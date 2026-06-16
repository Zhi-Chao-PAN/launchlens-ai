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
});
