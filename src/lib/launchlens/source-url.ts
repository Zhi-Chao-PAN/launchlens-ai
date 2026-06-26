/**
 * Extract the first HTTP(S) URL from a free-text source string.
 *
 * Used by the validation board's evidence cards to decide whether a
 * source field is "linkable" — i.e. should be rendered as an <a>
 * rather than plain text. If the entire string is a URL it is
 * returned verbatim; otherwise the first URL substring is extracted
 * (so a citation like "Per G2 reviews (https://g2.com/foo)" still
 * yields the URL). Returns null when no URL is present.
 */
export function extractSourceUrl(source: string | null | undefined): string | null {
  if (!source) return null;
  const trimmed = source.trim();
  if (!trimmed) return null;
  if (/^https?:\/\/\S+/i.test(trimmed)) return trimmed;
  const m = trimmed.match(/https?:\/\/\S+/i);
  return m ? m[0] : null;
}
