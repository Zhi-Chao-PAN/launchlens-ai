import { describe, expect, it } from "vitest";
import type {
  ExperimentStatus,
  ValidationExperiment,
} from "./execution";
import {
  EXPERIMENT_STATUS_LABELS,
  archivedStatusSummary,
  archivedStatusToneClass,
  experimentStatusLabel,
} from "./experiment-status-labels";

function experiment(
  status: ExperimentStatus,
  decision = "",
): ValidationExperiment {
  return {
    id: `exp-${status}-${decision || "empty"}`,
    assumption: "Assumption",
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

describe("EXPERIMENT_STATUS_LABELS", () => {
  it("covers the validation experiment statuses", () => {
    expect(Object.keys(EXPERIMENT_STATUS_LABELS).sort()).toEqual([
      "refuted",
      "supported",
      "testing",
      "untested",
    ]);
  });

  it("returns the display label for a status", () => {
    expect(experimentStatusLabel("supported")).toBe("Supported");
    expect(experimentStatusLabel("refuted")).toBe("Refuted");
  });
});

describe("archivedStatusToneClass", () => {
  it("maps statuses to the archived row badge tones", () => {
    expect(archivedStatusToneClass("supported")).toContain(
      "text-signal-supports",
    );
    expect(archivedStatusToneClass("refuted")).toContain(
      "text-signal-challenges",
    );
    expect(archivedStatusToneClass("testing")).toContain("text-accent");
    expect(archivedStatusToneClass("untested")).toBe("bg-muted text-muted");
  });
});

describe("archivedStatusSummary", () => {
  it("summarizes archived hypothesis outcomes for the panel header", () => {
    expect(
      archivedStatusSummary([
        experiment("supported"),
        experiment("refuted"),
        experiment("testing"),
        experiment("untested", "Pause for later"),
      ]),
    ).toBe("1 validated | 1 invalidated | 1 testing | 1 decided");
  });

  it("returns an empty summary for no archived hypotheses", () => {
    expect(archivedStatusSummary([])).toBe("");
  });
});
