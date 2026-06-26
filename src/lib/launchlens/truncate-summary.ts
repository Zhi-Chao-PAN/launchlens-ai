/**
 * Truncate a free-text summary to `max` characters with an ellipsis
 * suffix when truncation occurred. Used by the share page's
 * generateMetadata to build a short `description` (and the
 * Twitter / OG card copy) from a longer workspace summary.
 *
 * Returns the empty string when the input is null, undefined, or
 * an empty string — never throws on missing data.
 *
 * When the input is exactly `max` characters long, no ellipsis is
 * added. When the input is `max + 1` or longer, the output is the
 * first `max` characters + the ellipsis.
 *
 * Note: this is character-based, not grapheme-based. CJK characters
 * are usually one BMP code point each so this rarely produces
 * visibly-clipped output, but emoji sequences may be cut mid-codepoint
 * if they fall on the boundary. Acceptable for meta descriptions.
 */
export function truncateSummary(summary: string | null | undefined, max: number = 160): string {
  if (!summary) return "";
  if (summary.length <= max) return summary;
  return summary.slice(0, max) + "…";
}
