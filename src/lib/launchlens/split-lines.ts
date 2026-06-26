/**
 * Split a multi-line string into an array of trimmed, non-blank lines.
 *
 * Used by the local launch-workspace's <EditableLines> component to
 * turn a textarea's value back into a list of items. Trims each line
 * so leading/trailing whitespace from copy-paste does not survive, and
 * drops blank lines so the user can separate items with double
 * newlines without producing empty entries.
 *
 * Accepts CRLF, LF, and CR line endings so pasted text from any
 * platform is handled correctly.
 */
export function splitLines(value: string): string[] {
  return value
    .split(/\r\n|\r|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
