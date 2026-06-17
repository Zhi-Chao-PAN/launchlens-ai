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

describe("overlay stack defensive behavior", () => {
  it("reset between tests leaves no residue across describe blocks", () => {
    expect(hasOpenOverlay()).toBe(false);
  });

  it("popping an already-popped handle is a no-op and does not affect other overlays", () => {
    const a = pushOverlay();
    const b = pushOverlay();
    const c = pushOverlay();
    a();
    a(); // double-pop same handle
    a(); // triple
    expect(hasOpenOverlay()).toBe(true); // b and c still open
    b();
    c();
    expect(hasOpenOverlay()).toBe(false);
  });

  it("push returns independent handles that never cross-decrement", () => {
    const handles = Array.from({ length: 50 }, () => pushOverlay());
    expect(hasOpenOverlay()).toBe(true);
    // Pop every even index twice (double-pop)
    for (let i = 0; i < handles.length; i += 2) {
      handles[i]();
      handles[i]();
    }
    // Odd-indexed handles should still hold the stack open
    expect(hasOpenOverlay()).toBe(true);
    // Pop odd indices once each
    for (let i = 1; i < handles.length; i += 2) {
      handles[i]();
    }
    expect(hasOpenOverlay()).toBe(false);
  });

  it("hasOpenOverlay returns false when no overlays are pushed", () => {
    __resetOverlayStackForTests();
    expect(hasOpenOverlay()).toBe(false);
  });

  it("hasOpenOverlay returns true after pushing an overlay", () => {
    __resetOverlayStackForTests();
    const pop = pushOverlay();
    expect(hasOpenOverlay()).toBe(true);
    pop();
    expect(hasOpenOverlay()).toBe(false);
  });


  it("pushOverlay returns a function that can be called multiple times safely", () => {
    const pop = pushOverlay();
    expect(hasOpenOverlay()).toBe(true);
    // Should not throw on multiple calls
    expect(() => { pop(); pop(); pop(); }).not.toThrow();
  });

});
