import type { EvidenceSignal, EvidenceWeight } from "./execution";

/**
 * Display labels for the two evidence dimensions.
 *
 * Centralised so the validation board, the markdown exporter, the
 * CLI smoke scripts and any future export target read from the same
 * table — adding a new `EvidenceSignal` / `EvidenceWeight` value
 * means adding one entry here, and the call sites automatically
 * pick it up via the TypeScript `Record` constraint.
 */
export const SIGNAL_LABELS: Record<EvidenceSignal, string> = {
  supports: "Supports",
  challenges: "Challenges",
  neutral: "Neutral",
};

export const WEIGHT_LABELS: Record<EvidenceWeight, string> = {
  anecdotal: "Anecdotal",
  moderate: "Moderate",
  strong: "Strong",
};