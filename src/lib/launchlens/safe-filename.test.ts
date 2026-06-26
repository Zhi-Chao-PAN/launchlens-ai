import { describe, expect, it } from "vitest";
import { buildSafeFilename } from "./safe-filename";

const FIXED_NOW = new Date("2026-01-15T09:00:00.000Z"); // 20260115090000

describe("buildSafeFilename", () => {
  it("returns 'untitled-<ts>.<ext>' for empty input", () => {
    expect(buildSafeFilename({ source: "", ext: "md", now: FIXED_NOW })).toBe(
      "untitled-20260115090000.md",
    );
  });
  it("returns 'untitled-<ts>.<ext>' for whitespace-only input", () => {
    expect(buildSafeFilename({ source: "   \n\t  ", ext: "md", now: FIXED_NOW })).toBe(
      "untitled-20260115090000.md",
    );
  });
  it("returns 'untitled-<ts>.<ext>' for a string that slugifies to empty", () => {
    expect(buildSafeFilename({ source: "!!!", ext: "md", now: FIXED_NOW })).toBe(
      "untitled-20260115090000.md",
    );
  });
  it("lowercases and slugifies the source", () => {
    expect(buildSafeFilename({ source: "Will Users Pay for X?", ext: "md", now: FIXED_NOW })).toBe(
      "will-users-pay-for-x-20260115090000.md",
    );
  });
  it("collapses multiple non-alphanumeric chars into a single '-'", () => {
    expect(buildSafeFilename({ source: "foo --- bar___baz", ext: "md", now: FIXED_NOW })).toBe(
      "foo-bar-baz-20260115090000.md",
    );
  });
  it("strips leading and trailing '-'", () => {
    expect(buildSafeFilename({ source: "---hello---", ext: "md", now: FIXED_NOW })).toBe(
      "hello-20260115090000.md",
    );
  });
  it("caps the slug at 60 characters", () => {
    const long = "a".repeat(100);
    const out = buildSafeFilename({ source: long, ext: "md", now: FIXED_NOW });
    // 'aaaa...a' (60 chars) + '-20260115090000' + '.md'
    expect(out).toBe("a".repeat(60) + "-20260115090000.md");
  });
  it("respects a custom maxSlugLength", () => {
    expect(
      buildSafeFilename({ source: "a".repeat(20), ext: "md", now: FIXED_NOW, maxSlugLength: 5 }),
    ).toBe("aaaaa-20260115090000.md");
  });
  it("respects a custom fallback", () => {
    expect(
      buildSafeFilename({ source: "", ext: "md", now: FIXED_NOW, fallback: "hypothesis" }),
    ).toBe("hypothesis-20260115090000.md");
  });
  it("uses the given 'ext' verbatim", () => {
    expect(buildSafeFilename({ source: "x", ext: "json", now: FIXED_NOW })).toBe(
      "x-20260115090000.json",
    );
  });
  it("preserves digits in the source", () => {
    expect(buildSafeFilename({ source: "Q4 plan 2026", ext: "md", now: FIXED_NOW })).toBe(
      "q4-plan-2026-20260115090000.md",
    );
  });
  it("uses Date.now() when no 'now' is passed (timestamp is UTC)", () => {
    const before = Date.now();
    const out = buildSafeFilename({ source: "x", ext: "md" });
    const after = Date.now();
    // Extract the YYYYMMDDhhmmss segment and ensure it lies within
    // a generous window around the [before, after] interval (the
    // timestamp is truncated to whole seconds so it can be up to
    // ~1s outside the window).
    const m = out.match(/-(\d{14})\.md$/);
    expect(m).not.toBeNull();
    const ts = m![1];
    const year = parseInt(ts.slice(0, 4), 10);
    const month = parseInt(ts.slice(4, 6), 10);
    const day = parseInt(ts.slice(6, 8), 10);
    const hour = parseInt(ts.slice(8, 10), 10);
    const min = parseInt(ts.slice(10, 12), 10);
    const sec = parseInt(ts.slice(12, 14), 10);
    const date = new Date(Date.UTC(year, month - 1, day, hour, min, sec));
    // Allow ±2 seconds of slack for the truncation.
    expect(date.getTime()).toBeGreaterThanOrEqual(before - 2_000);
    expect(date.getTime()).toBeLessThanOrEqual(after + 2_000);
  });
});
