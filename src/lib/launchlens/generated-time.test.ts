import { describe, expect, it } from "vitest";

import { formatGeneratedTime, formatRelativeTime } from "./generated-time";

describe("formatGeneratedTime", () => {
  it("formats an ISO timestamp as HH:MM UTC (en-GB)", () => {
    expect(formatGeneratedTime("2025-03-14T09:05:00Z")).toBe("09:05 UTC");
    expect(formatGeneratedTime("2025-03-14T23:59:00Z")).toBe("23:59 UTC");
    expect(formatGeneratedTime("2025-03-14T00:00:00Z")).toBe("00:00 UTC");
  });

  it("pads single-digit hours and minutes with leading zeros", () => {
    expect(formatGeneratedTime("2025-01-01T01:02:00Z")).toBe("01:02 UTC");
  });

  it("returns Unknown time for invalid / unparseable dates", () => {
    expect(formatGeneratedTime("")).toBe("Unknown time");
    expect(formatGeneratedTime("not-a-date")).toBe("Unknown time");
    expect(formatGeneratedTime("2025-13-40T99:99:00Z")).toBe("Unknown time");
  });

  it("produces a non-empty string for valid ISO timestamps", () => {
    const result = formatGeneratedTime(new Date().toISOString());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles the same timestamp consistently (stable output)", () => {
    const ts = "2024-01-15T10:30:00Z";
    const a = formatGeneratedTime(ts);
    const b = formatGeneratedTime(ts);
    expect(a).toBe(b);
  });

  it("does not throw on malformed input", () => {
    expect(() => formatGeneratedTime("not-a-date")).not.toThrow();
    expect(() => formatGeneratedTime("")).not.toThrow();
  });
});


describe("formatRelativeTime", () => {
  it('returns "just now" for times within 10 seconds', () => {
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5 * 1000).toISOString();
    expect(formatRelativeTime(fiveSecondsAgo)).toBe("just now");
  });

  it("returns seconds ago for times under a minute", () => {
    const now = new Date();
    const thirtySecAgo = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatRelativeTime(thirtySecAgo)).toBe("30s ago");
  });

  it("returns minutes ago for times under an hour", () => {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago for times under a day", () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago for times under a week", () => {
    const now = new Date();
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fourDaysAgo)).toBe("4d ago");
  });

  it('returns "just now" for invalid or future dates', () => {
    expect(formatRelativeTime("not-a-date")).toBe("just now");
    const future = new Date(Date.now() + 3600000).toISOString();
    expect(formatRelativeTime(future)).toBe("just now");
  });

  it("does not throw on empty input", () => {
    expect(() => formatRelativeTime("")).not.toThrow();
  });

  it("falls back to absolute date for entries older than a week", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(twoWeeksAgo);
    // Should not contain any of the relative suffixes
    expect(result).not.toContain("s ago");
    expect(result).not.toContain("m ago");
    expect(result).not.toContain("h ago");
    expect(result).not.toContain("d ago");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles exactly 10 seconds boundary as 10s ago", () => {
    const now = new Date();
    const tenSecAgo = new Date(now.getTime() - 10 * 1000).toISOString();
    expect(formatRelativeTime(tenSecAgo)).toBe("10s ago");
  });

  it("handles exactly 60 seconds boundary as 1m ago", () => {
    const now = new Date();
    const sixtySecAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    expect(formatRelativeTime(sixtySecAgo)).toBe("1m ago");
  });

  it("handles exactly 24 hours boundary as 1d ago", () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneDayAgo)).toBe("1d ago");
  });

  it("is idempotent — calling twice with the same input returns the same result", () => {
    const ts = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toBe(formatRelativeTime(ts));
  });
});
