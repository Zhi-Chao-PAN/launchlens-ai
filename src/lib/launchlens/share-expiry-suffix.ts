import { formatExpiryBadge } from "./expiry-format";

/**
 * Build the trailing-sentence descriptor appended to a cloud-workspace
 * share-link description.
 *
 * Returns an i18n descriptor `{ key, params }` rather than a pre-rendered
 * string so the caller can translate it with its active locale. The
 * dictionary entries (`shareExpiry.permanent` / `.expired` / `.expiresIn`)
 * carry their own leading space and trailing period so the rendered text
 * still forms a continuous sentence.
 *
 * - null/empty expiry → `shareExpiry.permanent` (" Permanent.")
 * - already expired or unparseable → `shareExpiry.expired` (" It has expired.")
 * - future expiry → `shareExpiry.expiresIn` with `{ label }` drawn from
 *   `formatExpiryBadge`'s bucket label (e.g. "Expires in 3 days").
 *
 * If `formatExpiryBadge` returns `null` (already expired), the helper
 * reports that explicitly rather than emitting a permanent suffix.
 */
export type ShareExpirySuffix = {
  key: "shareExpiry.permanent" | "shareExpiry.expired" | "shareExpiry.expiresIn";
  params?: Record<string, string>;
};

export function shareExpirySuffix(
  expiresAt: string | null | undefined,
): ShareExpirySuffix {
  if (!expiresAt) {
    return { key: "shareExpiry.permanent" };
  }
  const badge = formatExpiryBadge(expiresAt ?? null);
  if (!badge) {
    return { key: "shareExpiry.expired" };
  }
  return { key: "shareExpiry.expiresIn", params: { label: badge.label } };
}
