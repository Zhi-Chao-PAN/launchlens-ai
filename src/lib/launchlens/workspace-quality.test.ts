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


  it("returns a score between 0 and 100 for any workspace", () => {
    const empty: LaunchLensWorkspace = {
      provider: "mock",
      generatedAt: "2026-01-01T00:00:00.000Z",
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
    const result = evaluateWorkspaceQuality(empty);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("checks array is never empty check fails for empty backlog", () => {
    const ws: LaunchLensWorkspace = {
      provider: "mock",
      generatedAt: "2026-01-01T00:00:00.000Z",
      summary: "A decent summary",
      targetUsers: ["User A", "User B"],
      pains: ["Pain 1", "Pain 2"],
      mvpScope: ["Feature 1"],
      backlog: [],
      landingPage: { headline: "Headline", subheadline: "Sub", cta: "CTA", proofBullets: ["Proof"] },
      pricing: { hypothesis: "Hypo", tiers: ["T1"], risks: ["R1"] },
      launchPlan: ["Step 1"],
      contentCalendar: [{ channel: "Twitter", angle: "a", cadence: "weekly" }],
      tasks: [{ title: "Task", owner: "Founder", due: "Week 1", outcome: "Validate" }],
      assumptions: ["Assumption"],
    };
    const result = evaluateWorkspaceQuality(ws);
    const backlogCheck = result.checks.find((c) => c.label.toLowerCase().includes("backlog"));
    if (backlogCheck) {
      expect(backlogCheck.passed).toBe(false);
    }
  });

  it("checks total checks count is stable across runs", () => {
    const result = evaluateWorkspaceQuality(exampleWorkspaces[0].workspace);
    expect(result.checks.length).toBeGreaterThan(5);
    const result2 = evaluateWorkspaceQuality(exampleWorkspaces[1].workspace);
    expect(result2.checks.length).toBe(result.checks.length);
  });

  it("includes all example workspace categories in quality checks", () => {
    const result = evaluateWorkspaceQuality(exampleWorkspaces[0].workspace);
    const labels = result.checks.map((c) => c.label.toLowerCase());
    expect(labels.some((l) => l.includes("summary"))).toBe(true);
    expect(labels.some((l) => l.includes("target") || l.includes("user"))).toBe(true);
  });

  it("score increases when more content is added", () => {
    const base: LaunchLensWorkspace = {
      provider: "mock",
      generatedAt: "2026-01-01T00:00:00.000Z",
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
    const baseScore = evaluateWorkspaceQuality(base).score;

    const enhanced: LaunchLensWorkspace = {
      ...base,
      summary: "A thoughtful strategy with clear differentiation.",
      targetUsers: ["Founders", "Product managers", "Engineers"],
      pains: ["Pain 1", "Pain 2", "Pain 3"],
      mvpScope: ["Feature A", "Feature B"],
    };
    const enhancedScore = evaluateWorkspaceQuality(enhanced).score;
    expect(enhancedScore).toBeGreaterThan(baseScore);
  });

});
