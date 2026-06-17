import type { LaunchLensWorkspace, LaunchTask } from "./types";
import {
  decisionSourceFromExperiment,
  normalizeDecisionBrief,
  type DecisionBrief,
} from "./decision";

export type EvidenceSignal = "supports" | "challenges" | "neutral";
export type EvidenceWeight = "anecdotal" | "moderate" | "strong";
export type ExperimentStatus =
  | "untested"
  | "testing"
  | "supported"
  | "refuted";
export type ConfidenceLevel = "low" | "medium" | "high";

export type ValidationEvidence = {
  id: string;
  note: string;
  source: string;
  signal: EvidenceSignal;
  weight: EvidenceWeight;
  observedAt: string;
  pinned?: boolean;
};

export type ValidationExperiment = {
  id: string;
  assumption: string;
  status: ExperimentStatus;
  confidence: ConfidenceLevel;
  confidenceManual: boolean;
  decision: string;
  nextAction: string;
  linkedTaskId: string;
  evidence: ValidationEvidence[];
  archived?: boolean;
  tags: string[];
  decisionBrief?: DecisionBrief;
};

export type WorkspaceExecutionState = {
  experiments: ValidationExperiment[];
  updatedAt: string;
};

export type ExecutionProgress = {
  score: number;
  total: number;
  withEvidence: number;
  decided: number;
  evidenceCount: number;
};

export type ExecutionProgressWeights = {
  /** Weight for starting testing (status != untested) */
  started: number;
  /** Weight for having at least one non-neutral evidence item */
  evidenceWithSignal: number;
  /** Weight for reaching a final status with a decision */
  decided: number;
};

/** Default weights 闂?all three checkpoints are equally weighted. */
export const DEFAULT_PROGRESS_WEIGHTS: ExecutionProgressWeights = {
  started: 1,
  evidenceWithSignal: 1,
  decided: 1,
};

/** Preset: "bias-toward-evidence" 闂?evidence gathering counts more. */
export const EVIDENCE_BIASED_WEIGHTS: ExecutionProgressWeights = {
  started: 1,
  evidenceWithSignal: 2,
  decided: 1,
};

/** Preset: "bias-toward-decisions" 闂?reaching conclusions counts more. */
export const DECISION_BIASED_WEIGHTS: ExecutionProgressWeights = {
  started: 1,
  evidenceWithSignal: 1,
  decided: 2,
};

export type SharedValidationExperiment = Omit<
  ValidationExperiment,
  "evidence" | "decisionBrief"
> & {
  evidenceCount: number;
};

export type SharedExecutionState = {
  experiments: SharedValidationExperiment[];
  updatedAt: string;
};

const EXPERIMENT_STATUSES = new Set<ExperimentStatus>([
  "untested",
  "testing",
  "supported",
  "refuted",
]);
const CONFIDENCE_LEVELS = new Set<ConfidenceLevel>(["low", "medium", "high"]);
const EVIDENCE_SIGNALS = new Set<EvidenceSignal>([
  "supports",
  "challenges",
  "neutral",
]);
const EVIDENCE_WEIGHTS = new Set<EvidenceWeight>(["anecdotal", "moderate", "strong"]);
const MAX_EXPERIMENTS = 24;
const MAX_EVIDENCE_PER_EXPERIMENT = 8;
const MAX_EXECUTION_STATE_CHARS = 80_000;
const MAX_ID_CHARS = 80;
const MAX_SHORT_TEXT_CHARS = 160;
const MAX_TEXT_CHARS = 800;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, maxChars: number) {
  return typeof value === "string" && value.length <= maxChars ? value : null;
}

