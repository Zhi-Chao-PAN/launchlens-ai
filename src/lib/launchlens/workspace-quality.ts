import type { LaunchLensWorkspace } from "./types";

export type WorkspaceQualityCheck = {
  id: string;
  label: string;
  passed: boolean;
};

export type WorkspaceQualityResult = {
  score: number;
  checks: WorkspaceQualityCheck[];
};

function hasText(value: string) {
  return value.trim().length >= 12;
}

function hasItems(items: unknown[], count: number) {
  return items.length >= count;
}

export function evaluateWorkspaceQuality(
  workspace: LaunchLensWorkspace,
): WorkspaceQualityResult {
  const checks: WorkspaceQualityCheck[] = [
    {
      id: "summary",
      label: "Clear summary",
      passed: hasText(workspace.summary),
    },
    {
      id: "users",
      label: "Target users",
      passed: hasItems(workspace.targetUsers, 2),
    },
    {
      id: "pains",
      label: "Pain map",
      passed: hasItems(workspace.pains, 2),
    },
    {
      id: "scope",
      label: "MVP scope",
      passed: hasItems(workspace.mvpScope, 3),
    },
    {
      id: "backlog",
      label: "Prioritized backlog",
      passed:
        hasItems(workspace.backlog, 3) &&
        workspace.backlog.some((item) => item.priority === "P0"),
    },
    {
      id: "landing",
      label: "Landing copy",
      passed:
        hasText(workspace.landingPage.headline) &&
        hasText(workspace.landingPage.subheadline) &&
        hasText(workspace.landingPage.cta),
    },
    {
      id: "pricing",
      label: "Pricing hypothesis",
      passed:
        hasText(workspace.pricing.hypothesis) &&
        hasItems(workspace.pricing.tiers, 2) &&
        hasItems(workspace.pricing.risks, 1),
    },
    {
      id: "launch",
      label: "Launch plan",
      passed:
        hasItems(workspace.launchPlan, 3) &&
        hasItems(workspace.contentCalendar, 2),
    },
    {
      id: "tasks",
      label: "Execution tasks",
      passed: hasItems(workspace.tasks, 3),
    },
    {
      id: "assumptions",
      label: "Assumptions",
      passed: hasItems(workspace.assumptions, 2),
    },
  ];

  const passed = checks.filter((check) => check.passed).length;

  return {
    score: Math.round((passed / checks.length) * 100),
    checks,
  };
}
