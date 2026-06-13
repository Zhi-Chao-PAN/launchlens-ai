import {
  DECISION_PROMPT_VERSION,
  decisionSourceFingerprint,
  type DecisionBrief,
  type DecisionGenerationResult,
  type DecisionSource,
} from "./decision";
import type { EvidenceSignal } from "./execution";
import type { ProviderName } from "./types";

export const PUBLIC_DECISION_EVAL_SCENARIO_IDS = [
  "activation-analyst",
  "clinic-admin",
  "creator-commerce",
] as const;

export type DecisionEvalScenarioId =
  (typeof PUBLIC_DECISION_EVAL_SCENARIO_IDS)[number];

type ScenarioCheck = {
  label: string;
  passed: boolean;
};

type QualityCheck = {
  label: string;
  passed: boolean;
};

export type DecisionEvalSummary = {
  id: DecisionEvalScenarioId;
  mode: DecisionGenerationResult["mode"];
  provider: ProviderName;
  usedFallback: boolean;
  fallbackReason?: string;
  elapsedMs: number;
  qualityScore: number;
  passedChecks: number;
  totalChecks: number;
  scenarioChecks: ScenarioCheck[];
  recommendation: DecisionBrief["recommendation"];
  evidenceStrength: DecisionBrief["evidenceStrength"];
  claimCount: number;
  citedEvidenceIds: number;
};

export type DecisionEvalCase = DecisionEvalSummary & {
  source: DecisionSource;
  brief: DecisionBrief;
};

type NormalizedDecisionBrief = Omit<DecisionBrief, "generatedAt">;

export type DecisionEvalFixtureCase = Omit<
  DecisionEvalSummary,
  "elapsedMs" | "fallbackReason"
> & {
  source: DecisionSource;
  brief: NormalizedDecisionBrief;
};

export type DecisionEvalFixture = {
  schemaVersion: 1;
  promptVersion: typeof DECISION_PROMPT_VERSION;
  provider: "minimax";
  model: string;
  evaluatedAt: string;
  source: "live-decision-samples";
  scenarioIds: DecisionEvalScenarioId[];
  cases: DecisionEvalFixtureCase[];
};

function signalCounts(source: DecisionSource) {
  return source.evidence.reduce(
    (counts, evidence) => ({
      ...counts,
      [evidence.signal]: counts[evidence.signal] + 1,
    }),
    {
      supports: 0,
      challenges: 0,
      neutral: 0,
    } satisfies Record<EvidenceSignal, number>,
  );
}

function recommendationMatchesEvidence(
  source: DecisionSource,
  brief: DecisionBrief,
) {
  const counts = signalCounts(source);

  if (counts.challenges > counts.supports) {
    return ["pivot", "iterate", "pause"].includes(brief.recommendation);
  }

  if (counts.supports > 0 && counts.challenges === 0) {
    return ["proceed", "iterate"].includes(brief.recommendation);
  }

  return ["pause", "iterate"].includes(brief.recommendation);
}

function evidenceStrengthMatchesEvidence(
  source: DecisionSource,
  brief: DecisionBrief,
) {
  const counts = signalCounts(source);
  const directional = counts.supports + counts.challenges;

  if (directional === 0) {
    return brief.evidenceStrength === "insufficient";
  }

  if (counts.supports > 0 && counts.challenges > 0) {
    return ["mixed", "directional"].includes(brief.evidenceStrength);
  }

  return ["directional", "strong"].includes(brief.evidenceStrength);
}

function citedIds(brief: DecisionBrief) {
  return new Set(brief.claims.flatMap((claim) => claim.evidenceIds));
}

function qualityChecks(
  source: DecisionSource,
  result: DecisionGenerationResult,
): QualityCheck[] {
  const brief = result.brief;
  const availableIds = new Set(source.evidence.map((item) => item.id));
  const usedIds = citedIds(brief);

  return [
    {
      label: "Prompt version is current",
      passed: brief.promptVersion === DECISION_PROMPT_VERSION,
    },
    {
      label: "Source fingerprint matches evidence",
      passed: brief.sourceFingerprint === decisionSourceFingerprint(source),
    },
    {
      label: "Every claim cites at least one evidence id",
      passed: brief.claims.every((claim) => claim.evidenceIds.length > 0),
    },
    {
      label: "All citations reference supplied evidence",
      passed: [...usedIds].every((id) => availableIds.has(id)),
    },
    {
      label: "Every supplied evidence item is cited",
      passed: [...availableIds].every((id) => usedIds.has(id)),
    },
    {
      label: "Recommendation follows evidence direction",
      passed: recommendationMatchesEvidence(source, brief),
    },
    {
      label: "Evidence strength follows recorded signals",
      passed: evidenceStrengthMatchesEvidence(source, brief),
    },
    {
      label: "Risks and next actions are actionable",
      passed:
        brief.unresolvedRisks.length > 0 &&
        brief.nextActions.length > 0 &&
        brief.nextActions.every((item) => item.length >= 10),
    },
    {
      label: "No fallback was needed",
      passed: !result.usedFallback && !brief.usedFallback,
    },
  ];
}

