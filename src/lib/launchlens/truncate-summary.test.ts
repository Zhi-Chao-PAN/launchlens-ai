import { describe, expect, it } from "vitest";
import { truncateSummary } from "./truncate-summary";

describe("truncateSummary", () => {
  it("returns '' for null", () => {
    expect(truncateSummary(null)).toBe("");
  });
  it("returns '' for undefined", () => {
    expect(truncateSummary(undefined)).toBe("");
  });
  it("returns '' for an empty string", () => {
    expect(truncateSummary("")).toBe("");
  });
  it("returns the string unchanged when shorter than max", () => {
    expect(truncateSummary("hello", 160)).toBe("hello");
  });
  it("returns the string unchanged when exactly max chars", () => {
    const exact = "a".repeat(160);
    expect(truncateSummary(exact, 160)).toBe(exact);
  });
  it("truncates with ellipsis when longer than max", () => {
    const long = "a".repeat(200);
    const out = truncateSummary(long, 160);
    expect(out.length).toBe(161);
    expect(out.endsWith("…")).toBe(true);
    expect(out.slice(0, 160)).toBe("a".repeat(160));
  });
  it("uses a custom max length", () => {
    expect(truncateSummary("a".repeat(50), 10)).toBe("aaaaaaaaaa…");
  });
  it("handles a max of 0 (returns only the ellipsis)", () => {
    expect(truncateSummary("hello", 0)).toBe("…");
  });
  it("uses 160 by default", () => {
    expect(truncateSummary("a".repeat(200)).length).toBe(161);
  });
  it("preserves unicode CJK characters as one-codepoint units", () => {
    // Each CJK character is one BMP code point, so 5 chars of 'X' should
    // pass through unchanged when max=5.
    expect(truncateSummary("中文测试X", 5)).toBe("中文测试X");
  });
});
