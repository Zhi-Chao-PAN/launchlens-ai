/**
 * Format a future expiry timestamp as a short, human-friendly badge label.
 *
 * Used by the share view and the cloud-workspaces panel to show how long a
 * share link has left. The function takes a fixed `now` (so callers can
 * avoid hydration mismatches by deferring until mounted) and returns a
 * short label for the badge plus a fuller title for the tooltip.
 *
 * Bucket order (largest to smallest):
 *   years    ->  >= 365 days
 *   months   ->  >= 60  days
 *   weeks    ->  >= 7   days
 *   days     ->  >= 2   days
 *   singular ->  1 day
 *   "tomorrow"-> exactly within 24h but > 0
 *   null     ->  expired (ms <= 0) or no expiresAt
 */
export function formatExpiryBadge(
  expiresAt: string | null,
  now: number = Date.now(),
): { label: string; title: string } | null {
  if (!expiresAt) return null;
  const target = new Date(expiresAt).getTime();
  const ms = target - now;
  if (ms <= 0) return null;
  // Round up so "still 1ms left" reads as "1 day remaining".
  const days = Math.max(1, Math.ceil(ms / 86_400_000));
  let label: string;
  if (days >= 365) {
    const years = Math.round(days / 365);
    label = "Expires in " + years + " year" + (years === 1 ? "" : "s");
  } else if (days >= 60) {
    const months = Math.round(days / 30);
    label = "Expires in " + months + " month" + (months === 1 ? "" : "s");
  } else if (days === 1) {
    label = "Expires tomorrow";
  } else if (days < 7) {
    label = "Expires in " + days + " days";
  } else {
    const weeks = Math.round(days / 7);
    label = "Expires in " + weeks + " week" + (weeks === 1 ? "" : "s");
  }
  return { label, title: "Expires " + new Date(expiresAt).toISOString() };
}
