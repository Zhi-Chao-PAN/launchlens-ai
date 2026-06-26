import { describe, expect, it } from "vitest";
import { futureIso } from "./future-iso";

const NOW = new Date("2026-01-15T12:00:00Z").getTime();

describe("futureIso", () => {
  it("returns null when days is null", () => {
    expect(futureIso(null, NOW)).toBeNull();
  });
  it("returns null when days is undefined", () => {
    expect(futureIso(undefined, NOW)).toBeNull();
  });
  it("returns null when days is 0 (no expiry, not 'today')", () => {
    expect(futureIso(0, NOW)).toBeNull();
  });
  it("returns an ISO string 7 days in the future", () => {
    const out = futureIso(7, NOW);
    expect(out).toBe("2026-01-22T12:00:00.000Z");
  });
  it("returns an ISO string 30 days in the future", () => {
    const out = futureIso(30, NOW);
    expect(out).toBe("2026-02-14T12:00:00.000Z");
  });
  it("returns a string in ISO 8601 / UTC format", () => {
    expect(futureIso(1, NOW)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
  it("delegates to Date.now() when no 'now' is passed", () => {
    const before = Date.now();
    const out = futureIso(1);
    const after = Date.now();
    expect(out).not.toBeNull();
    const outMs = new Date(out as string).getTime();
    expect(outMs).toBeGreaterThanOrEqual(before + 86_400_000);
    expect(outMs).toBeLessThanOrEqual(after + 86_400_000);
  });
});
