import { describe, expect, it } from "vitest";
import { cleanBullets } from "./bullets";

describe("cleanBullets", () => {
  it("returns [] for null", () => {
    expect(cleanBullets(null)).toEqual([]);
  });
  it("returns [] for undefined", () => {
    expect(cleanBullets(undefined)).toEqual([]);
  });
  it("returns [] for an empty array", () => {
    expect(cleanBullets([])).toEqual([]);
  });
  it("filters out empty strings", () => {
    expect(cleanBullets(["a", "", "b"])).toEqual(["a", "b"]);
  });
  it("filters out whitespace-only strings", () => {
    expect(cleanBullets(["a", "  ", "\n", "b"])).toEqual(["a", "b"]);
  });
  it("filters out the '-' sentinel", () => {
    expect(cleanBullets(["a", "-", "b"])).toEqual(["a", "b"]);
  });
  it("dedupes near-identical entries", () => {
    expect(cleanBullets(["a", "  a  ", "b"])).toEqual(["a", "b"]);
  });
  it("trims whitespace from each bullet", () => {
    expect(cleanBullets(["  hello  ", "world"])).toEqual(["hello", "world"]);
  });
  it("respects the max cap", () => {
    expect(cleanBullets(["a", "b", "c", "d"], { max: 2 })).toEqual(["a", "b"]);
  });
  it("respects the minLength option", () => {
    expect(cleanBullets(["ab", "c"], { minLength: 2 })).toEqual(["ab"]);
  });
  it("handles non-string entries gracefully (no throw)", () => {
    expect(cleanBullets(["a", null, "b", 42, "c"] as unknown as string[])).toEqual(["a", "b", "c"]);
  });
  it("preserves order", () => {
    expect(cleanBullets(["c", "a", "b"])).toEqual(["c", "a", "b"]);
  });
  it("caps at 12 by default", () => {
    const many = Array.from({ length: 20 }, (_, i) => `item-${i}`);
    const out = cleanBullets(many);
    expect(out).toHaveLength(12);
    expect(out[0]).toBe("item-0");
    expect(out[11]).toBe("item-11");
  });
});
