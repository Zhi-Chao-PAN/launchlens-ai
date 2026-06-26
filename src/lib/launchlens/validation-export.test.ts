import { describe, expect, it } from "vitest";

import type { ValidationExperiment } from "./execution";
import {
  validationBoardFilename,
  validationBoardToJson,
  validationBoardToMarkdown,
  validationExperimentFilename,
  validationExperimentToJson,
  validationExperimentToMarkdown,
} from "./validation-export";

const FIXED_NOW = new Date("2026-06-27T01:02:03.000Z");

function makeExperiment(
  overrides: Partial<ValidationExperiment> = {},
): ValidationExperiment {
  return {
    id: "hypothesis-1",
    assumption: "Users will pay for LaunchLens",
    status: "testing",
    confidence: "medium",
    confidenceManual: true,
    decision: "",
    nextAction: "Interview 5 founders",
    linkedTaskId: "",
    tags: ["pricing", "founder-led"],
    evidence: [
      {
        id: "evidence-1",
        note: "Three users asked for export workflows.",
        source: "Interview notes",
        signal: "supports",
        weight: "strong",
        observedAt: "2026-06-20T00:00:00.000Z",
      },
      {
        id: "evidence-2",
        note: "One user asked for a free tier first.",
        source: "Sales call",
        signal: "challenges",
        weight: "moderate",
        observedAt: "2026-06-21T00:00:00.000Z",
        pinned: true,
      },
    ],
    ...overrides,
  };
}

describe("validationExperimentToMarkdown", () => {
  it("exports stable front matter and pinned evidence first", () => {
    const markdown = validationExperimentToMarkdown(makeExperiment(), {
      now: FIXED_NOW,
      formatDate: (isoDate) => isoDate.slice(0, 10),
    });

    expect(markdown).toContain('title: "Users will pay for LaunchLens"');
    expect(markdown).toContain("updated: 2026-06-27T01:02:03.000Z");
    expect(markdown).toContain('tags: ["pricing", "founder-led"]');
    expect(markdown).toContain("pinned_evidence: 1");
    expect(markdown).toContain("- **Confidence**: Medium (manual)");
    expect(markdown.indexOf("Pinned 1. Challenges - Sales call")).toBeLessThan(
      markdown.indexOf("2. Supports - Interview notes"),
    );
  });

  it("includes an empty evidence placeholder", () => {
    const markdown = validationExperimentToMarkdown(
      makeExperiment({ evidence: [], tags: [] }),
      { now: FIXED_NOW },
    );

    expect(markdown).toContain("tags: []");
    expect(markdown).toContain("_No evidence recorded yet._");
  });
});

describe("validation board exports", () => {
  it("exports board counts, tags, confidence source, and evidence dates", () => {
    const markdown = validationBoardToMarkdown(
      [
        makeExperiment({
          status: "supported",
          confidence: "high",
          confidenceManual: false,
        }),
        makeExperiment({
          id: "hypothesis-2",
          assumption: "ICP teams want weekly validation rituals",
          status: "refuted",
          confidence: "low",
          confidenceManual: true,
          tags: ["ritual"],
          evidence: [],
        }),
      ],
      {
        now: FIXED_NOW,
        formatDate: (isoDate) => isoDate.slice(0, 10),
      },
    );

    expect(markdown).toContain("hypotheses: 2");
    expect(markdown).toContain("supported: 1");
    expect(markdown).toContain("refuted: 1");
    expect(markdown).toContain('tags: ["pricing", "founder-led", "ritual"]');
    expect(markdown).toContain("- **Confidence**: High (auto)");
    expect(markdown).toContain("- **Observed**: 2026-06-20");
    expect(markdown).toContain("## 2. ICP teams want weekly validation rituals");
  });

  it("exports JSON without wrapping the experiment array", () => {
    const experiments = [makeExperiment()];

    expect(JSON.parse(validationExperimentToJson(experiments[0]))).toEqual(
      experiments[0],
    );
    expect(JSON.parse(validationBoardToJson(experiments))).toEqual(experiments);
  });

  it("generates deterministic filenames", () => {
    expect(validationExperimentFilename(makeExperiment(), "md", FIXED_NOW)).toBe(
      "users-will-pay-for-launchlens-20260627010203.md",
    );
    expect(validationBoardFilename("json", FIXED_NOW)).toBe(
      "validation-board-20260627010203.json",
    );
  });
});