function scenarioChecks(
  id: DecisionEvalScenarioId,
  source: DecisionSource,
  brief: DecisionBrief,
): ScenarioCheck[] {
  if (id === "activation-analyst") {
    return [
      {
        label: "Positive activation evidence does not recommend pivot or pause",
        passed: ["proceed", "iterate"].includes(brief.recommendation),
      },
      {
        label: "All activation evidence is cited",
        passed: source.evidence.every((item) => citedIds(brief).has(item.id)),
      },
    ];
  }

  if (id === "clinic-admin") {
    return [
      {
        label: "Neutral clinic evidence does not overclaim proceed",
        passed: ["pause", "iterate"].includes(brief.recommendation),
      },
      {
        label: "Clinic brief keeps weak evidence marked insufficient",
        passed: brief.evidenceStrength === "insufficient",
      },
    ];
  }

  return [
    {
      label: "Challenge-only creator evidence does not recommend proceed",
      passed: brief.recommendation !== "proceed",
    },
    {
      label: "Creator challenge is represented in grounded claims",
      passed: brief.claims.some((claim) => claim.stance === "challenges"),
    },
  ];
}

export function buildDecisionEvalCase(
  id: DecisionEvalScenarioId,
  source: DecisionSource,
  result: DecisionGenerationResult,
  elapsedMs: number,
): DecisionEvalCase {
  const checks = qualityChecks(source, result);
  const passedChecks = checks.filter((check) => check.passed).length;

  return {
    id,
    mode: result.mode,
    provider: result.brief.provider,
    usedFallback: result.usedFallback,
    fallbackReason: result.fallbackReason,
    elapsedMs: Math.round(elapsedMs),
    qualityScore: Math.round((passedChecks / checks.length) * 100),
    passedChecks,
    totalChecks: checks.length,
    scenarioChecks: scenarioChecks(id, source, result.brief),
    recommendation: result.brief.recommendation,
    evidenceStrength: result.brief.evidenceStrength,
    claimCount: result.brief.claims.length,
    citedEvidenceIds: citedIds(result.brief).size,
    source,
    brief: result.brief,
  };
}

export function decisionEvalSummary(
  evalCase: DecisionEvalCase,
): DecisionEvalSummary {
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
    recommendation: evalCase.recommendation,
    evidenceStrength: evalCase.evidenceStrength,
    claimCount: evalCase.claimCount,
    citedEvidenceIds: evalCase.citedEvidenceIds,
  };
}

function normalizedBrief(brief: DecisionBrief): NormalizedDecisionBrief {
  return {
    schemaVersion: brief.schemaVersion,
    provider: brief.provider,
    promptVersion: brief.promptVersion,
    mode: brief.mode,
    usedFallback: brief.usedFallback,
    ...(brief.fallbackReason ? { fallbackReason: brief.fallbackReason } : {}),
    sourceFingerprint: brief.sourceFingerprint,
    recommendation: brief.recommendation,
    evidenceStrength: brief.evidenceStrength,
    headline: brief.headline,
    claims: brief.claims,
    unresolvedRisks: brief.unresolvedRisks,
    nextActions: brief.nextActions,
  };
}

export function buildDecisionEvalFixture(options: {
  model: string;
  evaluatedAt: string;
  cases: DecisionEvalCase[];
}): DecisionEvalFixture {
  return {
    schemaVersion: 1,
    promptVersion: DECISION_PROMPT_VERSION,
    provider: "minimax",
    model: options.model,
    evaluatedAt: options.evaluatedAt,
    source: "live-decision-samples",
    scenarioIds: [...PUBLIC_DECISION_EVAL_SCENARIO_IDS],
    cases: options.cases.map((evalCase) => ({
      id: evalCase.id,
      mode: evalCase.mode,
      provider: evalCase.provider,
      usedFallback: evalCase.usedFallback,
      qualityScore: evalCase.qualityScore,
      passedChecks: evalCase.passedChecks,
      totalChecks: evalCase.totalChecks,
      scenarioChecks: evalCase.scenarioChecks,
      recommendation: evalCase.recommendation,
      evidenceStrength: evalCase.evidenceStrength,
      claimCount: evalCase.claimCount,
      citedEvidenceIds: evalCase.citedEvidenceIds,
      source: evalCase.source,
      brief: normalizedBrief(evalCase.brief),
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

export function assertSafeDecisionFixture(
  fixture: DecisionEvalFixture,
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
    throw new Error("Decision fixture contains a secret-like value.");
  }

  const secrets = blockedValues.filter((value) => value.length >= 12);
  const containsConfiguredSecret = values.some((value) =>
    secrets.some((secret) => value.includes(secret)),
  );

  if (containsConfiguredSecret) {
    throw new Error("Decision fixture contains a configured secret value.");
  }
}