function normalizedDate(value: unknown) {
  if (typeof value !== "string" || value.length > 40) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function defaultExperiment(
  assumption: string,
  index: number,
  tasks: LaunchTask[],
): ValidationExperiment {
  return {
    id: assumptionIdentity(assumption, index),
    assumption,
    status: "untested",
    confidence: "low",
    confidenceManual: false,
    decision: "",
    nextAction: "",
    linkedTaskId: tasks[index] ? taskIdentity(tasks[index], index) : "",
    evidence: [],
    tags: [],
  };
}

function stableHash(value: string) {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(36);
}

export function assumptionIdentity(assumption: string, occurrence: number) {
  return `assumption-${stableHash(`${assumption}\u0000${occurrence}`)}`;
}

export function taskIdentity(_task: LaunchTask, occurrence: number) {
  return `task-${occurrence + 1}`;
}

export function createExecutionState(
  workspace: LaunchLensWorkspace,
): WorkspaceExecutionState {
  return {
    experiments: workspace.assumptions.map((assumption, index) =>
      defaultExperiment(assumption, index, workspace.tasks),
    ),
    updatedAt: workspace.generatedAt,
  };
}

function normalizeEvidence(value: unknown): ValidationEvidence | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = boundedString(value.id, MAX_ID_CHARS);
  const note = boundedString(value.note, MAX_TEXT_CHARS);
  const source = boundedString(value.source, MAX_SHORT_TEXT_CHARS);
  const observedAt = normalizedDate(value.observedAt);
  const signal = value.signal as EvidenceSignal;
  const weight = (typeof value.weight === "string" && EVIDENCE_WEIGHTS.has(value.weight as EvidenceWeight)) ? value.weight as EvidenceWeight : "moderate";
  const pinned = value.pinned === true;

  if (
    id === null ||
    note === null ||
    source === null ||
    !observedAt ||
    !EVIDENCE_SIGNALS.has(signal)
  ) {
    return null;
  }

  return {
    id,
    note,
    source,
    observedAt,
    pinned,
    signal,
    weight,
  };
}

function normalizeExperiment(
  value: unknown,
  assumption: string,
  fallback: ValidationExperiment,
  taskIds: Set<string>,
): ValidationExperiment | null {
  if (!isRecord(value) || !Array.isArray(value.evidence)) {
    return null;
  }

  if (value.evidence.length > MAX_EVIDENCE_PER_EXPERIMENT) {
    return null;
  }

  const id = boundedString(value.id, MAX_ID_CHARS);
  const status = value.status as ExperimentStatus;
  const confidence = value.confidence as ConfidenceLevel;
  const decision = boundedString(value.decision, MAX_TEXT_CHARS);
  const nextAction = boundedString(value.nextAction, MAX_TEXT_CHARS);
  const linkedTaskId = boundedString(value.linkedTaskId, MAX_ID_CHARS);
  const evidence = value.evidence.map(normalizeEvidence);

  const archived = value.archived === true;
  if (
    id === null ||
    !EXPERIMENT_STATUSES.has(status) ||
    !CONFIDENCE_LEVELS.has(confidence) ||
    decision === null ||
    nextAction === null ||
    linkedTaskId === null ||
    evidence.some((item) => item === null)
  ) {
    return null;
  }

  const rawTags = Array.isArray(value.tags)
    ? value.tags
        .map((t: unknown) => boundedString(t, 32))
        .filter((t: string | null): t is string => t !== null && t.trim().length > 0)
        .map((t: string) => t.trim())
        .slice(0, 8)
    : [];
  const experiment = {
    id: id || fallback.id,
    assumption,
    status,
    confidence,
    confidenceManual: value.confidenceManual === true,
    decision,
    nextAction,
    linkedTaskId: taskIds.has(linkedTaskId) ? linkedTaskId : "",
    evidence: evidence as ValidationEvidence[],
    tags: Array.from(new Set(rawTags)),
    archived,
  };
  const decisionBrief = normalizeDecisionBrief(
    value.decisionBrief,
    decisionSourceFromExperiment(experiment),
  );

  return {
    ...experiment,
    ...(decisionBrief ? { decisionBrief } : {}),
  };
}

export function normalizeExecutionState(
  value: unknown,
  workspace: LaunchLensWorkspace,
): WorkspaceExecutionState | null {
  if (value === undefined || value === null) {
    return createExecutionState(workspace);
  }

  if (!isRecord(value) || !Array.isArray(value.experiments)) {
    return null;
  }

  if (value.experiments.length > MAX_EXPERIMENTS) {
    return null;
  }

  const updatedAt = normalizedDate(value.updatedAt);

  if (!updatedAt) {
    return null;
  }

  if (value.experiments.length === 0) {
    return createExecutionState(workspace);
  }

  if (value.experiments.length !== workspace.assumptions.length) {
    return null;
  }

  const taskIds = new Set(
    workspace.tasks.map((task, index) => taskIdentity(task, index)),
  );
  const remaining = [...value.experiments];
  const experiments = workspace.assumptions.map((assumption, index) => {
    const fallback = defaultExperiment(assumption, index, workspace.tasks);
    const matchIndex = remaining.findIndex(
      (item) => isRecord(item) && item.assumption === assumption,
    );
    const exactMatch =
      matchIndex >= 0 ? remaining.splice(matchIndex, 1)[0] : null;

    return normalizeExperiment(
      exactMatch,
      assumption,
      fallback,
      taskIds,
    );
  });

  const normalizedExperiments = experiments as ValidationExperiment[];
  const experimentIds = normalizedExperiments.map((item) => item?.id);
  const evidenceIds = normalizedExperiments.flatMap(
    (item) => item?.evidence.map((evidence) => evidence.id) ?? [],
  );

  if (
    experiments.some((experiment) => experiment === null) ||
    new Set(experimentIds).size !== experimentIds.length ||
    new Set(evidenceIds).size !== evidenceIds.length
  ) {
    return null;
  }


  // v0 -> v1 migration: add default weight to evidence items, default tags
  const migratedExperiments = normalizedExperiments.map((experiment) => ({
    ...experiment,
    evidence: experiment.evidence.map((ev) => ({
      ...ev,
      weight: "moderate" as EvidenceWeight,
    })),
    tags: Array.isArray(experiment.tags) ? experiment.tags : [],
  }));
  const normalized = {
    experiments: migratedExperiments,
    updatedAt,
  };

  return JSON.stringify(normalized).length <= MAX_EXECUTION_STATE_CHARS
    ? normalized
    : null;
}

