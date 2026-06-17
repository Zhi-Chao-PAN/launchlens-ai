import type {
  ConfidenceLevel,
  EvidenceSignal,
  EvidenceWeight,
  ExperimentStatus,
  ValidationExperiment,
} from "./execution";
import type { ProviderName } from "./types";

const EVIDENCE_WEIGHT_VALUES: Record<EvidenceWeight, number> = {
  anecdotal: 1,
  moderate: 2,
  strong: 4,
};

export const DECISION_PROMPT_VERSION = "launchlens-decision-v2";

export type DecisionRecommendation = "proceed" | "iterate" | "pivot" | "pause";
export type EvidenceStrength =
  | "insufficient"
  | "mixed"
  | "directional"
  | "strong";
export type ClaimStance = "supports" | "challenges" | "context";

export type DecisionSourceEvidence = {
  id: string;
  note: string;
  source: string;
  signal: EvidenceSignal;
  weight: EvidenceWeight;
  observedAt: string;
};

export type DecisionSource = {
  experimentId: string;
  assumption: string;
  status: ExperimentStatus;
  confidence: ConfidenceLevel;
  decision: string;
  nextAction: string;
  evidence: DecisionSourceEvidence[];
};

export type GroundedClaim = {
  text: string;
  stance: ClaimStance;
  evidenceIds: string[];
};

export type DecisionBrief = {
  schemaVersion: 1;
  provider: ProviderName;
  promptVersion: typeof DECISION_PROMPT_VERSION;
  mode: "demo" | "real";
  usedFallback: boolean;
  fallbackReason?: string;
  generatedAt: string;
  sourceFingerprint: string;
  recommendation: DecisionRecommendation;
  evidenceStrength: EvidenceStrength;
  headline: string;
  claims: GroundedClaim[];
  unresolvedRisks: string[];
  nextActions: string[];
};

export type DecisionGenerationResult = {
  brief: DecisionBrief;
  mode: "demo" | "real";
  usedFallback: boolean;
  fallbackReason?: string;
};

