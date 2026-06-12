import { describe, expect, it } from "vitest";

import { buildMockWorkspace } from "./mock-provider";
import {
  assertSafeProviderFixture,
  buildProviderEvalCase,
  buildProviderEvalFixture,
  providerEvalSummary,
} from "./provider-eval";
import type { GenerationResult, LaunchLensInput } from "./types";

const input: LaunchLensInput = {
  idea: "An AI launch planner for tiny SaaS teams.",
  audience: "Indie founders",
  market: "AI SaaS",
  tone: "Practical",
  constraints: "No API key should be required.",
};

function fixture(result: GenerationResult) {
  return buildProviderEvalFixture({
    model: "MiniMax-M3",
    evaluatedAt: "2026-06-12T08:00:00.000Z",
    cases: [buildProviderEvalCase("activation-analyst", result, 1200)],
  });
}

describe("provider eval", () => {
  it("builds stable metrics without exposing workspace text in summaries", () => {
    const evalCase = buildProviderEvalCase(
      "activation-analyst",
      {
        workspace: buildMockWorkspace(input),
        mode: "demo",
        usedFallback: false,
      },
      1200.4,
    );
    const summary = providerEvalSummary(evalCase);

    expect(summary.qualityScore).toBeGreaterThanOrEqual(90);
    expect(summary.elapsedMs).toBe(1200);
    expect(summary.sectionCounts.backlog).toBe(4);
    expect(summary.scenarioChecks.every((check) => check.passed)).toBe(true);
    expect(summary).not.toHaveProperty("workspace");
  });

  it("rejects secret-like and configured secret values", () => {
    const safeFixture = fixture({
      workspace: buildMockWorkspace(input, "minimax"),
      mode: "real",
      usedFallback: false,
    });

    expect(() => assertSafeProviderFixture(safeFixture)).not.toThrow();

    safeFixture.cases[0].workspace.summary = `Accidentally echoed ${[
      "sk",
      "example_secret_value_1234567890",
    ].join("-")}`;

    expect(() => assertSafeProviderFixture(safeFixture)).toThrow(
      "secret-like value",
    );

    safeFixture.cases[0].workspace.summary = "configured-secret-value";

    expect(() =>
      assertSafeProviderFixture(safeFixture, ["configured-secret-value"]),
    ).toThrow("configured secret value");
  });
});
