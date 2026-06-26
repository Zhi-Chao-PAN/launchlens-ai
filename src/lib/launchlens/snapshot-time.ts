/**
 * Format a snapshot timestamp for the cloud-workspaces panel.
 *
 * Mirrors the previous inline `formatSnapshotTime` helper in
 * components/cloud-workspaces.tsx, with two improvements:
 *   - Pure (no implicit state); takes an explicit `now` for testability
 *   - Uses an explicit timezone (UTC) so the formatted output is the
 *     same on the server and the client. Previously the helper relied
 *     on the runtime timezone which made timestamps inconsistent across
 *     viewers of the same snapshot.
 *
 * The output format is "Mon DD, HH:MM" — e.g. "Jan 5, 09:00".
 */
export function formatSnapshotTime(value: string, timeZone: string = "UTC"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}
