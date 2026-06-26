import { describe, expect, it } from "vitest";
import { formatGenerationModeLabel } from "./generation-mode-label";

describe("formatGenerationModeLabel", () => {
  it("returns 'Real provider' when mode=real and no fallback", () => {
    expect(formatGenerationModeLabel({ mode: "real", usedFallback: false })).toBe("Real provider");
  });
  it("returns 'Demo mode' when mode=demo and no fallback", () => {
    expect(formatGenerationModeLabel({ mode: "demo", usedFallback: false })).toBe("Demo mode");
  });
  it("returns 'Demo mode' when mode=real but usedFallback is true", () => {
    // The crucial case: even if the user asked for a real model,
    // if the call had to fall back to the demo provider the label
    // should reflect the actual source, not the user's request.
    expect(formatGenerationModeLabel({ mode: "real", usedFallback: true })).toBe("Demo mode");
  });
  it("returns 'Demo mode' for mode=demo with usedFallback=true (defensive)", () => {
    expect(formatGenerationModeLabel({ mode: "demo", usedFallback: true })).toBe("Demo mode");
  });
  it("is pure (same input -> same output)", () => {
    const a = formatGenerationModeLabel({ mode: "real", usedFallback: false });
    const b = formatGenerationModeLabel({ mode: "real", usedFallback: false });
    expect(a).toBe(b);
  });
});
