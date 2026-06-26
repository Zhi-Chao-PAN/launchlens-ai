import { formatRelativeTime } from "./generated-time";

/**
 * The user-facing label for the save-state pill shown in the
 * launch-workspace toolbar. Three states:
 *   - storage not yet ready  -> "Preparing save"
 *   - nothing saved yet      -> "Saved locally"
 *   - saved at time T        -> "Saved 3m ago" / "Saved just now" / etc.
 */
export function formatSaveLabel(opts: {
  isStorageReady: boolean;
  savedAt: string | null;
}): string {
  const { isStorageReady, savedAt } = opts;
  if (!isStorageReady) return "Preparing save";
  if (!savedAt) return "Saved locally";
  return `Saved ${formatRelativeTime(savedAt)}`;
}
