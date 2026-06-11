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
