import { describe, expect, it } from "vitest";
import { patchEvidenceFilter } from "./evidence-filter-patch";

const DEFAULT = { signal: "all", weight: "all" };

describe("patchEvidenceFilter", () => {
  it("returns a new object with the patched experiment", () => {
    const prev = { exp1: { signal: "all", weight: "all" } };
    const next = patchEvidenceFilter(prev, "exp1", { signal: "supports" }, DEFAULT);
    expect(next).not.toBe(prev);
    expect(next.exp1.signal).toBe("supports");
    expect(next.exp1.weight).toBe("all");
  });

  it("preserves other experiments in the record", () => {
    const prev = {
      exp1: { signal: "all", weight: "all" },
      exp2: { signal: "challenges", weight: "strong" },
    };
    const next = patchEvidenceFilter(prev, "exp1", { weight: "moderate" }, DEFAULT);
    expect(next.exp2).toEqual({ signal: "challenges", weight: "strong" });
  });

  it("creates a new filter entry for an unknown experiment id", () => {
    const prev: Record<string, { signal: string; weight: string }> = {};
    const next = patchEvidenceFilter(prev, "new-exp", { signal: "supports" }, DEFAULT);
    expect(next["new-exp"]).toEqual({ signal: "supports", weight: "all" });
  });

  it("preserves the other field when only one is patched", () => {
    const prev = { exp1: { signal: "challenges", weight: "strong" } };
    const next = patchEvidenceFilter(prev, "exp1", { signal: "supports" }, DEFAULT);
    expect(next.exp1).toEqual({ signal: "supports", weight: "strong" });
  });

  it("clears both fields when patched with both 'all'", () => {
    const prev = { exp1: { signal: "supports", weight: "strong" } };
    const next = patchEvidenceFilter(
      prev,
      "exp1",
      { signal: "all", weight: "all" },
      DEFAULT,
    );
    expect(next.exp1).toEqual({ signal: "all", weight: "all" });
  });

  it("handles an empty patch by leaving the entry unchanged", () => {
    const prev = { exp1: { signal: "supports", weight: "moderate" } };
    const next = patchEvidenceFilter(prev, "exp1", {}, DEFAULT);
    expect(next.exp1).toEqual({ signal: "supports", weight: "moderate" });
  });

  it("does not mutate the input record", () => {
    const prev = { exp1: { signal: "all", weight: "all" } };
    const prevSnapshot = JSON.stringify(prev);
    patchEvidenceFilter(prev, "exp1", { signal: "supports" }, DEFAULT);
    expect(JSON.stringify(prev)).toBe(prevSnapshot);
  });

  it("does not mutate the existing filter object", () => {
    const existing = { signal: "all", weight: "all" };
    const prev = { exp1: existing };
    patchEvidenceFilter(prev, "exp1", { signal: "supports" }, DEFAULT);
    expect(existing.signal).toBe("all");
    expect(existing.weight).toBe("all");
  });

  it("uses the supplied defaultFilter when creating a new entry (not hard-coded 'all')", () => {
    const prev: Record<string, { signal: string; weight: string }> = {};
    const customDefault = { signal: "neutral", weight: "moderate" };
    const next = patchEvidenceFilter(
      prev,
      "fresh",
      { weight: "strong" },
      customDefault,
    );
    expect(next.fresh).toEqual({ signal: "neutral", weight: "strong" });
  });
});
