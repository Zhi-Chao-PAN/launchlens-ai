"use client";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  ChevronUp,
  CircleGauge,
  FlaskConical,
  Link2,
  PencilLine,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useSrAnnounce } from "@/hooks/use-sr-announce";
import { useToast } from "@/components/toast";

import {
  DEFAULT_PROGRESS_WEIGHTS,
  DECISION_BIASED_WEIGHTS,
  EVIDENCE_BIASED_WEIGHTS,
  evaluateExecutionProgress,
  taskIdentity,
  type EvidenceSignal,
  type ExecutionProgressWeights,
  type ValidationEvidence,
  type ValidationExperiment,
  assumptionIdentity,
  type WorkspaceExecutionState,
} from "@/lib/launchlens/execution";
import type { LaunchTask } from "@/lib/launchlens/types";

type ValidationBoardProps = {
  execution: WorkspaceExecutionState;
  tasks: LaunchTask[];
  onChange: (execution: WorkspaceExecutionState) => void;
};

type EvidenceDraft = {
  note: string;
  source: string;
  signal: EvidenceSignal;
};

const emptyDraft: EvidenceDraft = {
  note: "",
  source: "",
  signal: "supports",
};

const statusLabels = {
  untested: "Untested",
  testing: "Testing",
  supported: "Supported",
  refuted: "Refuted",
} as const;

const signalLabels = {
  supports: "Supports",
  challenges: "Challenges",
  neutral: "Neutral",
} as const;

function statusClass(status: ValidationExperiment["status"]) {
  if (status === "supported") {
    return "bg-signal-supports text-signal-supports";
  }

  if (status === "refuted") {
    return "bg-signal-challenges text-signal-challenges";
  }

  if (status === "testing") {
    return "bg-signal-neutral text-signal-neutral";
  }

  return "bg-muted text-muted";
}

function evidenceId() {
  return crypto.randomUUID();
}

