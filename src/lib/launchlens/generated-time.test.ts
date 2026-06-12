import { describe, expect, it } from "vitest";

import { formatGeneratedTime } from "./generated-time";

describe("formatGeneratedTime", () => {
  it("uses a deterministic UTC label for server and browser rendering", () => {
    expect(formatGeneratedTime("2026-06-12T04:35:00.000Z")).toBe(
      "04:35 UTC",
    );
  });

  it("handles invalid timestamps safely", () => {
    expect(formatGeneratedTime("not-a-date")).toBe("Unknown time");
  });
});
