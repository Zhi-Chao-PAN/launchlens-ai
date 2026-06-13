import { describe, expect, it } from "vitest";

import { workspaceToJson } from "./json-export";
import { buildMockWorkspace } from "./mock-provider";
import { createExecutionState } from "./execution";
import type { LaunchLensInput } from "./types";

const input: LaunchLensInput = {
  idea: "An AI planner that creates go-to-market tasks.",
  audience: "Solo founders",
  market: "Micro-SaaS",
  tone: "Practical",
  constraints: "Ship in two weeks.",
};

describe("workspaceToJson", () => {
  it("exports a parseable workspace payload", () => {
    const workspace = buildMockWorkspace(input);
    const parsed = JSON.parse(workspaceToJson(workspace));

    expect(parsed.provider).toBe("mock");
    expect(parsed.summary).toBe(workspace.summary);
    expect(parsed.backlog).toHaveLength(workspace.backlog.length);
    expect(parsed.tasks).toHaveLength(workspace.tasks.length);
  });

  it("exports the complete execution handoff when supplied", () => {
    const workspace = buildMockWorkspace(input);
    const execution = createExecutionState(workspace);
    const parsed = JSON.parse(workspaceToJson(workspace, execution));

    expect(parsed.workspace.summary).toBe(workspace.summary);
    expect(parsed.execution.experiments).toHaveLength(
      workspace.assumptions.length,
    );
  });
});
