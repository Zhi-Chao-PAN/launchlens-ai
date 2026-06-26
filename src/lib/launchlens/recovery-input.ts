/**
 * Validate a user's recovery-handle + recovery-key pair before it is
 * sent to the recovery endpoint.
 *
 * The cloud-workspaces panel collects a "recovery handle" (a free-text
 * label the user picks when they first save a snapshot) and a recovery
 * key (a server-issued opaque string). Before either is used to
 * derive an owner token, both must be non-empty and pass the format
 * rules:
 *
 * - handle: 1-160 characters after trimming whitespace
 * - key:    24-128 characters, only `[A-Za-z0-9_-]`
 *
 * Returning both an error message and a `ready` flag in one helper
 * keeps the form-level rule and the disabled-button rule in sync —
 * they were previously two separate derivations that could drift.
 */
export const RECOVERY_HANDLE_MAX = 160;
export const RECOVERY_KEY_MIN = 24;
export const RECOVERY_KEY_MAX = 128;
export const RECOVERY_KEY_PATTERN = /^[A-Za-z0-9_-]{24,128}$/;

export type RecoveryInput = {
  label: string;
  key: string;
};

export type RecoveryValidation = {
  trimmedLabel: string;
  trimmedKey: string;
  labelError: string;
  keyError: string;
  ready: boolean;
};

export function validateRecoveryInput(input: RecoveryInput): RecoveryValidation {
  const trimmedLabel = input.label.trim();
  const trimmedKey = input.key.trim();
  const labelError = !trimmedLabel
    ? "Enter the handle you used when you first saved the key."
    : trimmedLabel.length > RECOVERY_HANDLE_MAX
      ? "Handle is too long (max " + RECOVERY_HANDLE_MAX + " characters)."
      : "";
  const keyError = !trimmedKey
    ? "Enter or generate your recovery key."
    : !RECOVERY_KEY_PATTERN.test(trimmedKey)
      ? "Key does not look like a valid LaunchLens recovery key."
      : "";
  return {
    trimmedLabel,
    trimmedKey,
    labelError,
    keyError,
    ready: !labelError && !keyError && Boolean(trimmedLabel) && Boolean(trimmedKey),
  };
}
