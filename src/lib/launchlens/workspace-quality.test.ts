import { describe, expect, it } from "vitest";

import { exampleWorkspaces } from "./example-workspaces";
import { evaluateWorkspaceQuality } from "./workspace-quality";
import type { LaunchLensWorkspace } from "./types";

describe("evaluateWorkspaceQuality", () => {
  it("scores stable example workspaces as portfolio-demo ready", () => {
    for (const example of exampleWorkspaces) {
      const result = evaluateWorkspaceQuality(example.workspace);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.checks.every((check) => check.passed)).toBe(true);
    }
  });

  it("flags incomplete generated workspaces", () => {
    const incomplete: LaunchLensWorkspace = {
      provider: "mock",
      generatedAt: "2026-06-12T06:20:00.000Z",
      summary: "Too thin.",
      targetUsers: ["Founder"],
      pains: [],
      mvpScope: [],
      backlog: [],
      landingPage: {
        headline: "",
        subheadline: "",
        cta: "",
        proofBullets: [],
      },
      pricing: {
        hypothesis: "",
        tiers: [],
        risks: [],
      },
      launchPlan: [],
      contentCalendar: [],
      tasks: [],
      assumptions: [],
    };

    const result = evaluateWorkspaceQuality(incomplete);

    expect(result.score).toBeLessThan(50);
    expect(result.checks.some((check) => !check.passed)).toBe(true);
  });
});

describe("evaluateWorkspaceQuality edge cases", () => {
  it("fails the backlog check when priorities are invalid or no P0 exists", () => {
    const base = { ...exampleWorkspaces[0].workspace };
    const badBacklog = base.backlog.map((b, i) => ({
      ...b,
      priority: (i === 0 ? "P9" : "P1") as "P0" | "P1" | "P2",
    }));
    const r = evaluateWorkspaceQuality({ ...base, backlog: badBacklog });
    expect(r.checks.find((c) => c.id === "backlog")?.passed).toBe(false);
  });

  it("fails the tasks check when owner/title/outcome are too short", () => {
    const base = { ...exampleWorkspaces[0].workspace };
    const shortTasks = base.tasks.map((task, i) =>
      i === 0
        ? { ...task, title: "Short", owner: "Me", due: "W1", outcome: "Nope" }
        : task,
    );
    const r = evaluateWorkspaceQuality({ ...base, tasks: shortTasks });
    expect(r.checks.find((c) => c.id === "tasks")?.passed).toBe(false);
  });

  it("dedupes repeated string items as a failure for list checks", () => {
    const base = { ...exampleWorkspaces[0].workspace };
    const r = evaluateWorkspaceQuality({
      ...base,
      pains: ["repeated identical entry here", "repeated identical entry here"],
    });
    expect(r.checks.find((c) => c.id === "pains")?.passed).toBe(false);
  });

  it("requires string items to meet a minimum length to avoid filler bullets", () => {
    const base = { ...exampleWorkspaces[0].workspace };
    const r = evaluateWorkspaceQuality({
      ...base,
      targetUsers: ["x", "y", "z"],
    });
    expect(r.checks.find((c) => c.id === "users")?.passed).toBe(false);
  });

  it("produces a 0 score when every check is empty", () => {
    const empty: LaunchLensWorkspace = {
      provider: "mock",
      generatedAt: "2026-06-12T06:20:00.000Z",
      summary: "",
      targetUsers: [],
      pains: [],
      mvpScope: [],
      backlog: [],
      landingPage: { headline: "", subheadline: "", cta: "", proofBullets: [] },
      pricing: { hypothesis: "", tiers: [], risks: [] },
      launchPlan: [],
      contentCalendar: [],
      tasks: [],
      assumptions: [],
    };
    const r = evaluateWorkspaceQuality(empty);
    expect(r.score).toBe(0);
    expect(r.checks.every((c) => c.passed === false)).toBe(true);
  });
});
