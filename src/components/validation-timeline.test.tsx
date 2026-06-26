import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ValidationTimeline } from "./validation-timeline";
import type {
  HypothesisChangeEvent,
  HypothesisChangeKind,
} from "@/lib/launchlens/execution";

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

const HISTORY: HypothesisChangeEvent[] = [
  event("created", "created"),
  event("status-1", "status", { from: "untested", to: "testing" }),
  event("confidence-1", "confidence", { from: "low", to: "medium" }),
  event("evidence-1", "evidence_added", {
    label: "Founder interview",
    source: "manual",
    targetId: "ev-1",
  }),
  event("decision-1", "decision", { from: "iterate", to: "proceed" }),
  event("pin-1", "pinned", { source: "manual" }),
  event("archive-1", "archived", { to: "true" }),
  event("evidence-2", "evidence_removed", {
    label: "Stale source",
    source: "manual",
    targetId: "ev-2",
  }),
  event("status-2", "status", { from: "testing", to: "supported" }),
];

const BASE_PROPS = {
  experimentId: "exp-1",
  history: HISTORY,
  expanded: false,
  selectedKind: "all",
  onToggleExpanded: () => {},
  onSelectKind: () => {},
  onEventClick: () => {},
};

describe("<ValidationTimeline>", () => {
  it("renders nothing for an empty history", () => {
    const html = renderToStaticMarkup(
      <ValidationTimeline {...BASE_PROPS} history={[]} />,
    );
    expect(html).toBe("");
  });

  it("renders the timeline heading and total event count", () => {
    const html = renderToStaticMarkup(<ValidationTimeline {...BASE_PROPS} />);
    expect(html).toContain("Timeline");
    expect(html).toContain("(9 events)");
  });

  it("shows the expansion control based on expanded state", () => {
    const collapsed = renderToStaticMarkup(
      <ValidationTimeline {...BASE_PROPS} expanded={false} />,
    );
    const expanded = renderToStaticMarkup(
      <ValidationTimeline {...BASE_PROPS} expanded={true} />,
    );

    expect(collapsed).toContain("Show all 9");
    expect(expanded).toContain("Show recent");
  });

  it("renders filter chips with counts", () => {
    const html = renderToStaticMarkup(<ValidationTimeline {...BASE_PROPS} />);
    expect(html).toContain("Status 2");
    expect(html).toContain("Evidence + 1");
    expect(html).toContain('aria-pressed="true"');
  });

  it("renders an empty filtered state when no events match", () => {
    const html = renderToStaticMarkup(
      <ValidationTimeline
        {...BASE_PROPS}
        history={[event("created", "created")]}
        selectedKind="decision"
      />,
    );
    expect(html).toContain("No Decision events in this view.");
  });

  it("renders transition descriptions and source labels", () => {
    const html = renderToStaticMarkup(<ValidationTimeline {...BASE_PROPS} />);
    expect(html).toContain("Timeline: Status:");
    expect(html).toContain("Supported: the hypothesis is holding up");
    expect(html).toContain("Founder interview");
  });

  it("does not call handlers while rendering", () => {
    const onToggleExpanded = vi.fn();
    const onSelectKind = vi.fn();
    const onEventClick = vi.fn();

    renderToStaticMarkup(
      <ValidationTimeline
        {...BASE_PROPS}
        onToggleExpanded={onToggleExpanded}
        onSelectKind={onSelectKind}
        onEventClick={onEventClick}
      />,
    );

    expect(onToggleExpanded).not.toHaveBeenCalled();
    expect(onSelectKind).not.toHaveBeenCalled();
    expect(onEventClick).not.toHaveBeenCalled();
  });
});
