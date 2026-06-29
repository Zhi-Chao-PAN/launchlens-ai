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

  it("returns the expiresSentence descriptor with a bucket labelKey for a future expiry", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const suffix = shareExpirySuffix(future);
    expect(suffix.key).toBe("shareExpiry.expiresSentence");
    expect(suffix.labelKey).toBeDefined();
    expect(typeof suffix.labelKey).toBe("string");
    // 1 hour rounds up to 1 day → the "tomorrow" bucket.
    expect(suffix.labelKey).toBe("expiry.tomorrow");
    expect(suffix.labelParams).toBeUndefined();
  });

  it("passes bucket labelParams through for multi-unit expiries", () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const suffix = shareExpirySuffix(future);
    expect(suffix.key).toBe("shareExpiry.expiresSentence");
    expect(suffix.labelKey).toBe("expiry.expiresDaysMany");
    expect(suffix.labelParams).toEqual({ n: 5 });
  });

  it("returns the expired descriptor for malformed expiry strings", () => {
    expect(shareExpirySuffix("not-a-date")).toEqual({ key: "shareExpiry.expired" });
    expect(shareExpirySuffix("20")).toEqual({ key: "shareExpiry.expired" });
  });

  it("never exposes a time-of-day component in the label bucket for near-future expiries", () => {
    // The bucket label is now an i18n key (no rendered text here at all),
    // so there is no chance of a time-of-day leak. We assert the key is one
    // of the day/tomorrow buckets rather than a formatted timestamp.
    const fiveMin = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const suffix = shareExpirySuffix(fiveMin);
    expect(suffix.labelKey).toBe("expiry.tomorrow");
  });
});
