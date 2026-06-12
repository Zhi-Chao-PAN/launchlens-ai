import { LAUNCHLENS_PROMPT_VERSION } from "./provider";
import { evaluateWorkspaceQuality } from "./workspace-quality";
import type {
  GenerationResult,
  LaunchLensWorkspace,
  ProviderName,
} from "./types";

export const PUBLIC_PROVIDER_EVAL_SCENARIO_IDS = [
  "activation-analyst",
  "clinic-admin",
  "creator-commerce",
] as const;

export type ProviderEvalScenarioId =
  (typeof PUBLIC_PROVIDER_EVAL_SCENARIO_IDS)[number];

type ScenarioCheck = {
  label: string;
  passed: boolean;
};

export type ProviderEvalSummary = {
  id: ProviderEvalScenarioId;
  mode: GenerationResult["mode"];
  provider: ProviderName;
  usedFallback: boolean;
  fallbackReason?: string;
  elapsedMs: number;
  qualityScore: number;
  passedChecks: number;
  totalChecks: number;
  scenarioChecks: ScenarioCheck[];
  sectionCounts: {
    targetUsers: number;
    pains: number;
    mvpScope: number;
    backlog: number;
    launchPlan: number;
    contentCalendar: number;
    tasks: number;
    assumptions: number;
  };
};

export type ProviderEvalCase = ProviderEvalSummary & {
  workspace: LaunchLensWorkspace;
};

type NormalizedFixtureWorkspace = Omit<
  LaunchLensWorkspace,
  "generatedAt"
>;

export type ProviderEvalFixtureCase = Omit<
  ProviderEvalSummary,
  "elapsedMs" | "fallbackReason"
> & {
  workspace: NormalizedFixtureWorkspace;
};

export type ProviderEvalFixture = {
  schemaVersion: 2;
  promptVersion: typeof LAUNCHLENS_PROMPT_VERSION;
  provider: "minimax";
  model: string;
  evaluatedAt: string;
  source: "live-public-samples";
  scenarioIds: ProviderEvalScenarioId[];
  cases: ProviderEvalFixtureCase[];
};

function workspaceCorpus(workspace: LaunchLensWorkspace) {
  return JSON.stringify(workspace).toLowerCase();
}

function scenarioChecks(
  id: ProviderEvalScenarioId,
  workspace: LaunchLensWorkspace,
): ScenarioCheck[] {
  const corpus = workspaceCorpus(workspace);

  if (id === "activation-analyst") {
    return [
      {
        label: "Preserves activation/onboarding focus",
        passed: corpus.includes("activation") || corpus.includes("onboarding"),
      },
      {
        label: "Includes evidence-driven product fixes",
        passed:
          corpus.includes("product fix") ||
          corpus.includes("priorit") ||
          corpus.includes("rank"),
      },
    ];
  }

  if (id === "clinic-admin") {
    return [
      {
        label: "Requires human approval",
        passed:
          corpus.includes("human approval") ||
          corpus.includes("admin approval") ||
          corpus.includes("click-to-send"),
      },
      {
        label: "Addresses privacy or auditability",
        passed: corpus.includes("privacy") || corpus.includes("audit"),
      },
    ];
  }

  return [
    {
      label: "Preserves audience-comment input",
      passed: corpus.includes("comment"),
    },
    {
      label: "Preserves the 10-day launch constraint",
      passed:
        corpus.includes("10 day") ||
        corpus.includes("10-day") ||
        corpus.includes("within 10"),
    },
  ];
}

