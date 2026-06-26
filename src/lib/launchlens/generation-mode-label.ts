export type GenerationMode = "demo" | "real";

/**
 * The user-facing label for the generation mode pill in the
 * launch-workspace header. The label flips to "Demo mode" whenever
 * the real provider was attempted but a fallback was used (e.g. a
 * rate-limit error, network blip, or model refusal), so the user is
 * never told the workspace is "Real provider" unless it actually was.
 */
export function formatGenerationModeLabel(opts: {
  mode: GenerationMode;
  usedFallback: boolean;
}): "Real provider" | "Demo mode" {
  const { mode, usedFallback } = opts;
  if (mode === "real" && !usedFallback) return "Real provider";
  return "Demo mode";
}
