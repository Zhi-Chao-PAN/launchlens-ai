import { describe, expect, it } from "vitest";
import { clearIfStill, FLASH_STATE_DURATION_MS } from "./flash-state";

describe("FLASH_STATE_DURATION_MS", () => {
  it("is 1800ms (the canonical copy-flash duration)", () => {
    expect(FLASH_STATE_DURATION_MS).toBe(1800);
  });
});

describe("clearIfStill", () => {
  it("clears the state to '' when the live value still equals the target", () => {
    expect(clearIfStill("markdown", "markdown")).toBe("");
    expect(clearIfStill("json", "json")).toBe("");
  });

  it("leaves the state alone when a newer flash has overwritten the target", () => {
    expect(clearIfStill("json", "markdown")).toBe("json");
  });

  it("leaves the state alone when both values are empty", () => {
    expect(clearIfStill("", "")).toBe("");
  });

  it("leaves the state alone when the live value is empty but the target was non-empty", () => {
    // Race: the user copied markdown, then cleared it manually; the
    // scheduled setTimeout fires and finds an empty state, so the
    // clear is a no-op.
    expect(clearIfStill("", "markdown")).toBe("");
  });

  it("is type-preserving: works for union types like 'markdown' | 'json' | ''", () => {
    const live: "markdown" | "json" | "" = "json";
    const target: "markdown" | "json" | "" = "markdown";
    const result = clearIfStill(live, target);
    // The "newer flash" branch: result is the live value.
    expect(result).toBe("json");
  });

  it("works for non-string types when an explicit sentinel is provided", () => {
    // State machine: live=1, target=1 -> cleared to 0 (the explicit sentinel)
    expect(clearIfStill(1, 1, 0)).toBe(0);
    // Live=2, target=1 -> left alone
    expect(clearIfStill(2, 1, 0)).toBe(2);
  });

  it("returns the supplied sentinel (does not always coerce to '')", () => {
    expect(clearIfStill("x", "x", null)).toBe(null);
    expect(clearIfStill(true, true, false)).toBe(false);
  });
});
