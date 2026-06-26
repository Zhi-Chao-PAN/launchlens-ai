import type { ExperimentStatus } from "./execution";

/**
 * Map a validation experiment status to the Tailwind classes used by
 * its pill in the validation board. Centralised so the four states
 * stay consistent and any visual tweak is made in one place.
 *
 *   untested  -> muted (no signal yet)
 *   testing   -> neutral (in progress)
 *   supported -> signal-supports (positive)
 *   refuted   -> signal-challenges (negative)
 *
 * Returns the muted class for any unknown / future status rather than
 * throwing, so a stale or in-flight API response cannot break render.
 */
export function statusClass(status: ExperimentStatus): string {
  if (status === "supported") return "bg-signal-supports text-signal-supports";
  if (status === "refuted") return "bg-signal-challenges text-signal-challenges";
  if (status === "testing") return "bg-signal-neutral text-signal-neutral";
  // untested or any unknown / future status
  return "bg-muted text-muted";
}
