import type { ExperimentStatus } from "./execution";

const CLAIM_STATUS_KEYS: Record<ExperimentStatus, "claimStatus.untested" | "claimStatus.testing" | "claimStatus.supported" | "claimStatus.refuted"> = {
  untested: "claimStatus.untested",
  testing: "claimStatus.testing",
  supported: "claimStatus.supported",
  refuted: "claimStatus.refuted",
};

/**
 * i18n descriptor for the display label of an experiment claim status.
 *
 * "Validated" and "Invalidated" are the user-facing translations of the
 * storage codes ("supported" / "refuted"). The latter pair match what is
 * written to disk and exchanged over the API, but the decision-copilot UI
 * uses friendlier wording so the user reads "Validated" instead of
 * "Supported" in the badge / apply-preview.
 *
 * Returns `{ key }` for the four known statuses so the caller translates it
 * with its active locale. For unknown statuses it returns `{ fallback }`
 * with the title-cased input so the UI degrades to readable text instead of
 * crashing; the caller renders `fallback` verbatim.
 *
 * Returns `null` for empty/null/undefined input so the caller renders
 * nothing (matching the previous "" return).
 */
export type ClaimStatusLabelDescriptor = {
  key: "claimStatus.untested" | "claimStatus.testing" | "claimStatus.supported" | "claimStatus.refuted";
} | {
  fallback: string;
};

export function claimStatusLabel(status: string | null | undefined): ClaimStatusLabelDescriptor | null {
  if (!status) return null;
  if (status in CLAIM_STATUS_KEYS) {
    return { key: CLAIM_STATUS_KEYS[status as ExperimentStatus] };
  }
  return { fallback: status.charAt(0).toUpperCase() + status.slice(1) };
}
