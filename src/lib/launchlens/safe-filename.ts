/**
 * Build a safe filename from a free-text assumption (or similar
 * string) for exporting a single hypothesis as JSON or Markdown.
 *
 *   - lowercases the input
 *   - trims surrounding whitespace
 *   - collapses any run of non-alphanumeric characters into a single
 *     '-' so 'Will users pay for X?!' becomes 'will-users-pay-for-x'
 *   - strips leading / trailing '-' separators
 *   - caps the slug length at 60 characters so the filename is sane
 *     even for very long assumptions
 *   - falls back to 'untitled' when the slug would be empty
 *   - appends a compact YYYYMMDDhhmmss timestamp from `now` (or
 *     Date.now() by default) so two exports in the same minute get
 *     unique filenames
 *   - always returns the form '<slug>-<timestamp>.<ext>'
 */
export function buildSafeFilename(opts: {
  source: string;
  ext: string;
  now?: Date;
  fallback?: string;
  maxSlugLength?: number;
}): string {
  const { source, ext, now = new Date(), fallback = "untitled", maxSlugLength = 60 } = opts;
  const slug = source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxSlugLength);
  const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return (slug || fallback) + "-" + ts + "." + ext;
}
