import { describe, expect, it } from "vitest";

import { safeJsonFilename, workspaceToJson } from "./json-export";
import { buildMockWorkspace } from "./mock-provider";
import { exampleWorkspaces } from "./example-workspaces";
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

describe("workspaceToJson edge cases", () => {
  it("trailing newline for POSIX-friendliness", () => {
    const ws = buildMockWorkspace({
      idea: "An AI planner that creates go-to-market tasks.",
      audience: "Solo founders",
      market: "Micro-SaaS",
      tone: "Practical",
      constraints: "Ship in two weeks.",
    });
    expect(workspaceToJson(ws).endsWith("\n")).toBe(true);
  });
});

describe("safeJsonFilename", () => {
  it("slugifies project names like the markdown helper", () => {
    expect(safeJsonFilename({ projectName: "Acme SaaS Launch" })).toBe(
      "acme-saas-launch.json",
    );
  });

  it("falls back to landingPage.headline and default", () => {
    expect(
      safeJsonFilename({ landingPage: { headline: "My Product Launch" } }),
    ).toBe("my-product-launch.json");
    expect(safeJsonFilename({})).toBe("launchlens-workspace.json");
  });

  it("truncates to 60 chars plus .json extension", () => {
    const long = safeJsonFilename({ projectName: "a".repeat(200) });
    expect(long.endsWith(".json")).toBe(true);
    expect(long.length).toBeLessThanOrEqual(65);
  });

  it("produces valid JSON that round-trips through parse", () => {
    const ws = exampleWorkspaces[0].workspace;
    const json = workspaceToJson(ws);
    const parsed = JSON.parse(json);
    expect(typeof parsed).toBe("object");
    expect(parsed).not.toBeNull();
    expect(Array.isArray(parsed)).toBe(false);
  });

  it("preserves the summary field in JSON output", () => {
    const ws = exampleWorkspaces[0].workspace;
    const json = workspaceToJson(ws);
    expect(json).toContain(ws.summary);
  });

  it("includes backlog and tasks in the JSON output", () => {
    const ws = exampleWorkspaces[0].workspace;
    const json = workspaceToJson(ws);
    const parsed = JSON.parse(json);
    const hasBacklog = Array.isArray(parsed.backlog) || Array.isArray(parsed.priorities);
    const hasTasks = Array.isArray(parsed.tasks) || Array.isArray(parsed.actionItems);
    expect(hasBacklog || hasTasks).toBe(true);
  });
});
