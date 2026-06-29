import type { DecisionRecommendation } from "./decision";

const DECISION_RECOMMENDATION_KEYS: Record<DecisionRecommendation, "decisionRec.proceed" | "decisionRec.iterate" | "decisionRec.pivot" | "decisionRec.pause"> = {
  proceed: "decisionRec.proceed",
  iterate: "decisionRec.iterate",
  pivot: "decisionRec.pivot",
  pause: "decisionRec.pause",
};

/**
 * i18n descriptor for the display label of a DecisionRecommendation value.
 *
 * Returns `{ key }` for the four known values so the caller translates it
 * with its active locale. For unknown input (defensive against future enum
 * additions or JSON-decoded values that haven't been validated yet) the
 * helper returns `{ fallback }` with a manual title-case rather than
 * throwing, so the UI degrades to readable text instead of crashing the
 * render; the caller renders `fallback` verbatim.
 *
 * Returns `null` for empty/null/undefined input so the caller renders
 * nothing (matching the previous "" return).
 */
export type DecisionLabelDescriptor = {
  key: "decisionRec.proceed" | "decisionRec.iterate" | "decisionRec.pivot" | "decisionRec.pause";
} | {
  fallback: string;
};

export function decisionLabel(rec: string | null | undefined): DecisionLabelDescriptor | null {
  if (!rec) return null;
  if (rec in DECISION_RECOMMENDATION_KEYS) {
    return { key: DECISION_RECOMMENDATION_KEYS[rec as DecisionRecommendation] };
  }
  return { fallback: rec.charAt(0).toUpperCase() + rec.slice(1) };
}
