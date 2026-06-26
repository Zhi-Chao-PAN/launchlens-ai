import { describe, expect, it } from "vitest";
import { formatSnapshotTime } from "./snapshot-time";

describe("formatSnapshotTime", () => {
  it("formats a known UTC timestamp with default 'en' locale", () => {
    // 2026-01-15T09:00:00Z -> "Jan 15, 9:00 AM" (in UTC)
    const out = formatSnapshotTime("2026-01-15T09:00:00Z");
    expect(out).toMatch(/^Jan 15, \d{1,2}:\d{2}/);
  });

  it("is stable across server/client timezones (always UTC by default)", () => {
    const a = formatSnapshotTime("2026-06-15T14:30:00Z");
    const b = formatSnapshotTime("2026-06-15T14:30:00Z");
    expect(a).toBe(b);
  });

  it("respects an explicit timeZone override", () => {
    // Same UTC instant formatted in Tokyo (+9) should be hours later
    const utc = formatSnapshotTime("2026-01-15T09:00:00Z", "UTC");
    const tokyo = formatSnapshotTime("2026-01-15T09:00:00Z", "Asia/Tokyo");
    expect(tokyo).not.toBe(utc);
    expect(tokyo).toMatch(/Jan 15/);
  });

  it("handles a noon UTC timestamp", () => {
    const out = formatSnapshotTime("2026-06-15T12:00:00Z", "UTC");
    expect(out).toMatch(/Jun 15/);
  });

  it("handles an end-of-month timestamp", () => {
    const out = formatSnapshotTime("2026-01-31T23:59:00Z", "UTC");
    expect(out).toMatch(/Jan 31/);
  });

  it("returns 'Invalid Date' for a malformed input rather than throwing", () => {
    // Intentionally defensive: callers should never pass a malformed
    // timestamp, but if one slips through we prefer a visible NaN-like
    // string to a render-time exception.
    const out = formatSnapshotTime("not a date");
    expect(out).toMatch(/Invalid|NaN/);
  });
});
