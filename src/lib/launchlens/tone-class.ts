/**
 * Map a validation signal tone to its paired background + text Tailwind
 * className pair.
 *
 * Two upstream systems share this visual language:
 * - DecisionRecommendation: "proceed" / "iterate" / "pivot" / "pause"
 * - ClaimStance: "supports" / "challenges" / "context"
 *
 * Both groups collapse into three buckets: positive (supports),
 * negative (challenges), and neutral (everything else). Keeping the
 * mapping here means a new tone only needs to be added once and both
 * the decision-copilot badges and the grounded-claim chips stay in
 * lock-step.
 *
 * Returns the neutral pair for unknown input so the helper is safe to
 * call with arbitrary strings without crashing the render.
 */
export type SignalTone =
  | "supports"
  | "challenges"
  | "proceed"
  | "pivot"
  | "iterate"
  | "pause"
  | "context";

export const SIGNAL_TONE_CLASSES: Record<SignalTone, string> = {
  supports: "bg-signal-supports text-signal-supports",
  proceed: "bg-signal-supports text-signal-supports",
  challenges: "bg-signal-challenges text-signal-challenges",
  pivot: "bg-signal-challenges text-signal-challenges",
  iterate: "bg-signal-neutral text-signal-neutral",
  pause: "bg-muted text-muted",
  context: "bg-signal-neutral text-signal-neutral",
};

export const NEUTRAL_TONE_CLASS = "bg-muted text-muted";

export function toneClass(tone: string | null | undefined): string {
  if (!tone) return NEUTRAL_TONE_CLASS;
  if (tone in SIGNAL_TONE_CLASSES) {
    return SIGNAL_TONE_CLASSES[tone as SignalTone];
  }
  return NEUTRAL_TONE_CLASS;
}
