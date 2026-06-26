/**
 * Strip a single layer of matched quotes from a (possibly undefined)
 * environment value.
 *
 * Vercel sometimes writes env-file values with surrounding double
 * quotes when the value contains newlines or equals signs; the
 * Postgres client does not strip those before parsing, which causes
 * the "invalid connection string" error at startup.
 *
 * Only strips when:
 * - the value is at least 2 characters long, AND
 * - the first and last characters are the same quote ('" or "').
 *
 * Leaves everything else untouched, so a value that legitimately
 * starts with a quote and ends with something else is preserved
 * as-is rather than silently truncated.
 */
export function cleanEnvValue(value: string | undefined | null): string {
  const trimmed = (value ?? "").trim();
  const quote = trimmed[0];
  if (
    trimmed.length >= 2 &&
    (quote === '"' || quote === "'") &&
    trimmed.endsWith(quote)
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Pick the first non-empty database URL from a list of env-var names,
 * in priority order.
 *
 * Both values go through `cleanEnvValue` so a Vercel-style
 * double-quoted env value resolves identically regardless of which
 * variable name was set.
 */
export function pickEnvConnection(names: readonly string[]): string {
  for (const name of names) {
    const v = cleanEnvValue(process.env[name]);
    if (v) return v;
  }
  return "";
}

/**
 * Return a safe-to-log version of an error message: any connection
 * strings present in `error`'s message are replaced with `[redacted]`.
 *
 * Reads the same env vars as `pickEnvConnection` so a user-supplied
 * DATABASE_URL pasted into an error report doesn't leak through the
 * logs.
 */
export function sanitizedErrorMessage(
  error: unknown,
  envNames: readonly string[] = ["DATABASE_MIGRATION_URL", "DATABASE_URL"],
): string {
  const base =
    error instanceof Error
      ? error.message
      : "LaunchLens cloud database migration failed.";
  const blockedValues = envNames
    .map((name) => cleanEnvValue(process.env[name]))
    .filter((value) => value.length >= 12);
  return blockedValues.reduce(
    (msg, value) => msg.split(value).join("[redacted]"),
    base,
  );
}