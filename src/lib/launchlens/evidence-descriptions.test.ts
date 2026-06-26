import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_DESCRIPTIONS,
  DECISION_DESCRIPTIONS,
  SIGNAL_DESCRIPTIONS,
  STATUS_DESCRIPTIONS,
  WEIGHT_DESCRIPTIONS,
  confidenceDescription,
  decisionDescription,
  statusDescription,
} from "./evidence-descriptions";
import type { DecisionRecommendation } from "./decision";
import type {
  ConfidenceLevel,
  EvidenceSignal,
  EvidenceWeight,
  ExperimentStatus,
} from "./execution";

function expectCompleteDescriptionMap<Key extends string>(
  descriptions: Record<Key, string>,
  expectedKeys: Key[],
) {
  expect(Object.keys(descriptions).sort()).toEqual([...expectedKeys].sort());

  const values = Object.values(descriptions) as string[];
  expect(values.every((value) => value.length > 0)).toBe(true);
  expect(new Set(values).size).toBe(values.length);
}

describe("SIGNAL_DESCRIPTIONS", () => {
  it("covers every EvidenceSignal", () => {
    expectCompleteDescriptionMap<EvidenceSignal>(SIGNAL_DESCRIPTIONS, [
      "supports",
      "challenges",
      "neutral",
    ]);
  });
});

describe("WEIGHT_DESCRIPTIONS", () => {
  it("covers every EvidenceWeight", () => {
    expectCompleteDescriptionMap<EvidenceWeight>(WEIGHT_DESCRIPTIONS, [
      "anecdotal",
      "moderate",
      "strong",
    ]);
  });
});

describe("CONFIDENCE_DESCRIPTIONS", () => {
  it("covers every ConfidenceLevel", () => {
    expectCompleteDescriptionMap<ConfidenceLevel>(CONFIDENCE_DESCRIPTIONS, [
      "low",
      "medium",
      "high",
    ]);
  });

  it("returns an empty fallback for unknown confidence values", () => {
    expect(confidenceDescription("future")).toBe("");
    expect(confidenceDescription(null)).toBe("");
  });
});

describe("STATUS_DESCRIPTIONS", () => {
  it("covers every ExperimentStatus", () => {
    expectCompleteDescriptionMap<ExperimentStatus>(STATUS_DESCRIPTIONS, [
      "untested",
      "testing",
      "supported",
      "refuted",
    ]);
  });

  it("returns descriptions only for known status values", () => {
    expect(statusDescription("supported")).toBe(STATUS_DESCRIPTIONS.supported);
    expect(statusDescription("deprecated")).toBe("");
  });
});

describe("DECISION_DESCRIPTIONS", () => {
  it("covers every DecisionRecommendation", () => {
    expectCompleteDescriptionMap<DecisionRecommendation>(DECISION_DESCRIPTIONS, [
      "proceed",
      "iterate",
      "pause",
      "pivot",
    ]);
  });

  it("description for 'proceed' starts with 'Proceed:'", () => {
    expect(DECISION_DESCRIPTIONS.proceed.startsWith("Proceed:")).toBe(true);
  });

  it("returns descriptions only for known decision values", () => {
    expect(decisionDescription("pivot")).toBe(DECISION_DESCRIPTIONS.pivot);
    expect(decisionDescription("ship")).toBe("");
  });
});
