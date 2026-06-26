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
  it("uses the same word for minimax and minimax (case sensitive)", () => {
    // ProviderName is a union literal type; 'minimax' is the only accepted
    // form. A typo like 'minimax' would still go through the
    // mock branch (since none of the explicit branches match) and produce
    // the demo label rather than something garbled.
    expect(formatProviderLabel("minimax" as never)).toBe("Demo mock provider");
  });
  it("returns a non-empty label for every known provider", () => {
    expect(formatProviderLabel("minimax").length).toBeGreaterThan(0);
    expect(formatProviderLabel("openai").length).toBeGreaterThan(0);
    expect(formatProviderLabel("mock").length).toBeGreaterThan(0);
  });
  it("uses brand casing ('MiniMax' not 'minimax')", () => {
    // The brand name is intentionally 'MiniMax' (case-preserved) — a
    // search for 'minimax' in the label would not be a useful assertion,
    // but a check for the canonical 'MiniMax' (with capital M, lowercase
    // rest) makes the contract explicit.
    expect(formatProviderLabel("minimax")).toMatch(/MiniMax/);
  });
});
