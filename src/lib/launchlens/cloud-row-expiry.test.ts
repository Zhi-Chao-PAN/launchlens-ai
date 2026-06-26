import { describe, expect, it } from "vitest";
import { cloudRowExpiry } from "./cloud-row-expiry";

const NOW = new Date("2026-06-26T12:00:00Z").getTime();
const iso = (msFromNow: number) => new Date(NOW + msFromNow).toISOString();

describe("cloudRowExpiry", () => {
  it("returns null when expiresAt is null / empty", () => {
    expect(cloudRowExpiry(null, NOW)).toBeNull();
    expect(cloudRowExpiry("", NOW)).toBeNull();
  });

  it("returns null when expiresAt is malformed", () => {
    expect(cloudRowExpiry("not-a-date", NOW)).toBeNull();
    expect(cloudRowExpiry("2026-13-99T99:99:99Z", NOW)).toBeNull();
  });

  it("returns the Expired label once the timestamp is in the past", () => {
    expect(cloudRowExpiry(iso(-60_000), NOW)?.label).toBe("Expired");
    expect(cloudRowExpiry(iso(-30 * 86_400_000), NOW)?.label).toBe("Expired");
  });

  it("returns 'Expires in 1d' for sub-day remainders (clamps to 1)", () => {
    expect(cloudRowExpiry(iso(5 * 60 * 1000), NOW)?.label).toBe(
      "Expires in 1d",
    );
    expect(cloudRowExpiry(iso(60 * 1000), NOW)?.label).toBe("Expires in 1d");
  });

  it("rounds partial days up", () => {
    expect(cloudRowExpiry(iso(86_400_000 + 1), NOW)?.label).toBe(
      "Expires in 2d",
    );
    expect(cloudRowExpiry(iso(2 * 86_400_000 + 1), NOW)?.label).toBe(
      "Expires in 3d",
    );
  });

  it("uses integer day counts for whole-day expiries", () => {
    expect(cloudRowExpiry(iso(7 * 86_400_000), NOW)?.label).toBe(
      "Expires in 7d",
    );
    expect(cloudRowExpiry(iso(30 * 86_400_000), NOW)?.label).toBe(
      "Expires in 30d",
    );
  });

  it("does not bucket into weeks / months — keeps day-resolution", () => {
    // 14 days still reads as 14d, not '2w'. The cloud row is small.
    expect(cloudRowExpiry(iso(14 * 86_400_000), NOW)?.label).toBe(
      "Expires in 14d",
    );
    // 90 days still reads as 90d, not '3mo'.
    expect(cloudRowExpiry(iso(90 * 86_400_000), NOW)?.label).toBe(
      "Expires in 90d",
    );
  });

  it("title uses the local-tz formatted timestamp", () => {
    const result = cloudRowExpiry(iso(86_400_000), NOW);
    expect(result?.title).toMatch(/^Expires /);
    // Local-tz formatted dates vary by platform; check it contains
    // the year for a stable substring.
    expect(result?.title).toContain("2026");
  });

  it("expired title prefixes 'Expired ' instead of 'Expires '", () => {
    const result = cloudRowExpiry(iso(-86_400_000), NOW);
    expect(result?.title.startsWith("Expired ")).toBe(true);
  });

  it("treats exactly-now as expired (target <= now)", () => {
    expect(cloudRowExpiry(iso(0), NOW)?.label).toBe("Expired");
  });
});
