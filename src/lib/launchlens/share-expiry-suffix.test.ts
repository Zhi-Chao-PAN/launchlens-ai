import { describe, expect, it } from "vitest";
import { shareExpirySuffix } from "./share-expiry-suffix";

describe("shareExpirySuffix", () => {
  it("returns the Permanent descriptor when expiresAt is null", () => {
    expect(shareExpirySuffix(null)).toEqual({ key: "shareExpiry.permanent" });
    expect(shareExpirySuffix(undefined)).toEqual({ key: "shareExpiry.permanent" });
    expect(shareExpirySuffix("")).toEqual({ key: "shareExpiry.permanent" });
  });

  it("returns the expired descriptor when expiresAt is already in the past", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(shareExpirySuffix(past)).toEqual({ key: "shareExpiry.expired" });
  });

  it("returns the expiresIn descriptor with a label for a future expiry", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const suffix = shareExpirySuffix(future);
    expect(suffix.key).toBe("shareExpiry.expiresIn");
    expect(suffix.params).toBeDefined();
    expect(typeof suffix.params?.label).toBe("string");
    expect(suffix.params?.label.length).toBeGreaterThan(0);
  });

  it("returns the expired descriptor for malformed expiry strings", () => {
    expect(shareExpirySuffix("not-a-date")).toEqual({ key: "shareExpiry.expired" });
    expect(shareExpirySuffix("20")).toEqual({ key: "shareExpiry.expired" });
  });

  it("emits a label with no time-of-day component for near-future expiries", () => {
    const fiveMin = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const suffix = shareExpirySuffix(fiveMin);
    // 5 minutes lands in the "Expires tomorrow" / "Expires in 1 day" bucket;
    // we just want no time-of-day leak in the bucket label.
    expect(suffix.params?.label).not.toMatch(/\d:\d/);
    expect(suffix.params?.label).toMatch(/^(Expires in \d+ days?|Expires tomorrow)$/);
  });
});
