import { describe, expect, it } from "vitest";

import fixture from "../../../fixtures/providers/minimax-m3-public-samples.json";
import {
  assertSafeProviderFixture,
  PUBLIC_PROVIDER_EVAL_SCENARIO_IDS,
  type ProviderEvalFixture,
} from "./provider-eval";

describe("persisted MiniMax fixture", () => {
  it("contains complete real-provider evidence for every public scenario", () => {
    const typedFixture = fixture as ProviderEvalFixture;

    expect(typedFixture.schemaVersion).toBe(2);
    expect(typedFixture.promptVersion).toBe("launchlens-workspace-v1");
    expect(typedFixture.provider).toBe("minimax");
    expect(typedFixture.scenarioIds).toEqual([
      ...PUBLIC_PROVIDER_EVAL_SCENARIO_IDS,
    ]);
    expect(typedFixture.cases.map((evalCase) => evalCase.id)).toEqual([
      ...PUBLIC_PROVIDER_EVAL_SCENARIO_IDS,
    ]);

    for (const evalCase of typedFixture.cases) {
      expect(evalCase.mode).toBe("real");
      expect(evalCase.provider).toBe("minimax");
      expect(evalCase.usedFallback).toBe(false);
      expect(evalCase.qualityScore).toBeGreaterThanOrEqual(90);
      expect(evalCase.scenarioChecks.every((check) => check.passed)).toBe(true);
    }

    expect(() => assertSafeProviderFixture(typedFixture)).not.toThrow();
  });
});
