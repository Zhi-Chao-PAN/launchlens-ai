import { describe, expect, it } from "vitest";

import {
  assertSafeDecisionFixture,
  buildDecisionEvalCase,
  buildDecisionEvalFixture,
} from "./decision-eval";
import {
  buildMockDecisionBrief,
  decisionSourceFromExperiment,
} from "./decision";
import { exampleWorkspaces } from "./example-workspaces";

describe("decision eval", () => {
  const source = decisionSourceFromExperiment(
    exampleWorkspaces[0].execution.experiments[0],
  );

  it("scores the deterministic mock decision brief as a passing eval case", () => {
    const evalCase = buildDecisionEvalCase(
      "activation-analyst",
      source,
      {
        brief: buildMockDecisionBrief(source),
        mode: "demo",
        usedFallback: false,
      },
      12.4,
    );

    expect(evalCase.qualityScore).toBe(100);
    expect(evalCase.passedChecks).toBe(evalCase.totalChecks);
    expect(evalCase.scenarioChecks.every((check) => check.passed)).toBe(true);
    expect(evalCase.citedEvidenceIds).toBe(source.evidence.length);
  });

  it("penalizes a brief that does not cite every supplied evidence item", () => {
    const brief = buildMockDecisionBrief(source);
    const evalCase = buildDecisionEvalCase(
      "activation-analyst",
      source,
      {
        brief: {
          ...brief,
          claims: brief.claims.slice(0, 1),
        },
        mode: "demo",
        usedFallback: false,
      },
      1,
    );

    expect(evalCase.qualityScore).toBeLessThan(100);
    expect(
      evalCase.scenarioChecks.find((check) =>
        check.label.includes("All activation evidence"),
      )?.passed,
    ).toBe(false);
  });

  it("rejects configured secret values in persisted decision fixtures", () => {
    const evalCase = buildDecisionEvalCase(
      "activation-analyst",
      source,
      {
        brief: buildMockDecisionBrief(source),
        mode: "demo",
        usedFallback: false,
      },
      1,
    );
    const fixture = buildDecisionEvalFixture({
      model: "MiniMax-M3",
      evaluatedAt: "2026-06-13T10:00:00.000Z",
      cases: [evalCase],
    });

    expect(() =>
      assertSafeDecisionFixture({
        ...fixture,
        cases: [
          {
            ...fixture.cases[0],
            brief: {
              ...fixture.cases[0].brief,
              headline: "configured-secret-value",
            },
          },
        ],
      }, ["configured-secret-value"]),
    ).toThrow("configured secret");
  });
});


describe("decision eval edge cases", () => {
  const source = decisionSourceFromExperiment(
    exampleWorkspaces[0].execution.experiments[0],
  );

  it("rejects fixture with an empty cases list", () => {
    expect(() =>
      buildDecisionEvalFixture({
        model: "test-model",
        evaluatedAt: "2026-06-13T10:00:00.000Z",
        cases: [],
      }),
    ).toThrow();
  });

  it("rejects fixture when model label is blank", () => {
    const evalCase = buildDecisionEvalCase(
      "activation-analyst",
      source,
      { brief: buildMockDecisionBrief(source), mode: "demo", usedFallback: false },
      1,
    );
    expect(() =>
      buildDecisionEvalFixture({
        model: "",
        evaluatedAt: "2026-06-13T10:00:00.000Z",
        cases: [evalCase],
      }),
    ).toThrow();
  });

  it("rejects fixture when evaluatedAt is not a valid ISO timestamp", () => {
    const evalCase = buildDecisionEvalCase(
      "activation-analyst",
      source,
      { brief: buildMockDecisionBrief(source), mode: "demo", usedFallback: false },
      1,
    );
    expect(() =>
      buildDecisionEvalFixture({
        model: "test-model",
        evaluatedAt: "yesterday",
        cases: [evalCase],
      }),
    ).toThrow();
  });
});