export function reconcileExecutionState(
  current: WorkspaceExecutionState,
  workspace: LaunchLensWorkspace,
): WorkspaceExecutionState {
  const taskIds = new Set(
    workspace.tasks.map((task, index) => taskIdentity(task, index)),
  );
  const remaining = [...current.experiments];
  const experiments = workspace.assumptions.map((assumption, index) => {
    const matchIndex = remaining.findIndex(
      (item) => item.assumption === assumption,
    );
    const existing =
      matchIndex >= 0 ? remaining.splice(matchIndex, 1)[0] : undefined;

    if (!existing) {
      return defaultExperiment(assumption, index, workspace.tasks);
    }

    return {
      ...existing,
      assumption,
      linkedTaskId: taskIds.has(existing.linkedTaskId)
        ? existing.linkedTaskId
        : workspace.tasks[index]
          ? taskIdentity(workspace.tasks[index], index)
          : "",
    };
  });

  return {
    experiments,
    updatedAt: new Date().toISOString(),
  };
}

const EVIDENCE_WEIGHT_VALUES: Record<EvidenceWeight, number> = {
  anecdotal: 1,
  moderate: 2,
  strong: 4,
};

/**
 * Compute an experiment's confidence level from its evidence.
 *
 * Algorithm:
 * - Total weighted score = sum of weight values (supports = +, challenges = -, neutral = +0.5闂?
 * - Consensus = abs(total) / totalWeight 闂?how aligned the evidence is
 * - Confidence threshold: low < 3 weight 闂?medium < 7 weight 闂?high
 * - Mixed signals (consensus < 0.4) pull confidence down one tier
 */
export function computeExperimentConfidence(
  evidence: { signal: EvidenceSignal; weight: EvidenceWeight }[],
): ConfidenceLevel {
  if (evidence.length === 0) {
    return "low";
  }

  let totalWeight = 0;
  let directionalWeight = 0;
  let supportsWeight = 0;
  let challengesWeight = 0;

  for (const item of evidence) {
    const w = EVIDENCE_WEIGHT_VALUES[item.weight] ?? 2;
    totalWeight += w;
    if (item.signal === "supports") {
      supportsWeight += w;
      directionalWeight += w;
    } else if (item.signal === "challenges") {
      challengesWeight += w;
      directionalWeight += w;
    }
    // neutral: adds to total but not to directional or consensus
  }

  if (totalWeight === 0) {
    return "low";
  }

  // Consensus: how aligned the directional evidence is.
  // 1 = all same direction, 0 = perfectly balanced.
  // If no directional evidence, consensus is 0.5 (neutral = mild uncertainty).
  const consensus = directionalWeight > 0
    ? Math.abs(supportsWeight - challengesWeight) / directionalWeight
    : 0.5;

  // Base tier from total evidence weight
  let base: ConfidenceLevel = "low";
  if (totalWeight >= 7) {
    base = "high";
  } else if (totalWeight >= 3) {
    base = "medium";
  }

  // Pull down one tier if evidence is highly mixed
  if (consensus < 0.4 && base !== "low") {
    return base === "high" ? "medium" : "low";
  }

  return base;
}

