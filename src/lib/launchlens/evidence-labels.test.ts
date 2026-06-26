import { describe, expect, it } from "vitest";
import { SIGNAL_LABELS, WEIGHT_LABELS } from "./evidence-labels";

describe("SIGNAL_LABELS", () => {
  it("maps every EvidenceSignal to a display label", () => {
    expect(SIGNAL_LABELS.supports).toBe("Supports");
    expect(SIGNAL_LABELS.challenges).toBe("Challenges");
    expect(SIGNAL_LABELS.neutral).toBe("Neutral");
  });

  it("covers all three known signals (TypeScript Record enforces this)", () => {
    expect(Object.keys(SIGNAL_LABELS).sort()).toEqual([
      "challenges",
      "neutral",
      "supports",
    ]);
  });
});

describe("WEIGHT_LABELS", () => {
  it("maps every EvidenceWeight to a display label", () => {
    expect(WEIGHT_LABELS.anecdotal).toBe("Anecdotal");
    expect(WEIGHT_LABELS.moderate).toBe("Moderate");
    expect(WEIGHT_LABELS.strong).toBe("Strong");
  });

  it("covers all three known weights (TypeScript Record enforces this)", () => {
    expect(Object.keys(WEIGHT_LABELS).sort()).toEqual([
      "anecdotal",
      "moderate",
      "strong",
    ]);
  });

  it("labels are distinct", () => {
    const values = new Set(Object.values(WEIGHT_LABELS));
    expect(values.size).toBe(Object.keys(WEIGHT_LABELS).length);
  });
});