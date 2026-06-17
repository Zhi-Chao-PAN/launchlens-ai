import { describe, expect, it } from "vitest";

import { safeMarkdownFilename, workspaceToMarkdown } from "./markdown-export";
import { exampleWorkspaces } from "./example-workspaces";
import { buildMockWorkspace } from "./mock-provider";
import { createExecutionState } from "./execution";
import {
  buildMockDecisionBrief,
  decisionSourceFromExperiment,
} from "./decision";
import type { LaunchLensInput, LaunchLensWorkspace } from "./types";

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
          weight: "moderate" as const,
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

  it("output always starts with a top-level heading", () => {
    const md = workspaceToMarkdown(exampleWorkspaces[0].workspace);
    expect(md.startsWith("# ")).toBe(true);
  });

  it("includes multiple section headings", () => {
    const md = workspaceToMarkdown(exampleWorkspaces[0].workspace);
    const sectionCount = (md.match(/^## /gm) || []).length;
    expect(sectionCount).toBeGreaterThan(3);
  });

  it("produces consistent output for the same input", () => {
    const ws = exampleWorkspaces[0].workspace;
    const a = workspaceToMarkdown(ws);
    const b = workspaceToMarkdown(ws);
    expect(a).toBe(b);
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

describe("markdown export empty-list robustness", () => {
  it("renders empty sections without throwing when lists are empty", () => {

    const ws = {
      provider: "mock",
      generatedAt: "2026-06-15T10:00:00.000Z",
      summary: "A short summary that is long enough to pass the length check.",
      targetUsers: [],
      pains: [],
      mvpScope: ["First mvp item that is long enough to render here"],
      backlog: [
        {
          priority: "P0",
          feature: "First feature has enough length",
          why: "Because the test needs at least one backlog item",
        },
      ],
      landingPage: {
        headline: "Short",
        subheadline: "A longer subheadline for testing the export edge cases here",
        cta: "A call to action that is sufficiently long",
        proofBullets: ["Proof point one that has length"],
      },
      pricing: {
        hypothesis: "Pricing hypothesis that is sufficiently long",
        tiers: ["First pricing tier with enough length"],
        risks: ["Risk one long enough"],
      },
      launchPlan: ["Launch plan item with enough length here"],
      contentCalendar: [
        { channel: "Email", cadence: "Weekly", angle: "Weekly email with enough text" },
      ],
      tasks: [
        {
          title: "First task title with length",
          owner: "Founder",
          due: "Week 1",
          outcome: "Outcome text has enough length here",
        },
      ],
      assumptions: ["Assumption text that is long enough to render"],
    };
    const md = workspaceToMarkdown(ws as unknown as LaunchLensWorkspace);
    expect(typeof md).toBe("string");
    expect(md).toContain("# Short");
    expect(md).toContain("## Target Users");
    expect(md).toContain("## Pain Points");
  });

  it("includes assumptions section when assumptions are present in the workspace", () => {
    const ws = exampleWorkspaces[0].workspace;
    const md = workspaceToMarkdown(ws);
    expect(md).toContain("Assumptions");
    expect(ws.assumptions.length).toBeGreaterThan(0);
  });

  it("always starts with a level-1 heading", () => {
    const ws = exampleWorkspaces[0].workspace;
    const md = workspaceToMarkdown(ws);
    expect(md.trim().startsWith("# ")).toBe(true);
  });

  it("produces output without null/undefined literal strings", () => {
    const ws = exampleWorkspaces[0].workspace;
    const md = workspaceToMarkdown(ws);
    expect(md).not.toContain("undefined");
    expect(md).not.toContain("null");
  });

  it("includes backlog items in the output", () => {
    const ws = exampleWorkspaces[0].workspace;
    const md = workspaceToMarkdown(ws);
    expect(md).toContain("Backlog");
    expect(ws.backlog.length).toBeGreaterThan(0);
  });

  it("includes content calendar items in the output", () => {
    const ws = exampleWorkspaces[0].workspace;
    const md = workspaceToMarkdown(ws);
    expect(md).toContain("Content");
    expect(ws.contentCalendar.length).toBeGreaterThan(0);
  });

  it('produces non-empty output for mock workspace', () => {
    const result = workspaceToMarkdown(buildMockWorkspace(input));
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('output contains expected markdown structure with headings', () => {
    const result = workspaceToMarkdown(buildMockWorkspace(input));
    expect(result).toMatch(/^# /m);
    expect(result).toMatch(/^## /m);
    expect(result).toContain('- **');
  });

  it("workspaceToMarkdown includes pricing section", () => {
    const md = workspaceToMarkdown(exampleWorkspaces[0].workspace);
    expect(md).toContain("Pricing");
  });

  it("workspaceToMarkdown includes content calendar section", () => {
    const md = workspaceToMarkdown(exampleWorkspaces[0].workspace);
    expect(md).toContain("Content");
  });



  it("markdown export includes target users section", () => {
    const md = workspaceToMarkdown(exampleWorkspaces[0].workspace);
    expect(md).toMatch(/target.*user|audience/i);
  });

  it("markdown export includes at least 3 level-2 headings", () => {
    const md = workspaceToMarkdown(exampleWorkspaces[0].workspace);
    const headingCount = (md.match(/^## /gm) || []).length;
    expect(headingCount).toBeGreaterThanOrEqual(3);
  });

});
