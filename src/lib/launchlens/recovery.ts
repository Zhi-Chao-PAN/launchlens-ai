const RECOVERY_KEY_PATTERN = /^[A-Za-z0-9_-]{24,128}$/;
const RECOVERY_LABEL_MAX_LENGTH = 160;

function base64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function createRecoveryKey() {
  return base64Url(crypto.getRandomValues(new Uint8Array(24)));
}

export async function deriveRecoveryOwnerToken(
  label: string,
  recoveryKey: string,
) {
  const normalizedLabel = label.trim().toLowerCase();
  const normalizedKey = recoveryKey.trim();

  if (
    !normalizedLabel ||
    normalizedLabel.length > RECOVERY_LABEL_MAX_LENGTH ||
    !RECOVERY_KEY_PATTERN.test(normalizedKey)
  ) {
    throw new Error("invalid_recovery_input");
  }

  const bytes = new TextEncoder().encode(
    `launchlens-owner-v1\u0000${normalizedLabel}\u0000${normalizedKey}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return `acct_${base64Url(new Uint8Array(digest))}`;
}
