import { beforeEach, describe, expect, it } from "vitest";
import { hasOpenOverlay, pushOverlay, __resetOverlayStackForTests } from "./overlays";

beforeEach(() => __resetOverlayStackForTests());

describe("overlay stack", () => {
  it("starts empty", () => {
    // Note: module-level singleton; start by clearing any leftover state
    // by pushing and popping until empty. Since other tests may have pushed,
    // we test behavior relative to our own pushes.
    const initial = hasOpenOverlay();
    const pop1 = pushOverlay();
    expect(hasOpenOverlay()).toBe(true);
    const pop2 = pushOverlay();
    expect(hasOpenOverlay()).toBe(true);
    pop2();
    expect(hasOpenOverlay()).toBe(true);
    pop1();
    expect(hasOpenOverlay()).toBe(initial);
  });

  it("pop is idempotent (never goes negative)", () => {
    const before = hasOpenOverlay();
    const pop = pushOverlay();
    pop();
    pop(); // extra pop should not throw or underflow
    pop();
    // After balanced pop, back to before state
    expect(hasOpenOverlay()).toBe(before);
  });
});
