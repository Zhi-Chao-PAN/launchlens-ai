import { describe, expect, it } from "vitest";
import { decisionLabel } from "./decision-label";

describe("decisionLabel", () => {
  it("returns the canonical capitalized label for proceed", () => {
    expect(decisionLabel("proceed")).toBe("Proceed");
  });

  it("returns the canonical capitalized label for iterate", () => {
    expect(decisionLabel("iterate")).toBe("Iterate");
  });

  it("returns the canonical capitalized label for pivot", () => {
    expect(decisionLabel("pivot")).toBe("Pivot");
  });

  it("returns the canonical capitalized label for pause", () => {
    expect(decisionLabel("pause")).toBe("Pause");
  });

  it("returns '' for null / undefined / empty", () => {
    expect(decisionLabel(null)).toBe("");
    expect(decisionLabel(undefined)).toBe("");
    expect(decisionLabel("")).toBe("");
  });

  it("falls back to a title-case for unknown strings", () => {
    expect(decisionLabel("hold")).toBe("Hold");
    expect(decisionLabel("stop")).toBe("Stop");
  });

  it("single-char unknown values title-case to themselves", () => {
    expect(decisionLabel("x")).toBe("X");
  });

  it("is case-sensitive: 'Proceed' (capital P) is not in the table", () => {
    expect(decisionLabel("Proceed")).toBe("Proceed");
  });

  it("preserves multi-word unknown strings after title-casing", () => {
    expect(decisionLabel("ship-it")).toBe("Ship-it");
  });
});
