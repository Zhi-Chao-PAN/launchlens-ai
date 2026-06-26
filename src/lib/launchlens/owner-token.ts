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
