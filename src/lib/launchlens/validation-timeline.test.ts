import { describe, expect, it } from "vitest";
import {
  TIMELINE_KIND_FILTERS,
  timelineDotClass,
  timelineEventDetail,
  timelineEventIsTransition,
  timelineEventLabel,
  timelineEventTitle,
  timelineTokenClass,
  timelineValueDescription,
} from "./validation-timeline";

describe("TIMELINE_KIND_FILTERS", () => {
  it("contains the all filter and every known history kind", () => {
    expect(TIMELINE_KIND_FILTERS.map((item) => item.id)).toEqual([
      "all",
      "created",
      "status",
      "confidence",
      "decision",
      "evidence_added",
      "evidence_removed",
      "archived",
      "pinned",
    ]);
  });
});

describe("timelineEventLabel", () => {
  it("uses archived wording based on the target value", () => {
    expect(timelineEventLabel({ kind: "archived", to: "true" })).toBe(
      "Archived",
    );
    expect(timelineEventLabel({ kind: "archived", to: "false" })).toBe(
      "Unarchived",
    );
  });

  it("maps decision events to the user-facing label", () => {
    expect(timelineEventLabel({ kind: "decision", to: "proceed" })).toBe(
      "Decision updated",
    );
  });
});

describe("timelineEventTitle", () => {
  it("describes status transitions with long-form value descriptions", () => {
    expect(
      timelineEventTitle({
        kind: "status",
        from: "untested",
        to: "supported",
      }),
    ).toBe(
      "Status: Untested: no evidence has been collected yet. -> Supported: the hypothesis is holding up against the evidence.",
    );
  });

  it("keeps event labels in non-transition titles", () => {
    expect(
      timelineEventTitle({
        kind: "evidence_added",
        label: "Founder interview",
      }),
    ).toBe("Evidence added - Founder interview");
  });
});

describe("timelineEventDetail", () => {
  it("uses source only for non-transition, non-archive events", () => {
    expect(timelineEventDetail({ kind: "evidence_added", source: "manual" })).toBe(
      "manual",
    );
    expect(timelineEventDetail({ kind: "status", source: "manual" })).toBe("");
    expect(timelineEventDetail({ kind: "archived", source: "manual" })).toBe("");
  });
});

describe("timeline visual helpers", () => {
  it("detects transition kinds", () => {
    expect(timelineEventIsTransition("status")).toBe(true);
    expect(timelineEventIsTransition("confidence")).toBe(true);
    expect(timelineEventIsTransition("decision")).toBe(true);
    expect(timelineEventIsTransition("created")).toBe(false);
  });

  it("maps token and dot classes with safe fallbacks", () => {
    expect(timelineTokenClass("supported")).toContain("text-signal-supports");
    expect(timelineTokenClass("unknown")).toBe("text-muted");
    expect(timelineDotClass("decision", "pivot")).toBe("bg-signal-challenges");
    expect(timelineDotClass("future", "value")).toBe("bg-accent/70");
  });
});

describe("timelineValueDescription", () => {
  it("returns long-form descriptions for known transition values", () => {
    expect(timelineValueDescription("confidence", "high")).toBe(
      "High confidence: strongly supported by the evidence collected so far.",
    );
  });

  it("falls back to raw values or question marks", () => {
    expect(timelineValueDescription("decision", "ship")).toBe("ship");
    expect(timelineValueDescription("decision", undefined)).toBe("?");
  });
});
