import type { ProviderName } from "./types";

/**
 * The i18n descriptor for the workspace's provider badge label, used by the
 * launch-workspace header and the share-view header.
 *
 * Returns a dictionary key rather than a pre-rendered string so the caller
 * can translate it with its active locale:
 *
 *   "minimax" -> { key: "provider.minimax" }     ("MiniMax provider" / "MiniMax 模型供应商")
 *   "openai"  -> { key: "provider.openai" }      ("OpenAI-compatible provider")
 *   "mock"    -> { key: "provider.mock" }        ("Demo mock provider")
 *
 * Falls back to the demo label for any future provider that hasn't been
 * wired up yet.
 */
export type ProviderLabelDescriptor = {
  key: "provider.minimax" | "provider.openai" | "provider.mock";
};

export function formatProviderLabel(provider: ProviderName): ProviderLabelDescriptor {
  if (provider === "minimax") return { key: "provider.minimax" };
  if (provider === "openai") return { key: "provider.openai" };
  return { key: "provider.mock" };
}
