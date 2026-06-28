/**
 * Build a cryptographically random 32-byte owner token for the
 * cloud-workspaces panel, encoded as a URL-safe Base64 string.
 *
 * The token identifies the local browser to the cloud-workspaces API
 * and is stored in localStorage under the 'launchlens.ownerToken' key.
 *
 * The optional `getRandomValues` argument is exposed for unit-test
 * reproducibility; in production the helper delegates to
 * `globalThis.crypto.getRandomValues`.
 */
export function createOwnerToken(getRandomValues: (arr: Uint8Array) => Uint8Array = (a) => globalThis.crypto.getRandomValues(a)): string {
  const bytes = getRandomValues(new Uint8Array(32));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/**
 * R255: read an existing owner token from localStorage, validating it
 * matches the server's OWNER_TOKEN_PATTERN; otherwise mint a fresh one
 * (and persist it when the storage backend is writable).
 *
 * The `storage` parameter is injectable for testability — pass either
 * `window.localStorage` in production or a plain object in tests. Returns
 * the resolved token; callers are responsible for using it on every
 * authenticated request (e.g. as the `x-launchlens-owner` header).
 */
const OWNER_TOKEN_PATTERN_LOCAL = /^[A-Za-z0-9_-]{43,128}$/;

export function getOrCreateOwnerToken(
  storage: Pick<Storage, "getItem" | "setItem"> | null | undefined,
  storageKey: string,
): string {
  try {
    const existing = storage?.getItem(storageKey);
    if (existing && OWNER_TOKEN_PATTERN_LOCAL.test(existing)) {
      return existing;
    }
  } catch {
    // localStorage may throw (private mode quota, SSR context, sandbox).
    // Fall through to minting.
  }
  const minted = createOwnerToken();
  try {
    storage?.setItem(storageKey, minted);
  } catch {
    // Persistence is best-effort — the in-memory token is still valid for
    // this session; the caller will re-mint on the next visit if storage
    // is still unavailable.
  }
  return minted;
}
