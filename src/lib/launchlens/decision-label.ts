import type { DecisionRecommendation } from "./decision";

const DECISION_RECOMMENDATION_LABELS: Record<DecisionRecommendation, string> = {
  proceed: "Proceed",
  iterate: "Iterate",
  pivot: "Pivot",
  pause: "Pause",
};

/**
 * Display label for a DecisionRecommendation value.
 *
 * The canonical capitalized form is what the experiment header shows
 * ("Proceed", not "proceed"). Keeping the table here means the four
 * supported values can never drift between the badge, the brief
 * preview, and the apply-changes confirmation.
 *
 * For unknown input (defensive against future enum additions or
 * JSON-decoded values that haven't been validated yet) the helper
 * falls back to a manual title-case rather than throwing, so the UI
 * degrades to readable text instead of crashing the render.
 */
export function decisionLabel(rec: string | null | undefined): string {
  if (!rec) return "";
  if (rec in DECISION_RECOMMENDATION_LABELS) {
    return DECISION_RECOMMENDATION_LABELS[rec as DecisionRecommendation];
  }
  return rec.charAt(0).toUpperCase() + rec.slice(1);
}
