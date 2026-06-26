/**
 * Join an array of items into a textarea-friendly multi-line string.
 *
 * Round-trip companion to `splitLines`: any value produced by
 * `splitLines` round-trips back to the same array after a
 * `splitLines(joinLines(value))` pass. The empty array serialises to
 * the empty string so the textarea displays no phantom blank line.
 *
 * Separator is always LF so the value is portable across platforms
 * and `splitLines` (which accepts CRLF / LF / CR) splits it back
 * cleanly.
 */
export function joinLines(items: readonly string[]): string {
  return items.join("\n");
}
