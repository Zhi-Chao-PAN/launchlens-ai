import { describe, expect, it } from "vitest";

import { buildMockWorkspace } from "./mock-provider";
import type { LaunchLensInput } from "./types";

const input: LaunchLensInput = {
  idea: "An AI launch planner for tiny SaaS teams.",
  audience: "Indie founders",
  market: "AI SaaS",
  tone: "Practical",
  constraints: "No API key should be required.",
};

describe("buildMockWorkspace", () => {
  it("returns a runnable no-key workspace with core GTM sections", () => {
    const workspace = buildMockWorkspace(input);

    expect(workspace.provider).toBe("mock");
    expect(workspace.summary).toContain(input.idea);
    expect(workspace.targetUsers.length).toBeGreaterThan(0);
    expect(workspace.backlog).toHaveLength(4);
    expect(workspace.landingPage.headline).toContain("launch-ready workspace");
    expect(workspace.assumptions.length).toBeGreaterThan(0);
  });

  it("can label fallback output as an OpenAI-shaped workspace", () => {
    const workspace = buildMockWorkspace(input, "openai");

    expect(workspace.provider).toBe("openai");
  });
});
