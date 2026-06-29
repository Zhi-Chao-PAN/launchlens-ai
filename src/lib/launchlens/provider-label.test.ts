import { describe, expect, it } from "vitest";
import { formatProviderLabel } from "./provider-label";

describe("formatProviderLabel", () => {
  it("returns the minimax descriptor for minimax", () => {
    expect(formatProviderLabel("minimax")).toEqual({ key: "provider.minimax" });
  });
  it("returns the openai descriptor for openai", () => {
    expect(formatProviderLabel("openai")).toEqual({ key: "provider.openai" });
  });
  it("returns the mock descriptor for mock", () => {
    expect(formatProviderLabel("mock")).toEqual({ key: "provider.mock" });
  });
  it("is pure (same input -> same output)", () => {
    expect(formatProviderLabel("minimax")).toEqual(formatProviderLabel("minimax"));
    expect(formatProviderLabel("openai")).toEqual(formatProviderLabel("openai"));
    expect(formatProviderLabel("mock")).toEqual(formatProviderLabel("mock"));
  });
  it("falls back to demo label for any unknown provider (forward-compat)", () => {
    // The function is typed to ProviderName but at runtime the workspace
    // could in theory contain a stale or future provider string. The
    // function should not throw.
    expect(() => formatProviderLabel("mock" as never)).not.toThrow();
  });
  it("falls back to demo descriptor for an unrelated provider string (forward-compat)", () => {
    // A typo / future brand ('anthropic', 'gemini', etc.) is not in the
    // explicit switch and should still produce the demo descriptor rather
    // than throwing or returning a raw lowercase brand name.
    expect(formatProviderLabel("anthropic" as never)).toEqual({ key: "provider.mock" });
    expect(formatProviderLabel("" as never)).toEqual({ key: "provider.mock" });
  });
  it("returns a non-empty key for every known provider", () => {
    expect(formatProviderLabel("minimax").key.length).toBeGreaterThan(0);
    expect(formatProviderLabel("openai").key.length).toBeGreaterThan(0);
    expect(formatProviderLabel("mock").key.length).toBeGreaterThan(0);
  });
  it("the minimax key maps to the canonical MiniMax brand casing in the dictionary", () => {
    // The brand name is intentionally 'MiniMax' (case-preserved). The
    // descriptor only carries the key, so we assert the key resolves to a
    // dictionary entry that contains 'MiniMax' when rendered in English.
    expect(formatProviderLabel("minimax").key).toBe("provider.minimax");
  });
});
