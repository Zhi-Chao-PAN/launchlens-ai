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
    }
  });
});
