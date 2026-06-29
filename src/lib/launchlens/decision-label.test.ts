import { describe, expect, it } from "vitest";
import { decisionLabel } from "./decision-label";

describe("decisionLabel", () => {
  it("returns the proceed descriptor for proceed", () => {
    expect(decisionLabel("proceed")).toEqual({ key: "decisionRec.proceed" });
  });

  it("returns the iterate descriptor for iterate", () => {
    expect(decisionLabel("iterate")).toEqual({ key: "decisionRec.iterate" });
  });

  it("returns the pivot descriptor for pivot", () => {
    expect(decisionLabel("pivot")).toEqual({ key: "decisionRec.pivot" });
  });

  it("returns the pause descriptor for pause", () => {
    expect(decisionLabel("pause")).toEqual({ key: "decisionRec.pause" });
  });

  it("returns null for null / undefined / empty", () => {
    expect(decisionLabel(null)).toBeNull();
    expect(decisionLabel(undefined)).toBeNull();
    expect(decisionLabel("")).toBeNull();
  });

  it("falls back to a title-case fallback for unknown strings", () => {
    expect(decisionLabel("hold")).toEqual({ fallback: "Hold" });
    expect(decisionLabel("stop")).toEqual({ fallback: "Stop" });
  });

  it("single-char unknown values title-case to themselves", () => {
    expect(decisionLabel("x")).toEqual({ fallback: "X" });
  });

  it("is case-sensitive: 'Proceed' (capital P) is not in the table", () => {
    expect(decisionLabel("Proceed")).toEqual({ fallback: "Proceed" });
  });

  it("preserves multi-word unknown strings after title-casing", () => {
    expect(decisionLabel("ship-it")).toEqual({ fallback: "Ship-it" });
  });
});
