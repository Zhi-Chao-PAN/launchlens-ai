import { describe, expect, it } from "vitest";
import { formatExpiryBadge } from "./expiry-format";

const NOW = new Date("2026-01-01T00:00:00Z").getTime();
const DAY = 86_400_000;

function iso(deltaMs: number): string {
  return new Date(NOW + deltaMs).toISOString();
}

describe("formatExpiryBadge", () => {
  it("returns the Permanent descriptor (neutral) when expiresAt is null", () => {
    expect(formatExpiryBadge(null, NOW)).toEqual({
      key: "expiry.permanent",
      titleKey: "expiry.permanentTitle",
      variant: "neutral",
    });
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
      key: "expiry.expiresYearsOne",
      params: undefined,
      titleKey: "expiry.titlePrefix",
      titleParams: { ts: iso(365 * DAY) },
      variant: "danger",
    });
  });

  it("uses plural years for ~2 years", () => {
    expect(formatExpiryBadge(iso(2 * 365 * DAY), NOW)?.key).toBe(
      "expiry.expiresYearsMany",
    );
    expect(formatExpiryBadge(iso(2 * 365 * DAY), NOW)?.params).toEqual({
      n: 2,
    });
  });

  it("uses months for ~60 days (threshold is 60)", () => {
    expect(formatExpiryBadge(iso(60 * DAY), NOW)?.key).toBe(
      "expiry.expiresMonthsMany",
    );
    expect(formatExpiryBadge(iso(60 * DAY), NOW)?.params).toEqual({ n: 2 });
  });

  it("uses plural months for ~90 days", () => {
    expect(formatExpiryBadge(iso(90 * DAY), NOW)?.key).toBe(
      "expiry.expiresMonthsMany",
    );
    expect(formatExpiryBadge(iso(90 * DAY), NOW)?.params).toEqual({ n: 3 });
  });

  it("uses weeks for 30 days (below the months threshold of 60)", () => {
    expect(formatExpiryBadge(iso(30 * DAY), NOW)?.key).toBe(
      "expiry.expiresWeeksMany",
    );
    expect(formatExpiryBadge(iso(30 * DAY), NOW)?.params).toEqual({ n: 4 });
  });

  it("uses singular week for 7 days", () => {
    expect(formatExpiryBadge(iso(7 * DAY), NOW)?.key).toBe(
      "expiry.expiresWeeksOne",
    );
    expect(formatExpiryBadge(iso(7 * DAY), NOW)?.params).toBeUndefined();
  });

  it("uses plural weeks for 21 days (3 weeks)", () => {
    expect(formatExpiryBadge(iso(21 * DAY), NOW)?.key).toBe(
      "expiry.expiresWeeksMany",
    );
    expect(formatExpiryBadge(iso(21 * DAY), NOW)?.params).toEqual({ n: 3 });
  });

  it("uses days for 2-6 days", () => {
    expect(formatExpiryBadge(iso(2 * DAY), NOW)?.key).toBe("expiry.expiresDaysMany");
    expect(formatExpiryBadge(iso(2 * DAY), NOW)?.params).toEqual({ n: 2 });
    expect(formatExpiryBadge(iso(5 * DAY), NOW)?.key).toBe("expiry.expiresDaysMany");
    expect(formatExpiryBadge(iso(5 * DAY), NOW)?.params).toEqual({ n: 5 });
  });

  it("uses 'tomorrow' for ~1 day", () => {
    expect(formatExpiryBadge(iso(1 * DAY), NOW)?.key).toBe("expiry.tomorrow");
  });

  it("uses hours-granularity rounding so 1ms still reads as 1 day", () => {
    // Math.ceil ensures 'still 1ms left' reads as 'Expires tomorrow' (1 day)
    expect(formatExpiryBadge(iso(1), NOW)?.key).toBe("expiry.tomorrow");
  });

  it("rounds up sub-day windows to 1 day", () => {
    expect(formatExpiryBadge(iso(12 * 60 * 60 * 1000), NOW)?.key).toBe(
      "expiry.tomorrow",
    );
  });

  it("uses months for 364 days (months threshold is 60, years is 365)", () => {
    expect(formatExpiryBadge(iso(364 * DAY), NOW)?.key).toBe(
      "expiry.expiresMonthsMany",
    );
    expect(formatExpiryBadge(iso(364 * DAY), NOW)?.params).toEqual({ n: 12 });
  });

  it("falls into weeks bucket for sub-60-day spans like 59 days", () => {
    // Boundary is days >= 60 for months. 59 < 60 so weeks: round(59/7) = 8.
    expect(formatExpiryBadge(iso(59 * DAY), NOW)?.key).toBe(
      "expiry.expiresWeeksMany",
    );
    expect(formatExpiryBadge(iso(59 * DAY), NOW)?.params).toEqual({ n: 8 });
  });

  it("passes the ISO timestamp into the title prefix params for tooltip use", () => {
    const ts = iso(7 * DAY);
    const out = formatExpiryBadge(ts, NOW);
    expect(out?.titleKey).toBe("expiry.titlePrefix");
    expect(out?.titleParams).toEqual({ ts });
  });

  it("tags a future expiry with variant 'danger'", () => {
    expect(formatExpiryBadge(iso(7 * DAY), NOW)?.variant).toBe("danger");
  });

  it("tags a permanent link with variant 'neutral'", () => {
    expect(formatExpiryBadge(null, NOW)?.variant).toBe("neutral");
  });

  it("returns null for an unparseable expiresAt string (no 'NaN years' leak)", () => {
    expect(formatExpiryBadge("not a date", NOW)).toBeNull();
    expect(formatExpiryBadge("2026-99-99", NOW)).toBeNull();
  });

  it("treats an empty string as a permanent link (falsy == null)", () => {
    // Empty string is deliberately treated the same as null: it is
    // falsy, so the formatter falls into the permanent branch rather
    // than the NaN-arithmetic trap.
    expect(formatExpiryBadge("", NOW)?.variant).toBe("neutral");
  });
});
