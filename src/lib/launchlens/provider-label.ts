import type { ProviderName } from "./types";

/**
 * The user-facing label for the workspace's provider, used by the
 * launch-workspace header and the share-view header.
 *
 *   "minimax" -> "MiniMax provider"
 *   "openai"  -> "OpenAI-compatible provider"
 *   "mock"    -> "Demo mock provider"
 *
 * Falls back to the demo label for any future provider that hasn't
 * been wired up yet.
 */
export function formatProviderLabel(provider: ProviderName): string {
  if (provider === "minimax") return "MiniMax provider";
  if (provider === "openai") return "OpenAI-compatible provider";
  return "Demo mock provider";
}
