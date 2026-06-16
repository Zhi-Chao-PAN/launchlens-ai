import { describe, expect, it } from "vitest";

import { exampleWorkspaces } from "./example-workspaces";
import type { DecisionRecommendation } from "./decision";
import {
  buildMockDecisionBrief,
  decisionBriefIsCurrent,
  decisionSourceFingerprint,
  decisionSourceFromExperiment,
  normalizeDecisionBrief,
  normalizeDecisionSource,
} from "./decision";

describe("decision brief", () => {
  const experiment = exampleWorkspaces[0].execution.experiments[0];
  const source = decisionSourceFromExperiment(experiment);

  it("builds a deterministic evidence-bound demo brief", () => {
    const brief = buildMockDecisionBrief(
      source,
      "2026-06-13T08:00:00.000Z",
    );

    expect(brief.provider).toBe("mock");
    expect(brief.claims.flatMap((claim) => claim.evidenceIds)).toEqual(
      experiment.evidence.map((item) => item.id),
    );
    expect(brief.sourceFingerprint).toBe(decisionSourceFingerprint(source));
    expect(brief.claims.map((claim) => claim.text).join(" ")).toContain(
      experiment.evidence[0].source,
    );
  });

  it("rejects invented evidence citations", () => {
    const brief = buildMockDecisionBrief(source);

    expect(
      normalizeDecisionBrief(
        {
          ...brief,
          claims: [
            {
              text: "Invented claim",
              stance: "supports",
              evidenceIds: ["invented-evidence"],
            },
          ],
        },
        source,
      ),
    ).toBeNull();
  });

  it("rejects claim stances that contradict cited evidence signals", () => {
    const brief = buildMockDecisionBrief(source);

    expect(
      normalizeDecisionBrief(
        {
          ...brief,
          claims: [
            {
              text: "The cited supporting evidence was framed as a challenge.",
              stance: "challenges",
              evidenceIds: [source.evidence[0].id],
            },
          ],
        },
        source,
      ),
    ).toBeNull();
  });

  it("normalizes stray provider quote prefixes in generated text", () => {
    const brief = buildMockDecisionBrief(source);
    const normalized = normalizeDecisionBrief(
      {
        ...brief,
        headline: "\"Proceed with the cited evidence.",
        unresolvedRisks: ["\"The evidence base is still small."],
      },
      source,
    );

    expect(normalized?.headline).toBe("Proceed with the cited evidence.");
    expect(normalized?.unresolvedRisks[0]).toBe(
      "The evidence base is still small.",
    );
  });

  it("derives the mock recommendation from evidence, not human status", () => {
    const refutedByHuman = {
      ...source,
      status: "refuted" as const,
      confidence: "low" as const,
    };
    const supportedByHuman = {
      ...source,
      status: "supported" as const,
      confidence: "high" as const,
    };

    expect(buildMockDecisionBrief(refutedByHuman).recommendation).toBe(
      buildMockDecisionBrief(supportedByHuman).recommendation,
    );
  });

  it("marks a brief stale after source evidence changes", () => {
    const brief = buildMockDecisionBrief(source);
    const withBrief = { ...experiment, decisionBrief: brief };
    const changed = {
      ...withBrief,
      evidence: [
        ...withBrief.evidence,
        {
          id: "new-evidence",
          source: "Follow-up interview",
          note: "A new contradictory observation.",
          signal: "challenges" as const,
          observedAt: "2026-06-13T08:05:00.000Z",
        },
      ],
    };

    expect(decisionBriefIsCurrent(withBrief)).toBe(true);
    expect(decisionBriefIsCurrent(changed)).toBe(false);
  });

  it("normalizes only bounded experiments with evidence", () => {
    expect(normalizeDecisionSource(source)).toEqual(source);
    expect(
      normalizeDecisionSource({ ...source, evidence: [] }),
    ).toBeNull();
    expect(
      normalizeDecisionSource({
        ...source,
        evidence: [{ ...source.evidence[0], signal: "unknown" }],
      }),
    ).toBeNull();
  });

  it("keeps the source fingerprint stable across object property order", () => {
    const reordered = {
      ...source,
      evidence: source.evidence.map((item) => ({
        observedAt: item.observedAt,
        signal: item.signal,
        source: item.source,
        note: item.note,
        id: item.id,
      })),
    };

    expect(decisionSourceFingerprint(reordered)).toBe(
      decisionSourceFingerprint(source),
    );
  });

  it("returns null for non-record values without throwing", () => {
    expect(normalizeDecisionBrief(null, source)).toBeNull();
    expect(normalizeDecisionBrief(undefined, source)).toBeNull();
    expect(normalizeDecisionBrief("string", source)).toBeNull();
    expect(normalizeDecisionBrief(42, source)).toBeNull();
    expect(normalizeDecisionBrief([], source)).toBeNull();
  });

  it("returns null when brief fields are corrupted (schema mismatch)", () => {
    const valid = buildMockDecisionBrief(source);
    expect(normalizeDecisionBrief({ ...valid, schemaVersion: 2 }, source)).toBeNull();
    expect(normalizeDecisionBrief({ ...valid, mode: "quantum" as unknown as "demo" | "real" }, source)).toBeNull();
    expect(normalizeDecisionBrief({ ...valid, recommendation: "maybe" as unknown as DecisionRecommendation }, source)).toBeNull();
    expect(normalizeDecisionBrief({ ...valid, claims: [] }, source)).toBeNull();
    expect(normalizeDecisionBrief({ ...valid, headline: null as unknown as string }, source)).toBeNull();
  });

  it("returns null when claim references non-existent evidence ids", () => {
    const valid = buildMockDecisionBrief(source);
    const badClaims = [{ ...valid.claims[0], evidenceIds: ["nonexistent-id"] }];
    expect(normalizeDecisionBrief({ ...valid, claims: badClaims }, source)).toBeNull();
  });

  it("handles getter-throwing objects gracefully (try-catch path)", () => {
    const boobyTrap: Record<string, unknown> = {
      schemaVersion: 1,
      get provider() {
        throw new Error("nope");
      },
    };
    expect(() => normalizeDecisionBrief(boobyTrap, source)).not.toThrow();
    expect(normalizeDecisionBrief(boobyTrap, source)).toBeNull();
  });

});
