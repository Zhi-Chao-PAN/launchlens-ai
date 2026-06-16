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


describe('mock provider idempotency', () => {
  it('produces the same output for the same input (deterministic)', () => {
    const result1 = buildMockWorkspace(input);
    const result2 = buildMockWorkspace(input);
    expect(result1.backlog.length).toBe(result2.backlog.length);
    expect(result1.assumptions.length).toBe(result2.assumptions.length);
    expect(result1.backlog[0].feature).toBe(result2.backlog[0].feature);
  });

  it('includes core workspace sections with non-empty arrays', () => {
    const result = buildMockWorkspace(input);
    expect(result).toHaveProperty('backlog');
    expect(result).toHaveProperty('assumptions');
    expect(result).toHaveProperty('pricing');
    expect(Array.isArray(result.backlog)).toBe(true);
    expect(result.backlog.length).toBeGreaterThan(0);
    expect(Array.isArray(result.assumptions)).toBe(true);
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(typeof result.pricing).toBe('object');
    expect(result.pricing).not.toBeNull();
  });
});
