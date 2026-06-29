import { describe, expect, it } from "vitest";
import { claimStatusLabel } from "./claim-status-label";

describe("claimStatusLabel", () => {
  it("returns the untested descriptor for untested", () => {
    expect(claimStatusLabel("untested")).toEqual({ key: "claimStatus.untested" });
  });

  it("returns the testing descriptor for testing", () => {
    expect(claimStatusLabel("testing")).toEqual({ key: "claimStatus.testing" });
  });

  it("returns the supported descriptor for supported", () => {
    expect(claimStatusLabel("supported")).toEqual({ key: "claimStatus.supported" });
  });

  it("returns the refuted descriptor for refuted", () => {
    expect(claimStatusLabel("refuted")).toEqual({ key: "claimStatus.refuted" });
  });

  it("returns null for null / undefined / empty", () => {
    expect(claimStatusLabel(null)).toBeNull();
    expect(claimStatusLabel(undefined)).toBeNull();
    expect(claimStatusLabel("")).toBeNull();
  });

  it("falls back to title-case fallback for unknown statuses", () => {
    expect(claimStatusLabel("pending")).toEqual({ fallback: "Pending" });
    expect(claimStatusLabel("stalled")).toEqual({ fallback: "Stalled" });
  });

  it("is case-sensitive: 'Validated' is not in the table", () => {
    expect(claimStatusLabel("Validated")).toEqual({ fallback: "Validated" });
  });

  it("single-char unknown values title-case to themselves", () => {
    expect(claimStatusLabel("x")).toEqual({ fallback: "X" });
  });
});
