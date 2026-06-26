/**
 * Generate a fresh evidence-row id.
 *
 * Wraps `crypto.randomUUID()` so the call site reads as a domain
 * operation rather than a generic crypto call, and so tests can mock
 * this single function instead of stubbing the global `crypto`.
 *
 * Falls back to a timestamp-prefixed random string on environments
 * without `crypto.randomUUID` (older Safari, server-side without
 * webcrypto) so unit tests in node-without-jsdom don't have to mock
 * the whole global before they can run.
 */
export function evidenceId(): string {
  const cryptoApi = typeof globalThis !== "undefined" ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return "ev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}
