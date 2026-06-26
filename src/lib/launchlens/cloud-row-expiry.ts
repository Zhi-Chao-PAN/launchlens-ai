/**
 * Format a share-link expiry for the compact row badge in the
 * cloud-workspaces panel.
 *
 * Unlike `formatExpiryBadge` which produces human bucket labels
 * ("Expires in 3 weeks"), the row badge has a tighter visual budget
 * and only needs day-resolution: "Expires in 7d" or "Expired". This
 * helper centralises both the label generation and the local-timezone
 * tooltip text so every row in the list reads the same.
 *
 * Inputs are the same ISO timestamp the workspace record already
 * stores. The function:
 * - clamps the remaining days to a minimum of 1 when still in the
 *   future (so "Expires in 1d" reads as "today/tomorrow", not "0d"),
 * - emits "Expired" once the timestamp is in the past,
 * - returns `null` when there is no expiry at all so the caller can
 *   skip rendering the badge entirely.
 *
 * The optional `now` argument exists so the helper can be exercised
 * deterministically in unit tests.
 */
export type CloudRowExpiry = {
  label: string;
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
      label: "Expired",
      title: "Expired " + new Date(target).toLocaleString(),
    };
  }
  const ms = target - now;
  const days = Math.max(1, Math.ceil(ms / 86_400_000));
  return {
    label: "Expires in " + days + "d",
    title: "Expires " + new Date(target).toLocaleString(),
  };
}
