import { formatExpiryBadge, type ExpiryBadgeKey } from "./expiry-format";

/**
 * Build the trailing-sentence descriptor appended to a cloud-workspace
 * share-link description.
 *
 * Returns an i18n descriptor `{ key, params?, labelKey, labelParams? }`
 * rather than a pre-rendered string so the caller can translate it with
 * its active locale.
 *
 * - null/empty expiry → `shareExpiry.permanent` (" Permanent.")
 * - already expired or unparseable → `shareExpiry.expired` (" It has expired.")
 * - future expiry → `shareExpiry.expiresSentence` (" {label}.") where
 *   `{label}` is the translated bucket label from `formatExpiryBadge`
 *   (e.g. "3 天后过期"). The caller resolves `{label}` by translating
 *   `labelKey`/`labelParams` first, then passes the result into the
 *   sentence via `t(key, { label: t(labelKey, labelParams) })`.
 *
 * This two-step translation avoids the old bug where the sentence wrapper
 * ("Expires in {label}") prepended "Expires in" to a label that already
 * contained "Expires in", producing "Expires in Expires in 3 days".
 *
 * If `formatExpiryBadge` returns `null` (already expired), the helper
 * reports that explicitly rather than emitting a permanent suffix.
 */
export type ShareExpirySuffix = {
  /** Sentence-wrapper key; one of the three `shareExpiry.*` keys below. */
  key: "shareExpiry.permanent" | "shareExpiry.expired" | "shareExpiry.expiresSentence";
  params?: Record<string, string | number>;
  /** Bucket-label key from formatExpiryBadge, for the `{label}` slot. */
  labelKey?: ExpiryBadgeKey;
  /** Bucket-label interpolation params. */
  labelParams?: Record<string, string | number>;
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
  return {
    key: "shareExpiry.expiresSentence",
    labelKey: badge.key,
    labelParams: badge.params,
  };
}
