import type { LaunchLensWorkspace, LaunchTask } from "./types";
import {
  decisionSourceFromExperiment,
  normalizeDecisionBrief,
  type DecisionBrief,
} from "./decision";

export type EvidenceSignal = "supports" | "challenges" | "neutral";
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
  observedAt: string;
};

export type ValidationExperiment = {
  id: string;
  assumption: string;
  status: ExperimentStatus;
  confidence: ConfidenceLevel;
  decision: string;
  nextAction: string;
  linkedTaskId: string;
  evidence: ValidationEvidence[];
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
    decision: "",
    nextAction: "",
    linkedTaskId: tasks[index] ? taskIdentity(tasks[index], index) : "",
    evidence: [],
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
    signal,
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

  const experiment = {
    id: id || fallback.id,
    assumption,
    status,
    confidence,
    decision,
    nextAction,
    linkedTaskId: taskIds.has(linkedTaskId) ? linkedTaskId : "",
    evidence: evidence as ValidationEvidence[],
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

  const normalized = {
    experiments: normalizedExperiments,
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

export function evaluateExecutionProgress(
  execution: WorkspaceExecutionState,
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
  const completedCheckpoints = execution.experiments.reduce(
    (sum, experiment) =>
      sum +
      Number(experiment.status !== "untested") +
      Number(
        experiment.evidence.some((item) => item.signal !== "neutral"),
      ) +
      Number(
        ["supported", "refuted"].includes(experiment.status) &&
          experiment.decision.trim().length > 0,
      ),
    0,
  );

  return {
    score:
      total === 0
        ? 0
        : Math.round((completedCheckpoints / (total * 3)) * 100),
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
    const decision = boundedString(item.decision, MAX_TEXT_CHARS);
    const nextAction = boundedString(item.nextAction, MAX_TEXT_CHARS);
    const linkedTaskId = boundedString(item.linkedTaskId, MAX_ID_CHARS);
    const evidenceCount = item.evidenceCount;

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
      decision,
      nextAction,
      linkedTaskId,
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
