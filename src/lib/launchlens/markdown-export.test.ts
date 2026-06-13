import { describe, expect, it } from "vitest";

import { workspaceToMarkdown } from "./markdown-export";
import { buildMockWorkspace } from "./mock-provider";
import { createExecutionState } from "./execution";
import {
  buildMockDecisionBrief,
  decisionSourceFromExperiment,
} from "./decision";
import type { LaunchLensInput } from "./types";

const input: LaunchLensInput = {
  idea: "An AI planner that creates go-to-market tasks.",
  audience: "Solo founders",
  market: "Micro-SaaS",
  tone: "Practical",
  constraints: "Ship in two weeks.",
};

describe("workspaceToMarkdown", () => {
  it("exports all important workspace sections", () => {
    const markdown = workspaceToMarkdown(buildMockWorkspace(input));

    expect(markdown).toContain("# Turn a raw SaaS idea");
    expect(markdown).toContain("## Feature Backlog");
    expect(markdown).toContain("## Pricing Risks");
    expect(markdown).toContain("## Assumptions To Validate");
    expect(markdown).toContain("Generated with mock provider");
  });

  it("includes evidence-backed decisions when execution state is supplied", () => {
    const workspace = buildMockWorkspace(input);
    const execution = createExecutionState(workspace);
    execution.experiments[0] = {
      ...execution.experiments[0],
      status: "supported",
      confidence: "high",
      decision: "Keep weekly activation fixes in MVP scope.",
      evidence: [
        {
          id: "evidence-1",
          note: "Four of five founders ranked activation fixes first.",
          source: "Founder interviews",
          signal: "supports",
          observedAt: "2026-06-13T01:00:00.000Z",
        },
      ],
    };
    execution.experiments[0].decisionBrief = buildMockDecisionBrief(
      decisionSourceFromExperiment(execution.experiments[0]),
      "2026-06-13T01:05:00.000Z",
    );

    const markdown = workspaceToMarkdown(workspace, execution);

    expect(markdown).toContain("## Validation Decisions");
    expect(markdown).toContain("Keep weekly activation fixes in MVP scope.");
    expect(markdown).toContain("Founder interviews");
    expect(markdown).toContain("AI recommendation:");
    expect(markdown).toContain("AI grounded claims:");
    expect(markdown).toContain("AI unresolved risks:");
  });
});
