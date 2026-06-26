/**
 * Title-case a single word: upper-case the first character, leave the
 * rest untouched.
 *
 * This is the simplest possible "Title Case" — it does not split on
 * spaces, lower-case the tail, or rejoin camelCase. It is meant for
 * short storage-code values (e.g. "untested" -> "Untested",
 * "supported" -> "Supported") that arrive as a single lower-case word
 * and need to read as a capitalized display string.
 *
 * Returns the empty string for null / undefined / empty input so
 * callers can use the result directly without a guard.
 */
export function titleCase(value: string | null | undefined): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
