import type { ExperimentStatus } from "./execution";

const CLAIM_STATUS_LABELS: Record<ExperimentStatus, string> = {
  untested: "Untested",
  testing: "Testing",
  supported: "Validated",
  refuted: "Invalidated",
};

/**
 * Display label for an experiment claim status.
 *
 * "Validated" and "Invalidated" are the user-facing translations of
 * the storage codes ("supported" / "refuted"). The latter pair match
 * what is written to disk and exchanged over the API, but the
 * decision-copilot UI uses friendlier wording so the user reads
 * "Validated" instead of "Supported" in the badge / apply-preview.
 *
 * Falls back to the raw input (title-cased first letter) for unknown
 * statuses so the UI degrades to readable text instead of crashing.
 */
export function claimStatusLabel(status: string | null | undefined): string {
  if (!status) return "";
  if (status in CLAIM_STATUS_LABELS) {
    return CLAIM_STATUS_LABELS[status as ExperimentStatus];
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}
