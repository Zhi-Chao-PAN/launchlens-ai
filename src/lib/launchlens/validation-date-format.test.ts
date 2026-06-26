import { describe, expect, it } from "vitest";
import {
  formatValidationObservedDate,
  formatValidationObservedDateTitle,
  formatValidationTimelineTime,
} from "./validation-date-format";

describe("validation date formatting", () => {
  it("formats timeline timestamps with explicit locale and timezone", () => {
    expect(formatValidationTimelineTime("2026-06-12T05:10:00.000Z")).toBe(
      "Jun 12, 2026, 5:10 AM UTC",
    );
  });

  it("formats evidence dates without depending on the process locale", () => {
    expect(formatValidationObservedDate("2026-06-12T05:10:00.000Z")).toBe(
      "Jun 12",
    );
    expect(
      formatValidationObservedDateTitle("2026-06-12T05:10:00.000Z"),
    ).toBe("Friday, June 12, 2026");
  });

  it("handles invalid dates with stable fallback labels", () => {
    expect(formatValidationTimelineTime("bad-date")).toBe("Unknown date");
    expect(formatValidationObservedDate("bad-date")).toBe("Unknown");
    expect(formatValidationObservedDateTitle("bad-date")).toBe("Unknown date");
  });
});
