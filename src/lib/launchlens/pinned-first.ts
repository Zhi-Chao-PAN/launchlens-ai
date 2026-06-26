/**
 * Sort comparator that puts `pinned`-flagged items before the rest.
 *
 * Pure: the comparator reads only the `pinned` property of each input,
 * so it works on any record shape that exposes a `pinned` field.
 * Stable: items with the same pinned-ness retain their relative
 * order from the input array (Array.prototype.sort is stable in
 * modern engines).
 *
 * Usage:
 *   items.sort(pinnedFirst)
 *   items.sort(pinnedFirstBy("featured"))
 *
 * The optional `key` argument picks a different boolean property
 * name (defaults to "pinned").
 */
export function pinnedFirst<T extends Record<string, unknown>>(
  a: T,
  b: T,
): number {
  return Number(!!b.pinned) - Number(!!a.pinned);
}

export function pinnedFirstBy<T extends Record<string, unknown>>(key: keyof T) {
  return (a: T, b: T) => {
    const av = a[key];
    const bv = b[key];
    return Number(!!bv) - Number(!!av);
  };
}