export function evaluateExecutionProgress(
  execution: WorkspaceExecutionState,
  weights: ExecutionProgressWeights = DEFAULT_PROGRESS_WEIGHTS,
): ExecutionProgress {
  const total = execution.experiments.length;
  const withEvidence = execution.experiments.filter(
    (experiment) => experiment.evidence.length > 0,
  ).length;
  const decided = execution.experiments.filter(
    (experiment) =>
      ["supported", "refuted"].includes(experiment.status) &&
      experiment.decision.trim().length > 0,
  ).length;
  const evidenceCount = execution.experiments.reduce(
    (sum, experiment) => sum + experiment.evidence.length,
    0,
  );
  const maxWeightPerExperiment =
    weights.started + weights.evidenceWithSignal + weights.decided;
  const completedWeight = execution.experiments.reduce((sum, experiment) => {
    let weight = 0;
    if (experiment.status !== "untested") weight += weights.started;
    if (experiment.evidence.some((item) => item.signal !== "neutral"))
      weight += weights.evidenceWithSignal;
    if (
      ["supported", "refuted"].includes(experiment.status) &&
      experiment.decision.trim().length > 0
    )
      weight += weights.decided;
    return sum + weight;
  }, 0);

  return {
    score:
      total === 0
        ? 0
        : Math.round((completedWeight / (total * maxWeightPerExperiment)) * 100),
    total,
    withEvidence,
    decided,
    evidenceCount,
  };
}

export function summarizeExecutionState(
  execution: WorkspaceExecutionState,
): SharedExecutionState {
  return {
    experiments: execution.experiments.map((experiment) => ({
      id: experiment.id,
      assumption: experiment.assumption,
      status: experiment.status,
      confidence: experiment.confidence,
      decision: experiment.decision,
      nextAction: experiment.nextAction,
      linkedTaskId: experiment.linkedTaskId,
      confidenceManual: experiment.confidenceManual,
      tags: experiment.tags,
      evidenceCount: experiment.evidence.length,
    })),
    updatedAt: execution.updatedAt,
  };
}

export function normalizeSharedExecutionState(
  value: unknown,
  workspace: LaunchLensWorkspace,
): SharedExecutionState | null {
  if (!isRecord(value) || !Array.isArray(value.experiments)) {
    return null;
  }

  const updatedAt = normalizedDate(value.updatedAt);

  if (
    !updatedAt
  ) {
    return null;
  }

  if (value.experiments.length === 0) {
    return summarizeExecutionState(createExecutionState(workspace));
  }

  if (value.experiments.length !== workspace.assumptions.length) {
    return null;
  }

  const taskIds = new Set(
    workspace.tasks.map((task, index) => taskIdentity(task, index)),
  );
  const remaining = [...value.experiments];
  const experiments = workspace.assumptions.map((assumption) => {
    const matchIndex = remaining.findIndex(
      (item) => isRecord(item) && item.assumption === assumption,
    );
    const item = matchIndex >= 0 ? remaining.splice(matchIndex, 1)[0] : null;

    if (!isRecord(item)) {
      return null;
    }

    const id = boundedString(item.id, MAX_ID_CHARS);
    const status = item.status as ExperimentStatus;
    const confidence = item.confidence as ConfidenceLevel;
    const confidenceManual = item.confidenceManual === true;
    const decision = boundedString(item.decision, MAX_TEXT_CHARS);
    const nextAction = boundedString(item.nextAction, MAX_TEXT_CHARS);
    const linkedTaskId = boundedString(item.linkedTaskId, MAX_ID_CHARS);
    const evidenceCount = item.evidenceCount;
    const sharedTags = Array.isArray(item.tags) ? item.tags.map((t: unknown) => boundedString(t, 32)).filter((t: unknown): t is string => typeof t === "string" && t.length > 0).slice(0, 8) : [];
    const sharedArchived = item.archived === true;

    if (
      id === null ||
      !EXPERIMENT_STATUSES.has(status) ||
      !CONFIDENCE_LEVELS.has(confidence) ||
      decision === null ||
      nextAction === null ||
      linkedTaskId === null ||
      (linkedTaskId && !taskIds.has(linkedTaskId)) ||
      !Number.isInteger(evidenceCount) ||
      Number(evidenceCount) < 0 ||
      Number(evidenceCount) > MAX_EVIDENCE_PER_EXPERIMENT
    ) {
      return null;
    }

    return {
      id,
      assumption,
      status,
      confidence,
      confidenceManual,
      decision,
      nextAction,
      linkedTaskId,
      tags: sharedTags,
      ...(sharedArchived ? { archived: true } : {}),
      evidenceCount: Number(evidenceCount),
    };
  });

  if (experiments.some((experiment) => experiment === null)) {
    return null;
  }

  return {
    experiments: experiments as SharedValidationExperiment[],
    updatedAt,
  };
}
