/**
 * Quote a string for inclusion in a YAML double-quoted scalar.
 *
 * YAML's double-quoted scalar syntax requires that the surrounding
 * double quotes, and the backslashes used for escaping, are themselves
 * escaped. The replacement is intentionally minimal — the validation
 * board only emits values that are plain text (no embedded tabs,
 * newlines, or control characters) so we don't need to handle the
 * full YAML escape table.
 */
export function yamlQuote(value: string): string {
  return "\"" + value.replace(/["\\]/g, "\\$&") + "\"";
}