export function ValidationBoard({
  execution,
  tasks,
  onChange,
}: ValidationBoardProps) {
  const [activeExperimentId, setActiveExperimentId] = useState("");
  const [requestedExpandedExperimentId, setRequestedExpandedExperimentId] =
    useState<string | null>();
  const [draft, setDraft] = useState<EvidenceDraft>(emptyDraft);
  const [draftTouched, setDraftTouched] = useState<{source: boolean; note: boolean}>({ source: false, note: false });
  const [draftSubmitError, setDraftSubmitError] = useState<string>("");
  const { announce: srAnnounce, message: srEvidenceAnnouncement } = useSrAnnounce();
  const { showToast } = useToast();
  const evidenceListRef = useRef<HTMLUListElement | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ experimentId: string; evidence: ValidationEvidence; index: number } | null>(null);
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const sourceError = draftTouched.source && draft.source.trim().length < 2 ? "Source needs at least 2 characters." : "";
  const noteError = draftTouched.note && draft.note.trim().length < 8 ? "Observation needs at least 8 characters." : "";
  const [weightPreset, setWeightPreset] = useState<"default" | "evidence" | "decision">("default");
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "decided">("all");
  const [isAddingExperiment, setIsAddingExperiment] = useState(false);
  const [newExperimentDraft, setNewExperimentDraft] = useState("");

  const currentWeights: ExecutionProgressWeights = useMemo(() => {
    if (weightPreset === "evidence") return EVIDENCE_BIASED_WEIGHTS;
    if (weightPreset === "decision") return DECISION_BIASED_WEIGHTS;
    return DEFAULT_PROGRESS_WEIGHTS;
  }, [weightPreset]);

  const progress = useMemo(
    () => evaluateExecutionProgress(execution, currentWeights),
    [execution, currentWeights],
  );

  const filteredExperiments = useMemo(() => {
    if (statusFilter === "all") return execution.experiments;
    if (statusFilter === "active") {
      return execution.experiments.filter(
        (exp) => exp.status === "untested" || exp.status === "testing",
      );
    }
    return execution.experiments.filter(
      (exp) => exp.status === "supported" || exp.status === "refuted",
    );
  }, [execution.experiments, statusFilter]);

  const expandedExperimentId =
    requestedExpandedExperimentId === null
      ? ""
      : requestedExpandedExperimentId &&
          execution.experiments.some(
            (experiment) => experiment.id === requestedExpandedExperimentId,
          )
        ? requestedExpandedExperimentId
        : (execution.experiments[0]?.id ?? "");

  function updateExperiment(
    experimentId: string,
    update: (experiment: ValidationExperiment) => ValidationExperiment,
  ) {
    onChange({
      experiments: execution.experiments.map((experiment) =>
        experiment.id === experimentId
          ? { ...update(experiment), decisionBrief: undefined }
          : experiment,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function openEvidenceForm(experimentId: string) {
    setRequestedExpandedExperimentId(experimentId);
    setActiveExperimentId((current) =>
      current === experimentId ? "" : experimentId,
    );
    setDraft(emptyDraft);
    setEditingEvidenceId(null);
  }

  function startEditingEvidence(experimentId: string, evidenceId: string) {
    const experiment = execution.experiments.find((e) => e.id === experimentId);
    const evidence = experiment?.evidence.find((e) => e.id === evidenceId);
    if (!evidence) return;

    setRequestedExpandedExperimentId(experimentId);
    setActiveExperimentId(experimentId);
    setDraft({ signal: evidence.signal ?? "supports", source: evidence.source, note: evidence.note });
    setEditingEvidenceId(evidenceId);
    setDraftTouched({ source: false, note: false });
  }

  function moveEvidence(
    experimentId: string,
    evidenceId: string,
    direction: "up" | "down",
  ) {
    updateExperiment(experimentId, (experiment) => {
      const idx = experiment.evidence.findIndex((e) => e.id === evidenceId);
      if (idx === -1) return experiment;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= experiment.evidence.length) {
        return experiment;
      }
      const next = [...experiment.evidence];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return { ...experiment, evidence: next };
    });
    const experiment = execution.experiments.find((e) => e.id === experimentId);
    const evidence = experiment?.evidence.find((e) => e.id === evidenceId);
    if (evidence) {
      srAnnounce("Evidence moved " + direction + ": " + evidence.source + ".");
    }
  }

  function deleteEvidence(experimentId: string, evidenceId: string) {
    const experiment = execution.experiments.find((e) => e.id === experimentId);
    if (!experiment) return;
    const idx = experiment.evidence.findIndex((e) => e.id === evidenceId);
    if (idx === -1) return;
    const evidence = experiment.evidence[idx];
    setRecentlyDeleted({ experimentId, evidence, index: idx });
    const allDeleteButtons = Array.from(
      evidenceListRef.current?.querySelectorAll("button[data-delete-confirm]") || [],
    );
    const deleteBtn = evidenceListRef.current?.querySelector(
      "[data-evidence-id=" + evidenceId + "] [data-delete-confirm]",
    );
    const currentIndex = deleteBtn ? allDeleteButtons.indexOf(deleteBtn) : -1;
    const nextFocusTarget =
      allDeleteButtons[currentIndex + 1] ||
      allDeleteButtons[currentIndex - 1] ||
      evidenceListRef.current;
    updateExperiment(experimentId, (exp) => ({
      ...exp,
      evidence: exp.evidence.filter((e) => e.id !== evidenceId),
    }));
    srAnnounce("Evidence from " + evidence.source + " removed. Press Ctrl+Z to undo.");
    showToast("Evidence removed", "info", 5000, {
      label: "Undo",
      onClick: () => undoDeleteEvidence(),
    });
    setPendingDeleteId(null);
    requestAnimationFrame(() => {
      if (nextFocusTarget instanceof HTMLElement) {
        nextFocusTarget.focus();
      }
    });
  }

  function undoDeleteEvidence() {
    if (!recentlyDeleted) return;
    const { experimentId, evidence, index } = recentlyDeleted;
    updateExperiment(experimentId, (exp) => {
      const next = [...exp.evidence];
      next.splice(index, 0, evidence);
      return { ...exp, evidence: next };
    });
    srAnnounce("Evidence from " + evidence.source + " restored.");
    setRecentlyDeleted(null);
  }

  function handleEvidenceKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    const target = e.currentTarget;
    const experimentId = target.getAttribute("data-experiment-id") || "";
    const items = Array.from(target.querySelectorAll("[data-evidence-id]"));
    if (items.length === 0) return;

    const active = document.activeElement;
    let currentIdx = -1;
    let currentEvidenceId: string | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].contains(active)) {
        currentIdx = i;
        currentEvidenceId = items[i].getAttribute("data-evidence-id");
        break;
      }
    }

    if (e.altKey && e.key === "ArrowUp" && currentIdx > 0 && currentEvidenceId) {
      // Move evidence up and keep focus on it
      e.preventDefault();
      moveEvidence(experimentId, currentEvidenceId, "up");
      // After re-render, focus the same evidence in its new position
      requestAnimationFrame(() => {
        const moved = target.querySelector(`[data-evidence-id="\${currentEvidenceId}"]`);
        if (moved) {
          const focusable = (moved as HTMLElement).querySelector("button");
          focusable?.focus();
        }
      });
    } else if (e.altKey && e.key === "ArrowDown" && currentIdx < items.length - 1 && currentEvidenceId) {
      // Move evidence down and keep focus on it
      e.preventDefault();
      moveEvidence(experimentId, currentEvidenceId, "down");
      requestAnimationFrame(() => {
        const moved = target.querySelector(`[data-evidence-id="\${currentEvidenceId}"]`);
        if (moved) {
          const focusable = (moved as HTMLElement).querySelector("button");
          focusable?.focus();
        }
      });
    } else if (e.key === "ArrowUp" && currentIdx > 0 && !e.altKey) {
      e.preventDefault();
      const prev = items[currentIdx - 1] as HTMLElement;
      const focusable = prev.querySelector("button");
      focusable?.focus();
    } else if (e.key === "ArrowDown" && currentIdx < items.length - 1 && !e.altKey) {
      e.preventDefault();
      const next = items[currentIdx + 1] as HTMLElement;
      const focusable = next.querySelector("button");
      focusable?.focus();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      if (recentlyDeleted) {
        e.preventDefault();
        undoDeleteEvidence();
      }
    }
  }



  function handleExperimentKeyDown(
    e: React.KeyboardEvent<HTMLElement>,
    experimentId: string,
  ) {
    const experiment = execution.experiments.find((ex) => ex.id === experimentId);
    if (!experiment) return;

    // Enter to toggle expand
    if (e.key === "Enter" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setRequestedExpandedExperimentId((current) =>
        current === experimentId ? null : experimentId,
      );
      return;
    }

    // Number keys to change status (1=untested, 2=testing, 3=supported, 4=refuted)
    const statusOrder: Array<keyof typeof statusLabels> = [
      "untested",
      "testing",
      "supported",
      "refuted",
    ];
    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= statusOrder.length) {
      const newStatus = statusOrder[num - 1];
      if (experiment.status !== newStatus) {
        e.preventDefault();
        updateExperiment(experimentId, (current) => ({
          ...current,
          status: newStatus,
        }));
      }
    }

    // ArrowUp/Down to move focus between experiments
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const articles = Array.from(
        document.querySelectorAll("[data-experiment-article]"),
      );
      const currentIdx = articles.findIndex((el) => el === e.currentTarget);
      if (currentIdx === -1) return;

      let nextIdx = currentIdx;
      if (e.key === "ArrowUp" && currentIdx > 0) {
        nextIdx = currentIdx - 1;
      } else if (
        e.key === "ArrowDown" &&
        currentIdx < articles.length - 1
      ) {
        nextIdx = currentIdx + 1;
      }

      if (nextIdx !== currentIdx) {
        e.preventDefault();
        (articles[nextIdx] as HTMLElement).focus();
      }
    }
  }

  function addEvidence(
    event: React.FormEvent<HTMLFormElement>,
    experimentId: string,
  ) {
    event.preventDefault();
    const note = draft.note.trim();
    const source = draft.source.trim();

    setDraftTouched({ source: true, note: true });
    if (source.length < 2 || note.length < 8) {
      setDraftSubmitError("Please fill in the source and observation before recording evidence.");
      srAnnounce("Evidence not recorded. Please fill in the source and observation.");
      return;
    }
    setDraftSubmitError("");

    updateExperiment(experimentId, (experiment) => ({
      ...experiment,
      status: experiment.status === "untested" ? "testing" : experiment.status,
      evidence: [
        ...experiment.evidence,
        {
          id: evidenceId(),
          note,
          source,
          signal: draft.signal,
          observedAt: new Date().toISOString(),
        },
      ],
    }));
    setDraft(emptyDraft);
    setDraftTouched({ source: false, note: false });
    setDraftSubmitError("");
    const updatedExperiment = execution.experiments.find((e) => e.id === experimentId);
    const count = updatedExperiment ? updatedExperiment.evidence.length + 1 : 1;
    srAnnounce(
      `Evidence recorded: ${source}. ${count} items total.`,
    );
    setActiveExperimentId("");
    // Move focus to the evidence list region for keyboard / screen-reader users
    if (evidenceListRef.current) {
      evidenceListRef.current.focus();
    }
  }

  return (
    <section className="rounded-lg border border-card bg-card shadow-sm">
      <span role="status" aria-live="polite" className="sr-only">
        {srEvidenceAnnouncement}
      </span>
      <div className="flex flex-col gap-3 border-b border-card p-4 sm:gap-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-signal-challenges text-signal-challenges sm:size-9">
            <FlaskConical className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Validation loop
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-muted sm:mt-1 sm:text-sm sm:leading-6">
              Turn generated assumptions into evidence-backed product decisions.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:min-w-[310px] sm:max-w-sm">
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs sm:gap-2">
            <div className="rounded-md bg-muted px-2 py-1.5 sm:px-3 sm:py-2">
              <strong className="block text-sm font-semibold text-foreground">
                {progress.score}%
              </strong>
              progress
            </div>
            <div className="rounded-md bg-signal-supports px-3 py-2">
              <strong className="block text-sm text-signal-supports">
                {progress.withEvidence}/{progress.total}
              </strong>
              evidenced
            </div>
            <div className="rounded-md bg-signal-neutral px-3 py-2">
              <strong className="block text-sm text-signal-neutral">
                {progress.decided}/{progress.total}
              </strong>
              decided
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWeightPicker(!showWeightPicker)}
              aria-haspopup="menu"
              aria-expanded={showWeightPicker}
              aria-label="Progress weight preset"
              className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground/70 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            >
              <span className="font-medium">
                Weights: {weightPreset === "default" ? "Balanced" : weightPreset === "evidence" ? "Evidence-heavy" : "Decision-heavy"}
              </span>
              <ChevronDown
                className={`size-3.5 transition-transform ${showWeightPicker ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {showWeightPicker && (
              <div
                role="menu"
                className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-md border border-card bg-card shadow-lg"
              >
                {([
                  ["default", "Balanced", "All checkpoints equal"],
                  ["evidence", "Evidence-heavy", "Evidence gathering counts more"],
                  ["decision", "Decision-heavy", "Reaching conclusions counts more"],
                ] as const).map(([value, label, desc]) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setWeightPreset(value);
                      setShowWeightPicker(false);
                    }}
                    aria-current={weightPreset === value}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-foreground/80 transition hover:bg-muted hover:text-foreground"
                  >
                    <div>
                      <div className="font-semibold">{label}</div>
                      <div className="text-[10px] text-muted">{desc}</div>
                    </div>
                    {weightPreset === value && (
                      <Check className="size-3.5 text-accent" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.score}
            aria-labelledby="validation-progress-label"
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${progress.score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-card px-3 py-2 sm:px-5">
        <div className="flex items-center gap-1">
          <Filter className="size-3.5 text-muted" aria-hidden="true" />
          <div role="tablist" aria-label="Filter experiments by status" className="flex gap-0.5">
          {[
            { id: "all", label: "All", count: execution.experiments.length },
            { id: "active", label: "Active", count: execution.experiments.filter((e) => e.status === "untested" || e.status === "testing").length },
            { id: "decided", label: "Decided", count: execution.experiments.filter((e) => e.status === "supported" || e.status === "refuted").length },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={statusFilter === tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === tab.id
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1 opacity-70">({tab.count})</span>
            </button>
          ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingExperiment(!isAddingExperiment)}
          aria-expanded={isAddingExperiment}
          className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">New hypothesis</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
      {isAddingExperiment && (
        <div className="border-b border-card bg-input/50 p-3 sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">
              New hypothesis
            </span>
            <input
              type="text"
              value={newExperimentDraft}
              onChange={(e) => setNewExperimentDraft(e.target.value)}
              placeholder="What assumption do you want to validate?"
              autoFocus
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newExperimentDraft.trim().length >= 5) {
                  e.preventDefault();
                  const assumption = newExperimentDraft.trim();
                  const newExp: ValidationExperiment = {
                    id: assumptionIdentity(assumption, execution.experiments.length),
                    assumption,
                    status: "untested",
                    confidence: "low",
                    decision: "",
                    nextAction: "",
                    linkedTaskId: "",
                    evidence: [],
                  };
                  onChange({
                    ...execution,
                    experiments: [...execution.experiments, newExp],
                    updatedAt: new Date().toISOString(),
                  });
                  setNewExperimentDraft("");
                  setIsAddingExperiment(false);
                  setRequestedExpandedExperimentId(newExp.id);
                  srAnnounce("New hypothesis added: " + newExp.assumption);
                }
              }}
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingExperiment(false);
                setNewExperimentDraft("");
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (newExperimentDraft.trim().length < 5) return;
                const assumption = newExperimentDraft.trim();
                const newExp: ValidationExperiment = {
                  id: assumptionIdentity(assumption, execution.experiments.length),
                  assumption,
                  status: "untested",
                  confidence: "low",
                  decision: "",
                  nextAction: "",
                  linkedTaskId: "",
                  evidence: [],
                };
                onChange({
                  ...execution,
                  experiments: [...execution.experiments, newExp],
                  updatedAt: new Date().toISOString(),
                });
                setNewExperimentDraft("");
                setIsAddingExperiment(false);
                setRequestedExpandedExperimentId(newExp.id);
                srAnnounce("New hypothesis added: " + newExp.assumption);
              }}
              disabled={newExperimentDraft.trim().length < 5}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add hypothesis
            </button>
          </div>
        </div>
      )}
      <div className="divide-y divide-[#edf0ea]">
        {filteredExperiments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-foreground">No validation experiments yet</p>
            <p className="mt-0.5 text-xs leading-5 text-muted sm:mt-1 sm:text-sm sm:leading-6">
              Generate a workspace to seed starter assumptions, or add new hypotheses once your brief is in place.
            </p>
          </div>
        ) : null}
        {filteredExperiments.map((experiment, index) => {
          const formOpen = activeExperimentId === experiment.id;
          const expanded = expandedExperimentId === experiment.id;
          const evidenceLimitReached = experiment.evidence.length >= 8;

          return (
            <article
              role="group"
              key={experiment.id}
              data-experiment-article
              tabIndex={0}
              onKeyDown={(e) => handleExperimentKeyDown(e, experiment.id)}
              aria-label={`Hypothesis ${index + 1}: ${experiment.assumption}. Status: ${statusLabels[experiment.status]}. ${experiment.evidence.length} evidence items.}`}
              className="p-5 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-signal-challenges">
                      H{index + 1}
                    </span>
                    <span
                      role="status"
                      aria-label={`Validation status: ${statusLabels[experiment.status]}`}
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(experiment.status)}`}
                    >
                      {statusLabels[experiment.status]}
                    </span>
                    <span className="text-xs text-muted" aria-label={`${experiment.evidence.length} evidence item${experiment.evidence.length === 1 ? "" : "s"}`}>
                      {experiment.evidence.length} evidence item
                      {experiment.evidence.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h3 className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-foreground">
                    {experiment.assumption}
                  </h3>
                </div>

                <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setRequestedExpandedExperimentId((current) =>
                        current === experiment.id ? null : experiment.id,
                      )
                    }
                    aria-expanded={expanded}
                    aria-controls={`experiment-details-${experiment.id}`}
                    className="flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-semibold text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:h-10"
                  >
                    {expanded ? (
                      <ChevronUp className="size-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="size-4" aria-hidden="true" />
                    )}
                    {expanded ? "Collapse" : "Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEvidenceForm(experiment.id)}
                    disabled={evidenceLimitReached}
                    aria-expanded={formOpen}
                    aria-controls={`evidence-form-${experiment.id}`}
                    className="flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-input px-4 text-sm font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {formOpen ? "Cancel" : "Add evidence"}
                  </button>
                </div>
              </div>

              <div
                id={`experiment-details-${experiment.id}`}
                className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
                aria-hidden={!expanded}
              >
                <div className="min-h-0 overflow-hidden" inert={!expanded}>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-muted">
                    Validation status
                  </span>
                  <select
                    value={experiment.status}
                    onChange={(event) =>
                      updateExperiment(experiment.id, (current) => ({
                        ...current,
                        status: event.target
                          .value as ValidationExperiment["status"],
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-input px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-muted">
                    Confidence
                  </span>
                  <select
                    value={experiment.confidence}
                    onChange={(event) =>
                      updateExperiment(experiment.id, (current) => ({
                        ...current,
                        confidence: event.target
                          .value as ValidationExperiment["confidence"],
                      }))
                    }
                    className="h-12 w-full rounded-md border border-input bg-input px-3 text-sm capitalize text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)] sm:h-10"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    Product judgment, not statistical certainty.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-muted">
                    <Link2 className="size-3.5" aria-hidden="true" />
                    Linked execution task
                  </span>
                  <select
                    value={experiment.linkedTaskId}
                    onChange={(event) =>
                      updateExperiment(experiment.id, (current) => ({
                        ...current,
                        linkedTaskId: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-input px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  >
                    <option value="">No linked task</option>
                    {tasks.map((task, taskIndex) => (
                      <option
                        key={taskIdentity(task, taskIndex)}
                        value={taskIdentity(task, taskIndex)}
                      >
                        {task.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {experiment.evidence.length > 0 ? (
                <ul ref={evidenceListRef} data-experiment-id={experiment.id} tabIndex={-1} aria-label="Evidence items" aria-live="polite" onKeyDown={handleEvidenceKeyDown} className="mt-4 divide-y divide-card rounded-md bg-muted px-4 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">
                  {experiment.evidence.map((item) => (
                    <li
                      data-evidence-id={item.id}
                      key={item.id}
                      className="flex items-start gap-3 py-3 text-sm"
                    >
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-foreground">
                            {item.source}
                          </span>
                          <span className="rounded-md bg-card px-2 py-1 font-medium text-muted">
                            {signalLabels[item.signal]}
                          </span>
                          <time className="text-muted">
                            {new Intl.DateTimeFormat("en", {
                              month: "short",
                              day: "numeric",
                            }).format(new Date(item.observedAt))}
                          </time>
                        </div>
                        <p className="mt-1 break-words leading-6 text-foreground/80">
                          {item.note}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveEvidence(experiment.id, item.id, "up")}
                          disabled={experiment.evidence.findIndex((e) => e.id === item.id) === 0}
                          title="Move evidence up"
                          aria-label={`Move evidence from ${item.source} up`}
                          className="flex size-12 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent sm:size-9"
                        >
                          <ChevronUp className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEvidence(experiment.id, item.id, "down")}
                          disabled={experiment.evidence.findIndex((e) => e.id === item.id) === experiment.evidence.length - 1}
                          title="Move evidence down"
                          aria-label={`Move evidence from ${item.source} down`}
                          className="flex size-12 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent sm:size-9"
                        >
                          <ChevronDown className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingEvidence(experiment.id, item.id)}
                          title="Edit evidence"
                          aria-label={`Edit evidence from ${item.source}`}
                          className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:size-8"
                        >
                          <PencilLine className="size-4" aria-hidden="true" />
                        </button>
                        {pendingDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => deleteEvidence(experiment.id, item.id)}
                            data-delete-confirm
                            title="Confirm delete"
                            aria-label={`Confirm delete evidence from ${item.source}`}
                            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-signal-challenges text-white transition hover:bg-[color-mix(in_srgb,var(--signal-challenges-bg)_85%,black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 sm:size-8"
                          >
                            <Check className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDeleteId(null);
                            }}
                            title="Cancel delete"
                            aria-label="Cancel delete evidence"
                            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 sm:size-8"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(item.id);
                          }}
                          title="Remove evidence"
                          aria-label={`Remove evidence from ${item.source}`}
                          className="flex size-11 shrink-0 items-center justify-center rounded-md text-signal-challenges transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 sm:size-8"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-md bg-muted px-4 py-3 text-sm text-muted">
                  No evidence recorded yet. Add an interview signal, metric, or
                  market observation.
                </p>
              )}

              <div
                id={`evidence-form-${experiment.id}`}
                className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
                style={{ gridTemplateRows: formOpen ? "1fr" : "0fr" }}
                aria-hidden={!formOpen}
              >
                <div className="min-h-0 overflow-hidden">
                <form
                  onSubmit={(event) => addEvidence(event, experiment.id)}
                  className="mt-4 grid gap-3 rounded-md border border-input bg-input p-4 md:grid-cols-[160px_1fr_auto]"
                  inert={!formOpen}
                >
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase text-muted">
                      Signal
                    </span>
                    <select
                      value={draft.signal}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          signal: event.target.value as EvidenceSignal,
                        }))
                      }
                      aria-describedby={`evidence-signal-hint-${experiment.id}`}
                      className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                    >
                      {Object.entries(signalLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <p id={`evidence-signal-hint-${experiment.id}`} className="sr-only">
                      Choose the evidence signal strength for this validation finding.
                    </p>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase text-muted">
                        Source
                      </span>
                      <input
                        required
                        maxLength={160}
                        value={draft.source}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            source: event.target.value,
                          }))
                        }
                        onBlur={() => setDraftTouched((cur) => ({ ...cur, source: true }))}
                        aria-invalid={!!sourceError}
                        aria-describedby={sourceError ? "evidence-source-error" : undefined}
                        placeholder="Interview, metric, test"
                        className={`h-10 w-full rounded-md border bg-card px-3 text-sm outline-none ${
                          sourceError
                            ? "border-signal-challenges focus:border-signal-challenges focus:ring-2 focus:ring-[var(--signal-challenges-border)]"
                            : "border-input focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                        }`}
                      />
                      {sourceError && (
                        <p id="evidence-source-error" role="alert" className="mt-1 text-[11px] leading-4 text-error">{sourceError}</p>
                      )}
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase text-muted">
                        Observation
                      </span>
                      <input
                        required
                        maxLength={800}
                        value={draft.note}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            note: event.target.value,
                          }))
                        }
                        onBlur={() => setDraftTouched((cur) => ({ ...cur, note: true }))}
                        aria-invalid={!!noteError}
                        aria-describedby={noteError ? "evidence-note-error" : undefined}
                        placeholder="What did you learn?"
                        className={`h-10 w-full rounded-md border bg-card px-3 text-sm outline-none ${
                          noteError
                            ? "border-signal-challenges focus:border-signal-challenges focus:ring-2 focus:ring-[var(--signal-challenges-border)]"
                            : "border-input focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                        }`}
                      />
                      {noteError && (
                        <p id="evidence-note-error" role="alert" className="mt-1 text-[11px] leading-4 text-error">{noteError}</p>
                      )}
                    </label>
                  </div>
                  <div className="mt-6 flex flex-col items-start gap-2 md:mt-0 md:justify-end">
                    {draftSubmitError && (
                      <p role="alert" className="text-[11px] leading-4 text-error">{draftSubmitError}</p>
                    )}
                    <button
                      type="submit"
                      className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      {editingEvidenceId ? "Save" : "Record"}
                    </button>
                  </div>
                </form>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-muted">
                    <CircleGauge className="size-3.5" aria-hidden="true" />
                    Decision
                  </span>
                  <textarea
                    rows={3}
                    maxLength={800}
                    value={experiment.decision}
                    onChange={(event) =>
                      updateExperiment(experiment.id, (current) => ({
                        ...current,
                        decision: event.target.value,
                      }))
                    }
                    aria-describedby={`decision-count-${experiment.id}`}
                    placeholder="What will change because of this evidence?"
                    className="w-full resize-y rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p id={`decision-count-${experiment.id}`} className="mt-1 text-right text-[11px] leading-4 text-muted">
                    {experiment.decision.length}/800 characters
                  </p>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-muted">
                    Next validation action
                  </span>
                  <textarea
                    rows={3}
                    maxLength={800}
                    value={experiment.nextAction}
                    onChange={(event) =>
                      updateExperiment(experiment.id, (current) => ({
                        ...current,
                        nextAction: event.target.value,
                      }))
                    }
                    aria-describedby={`next-action-count-${experiment.id}`}
                    placeholder="What evidence should be collected next?"
                    className="w-full resize-y rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p id={`next-action-count-${experiment.id}`} className="mt-1 text-right text-[11px] leading-4 text-muted">
                    {experiment.nextAction.length}/800 characters
                  </p>
                </label>
              </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
