import { formatExpiryBadge } from "./expiry-format";

/**
 * Build the trailing sentence appended to a cloud-workspace share-link
 * description.
 *
 * The label forms a continuous sentence when concatenated with the
 * preceding text ("Share this link. It expires in 3 days."), so the
 * leading space and trailing period are intentional. When the snapshot
 * has no expiry at all (`expiresAt` is empty), the caller should not
 * invoke this helper — there is nothing meaningful to append.
 *
 * If `formatExpiryBadge` returns `null` (already expired), the helper
 * reports that explicitly rather than emitting an empty fragment.
 */
export function shareExpirySuffix(expiresAt: string | null | undefined): string {
  const badge = formatExpiryBadge(expiresAt ?? null);
  if (!badge) return " It has expired.";
  return " " + badge.label + ".";
}
