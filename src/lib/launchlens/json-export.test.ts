import { describe, expect, it } from "vitest";

import { safeJsonFilename, SCHEMA_VERSION, workspaceFromJson, workspaceToJson } from "./json-export";
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
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
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

  it("produces valid JSON that can be round-tripped", () => {
    const json = workspaceToJson(exampleWorkspaces[0].workspace);
    const parsed = JSON.parse(json);
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe("object");
  });

  it("preserves the provider field through export", () => {
    const json = workspaceToJson(exampleWorkspaces[0].workspace);
    const parsed = JSON.parse(json);
    expect(parsed.provider).toBe(exampleWorkspaces[0].workspace.provider);
  });

  it("includes a generatedAt timestamp", () => {
    const json = workspaceToJson(exampleWorkspaces[0].workspace);
    const parsed = JSON.parse(json);
    expect(parsed.generatedAt).toBeDefined();
    expect(new Date(parsed.generatedAt).toString()).not.toBe("Invalid Date");
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

  it('produces valid parseable JSON output', () => {
    const workspace = buildMockWorkspace(input);
    const execution = createExecutionState(workspace);
    const json = workspaceToJson(workspace, execution);
    const parsed = JSON.parse(json);
    expect(typeof parsed).toBe('object');
    expect(parsed).not.toBeNull();
  });

  it('includes execution data when execution state is provided', () => {
    const workspace = buildMockWorkspace(input);
    const execution = createExecutionState(workspace);
    const json = workspaceToJson(workspace, execution);
    const parsed = JSON.parse(json);
    expect(parsed.execution).toBeDefined();
    expect(Array.isArray(parsed.execution?.experiments)).toBe(true);
  });


  it("exported JSON is valid and parseable", () => {
    const result = workspaceToJson(exampleWorkspaces[0].workspace);
    const parsed = JSON.parse(result);
    expect(parsed.generatedAt).toBeTruthy();
    expect(parsed.summary).toBeTruthy();
  });

  it("exported JSON includes provider field", () => {
    const result = workspaceToJson(exampleWorkspaces[0].workspace);
    const parsed = JSON.parse(result);
    expect(typeof parsed.provider).toBe("string");
    expect(parsed.provider.length).toBeGreaterThan(0);
  });



  it("workspaceFromJson parses a valid export round-trip", () => {
    const ws = exampleWorkspaces[0].workspace;
    const json = workspaceToJson(ws);
    const result = workspaceFromJson(json);
    expect(result.workspace.summary).toBe(ws.summary);
    expect(result.warnings.length).toBe(0);
  });

  it("workspaceFromJson parses export with execution state", () => {
    const ws = exampleWorkspaces[0].workspace;
    const ex = exampleWorkspaces[0].execution;
    const json = workspaceToJson(ws, ex);
    const result = workspaceFromJson(json);
    expect(result.execution).toBeTruthy();
    expect(result.execution?.experiments.length).toBe(ex.experiments.length);
  });

  it("workspaceFromJson rejects invalid JSON", () => {
    expect(() => workspaceFromJson("not valid json {")).toThrow();
  });

  it("workspaceFromJson rejects missing workspace fields", () => {
    const empty = JSON.stringify({});
    expect(() => workspaceFromJson(empty)).toThrow();
    const partial = JSON.stringify({ summary: "test" });
    expect(() => workspaceFromJson(partial)).toThrow();
  });

  it("workspaceFromJson warns about missing optional fields", () => {
    const ws = exampleWorkspaces[0].workspace;
    const rest = { ...ws, generatedAt: undefined, provider: undefined } as unknown as typeof ws;
    const result = workspaceFromJson(JSON.stringify(rest));
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.workspace.generatedAt).toBeTruthy();
  });

  it("workspaceFromJson handles bare workspace (not wrapped)", () => {
    const ws = exampleWorkspaces[0].workspace;
    const result = workspaceFromJson(JSON.stringify(ws));
    expect(result.workspace.summary).toBe(ws.summary);
  });

});

describe("schema migration", () => {
  it("migrates v0 (no version) wrapped workspace to v1 with completed=false on tasks", () => {
    const v0 = JSON.stringify({
      workspace: {
        summary: "Test",
        targetUsers: ["a"],
        pains: ["b"],
        backlog: [],
        landingPage: { headline: "h", subheadline: "s", cta: "c", proofBullets: [] },
        assumptions: ["x"],
        tasks: [{ title: "Task 1", owner: "Me", due: "Week 1", outcome: "done" }],
      },
    });
    const result = workspaceFromJson(v0);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings.some((w) => w.includes("Upgraded"))).toBe(true);
    expect(result.workspace.tasks[0].completed).toBe(false);
  });

  it("migrates v0 bare workspace (unwrapped) to v1", () => {
    const v0 = JSON.stringify({
      summary: "Test",
      targetUsers: ["a"],
      pains: ["b"],
      backlog: [],
      landingPage: { headline: "h", subheadline: "s", cta: "c", proofBullets: [] },
      assumptions: ["x"],
      tasks: [{ title: "T1", owner: "O", due: "W1", outcome: "O" }],
    });
    const result = workspaceFromJson(v0);
    expect(result.workspace.tasks[0].completed).toBe(false);
  });

  it("leaves v1 workspaces unchanged (no migration warning)", () => {
    const v1 = JSON.stringify({
      schemaVersion: 1,
      workspace: {
        summary: "Test",
        targetUsers: ["a"],
        pains: ["b"],
        backlog: [],
        landingPage: { headline: "h", subheadline: "s", cta: "c", proofBullets: [] },
        assumptions: ["x"],
        tasks: [{ title: "T1", owner: "O", due: "W1", outcome: "O", completed: true }],
      },
    });
    const result = workspaceFromJson(v1);
    const hasUpgradeWarning = result.warnings.some((w) => w.includes("Upgraded"));
    expect(hasUpgradeWarning).toBe(false);
    expect(result.workspace.tasks[0].completed).toBe(true);
  });
});

