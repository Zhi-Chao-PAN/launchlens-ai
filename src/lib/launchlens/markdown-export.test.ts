import { describe, expect, it } from "vitest";

import { safeMarkdownFilename, workspaceToMarkdown } from "./markdown-export";
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

describe("safeMarkdownFilename", () => {
  it("slugifies a normal project name", () => {
    expect(safeMarkdownFilename({ projectName: "Acme SaaS Launch" })).toBe(
      "acme-saas-launch.md",
    );
  });

  it("falls back to default when projectName is empty or missing", () => {
    expect(safeMarkdownFilename({})).toBe("launchlens-workspace.md");
    expect(safeMarkdownFilename({ projectName: "" })).toBe(
      "launchlens-workspace.md",
    );
    expect(safeMarkdownFilename({ projectName: "   " })).toBe(
      "launchlens-workspace.md",
    );
  });

  it("strips punctuation and collapses non-alphanumerics", () => {
    expect(
      safeMarkdownFilename({ projectName: "  Hello, World! (v2) -- AI/ML " }),
    ).toBe("hello-world-v2-ai-ml.md");
  });


  it("falls back to landingPage.headline when projectName is absent", () => {
    expect(
      safeMarkdownFilename({
        landingPage: { headline: "  Turn a raw SaaS idea into a launch plan!  " },
      }),
    ).toBe("turn-a-raw-saas-idea-into-a-launch-plan.md");
  });

  it("prefers projectName over landingPage.headline when both are provided", () => {
    expect(
      safeMarkdownFilename({
        projectName: "Acme v2",
        landingPage: { headline: "Ignored headline" },
      }),
    ).toBe("acme-v2.md");
  });

  it("truncates long names to 60 chars plus .md", () => {
    const long = "a".repeat(200);
    const out = safeMarkdownFilename({ projectName: long });
    expect(out.endsWith(".md")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(64); // 60 + ".md"
  });
});
