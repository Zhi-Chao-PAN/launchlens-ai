/**
 * Build an ISO 8601 timestamp `days` days in the future.
 *
 * Returns null when `days` is null/undefined/0 — the cloud-workspaces
 * panel uses null to signal 'no expiry (permanent share)'.
 *
 * The optional `now` argument is exposed for unit-test reproducibility.
 * In production the helper delegates to Date.now().
 */
export function futureIso(days: number | null | undefined, now: number = Date.now()): string | null {
  if (!days) return null;
  return new Date(now + days * 86_400_000).toISOString();
}