export function buildProviderEvalCase(
  id: ProviderEvalScenarioId,
  result: GenerationResult,
  elapsedMs: number,
): ProviderEvalCase {
  const quality = evaluateWorkspaceQuality(result.workspace);

  return {
    id,
    mode: result.mode,
    provider: result.workspace.provider,
    usedFallback: result.usedFallback,
    fallbackReason: result.fallbackReason,
    elapsedMs: Math.round(elapsedMs),
    qualityScore: quality.score,
    passedChecks: quality.checks.filter((check) => check.passed).length,
    totalChecks: quality.checks.length,
    scenarioChecks: scenarioChecks(id, result.workspace),
    sectionCounts: {
      targetUsers: result.workspace.targetUsers.length,
      pains: result.workspace.pains.length,
      mvpScope: result.workspace.mvpScope.length,
      backlog: result.workspace.backlog.length,
      launchPlan: result.workspace.launchPlan.length,
      contentCalendar: result.workspace.contentCalendar.length,
      tasks: result.workspace.tasks.length,
      assumptions: result.workspace.assumptions.length,
    },
    workspace: result.workspace,
  };
}

export function providerEvalSummary(
  evalCase: ProviderEvalCase,
): ProviderEvalSummary {
  return {
    id: evalCase.id,
    mode: evalCase.mode,
    provider: evalCase.provider,
    usedFallback: evalCase.usedFallback,
    fallbackReason: evalCase.fallbackReason,
    elapsedMs: evalCase.elapsedMs,
    qualityScore: evalCase.qualityScore,
    passedChecks: evalCase.passedChecks,
    totalChecks: evalCase.totalChecks,
    scenarioChecks: evalCase.scenarioChecks,
    sectionCounts: evalCase.sectionCounts,
  };
}

function normalizedWorkspace(
  workspace: LaunchLensWorkspace,
): NormalizedFixtureWorkspace {
  return {
    provider: workspace.provider,
    summary: workspace.summary,
    targetUsers: workspace.targetUsers,
    pains: workspace.pains,
    mvpScope: workspace.mvpScope,
    backlog: workspace.backlog,
    landingPage: workspace.landingPage,
    pricing: workspace.pricing,
    launchPlan: workspace.launchPlan,
    contentCalendar: workspace.contentCalendar,
    tasks: workspace.tasks,
    assumptions: workspace.assumptions,
  };
}

export function buildProviderEvalFixture(options: {
  model: string;
  evaluatedAt: string;
  cases: ProviderEvalCase[];
}): ProviderEvalFixture {
  return {
    schemaVersion: 2,
    promptVersion: LAUNCHLENS_PROMPT_VERSION,
    provider: "minimax",
    model: options.model,
    evaluatedAt: options.evaluatedAt,
    source: "live-public-samples",
    scenarioIds: [...PUBLIC_PROVIDER_EVAL_SCENARIO_IDS],
    cases: options.cases.map((evalCase) => ({
      id: evalCase.id,
      mode: evalCase.mode,
      provider: evalCase.provider,
      usedFallback: evalCase.usedFallback,
      qualityScore: evalCase.qualityScore,
      passedChecks: evalCase.passedChecks,
      totalChecks: evalCase.totalChecks,
      scenarioChecks: evalCase.scenarioChecks,
      sectionCounts: evalCase.sectionCounts,
      workspace: normalizedWorkspace(evalCase.workspace),
    })),
  };
}

function stringValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(stringValues);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(stringValues);
  }

  return [];
}

export function assertSafeProviderFixture(
  fixture: ProviderEvalFixture,
  blockedValues: string[] = [],
) {
  const values = stringValues(fixture);
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/,
    /Bearer\s+[A-Za-z0-9._-]{16,}/i,
    /(?:MINIMAX|OPENAI)_API_KEY\s*[:=]\s*\S+/i,
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    /(?:api[_-]?key|access[_-]?token|token)=[A-Za-z0-9._-]{12,}/i,
  ];

  if (
    values.some((value) =>
      secretPatterns.some((pattern) => pattern.test(value)),
    )
  ) {
    throw new Error("Provider fixture contains a secret-like value.");
  }

  const secrets = blockedValues.filter((value) => value.length >= 12);
  const containsConfiguredSecret = values.some((value) =>
    secrets.some((secret) => value.includes(secret)),
  );

  if (containsConfiguredSecret) {
    throw new Error("Provider fixture contains a configured secret value.");
  }
}
