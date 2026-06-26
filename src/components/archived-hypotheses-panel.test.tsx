import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ArchivedHypothesesPanel } from "./archived-hypotheses-panel";
import type {
  ExperimentStatus,
  ValidationExperiment,
} from "@/lib/launchlens/execution";

function experiment(
  id: string,
  status: ExperimentStatus,
  decision = "",
): ValidationExperiment {
  return {
    id,
    assumption: `Assumption ${id}`,
    status,
    confidence: "low",
    confidenceManual: false,
    decision,
    nextAction: "",
    linkedTaskId: "",
    evidence: [],
    tags: [],
  };
}

const EXPERIMENTS = [
  experiment("exp-1", "supported"),
  experiment("exp-2", "testing"),
];

describe("<ArchivedHypothesesPanel>", () => {
  it("renders nothing when there are no archived hypotheses", () => {
    const html = renderToStaticMarkup(
      <ArchivedHypothesesPanel
        experiments={[]}
        allExperimentIds={[]}
        open={false}
        onToggle={() => {}}
        onUnarchive={() => {}}
      />,
    );
    expect(html).toBe("");
  });

  it("renders the collapsed archive header and summary", () => {
    const html = renderToStaticMarkup(
      <ArchivedHypothesesPanel
        experiments={EXPERIMENTS}
        allExperimentIds={["exp-1", "exp-2"]}
        open={false}
        onToggle={() => {}}
        onUnarchive={() => {}}
      />,
    );
    expect(html).toContain("Archived (2)");
    expect(html).toContain("1 validated | 1 testing");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("Unarchive");
  });

  it("renders archived rows when open", () => {
    const html = renderToStaticMarkup(
      <ArchivedHypothesesPanel
        experiments={EXPERIMENTS}
        allExperimentIds={["exp-1", "exp-2"]}
        open
        onToggle={() => {}}
        onUnarchive={() => {}}
      />,
    );
    expect(html).toContain("Unarchive");
    expect(html).toContain("H1");
    expect(html).toContain("Supported");
    expect(html).toContain("Assumption exp-2");
  });

  it("does not call handlers while rendering", () => {
    const onToggle = vi.fn();
    const onUnarchive = vi.fn();
    renderToStaticMarkup(
      <ArchivedHypothesesPanel
        experiments={EXPERIMENTS}
        allExperimentIds={["exp-1", "exp-2"]}
        open
        onToggle={onToggle}
        onUnarchive={onUnarchive}
      />,
    );
    expect(onToggle).not.toHaveBeenCalled();
    expect(onUnarchive).not.toHaveBeenCalled();
  });
});
