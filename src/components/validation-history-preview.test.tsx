import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ValidationHistoryPreview } from "./validation-history-preview";
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

describe("<ValidationHistoryPreview>", () => {
  it("renders nothing when no preview data exists", () => {
    expect(renderToStaticMarkup(<ValidationHistoryPreview history={[]} />)).toBe(
      "",
    );
  });

  it("renders status ribbon for created/status history", () => {
    const html = renderToStaticMarkup(
      <ValidationHistoryPreview
        history={[
          event("created", "created"),
          event("status", "status", { to: "supported" }),
        ]}
      />,
    );

    expect(html).toContain("Status");
    expect(html).toContain('aria-label="Status over time"');
    expect(html).toContain("bg-signal-supports");
  });

  it("renders confidence sparkline once at least two confidence points exist", () => {
    const html = renderToStaticMarkup(
      <ValidationHistoryPreview
        history={[
          event("created", "created"),
          event("confidence", "confidence", { to: "high" }),
        ]}
      />,
    );

    expect(html).toContain("Confidence");
    expect(html).toContain("<polyline");
    expect(html).toContain('points="0.0,12.0 60.0,2.0"');
  });
});