const RECOMMENDATIONS = new Set<DecisionRecommendation>([
  "proceed",
  "iterate",
  "pivot",
  "pause",
]);
const EVIDENCE_STRENGTHS = new Set<EvidenceStrength>([
  "insufficient",
  "mixed",
  "directional",
  "strong",
]);
const CLAIM_STANCES = new Set<ClaimStance>([
  "supports",
  "challenges",
  "context",
]);
const CONFIDENCE_LEVELS = new Set<ConfidenceLevel>(["low", "medium", "high"]);
const EXPERIMENT_STATUSES = new Set<ExperimentStatus>([
  "untested",
  "testing",
  "supported",
  "refuted",
]);
const EVIDENCE_SIGNALS = new Set<EvidenceSignal>([
  "supports",
  "challenges",
  "neutral",
]);
const MAX_EVIDENCE = 8;
const MAX_ID_CHARS = 80;
const MAX_SHORT_TEXT_CHARS = 240;
const MAX_TEXT_CHARS = 800;
const MAX_LIST_ITEMS = 4;
const MAX_CLAIMS = 8;
const FALLBACK_REASONS = new Set([
  "provider_failed",
  "provider_timeout",
  "provider_misconfigured",
  "provider_validation_failed",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, maxChars: number) {
  if (typeof value !== "string") {
    return null;
  }

  let normalized = value.trim();
  const firstCharacter = normalized[0];

  if (
    normalized.length >= 2 &&
    (firstCharacter === "\"" || firstCharacter === "'") &&
    normalized.endsWith(firstCharacter)
  ) {
    normalized = normalized.slice(1, -1).trim();
  } else if (
    normalized.length >= 2 &&
    (firstCharacter === "\"" || firstCharacter === "'")
  ) {
    normalized = normalized.slice(1).trim();
  }

  return normalized.length > 0 && normalized.length <= maxChars
    ? normalized
    : null;
}

function optionalBoundedString(value: unknown, maxChars: number) {
  if (value === undefined || value === null) {
    return "";
  }

  return typeof value === "string" && value.length <= maxChars ? value : null;
}

function normalizedDate(value: unknown) {
  if (typeof value !== "string" || value.length > 40) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function boundedList(
  value: unknown,
  options: { min?: number; max?: number } = {},
) {
  const min = options.min ?? 0;
  const max = options.max ?? MAX_LIST_ITEMS;

  if (!Array.isArray(value) || value.length < min || value.length > max) {
    return null;
  }

  const items = value.map((item) => boundedString(item, MAX_TEXT_CHARS));

  return items.some((item) => item === null) ? null : (items as string[]);
}

function stableHash(value: string) {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(36);
}

export function decisionSourceFromExperiment(
  experiment: ValidationExperiment,
): DecisionSource {
  return {
    experimentId: experiment.id,
    assumption: experiment.assumption,
    status: experiment.status,
    confidence: experiment.confidence,
    decision: experiment.decision,
    nextAction: experiment.nextAction,
    evidence: experiment.evidence,
  };
}

export function decisionSourceFingerprint(source: DecisionSource) {
  return `decision-${stableHash(
    JSON.stringify({
      assumption: source.assumption,
      evidence: source.evidence.map((item) => ({
        id: item.id,
        note: item.note,
        source: item.source,
        signal: item.signal,
        observedAt: item.observedAt,
      })),
    }),
  )}`;
}

export function normalizeDecisionSource(value: unknown): DecisionSource | null {
  if (!isRecord(value) || !Array.isArray(value.evidence)) {
    return null;
  }

  if (value.evidence.length < 1 || value.evidence.length > MAX_EVIDENCE) {
    return null;
  }

  const experimentId = boundedString(value.experimentId, MAX_ID_CHARS);
  const assumption = boundedString(value.assumption, MAX_TEXT_CHARS);
  const status = value.status as ExperimentStatus;
  const confidence = value.confidence as ConfidenceLevel;
  const decision = optionalBoundedString(value.decision, MAX_TEXT_CHARS);
  const nextAction = optionalBoundedString(value.nextAction, MAX_TEXT_CHARS);
  const evidence = value.evidence.map((item) => {
    if (!isRecord(item)) {
      return null;
    }

    const id = boundedString(item.id, MAX_ID_CHARS);
    const note = boundedString(item.note, MAX_TEXT_CHARS);
    const source = boundedString(item.source, MAX_SHORT_TEXT_CHARS);
    const signal = item.signal as EvidenceSignal;
    const weightRaw = item.weight;
    const weight =
      typeof weightRaw === "string" &&
      (weightRaw === "anecdotal" || weightRaw === "moderate" || weightRaw === "strong")
        ? (weightRaw as EvidenceWeight)
        : "moderate";
    const observedAt = normalizedDate(item.observedAt);

    if (
      !id ||
      !note ||
      !source ||
      !EVIDENCE_SIGNALS.has(signal) ||
      !observedAt
    ) {
      return null;
    }

    return { id, note, source, signal, weight, observedAt };
  });

  if (
    !experimentId ||
    !assumption ||
    !EXPERIMENT_STATUSES.has(status) ||
    !CONFIDENCE_LEVELS.has(confidence) ||
    decision === null ||
    nextAction === null ||
    evidence.some((item) => item === null)
  ) {
    return null;
  }

  const normalizedEvidence = evidence as DecisionSourceEvidence[];
  const evidenceIds = normalizedEvidence.map((item) => item.id);

  if (new Set(evidenceIds).size !== evidenceIds.length) {
    return null;
  }

  return {
    experimentId,
    assumption,
    status,
    confidence,
    decision,
    nextAction,
    evidence: normalizedEvidence,
  };
}

export function normalizeDecisionBrief(
  value: unknown,
  source: DecisionSource,
): DecisionBrief | null {
  try {
  if (!isRecord(value)) {
    return null;
  }

  const schemaVersion = value.schemaVersion;
  const provider = value.provider as ProviderName;
  const mode = value.mode;
  const usedFallback = value.usedFallback;
  const fallbackReason = optionalBoundedString(value.fallbackReason, 80);
  const generatedAt = normalizedDate(value.generatedAt);
  const sourceFingerprint = boundedString(value.sourceFingerprint, 80);
  const recommendation = value.recommendation as DecisionRecommendation;
  const evidenceStrength = value.evidenceStrength as EvidenceStrength;
  const headline = boundedString(value.headline, MAX_SHORT_TEXT_CHARS);
  const unresolvedRisks = boundedList(value.unresolvedRisks, { min: 1 });
  const nextActions = boundedList(value.nextActions, { min: 1 });
  const availableEvidenceIds = new Set(source.evidence.map((item) => item.id));
  const evidenceById = new Map(source.evidence.map((item) => [item.id, item]));
  const claims =
    Array.isArray(value.claims) &&
    value.claims.length >= 1 &&
    value.claims.length <= MAX_CLAIMS
      ? value.claims.map((claim) => {
          if (!isRecord(claim) || !Array.isArray(claim.evidenceIds)) {
            return null;
          }

          const text = boundedString(claim.text, MAX_TEXT_CHARS);
          const stance = claim.stance as ClaimStance;
          const evidenceIds = claim.evidenceIds.map((item) =>
            boundedString(item, MAX_ID_CHARS),
          );

          if (
            !text ||
            !CLAIM_STANCES.has(stance) ||
            evidenceIds.length < 1 ||
            evidenceIds.length > MAX_LIST_ITEMS ||
            evidenceIds.some(
              (item) => !item || !availableEvidenceIds.has(item),
            )
          ) {
            return null;
          }

          const normalizedIds = evidenceIds as string[];
          const citedSignals = normalizedIds.map(
            (id) => evidenceById.get(id)?.signal,
          );

          if (
            (citedSignals.every((signal) => signal === "supports") &&
              stance !== "supports") ||
            (citedSignals.every((signal) => signal === "challenges") &&
              stance !== "challenges") ||
            (citedSignals.every((signal) => signal === "neutral") &&
              stance !== "context")
          ) {
            return null;
          }

          if (new Set(normalizedIds).size !== normalizedIds.length) {
            return null;
          }

          return { text, stance, evidenceIds: normalizedIds };
        })
      : null;

  if (
    schemaVersion !== 1 ||
    !["mock", "openai", "minimax"].includes(provider) ||
    value.promptVersion !== DECISION_PROMPT_VERSION ||
    !["demo", "real"].includes(mode as string) ||
    typeof usedFallback !== "boolean" ||
    fallbackReason === null ||
    (usedFallback &&
      (!fallbackReason || !FALLBACK_REASONS.has(fallbackReason))) ||
    (!usedFallback && Boolean(fallbackReason)) ||
    !generatedAt ||
    sourceFingerprint !== decisionSourceFingerprint(source) ||
    !RECOMMENDATIONS.has(recommendation) ||
    !EVIDENCE_STRENGTHS.has(evidenceStrength) ||
    !headline ||
    !claims ||
    claims.some((claim) => claim === null) ||
    !unresolvedRisks ||
    !nextActions
  ) {
    return null;
  }

  return {
    schemaVersion: 1,
    provider,
    promptVersion: DECISION_PROMPT_VERSION,
    mode: mode as "demo" | "real",
    usedFallback,
    ...(fallbackReason ? { fallbackReason } : {}),
    generatedAt,
    sourceFingerprint,
    recommendation,
    evidenceStrength,
    headline,
    claims: claims as GroundedClaim[],
    unresolvedRisks,
    nextActions,
  };
  } catch {
    return null;
  }
}

export function recommendationFor(source: DecisionSource): DecisionRecommendation {
  let supportingWeight = 0;
  let challengingWeight = 0;

  for (const item of source.evidence) {
    const w = EVIDENCE_WEIGHT_VALUES[item.weight] ?? 2;
    if (item.signal === "supports") {
      supportingWeight += w;
    } else if (item.signal === "challenges") {
      challengingWeight += w;
    }
  }

  if (challengingWeight > supportingWeight) {
    return "pivot";
  }

  // "Proceed" needs at least moderate-weight supporting evidence with no challenges
  if (supportingWeight >= 3 && challengingWeight === 0) {
    return "proceed";
  }

  if (supportingWeight === 0 && challengingWeight === 0) {
    return "pause";
  }

  return "iterate";
}

export function evidenceStrengthFor(source: DecisionSource): EvidenceStrength {
  let supportingWeight = 0;
  let challengingWeight = 0;

  for (const item of source.evidence) {
    const w = EVIDENCE_WEIGHT_VALUES[item.weight] ?? 2;
    if (item.signal === "supports") {
      supportingWeight += w;
    } else if (item.signal === "challenges") {
      challengingWeight += w;
    }
  }

  const directionalWeight = supportingWeight + challengingWeight;

  if (directionalWeight === 0) {
    return "insufficient";
  }

  if (supportingWeight > 0 && challengingWeight > 0) {
    return "mixed";
  }

  if (directionalWeight >= 6) {
    return "strong";
  }

  return "directional";
}

function headlineFor(
  recommendation: DecisionRecommendation,
  assumption: string,
) {
  const prefix = {
    proceed: "Proceed with the current direction",
    iterate: "Iterate before increasing commitment",
    pivot: "Pivot the current approach",
    pause: "Pause the decision and collect stronger evidence",
  }[recommendation];

  return `${prefix}: ${assumption}`.slice(0, MAX_SHORT_TEXT_CHARS);
}

export function buildMockDecisionBrief(
  source: DecisionSource,
  generatedAt = new Date().toISOString(),
  metadata: {
    usedFallback?: boolean;
    fallbackReason?: string;
  } = {},
): DecisionBrief {
  const recommendation = recommendationFor(source);
  const evidenceStrength = evidenceStrengthFor(source);
  const risks = [
    ...(source.evidence.length < 3
      ? ["The evidence base is still small, so confidence should remain provisional."]
      : []),
    ...(source.evidence.every((item) => item.signal !== "challenges")
      ? ["No direct contradicting evidence has been recorded yet."]
      : []),
  ].slice(0, MAX_LIST_ITEMS);

  return {
    schemaVersion: 1,
    provider: "mock",
    promptVersion: DECISION_PROMPT_VERSION,
    mode: "demo",
    usedFallback: Boolean(metadata.usedFallback),
    ...(metadata.fallbackReason
      ? { fallbackReason: metadata.fallbackReason }
      : {}),
    generatedAt,
    sourceFingerprint: decisionSourceFingerprint(source),
    recommendation,
    evidenceStrength,
    headline: headlineFor(recommendation, source.assumption),
    claims: source.evidence.map((item) => ({
      text: `${item.source}: ${item.note}`,
      stance:
        item.signal === "neutral"
          ? "context"
          : item.signal,
      evidenceIds: [item.id],
    })),
    unresolvedRisks:
      risks.length > 0
        ? risks
        : ["Evidence is directionally useful but should be checked against a new segment or channel."],
    nextActions: [
      "Collect one more piece of evidence that could disprove the assumption.",
      "Compare the AI recommendation with the founder's recorded decision before acting.",
    ].slice(0, MAX_LIST_ITEMS),
  };
}

export function decisionBriefIsCurrent(experiment: ValidationExperiment) {
  return Boolean(
    experiment.decisionBrief &&
      experiment.decisionBrief.sourceFingerprint ===
        decisionSourceFingerprint(decisionSourceFromExperiment(experiment)),
  );
}
