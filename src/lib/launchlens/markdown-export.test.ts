import { describe, expect, it } from "vitest";

import { workspaceToMarkdown } from "./markdown-export";
import { buildMockWorkspace } from "./mock-provider";
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
});
