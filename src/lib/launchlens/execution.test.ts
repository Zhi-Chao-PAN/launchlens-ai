import { describe, expect, it } from "vitest";

import { exampleWorkspaces } from "./example-workspaces";
import {
  buildMockDecisionBrief,
  decisionSourceFromExperiment,
} from "./decision";
import {
  createExecutionState,
  evaluateExecutionProgress,
  normalizeExecutionState,
  normalizeSharedExecutionState,
  reconcileExecutionState,
  summarizeExecutionState,
  taskIdentity,
} from "./execution";

const workspace = exampleWorkspaces[0].workspace;

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
});
