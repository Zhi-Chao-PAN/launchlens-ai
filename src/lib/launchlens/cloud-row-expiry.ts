/**
 * Format a share-link expiry for the compact row badge in the
 * cloud-workspaces panel.
 *
 * Unlike `formatExpiryBadge` which produces human bucket labels
 * ("Expires in 3 weeks"), the row badge has a tighter visual budget
 * and only needs day-resolution: "Expires in 7d" or "Expired". This
 * helper centralises both the badge-key generation and the local-timezone
 * tooltip text so every row in the list reads the same.
 *
 * Returns an i18n descriptor `{ key, params, title }` rather than a
 * pre-rendered label string so the caller can translate the badge with
 * its active locale. `title` is a local-tz timestamp (dates are locale-
 * independent of the UI language) and is rendered verbatim.
 *
 * Inputs are the same ISO timestamp the workspace record already
 * stores. The function:
 * - clamps the remaining days to a minimum of 1 when still in the
 *   future (so "Expires in 1d" reads as "today/tomorrow", not "0d"),
 * - emits `rowExpiry.expired` once the timestamp is in the past,
 * - returns `null` when there is no expiry at all so the caller can
 *   skip rendering the badge entirely.
 *
 * The optional `now` argument exists so the helper can be exercised
 * deterministically in unit tests.
 */
export type CloudRowExpiry = {
  key: "rowExpiry.expired" | "rowExpiry.expiresIn";
  params?: Record<string, string>;
  title: string;
};

export function cloudRowExpiry(
  expiresAt: string | null,
  now: number = Date.now(),
): CloudRowExpiry | null {
  if (!expiresAt) return null;
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) return null;
  if (target <= now) {
    return {
      key: "rowExpiry.expired",
      title: new Date(target).toLocaleString(),
    };
  }
  const ms = target - now;
  const days = Math.max(1, Math.ceil(ms / 86_400_000));
  return {
    key: "rowExpiry.expiresIn",
    params: { days: String(days) },
    title: new Date(target).toLocaleString(),
  };
}
