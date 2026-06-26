import { describe, expect, it } from "vitest";
import { claimStatusLabel } from "./claim-status-label";

describe("claimStatusLabel", () => {
  it("returns 'Untested' for untested", () => {
    expect(claimStatusLabel("untested")).toBe("Untested");
  });

  it("returns 'Testing' for testing", () => {
    expect(claimStatusLabel("testing")).toBe("Testing");
  });

  it("returns 'Validated' for supported", () => {
    expect(claimStatusLabel("supported")).toBe("Validated");
  });

  it("returns 'Invalidated' for refuted", () => {
    expect(claimStatusLabel("refuted")).toBe("Invalidated");
  });

  it("returns '' for null / undefined / empty", () => {
    expect(claimStatusLabel(null)).toBe("");
    expect(claimStatusLabel(undefined)).toBe("");
    expect(claimStatusLabel("")).toBe("");
  });

  it("falls back to title-case for unknown statuses", () => {
    expect(claimStatusLabel("pending")).toBe("Pending");
    expect(claimStatusLabel("stalled")).toBe("Stalled");
  });

  it("is case-sensitive: 'Validated' is not in the table", () => {
    expect(claimStatusLabel("Validated")).toBe("Validated");
  });

  it("single-char unknown values title-case to themselves", () => {
    expect(claimStatusLabel("x")).toBe("X");
  });
});
