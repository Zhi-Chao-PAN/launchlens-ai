/**
 * Filter a list of bullets to non-blank items and apply a max length
 * cap. Used by the share view (and the local workspace) to clean up
 * generated / imported bullet lists that may contain empty strings,
 * whitespace, or sentinel placeholders like '-'.
 */
export function cleanBullets(
  bullets: readonly string[] | null | undefined,
  opts: { max?: number; minLength?: number } = {},
): string[] {
  const { max = 12, minLength = 1 } = opts;
  if (!bullets) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of bullets) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed.length < minLength) continue;
    if (trimmed === "-") continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}
