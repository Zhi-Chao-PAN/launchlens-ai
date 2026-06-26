import { describe, expect, it } from "vitest";
import type {
  HypothesisChangeEvent,
  HypothesisChangeKind,
} from "./execution";
import {
  confidenceSparklinePoints,
  hasHistoryPreview,
  statusRibbonClass,
  statusRibbonSegments,
} from "./validation-history-preview";

function event(
  id: string,
  kind: HypothesisChangeKind,
  overrides: Partial<HypothesisChangeEvent> = {},
): HypothesisChangeEvent {
  return {
    id,
    kind,
    at: "2026-06-27T00:00:00.000Z",
    ...overrides,
  };
}

describe("statusRibbonClass", () => {
  it("maps known statuses and falls back to muted", () => {
    expect(statusRibbonClass("supported")).toBe("bg-signal-supports");
    expect(statusRibbonClass("refuted")).toBe("bg-signal-challenges");
    expect(statusRibbonClass("future")).toBe("bg-muted-foreground/40");
    expect(statusRibbonClass(undefined)).toBe("bg-muted-foreground/40");
  });
});

describe("statusRibbonSegments", () => {
  it("builds ordered status segments from created/status events", () => {
    const segments = statusRibbonSegments([
      event("late", "status", {
        at: "2026-06-27T00:02:00.000Z",
        to: "supported",
      }),
      event("created", "created", { at: "2026-06-27T00:00:00.000Z" }),
      event("middle", "status", {
        at: "2026-06-27T00:01:00.000Z",
        to: "testing",
      }),
      event("ignored", "decision", { to: "proceed" }),
    ]);

    expect(segments).toHaveLength(3);
    expect(segments.map((segment) => segment.status)).toEqual([
      "",
      "testing",
      "supported",
    ]);
    expect(segments[1].x).toBeCloseTo(20);
    expect(segments[1].width).toBeCloseTo(20);
  });
});

describe("confidenceSparklinePoints", () => {
  it("returns an empty string without at least two confidence points", () => {
    expect(confidenceSparklinePoints([event("created", "created")])).toBe("");
  });

  it("projects confidence levels into sparkline coordinates", () => {
    expect(
      confidenceSparklinePoints([
        event("created", "created"),
        event("medium", "confidence", { to: "medium" }),
        event("high", "confidence", { to: "high" }),
      ]),
    ).toBe("0.0,12.0 30.0,7.0 60.0,2.0");
  });
});

describe("hasHistoryPreview", () => {
  it("detects status or confidence preview data", () => {
    expect(hasHistoryPreview([])).toBe(false);
    expect(hasHistoryPreview([event("created", "created")])).toBe(true);
  });
});
