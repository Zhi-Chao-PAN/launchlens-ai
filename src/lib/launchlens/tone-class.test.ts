import { describe, expect, it } from "vitest";
import {
  NEUTRAL_TONE_CLASS,
  SIGNAL_TONE_CLASSES,
  toneClass,
} from "./tone-class";

describe("toneClass", () => {
  it("returns the supports pair for supports", () => {
    expect(toneClass("supports")).toBe(
      "bg-signal-supports text-signal-supports",
    );
  });

  it("returns the challenges pair for challenges", () => {
    expect(toneClass("challenges")).toBe(
      "bg-signal-challenges text-signal-challenges",
    );
  });

  it("returns the neutral pair for iterate", () => {
    expect(toneClass("iterate")).toBe(
      "bg-signal-neutral text-signal-neutral",
    );
  });

  it("returns the muted pair for pause", () => {
    expect(toneClass("pause")).toBe(NEUTRAL_TONE_CLASS);
  });

  it("returns the supports pair for proceed (same visual as supports)", () => {
    expect(toneClass("proceed")).toBe(SIGNAL_TONE_CLASSES.supports);
  });

  it("returns the challenges pair for pivot (same visual as challenges)", () => {
    expect(toneClass("pivot")).toBe(SIGNAL_TONE_CLASSES.challenges);
  });

  it("returns the neutral pair for context (the third stance)", () => {
    expect(toneClass("context")).toBe(
      "bg-signal-neutral text-signal-neutral",
    );
  });

  it("falls back to the muted pair for unknown tones", () => {
    expect(toneClass("bogus")).toBe(NEUTRAL_TONE_CLASS);
    expect(toneClass("")).toBe(NEUTRAL_TONE_CLASS);
  });

  it("falls back to the muted pair for null / undefined", () => {
    expect(toneClass(null)).toBe(NEUTRAL_TONE_CLASS);
    expect(toneClass(undefined)).toBe(NEUTRAL_TONE_CLASS);
  });

  it("preserves case-sensitivity for the in-record lookup", () => {
    // Lowercase "Supports" is not a valid key — must fall back.
    expect(toneClass("Supports")).toBe(NEUTRAL_TONE_CLASS);
  });

  it("SIGNAL_TONE_CLASSES covers both DecisionRecommendation and ClaimStance sets", () => {
    expect(Object.keys(SIGNAL_TONE_CLASSES).sort()).toEqual([
      "challenges",
      "context",
      "iterate",
      "pause",
      "pivot",
      "proceed",
      "supports",
    ]);
  });
});
