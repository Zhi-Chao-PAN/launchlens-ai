import { describe, expect, it } from "vitest";
import { formatProviderLabel } from "./provider-label";

describe("formatProviderLabel", () => {
  it("returns 'MiniMax provider' for minimax", () => {
    expect(formatProviderLabel("minimax")).toBe("MiniMax provider");
  });
  it("returns 'OpenAI-compatible provider' for openai", () => {
    expect(formatProviderLabel("openai")).toBe("OpenAI-compatible provider");
  });
  it("returns 'Demo mock provider' for mock", () => {
    expect(formatProviderLabel("mock")).toBe("Demo mock provider");
  });
  it("is pure (same input -> same output)", () => {
    expect(formatProviderLabel("minimax")).toBe(formatProviderLabel("minimax"));
    expect(formatProviderLabel("openai")).toBe(formatProviderLabel("openai"));
    expect(formatProviderLabel("mock")).toBe(formatProviderLabel("mock"));
  });
  it("falls back to demo label for any unknown provider (forward-compat)", () => {
    // The function is typed to ProviderName but at runtime the workspace
    // could in theory contain a stale or future provider string. The
    // function should not throw.
    expect(() => formatProviderLabel("mock" as never)).not.toThrow();
  });
});
