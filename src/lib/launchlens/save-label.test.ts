import { describe, expect, it } from "vitest";
import { formatSaveLabel } from "./save-label";

describe("formatSaveLabel", () => {
  it("returns 'Preparing save' when storage is not ready", () => {
    expect(formatSaveLabel({ isStorageReady: false, savedAt: null })).toBe(
      "Preparing save",
    );
    expect(
      formatSaveLabel({ isStorageReady: false, savedAt: "2026-01-15T09:00:00Z" }),
    ).toBe("Preparing save");
  });

  it("returns 'Saved locally' when storage is ready but nothing saved yet", () => {
    expect(formatSaveLabel({ isStorageReady: true, savedAt: null })).toBe(
      "Saved locally",
    );
  });

  it("returns 'Saved <relative-time>' when savedAt is provided", () => {
    const now = new Date();
    const justSaved = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatSaveLabel({ isStorageReady: true, savedAt: justSaved })).toBe(
      "Saved 30s ago",
    );
  });

  it("uses 'just now' for very recent saves", () => {
    const now = new Date();
    const justSaved = new Date(now.getTime() - 2 * 1000).toISOString();
    expect(formatSaveLabel({ isStorageReady: true, savedAt: justSaved })).toBe(
      "Saved just now",
    );
  });

  it("falls through to formatRelativeTime for older saves (>= 7 days = absolute date)", () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const out = formatSaveLabel({ isStorageReady: true, savedAt: tenDaysAgo });
    expect(out.startsWith("Saved ")).toBe(true);
    // The 7+ day fallback emits a 'Mon DD' style label, never 'X days ago'
    expect(out).not.toMatch(/\d+d ago/);
  });
});
