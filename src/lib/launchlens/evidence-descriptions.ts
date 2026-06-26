import type { DecisionRecommendation } from "./decision";
import type {
  ConfidenceLevel,
  EvidenceSignal,
  EvidenceWeight,
  ExperimentStatus,
} from "./execution";

/**
 * Long-form descriptions for the validation-board enums.
 *
 * Used as the title (tooltip) and the inline explanation on each
 * badge / chip in the validation board. Centralised so the
 * hypothesis editor, the decision-copilot, the share view and any
 * future export target all read from the same source of truth.
 */

export const SIGNAL_DESCRIPTIONS: Record<EvidenceSignal, string> = {
  supports: "Supports: this evidence reinforces the hypothesis.",
  challenges: "Challenges: this evidence contradicts or weakens the hypothesis.",
  neutral: "Neutral: this evidence is informational, neither supporting nor contradicting.",
};

export const WEIGHT_DESCRIPTIONS: Record<EvidenceWeight, string> = {
  anecdotal: "Anecdotal: a single story or hunch, not yet a pattern.",
  moderate: "Moderate: a pattern seen a few times but not yet conclusive.",
  strong: "Strong: repeated, high-quality signal across multiple sources.",
};

export const CONFIDENCE_DESCRIPTIONS: Record<ConfidenceLevel, string> = {
  low: "Low confidence: this is still a guess; more evidence is needed.",
  medium: "Medium confidence: some supporting evidence, but still uncertain.",
  high: "High confidence: strongly supported by the evidence collected so far.",
};

export const STATUS_DESCRIPTIONS: Record<ExperimentStatus, string> = {
  untested: "Untested: no evidence has been collected yet.",
  testing: "Testing: evidence is actively being gathered.",
  supported: "Supported: the hypothesis is holding up against the evidence.",
  refuted: "Refuted: the evidence contradicts the hypothesis.",
};

export const DECISION_DESCRIPTIONS: Record<DecisionRecommendation, string> = {
  proceed: "Proceed: the evidence supports this hypothesis; move forward.",
  pivot: "Pivot: the evidence contradicts this hypothesis; consider changing direction.",
  iterate: "Iterate: signals are mixed; keep testing and refining.",
  pause: "Pause: set this hypothesis aside for now.",
};

function descriptionFor<Key extends string>(
  descriptions: Record<Key, string>,
  value: string | null | undefined,
) {
  if (!value || !Object.prototype.hasOwnProperty.call(descriptions, value)) {
    return "";
  }

  return descriptions[value as Key];
}

export function statusDescription(value: string | null | undefined) {
  return descriptionFor(STATUS_DESCRIPTIONS, value);
}

export function confidenceDescription(value: string | null | undefined) {
  return descriptionFor(CONFIDENCE_DESCRIPTIONS, value);
}

export function decisionDescription(value: string | null | undefined) {
  return descriptionFor(DECISION_DESCRIPTIONS, value);
}
