import { describe, expect, it } from "vitest";
import { shareExpirySuffix } from "./share-expiry-suffix";

describe("shareExpirySuffix", () => {
  it("returns the Permanent suffix when expiresAt is null", () => {
    expect(shareExpirySuffix(null)).toBe(" Permanent.");
    expect(shareExpirySuffix(undefined)).toBe(" Permanent.");
    expect(shareExpirySuffix("")).toBe(" Permanent.");
  });

  it("returns the expired marker when expiresAt is already in the past", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(shareExpirySuffix(past)).toBe(" It has expired.");
  });

  it("returns a 'starts with space, ends with period' suffix for a future expiry", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const suffix = shareExpirySuffix(future);
    expect(suffix.startsWith(" ")).toBe(true);
    expect(suffix.endsWith(".")).toBe(true);
    expect(suffix.length).toBeGreaterThan(2);
  });

  it("returns the expired marker for malformed expiry strings", () => {
    expect(shareExpirySuffix("not-a-date")).toBe(" It has expired.");
    expect(shareExpirySuffix("20")).toBe(" It has expired.");
  });

  it("never returns an empty string", () => {
    expect(shareExpirySuffix(null)).not.toBe("");
    expect(shareExpirySuffix(undefined)).not.toBe("");
    expect(shareExpirySuffix("")).not.toBe("");
    expect(shareExpirySuffix("not-a-date")).not.toBe("");
  });

  it("keeps a one-space gap before the trailing sentence", () => {
    const suffix = shareExpirySuffix(new Date(Date.now() + 86_400_000).toISOString());
    expect(suffix.charAt(0)).toBe(" ");
    expect(suffix.charAt(1)).not.toBe(" ");
  });

  it("emits a short label for near-future expiries (no time-component leaks)", () => {
    const fiveMin = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const suffix = shareExpirySuffix(fiveMin);
    // 5 minutes lands in the "Expires tomorrow" bucket — both
    // "Expires in 1 day." and "Expires tomorrow." are acceptable
    // short labels; we just want no time-of-day leak.
    expect(suffix).not.toMatch(/\d:\d/);
    expect(suffix).toMatch(/^( Expires in \d+ days?\.| Expires tomorrow\.)$/);
  });
});
