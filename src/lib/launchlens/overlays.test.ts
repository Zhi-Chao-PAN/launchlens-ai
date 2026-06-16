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


describe("overlay stack ordering", () => {
  it("supports arbitrary nesting depth and reports truthy until fully popped", () => {
    const pops = Array.from({ length: 10 }, () => pushOverlay());
    expect(hasOpenOverlay()).toBe(true);
    // Pop out of order (middle first) — counter still decrements correctly
    pops[5]();
    expect(hasOpenOverlay()).toBe(true);
    pops[0]();
    pops[9]();
    expect(hasOpenOverlay()).toBe(true);
    for (let i = 1; i < 5; i++) pops[i]();
    for (let i = 6; i < 9; i++) pops[i]();
    pops[5](); // double-pop already-popped id — idempotent
    expect(hasOpenOverlay()).toBe(false);
  });

  it("__resetOverlayStackForTests returns the counter to zero", () => {
    pushOverlay();
    pushOverlay();
    expect(hasOpenOverlay()).toBe(true);
    __resetOverlayStackForTests();
    expect(hasOpenOverlay()).toBe(false);
  });
});
