import { describe, expect, it } from "vitest";

import { formatGeneratedTime } from "./generated-time";

describe("formatGeneratedTime", () => {
  it("formats an ISO timestamp as HH:MM UTC (en-GB)", () => {
    expect(formatGeneratedTime("2025-03-14T09:05:00Z")).toBe("09:05 UTC");
    expect(formatGeneratedTime("2025-03-14T23:59:00Z")).toBe("23:59 UTC");
    expect(formatGeneratedTime("2025-03-14T00:00:00Z")).toBe("00:00 UTC");
  });

  it("pads single-digit hours and minutes with leading zeros", () => {
    expect(formatGeneratedTime("2025-01-01T01:02:00Z")).toBe("01:02 UTC");
  });

  it("returns Unknown time for invalid / unparseable dates", () => {
    expect(formatGeneratedTime("")).toBe("Unknown time");
    expect(formatGeneratedTime("not-a-date")).toBe("Unknown time");
    expect(formatGeneratedTime("2025-13-40T99:99:00Z")).toBe("Unknown time");
  });
});
