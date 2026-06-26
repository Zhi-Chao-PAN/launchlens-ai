import { describe, expect, it } from "vitest";
import { formatExpiryBadge } from "./expiry-format";

const NOW = new Date("2026-01-01T00:00:00Z").getTime();
const DAY = 86_400_000;

function iso(deltaMs: number): string {
  return new Date(NOW + deltaMs).toISOString();
}

describe("formatExpiryBadge", () => {
  it("returns null when expiresAt is null", () => {
    expect(formatExpiryBadge(null, NOW)).toBeNull();
  });

  it("returns null when already expired (target <= now)", () => {
    expect(formatExpiryBadge(iso(0), NOW)).toBeNull();
    expect(formatExpiryBadge(iso(-1000), NOW)).toBeNull();
  });

  it("returns null for a clearly past timestamp", () => {
    expect(formatExpiryBadge(iso(-1 * DAY), NOW)).toBeNull();
  });

  it("uses singular year for exactly 365 days", () => {
    expect(formatExpiryBadge(iso(365 * DAY), NOW)).toEqual({
      label: "Expires in 1 year",
      title: "Expires " + iso(365 * DAY),
    });
  });

  it("uses plural years for ~2 years", () => {
    expect(formatExpiryBadge(iso(2 * 365 * DAY), NOW)?.label).toBe(
      "Expires in 2 years",
    );
  });

  it("uses singular month for ~60 days", () => {
    // Function uses days >= 60 as the months threshold
    expect(formatExpiryBadge(iso(60 * DAY), NOW)?.label).toBe(
      "Expires in 2 months",
    );
  });

  it("uses plural months for ~90 days", () => {
    expect(formatExpiryBadge(iso(90 * DAY), NOW)?.label).toBe(
      "Expires in 3 months",
    );
  });

  it("uses weeks for 30 days (below the months threshold of 60)", () => {
    expect(formatExpiryBadge(iso(30 * DAY), NOW)?.label).toBe(
      "Expires in 4 weeks",
    );
  });

  it("uses singular week for 7 days", () => {
    expect(formatExpiryBadge(iso(7 * DAY), NOW)?.label).toBe(
      "Expires in 1 week",
    );
  });

  it("uses plural weeks for 21 days (3 weeks)", () => {
    expect(formatExpiryBadge(iso(21 * DAY), NOW)?.label).toBe(
      "Expires in 3 weeks",
    );
  });

  it("uses days for 2-6 days", () => {
    expect(formatExpiryBadge(iso(2 * DAY), NOW)?.label).toBe("Expires in 2 days");
    expect(formatExpiryBadge(iso(5 * DAY), NOW)?.label).toBe("Expires in 5 days");
  });

  it("uses 'tomorrow' for ~1 day", () => {
    expect(formatExpiryBadge(iso(1 * DAY), NOW)?.label).toBe(
      "Expires tomorrow",
    );
  });

  it("uses hours-granularity rounding so 1ms still reads as 1 day", () => {
    // Math.ceil ensures 'still 1ms left' reads as 'Expires tomorrow' (1 day)
    expect(formatExpiryBadge(iso(1), NOW)?.label).toBe("Expires tomorrow");
  });

  it("rounds up sub-day windows to 1 day", () => {
    expect(formatExpiryBadge(iso(12 * 60 * 60 * 1000), NOW)?.label).toBe(
      "Expires tomorrow",
    );
  });

  it("uses months for 364 days (months threshold is 60, years is 365)", () => {
    expect(formatExpiryBadge(iso(364 * DAY), NOW)?.label).toBe(
      "Expires in 12 months",
    );
  });

  it("falls into weeks bucket for sub-60-day spans like 59 days", () => {
    // Boundary is days >= 60 for months. 59 < 60 so weeks: round(59/7) = 8.
    expect(formatExpiryBadge(iso(59 * DAY), NOW)?.label).toBe(
      "Expires in 8 weeks",
    );
  });

  it("includes the ISO 8601 timestamp in the title for tooltip use", () => {
    const ts = iso(7 * DAY);
    const out = formatExpiryBadge(ts, NOW);
    expect(out?.title).toBe("Expires " + ts);
  });
});
