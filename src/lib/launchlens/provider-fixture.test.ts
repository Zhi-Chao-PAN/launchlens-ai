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

  it("fixture cases all have sectionCounts with valid numbers", () => {
    const typedFixture = fixture as ProviderEvalFixture;
    for (const evalCase of typedFixture.cases) {
      expect(evalCase.sectionCounts.assumptions).toBeGreaterThan(0);
      expect(evalCase.sectionCounts.targetUsers).toBeGreaterThan(0);
      expect(evalCase.sectionCounts.pains).toBeGreaterThan(0);
      expect(evalCase.sectionCounts.backlog).toBeGreaterThan(0);
    }
  });

  it("fixture schemaVersion and promptVersion are consistent", () => {
    const typedFixture = fixture as ProviderEvalFixture;
    expect(typeof typedFixture.schemaVersion).toBe("number");
    expect(typedFixture.schemaVersion).toBeGreaterThanOrEqual(1);
    expect(typeof typedFixture.promptVersion).toBe("string");
    expect(typedFixture.promptVersion.startsWith("launchlens-workspace-")).toBe(true);
  });

});
