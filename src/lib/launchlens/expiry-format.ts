/**
 * Format a future expiry timestamp as an i18n descriptor for a badge label.
 *
 * Used by the share view and the cloud-workspaces panel to show how long a
 * share link has left. The function takes a fixed `now` (so callers can
 * avoid hydration mismatches by deferring until mounted) and returns an
 * i18n descriptor `{ key, params?, titleKey, titleParams?, variant }` that
 * the caller translates with its active locale — it never renders text
 * itself, so the same call serves both English and zh-CN.
 *
 * Bucket order (largest to smallest):
 *   years    ->  >= 365 days
 *   months   ->  >= 60  days
 *   weeks    ->  >= 7   days
 *   days     ->  >= 2   days
 *   singular ->  1 day
 *   "tomorrow"-> exactly within 24h but > 0
 *   permanent->  expiresAt is null
 *   null     ->  expired (ms <= 0)
 *
 * The title for a future expiry embeds the raw ISO timestamp via
 * `expiry.titlePrefix` + `{ts}`; callers pass the ISO string in `titleParams`.
 */
export type ExpiryBadgeDescriptor = {
  /** Dictionary key for the badge label. */
  key: ExpiryBadgeKey;
  /** Interpolation params for the label key (e.g. `{ n }`). */
  params?: Record<string, string | number>;
  /** Dictionary key for the tooltip title. */
  titleKey: string;
  /** Interpolation params for the title key (e.g. `{ ts }`). */
  titleParams?: Record<string, string | number>;
  /** Visual variant: `neutral` for permanent links, `danger` for countdowns. */
  variant: "danger" | "neutral";
};

export type ExpiryBadgeKey =
  | "expiry.permanent"
  | "expiry.tomorrow"
  | "expiry.expiresYearsOne"
  | "expiry.expiresYearsMany"
  | "expiry.expiresMonthsOne"
  | "expiry.expiresMonthsMany"
  | "expiry.expiresWeeksOne"
  | "expiry.expiresWeeksMany"
  | "expiry.expiresDaysOne"
  | "expiry.expiresDaysMany";

export function formatExpiryBadge(
  expiresAt: string | null,
  now: number = Date.now(),
): ExpiryBadgeDescriptor | null {
  if (!expiresAt) {
    return {
      key: "expiry.permanent",
      titleKey: "expiry.permanentTitle",
      variant: "neutral",
    };
  }
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) return null;
  const ms = target - now;
  if (ms <= 0) return null;
  // Round up so "still 1ms left" reads as "1 day remaining".
  const days = Math.max(1, Math.ceil(ms / 86_400_000));
  const iso = new Date(expiresAt).toISOString();
  if (days >= 365) {
    const years = Math.round(days / 365);
    return {
      key: years === 1 ? "expiry.expiresYearsOne" : "expiry.expiresYearsMany",
      params: years === 1 ? undefined : { n: years },
      titleKey: "expiry.titlePrefix",
      titleParams: { ts: iso },
      variant: "danger",
    };
  }
  if (days >= 60) {
    const months = Math.round(days / 30);
    return {
      key: months === 1 ? "expiry.expiresMonthsOne" : "expiry.expiresMonthsMany",
      params: months === 1 ? undefined : { n: months },
      titleKey: "expiry.titlePrefix",
      titleParams: { ts: iso },
      variant: "danger",
    };
  }
  if (days === 1) {
    return {
      key: "expiry.tomorrow",
      titleKey: "expiry.tomorrowTitle",
      variant: "danger",
    };
  }
  if (days < 7) {
    return {
      key: days === 1 ? "expiry.expiresDaysOne" : "expiry.expiresDaysMany",
      params: days === 1 ? undefined : { n: days },
      titleKey: "expiry.titlePrefix",
      titleParams: { ts: iso },
      variant: "danger",
    };
  }
  const weeks = Math.round(days / 7);
  return {
    key: weeks === 1 ? "expiry.expiresWeeksOne" : "expiry.expiresWeeksMany",
    params: weeks === 1 ? undefined : { n: weeks },
    titleKey: "expiry.titlePrefix",
    titleParams: { ts: iso },
    variant: "danger",
  };
}
