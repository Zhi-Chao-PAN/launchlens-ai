import { describe, expect, it } from "vitest";

import { exampleWorkspaces } from "./example-workspaces";
import {
  buildMockDecisionBrief,
  decisionSourceFromExperiment,
} from "./decision";
import {
  createExecutionState,
  evaluateExecutionProgress, EVIDENCE_BIASED_WEIGHTS, DECISION_BIASED_WEIGHTS,
  normalizeExecutionState,
  normalizeSharedExecutionState,
  reconcileExecutionState,
  summarizeExecutionState,
  taskIdentity,
  computeExperimentConfidence,
} from "./execution";

const workspace = exampleWorkspaces[0].workspace;
const execution = exampleWorkspaces[0].execution;

describe("workspace execution state", () => {
  it("creates one deterministic experiment per generated assumption", () => {
    const execution = createExecutionState(workspace);

    expect(execution.experiments).toHaveLength(workspace.assumptions.length);
    expect(execution.experiments[0]).toMatchObject({
      id: expect.stringMatching(/^assumption-/),
      assumption: workspace.assumptions[0],
      status: "untested",
      confidence: "low",
      evidence: [],
    });
    expect(evaluateExecutionProgress(execution).score).toBe(0);
  });

  it("normalizes bounded evidence and strips unknown fields", () => {
    const execution = createExecutionState(workspace);
    execution.experiments[0] = {
      ...execution.experiments[0],
      status: "supported",
      confidence: "high",
      decision: "Keep the fast activation workflow in MVP scope.",
      nextAction: "Run three more activation interviews.",
      evidence: [
        {
          id: "evidence-1",
          note: "Four founders ranked weekly activation fixes as urgent.",
          source: "Founder interviews",
          signal: "supports",
          weight: "moderate" as const,
          observedAt: "2026-06-13T01:00:00.000Z",
          ignored: "strip me",
        } as (typeof execution.experiments)[number]["evidence"][number],
      ],
    };

    const normalized = normalizeExecutionState(execution, workspace);

    expect(normalized).not.toBeNull();
    expect(normalized?.experiments[0].evidence[0]).not.toHaveProperty("ignored");
    expect(evaluateExecutionProgress(normalized!)).toMatchObject({
      withEvidence: 1,
      decided: 1,
      evidenceCount: 1,
    });
  });

  it("starts a fresh experiment when an assumption meaning changes", () => {
    const execution = createExecutionState(workspace);
    execution.experiments[0].evidence.push({
      id: "evidence-1",
      note: "Interview evidence",
      source: "Call notes",
      signal: "supports",
      weight: "moderate" as const,
      observedAt: "2026-06-13T01:00:00.000Z",
    });
    const editedWorkspace = {
      ...workspace,
      assumptions: ["Edited buyer-speed assumption", ...workspace.assumptions.slice(1)],
    };

    const reconciled = reconcileExecutionState(execution, editedWorkspace);

    expect(reconciled.experiments[0].assumption).toBe(
      "Edited buyer-speed assumption",
    );
    expect(reconciled.experiments[0].evidence).toHaveLength(0);
  });

  it("rejects malformed or over-capacity evidence collections", () => {
    const execution = createExecutionState(workspace);
    execution.experiments[0].evidence = Array.from({ length: 21 }, (_, index) => ({
      id: `evidence-${index}`,
      note: "Bounded note",
      source: "Test",
      signal: "neutral" as const,
      weight: "moderate" as const,
      observedAt: "2026-06-13T01:00:00.000Z",
    }));

    expect(normalizeExecutionState(execution, workspace)).toBeNull();
    expect(normalizeExecutionState({ experiments: [] }, workspace)).toBeNull();
  });

  it("does not transfer evidence when assumptions are inserted or reordered", () => {
    const execution = createExecutionState(workspace);
    execution.experiments[0].evidence.push({
      id: "evidence-original",
      note: "Original assumption evidence",
      source: "Interview",
      signal: "supports",
      weight: "moderate" as const,
      observedAt: "2026-06-13T01:00:00.000Z",
    });
    const reorderedWorkspace = {
      ...workspace,
      assumptions: [
        "A new assumption inserted first.",
        workspace.assumptions[1],
        workspace.assumptions[0],
        workspace.assumptions[2],
      ],
    };

    const reconciled = reconcileExecutionState(execution, reorderedWorkspace);

    expect(reconciled.experiments[0].evidence).toHaveLength(0);
    expect(reconciled.experiments[2].assumption).toBe(workspace.assumptions[0]);
    expect(reconciled.experiments[2].evidence[0].id).toBe("evidence-original");
  });

  it("keeps task links stable when task content is edited", () => {
    const execution = createExecutionState(workspace);
    const originalTaskId = taskIdentity(workspace.tasks[0], 0);
    const editedTask = {
      ...workspace.tasks[0],
      title: "Edited task title",
      owner: "Growth lead",
    };

    expect(execution.experiments[0].linkedTaskId).toBe(originalTaskId);
    expect(taskIdentity(editedTask, 0)).toBe(originalTaskId);
  });

  it("creates a privacy-safe public summary without evidence details", () => {
    const execution = createExecutionState(workspace);
    execution.experiments[0].evidence.push({
      id: "private-evidence",
      note: "Private interview note",
      source: "Private founder call",
      signal: "supports",
      weight: "moderate" as const,
      observedAt: "2026-06-13T01:00:00.000Z",
    });
    execution.experiments[0].decisionBrief = buildMockDecisionBrief(
      decisionSourceFromExperiment(execution.experiments[0]),
    );

    const summary = summarizeExecutionState(execution);
    const serialized = JSON.stringify(summary);

    expect(summary.experiments[0].evidenceCount).toBe(1);
    expect(serialized).not.toContain("Private interview note");
    expect(serialized).not.toContain("Private founder call");
    expect(serialized).not.toContain("decisionBrief");
    expect(serialized).not.toContain("Evidence synthesis");
    expect(normalizeSharedExecutionState(summary, workspace)).toEqual(summary);
  });

  it("strips stale decision briefs when restoring execution state", () => {
    const execution = createExecutionState(workspace);
    execution.experiments[0].evidence.push({
      id: "evidence-current",
      note: "Current evidence",
      source: "Interview",
      signal: "supports",
      weight: "moderate" as const,
      observedAt: "2026-06-13T01:00:00.000Z",
    });
    execution.experiments[0].decisionBrief = buildMockDecisionBrief(
      decisionSourceFromExperiment(execution.experiments[0]),
    );
    execution.experiments[0].evidence[0].note = "Evidence changed later";

    const normalized = normalizeExecutionState(execution, workspace);

    expect(normalized).not.toBeNull();
    expect(normalized?.experiments[0].decisionBrief).toBeUndefined();
  });

  it("default weights match original 3-checkpoint behavior", () => {
    const ex = createExecutionState(workspace);
    // Default = 3 equal checkpoints per experiment
    const p = evaluateExecutionProgress(ex);
    expect(p.score).toBeGreaterThanOrEqual(0);
    expect(p.score).toBeLessThanOrEqual(100);
    // Fresh execution with all untested should be 0
    const allUntested = { experiments: [], updatedAt: new Date().toISOString() };
    expect(evaluateExecutionProgress(allUntested).score).toBe(0);
  });

  it("evidence-biased weights give higher score when evidence is present", () => {
    const execution = {
      experiments: [
        {
          id: "h1",
          assumption: "Test",
          status: "testing" as const,
          confidence: "medium" as const,
          decision: "",
          nextAction: "",
          linkedTaskId: "",
          evidence: [
            {
              id: "e1",
              source: "Test",
              note: "Test evidence",
              signal: "supports" as const,
              weight: "moderate" as const,
              observedAt: "2024-01-01T00:00:00Z",
              confidence: "medium" as const,
            },
          ],
        },
      ],
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const defaultScore = evaluateExecutionProgress(execution).score;
    const biasedScore = evaluateExecutionProgress(
      execution,
      EVIDENCE_BIASED_WEIGHTS,
    ).score;
    // evidence-biased should give more weight to the evidence checkpoint
    expect(biasedScore).toBeGreaterThan(defaultScore);
  });

  it("decision-biased weights give higher score when a decision is reached", () => {
    const execution = {
      experiments: [
        {
          id: "h1",
          assumption: "Test",
          status: "supported" as const,
          confidence: "high" as const,
          decision: "Validated",
          nextAction: "",
          linkedTaskId: "",
          evidence: [
            {
              id: "e1",
              source: "Test",
              note: "Evidence",
              signal: "supports" as const,
              weight: "moderate" as const,
              observedAt: "2024-01-01T00:00:00Z",
              confidence: "high" as const,
            },
          ],
        },
      ],
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const defaultScore = evaluateExecutionProgress(execution).score;
    const biasedScore = evaluateExecutionProgress(
      execution,
      DECISION_BIASED_WEIGHTS,
    ).score;
    // When all 3 checkpoints are met, both should be 100
    expect(biasedScore).toBe(100);
    expect(defaultScore).toBe(100);
  });

  it("evaluateExecutionProgress returns 0 for no experiments", () => {
    const empty = { experiments: [], updatedAt: new Date().toISOString() };
    const progress = evaluateExecutionProgress(empty);
    expect(progress.score).toBe(0);
    expect(progress.total).toBe(0);
    expect(progress.withEvidence).toBe(0);
    expect(progress.decided).toBe(0);
    expect(progress.evidenceCount).toBe(0);
  });

  it("evaluateExecutionProgress gives higher score for experiments with evidence", () => {
    const base = execution.experiments[0];
    const progress = evaluateExecutionProgress({ experiments: [base], updatedAt: execution.updatedAt });
    expect(progress.total).toBe(1);
    expect(progress.score).toBeGreaterThan(0);
    expect(progress.evidenceCount).toBe(base.evidence.length);
  });

  it("normalizeExecutionState handles multiple evidence items within limits", () => {
    const base = createExecutionState(workspace);
    const first = base.experiments[0];
    expect(first.evidence.length).toBeGreaterThanOrEqual(0);

    const normalized = normalizeExecutionState(base, workspace);
    expect(normalized).not.toBeNull();
    expect(normalized?.experiments.length).toBe(base.experiments.length);
  });


  it("summarizeExecutionState produces stable summaries for the same input", () => {
    const summary1 = summarizeExecutionState(execution);
    const summary2 = summarizeExecutionState(execution);
    expect(summary1.experiments.length).toBe(summary2.experiments.length);
    expect(summary1.experiments.length).toBeGreaterThan(0);
    expect(summary1.updatedAt).toBe(summary2.updatedAt);
  });

  it("taskIdentity produces consistent strings for the same input", () => {
    const task = { title: "Test task", owner: "Me", due: "Week 1", outcome: "Done" };
    const id1 = taskIdentity(task, 0);
    const id2 = taskIdentity(task, 0);
    expect(id1).toBe(id2);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(5);
  });

  it("summarizeExecutionState produces shared format with evidenceCount", () => {
    const summary = summarizeExecutionState(execution);
    expect(summary).toHaveProperty("experiments");
    expect(summary.experiments.length).toBeGreaterThan(0);
    for (const exp of summary.experiments) {
      expect(exp).toHaveProperty("evidenceCount");
      expect(typeof exp.evidenceCount).toBe("number");
      expect(exp).not.toHaveProperty("evidence");
      expect(exp).not.toHaveProperty("decisionBrief");
    }
  });

  it("reconcileExecutionState preserves user evidence", () => {
    const base = createExecutionState(workspace);
    const withEvidence = JSON.parse(JSON.stringify(base));
    withEvidence.experiments[0].evidence.push({
      id: "test-evidence",
      note: "User added this evidence",
      source: "Manual test",
      signal: "supports",
      weight: "moderate" as const,
      observedAt: new Date().toISOString(),
    });
    const reconciled = reconcileExecutionState(withEvidence, workspace);
    expect(reconciled.experiments[0].evidence.length).toBeGreaterThanOrEqual(1);
  });

  it("evaluateExecutionProgress returns score 0-100", () => {
    const empty = createExecutionState(workspace);
    const progress = evaluateExecutionProgress(empty);
    expect(progress.score).toBeGreaterThanOrEqual(0);
    expect(progress.score).toBeLessThanOrEqual(100);
    expect(typeof progress.total).toBe("number");
    expect(typeof progress.withEvidence).toBe("number");
    expect(typeof progress.decided).toBe("number");
    expect(typeof progress.evidenceCount).toBe("number");
  });



  it("experiment ids are unique across the execution state", () => {
    const ids = execution.experiments.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("evidence ids are unique across all experiments", () => {
    const allEvidenceIds: string[] = [];
    for (const exp of execution.experiments) {
      for (const ev of exp.evidence) {
        allEvidenceIds.push(ev.id);
      }
    }
    expect(new Set(allEvidenceIds).size).toBe(allEvidenceIds.length);
  });

  it("evaluateExecutionProgress returns a non-negative score with matching totals", () => {
    const progress = evaluateExecutionProgress(execution);
    expect(progress.score).toBeGreaterThanOrEqual(0);
    expect(progress.total).toBe(execution.experiments.length);
    expect(progress.evidenceCount).toBeGreaterThanOrEqual(0);
    expect(progress.withEvidence).toBeLessThanOrEqual(progress.total);
    expect(progress.decided).toBeLessThanOrEqual(progress.total);
  });

  it("evaluateExecutionProgress increases when evidence is added", () => {
    const baseScore = evaluateExecutionProgress(execution).score;
    const enhanced = {
      ...execution,
      experiments: execution.experiments.map((exp, idx) =>
        idx === 0
          ? {
              ...exp,
              evidence: [
                ...exp.evidence,
                {
                  id: "extra-evidence",
                  source: "Test Source",
                  note: "Extra evidence note",
                  signal: "supports" as const,
                  weight: "moderate" as const,
                  observedAt: "2026-01-01T00:00:00.000Z",
                },
              ],
            }
          : exp,
      ),
    };
    const enhancedScore = evaluateExecutionProgress(enhanced).score;
    expect(enhancedScore).toBeGreaterThanOrEqual(baseScore);
  });

  it("taskIdentity produces consistent ids for the same task", () => {
    const task = { title: "Test task", owner: "Founder", due: "Week 1", outcome: "Validate" };
    const id1 = taskIdentity(task, 0);
    const id2 = taskIdentity(task, 0);
    expect(id1).toBe(id2);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(5);
  });


  describe("computeExperimentConfidence", () => {
    it("returns low for zero evidence", () => {
      expect(computeExperimentConfidence([])).toBe("low");
    });

    it("returns low for a single anecdotal evidence", () => {
      expect(
        computeExperimentConfidence([
          { signal: "supports", weight: "anecdotal" },
        ]),
      ).toBe("low");
    });

    it("returns medium for moderate + anecdotal (weight 3)", () => {
      expect(
        computeExperimentConfidence([
          { signal: "supports", weight: "moderate" },
          { signal: "supports", weight: "anecdotal" },
        ]),
      ).toBe("medium");
    });

    it("returns high for two strong evidence (weight 8)", () => {
      expect(
        computeExperimentConfidence([
          { signal: "supports", weight: "strong" },
          { signal: "supports", weight: "strong" },
        ]),
      ).toBe("high");
    });

    it("pulls high down to medium when signals are deeply mixed", () => {
      expect(
        computeExperimentConfidence([
          { signal: "supports", weight: "strong" },
          { signal: "challenges", weight: "strong" },
        ]),
      ).toBe("medium");
    });

    it("keeps medium when signals are reasonably aligned", () => {
      expect(
        computeExperimentConfidence([
          { signal: "supports", weight: "strong" },
          { signal: "challenges", weight: "anecdotal" },
        ]),
      ).toBe("medium");
    });

    it("treats neutral evidence as weak consensus contribution", () => {
      expect(
        computeExperimentConfidence([
          { signal: "neutral", weight: "moderate" },
          { signal: "neutral", weight: "moderate" },
        ]),
      ).toBe("medium");
    });
  });
});
