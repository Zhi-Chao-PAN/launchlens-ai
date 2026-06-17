import { describe, expect, it } from "vitest";

import { exampleWorkspaces } from "./example-workspaces";
import { sampleBriefs } from "./sample-briefs";

describe("exampleWorkspaces", () => {
  it("provides one stable reviewer fixture per sample brief", () => {
    expect(exampleWorkspaces).toHaveLength(sampleBriefs.length);

    for (const example of exampleWorkspaces) {
      expect(example.workspace.provider).toBe("mock");
      expect(example.workspace.generatedAt).toMatch(/^2026-06-12T04:3/);
      expect(example.workspace.summary).toContain(example.input.idea.slice(0, 40));
      expect(example.workspace.backlog.length).toBeGreaterThan(0);
      expect(example.workspace.tasks.length).toBeGreaterThan(0);
      expect(example.execution.experiments).toHaveLength(
        example.workspace.assumptions.length,
      );
    }
  });

  it("includes reviewer-ready evidence in each stable example", () => {
    for (const example of exampleWorkspaces) {
      expect(
        example.execution.experiments.some(
          (experiment) => experiment.evidence.length > 0,
        ),
      ).toBe(true);
      expect(
        example.execution.experiments.some(
          (experiment) => experiment.decisionBrief,
        ),
      ).toBe(true);
    }
  });


  it('all example workspaces have non-empty backlog and assumptions', () => {
    for (const ex of exampleWorkspaces) {
      expect(Array.isArray(ex.workspace.backlog)).toBe(true);
      expect(ex.workspace.backlog.length).toBeGreaterThan(0);
      expect(Array.isArray(ex.workspace.assumptions)).toBe(true);
      expect(ex.workspace.assumptions.length).toBeGreaterThan(0);
    }
  });

  it('all example workspaces have matching execution state length', () => {
    for (const ex of exampleWorkspaces) {
      expect(ex.execution.experiments.length).toBe(ex.workspace.assumptions.length);
    }
  });


  it("all example workspaces have a valid generatedAt timestamp", () => {
    for (const item of exampleWorkspaces) {
      expect(() => new Date(item.workspace.generatedAt)).not.toThrow();
      expect(item.workspace.generatedAt).toMatch(/^\d{4}-/);
    }
  });

  it("each example workspace has a unique summary", () => {
    const summaries = exampleWorkspaces.map((item) => item.workspace.summary);
    expect(new Set(summaries).size).toBe(summaries.length);
  });

});
