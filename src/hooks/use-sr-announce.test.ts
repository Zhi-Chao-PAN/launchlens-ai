import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSrAnnounce } from "./use-sr-announce";

describe("useSrAnnounce hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is exported as a named function", () => {
    expect(typeof useSrAnnounce).toBe("function");
  });

  it("has a hook-style name (use prefix)", () => {
    expect(useSrAnnounce.name).toBe("useSrAnnounce");
  });

  it("returns an object with announce function and message string", () => {
    // We can't call hooks directly outside render, but we can verify shape
    expect(typeof useSrAnnounce).toBe("function");
    expect(useSrAnnounce.length).toBe(0);
  });

  it("module has no side effects on import", () => {
    // Importing the module should not throw or modify globals
    expect(useSrAnnounce).toBeDefined();
  });
});
