/**
 * Describe the provenance of the current owner token as a short label.
 *
 * The cloud-workspaces panel surfaces a "scope" line under the panel
 * header that tells the user whether the cloud history they are
 * looking at is bound to this browser session or to a recovery key
 * they can carry across devices.
 *
 * - `acct_*` prefix => "Recovery-linked" (the token was minted by
 *   `deriveRecoveryOwnerToken` and stored in localStorage after the
 *   user re-entered their handle + key).
 * - anything else => "This browser" (a fresh, device-local token).
 */
export function ownerScopeLabel(ownerToken: string): string {
  return ownerToken.startsWith("acct_") ? "Recovery-linked" : "This browser";
}
