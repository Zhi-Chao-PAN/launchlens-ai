"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  FlaskConical,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  evaluateExecutionProgress,
  taskIdentity,
  type EvidenceSignal,
  type ValidationExperiment,
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
    return "bg-[#e5f4ef] text-[#0f766e]";
  }

  if (status === "refuted") {
    return "bg-[#fff0eb] text-[#9a432d]";
  }

  if (status === "testing") {
    return "bg-[#f6df8f] text-[#493b08]";
  }

  return "bg-[#eef0ed] text-[#607069]";
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
  const progress = useMemo(
    () => evaluateExecutionProgress(execution),
    [execution],
  );

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
  }

  function addEvidence(
    event: React.FormEvent<HTMLFormElement>,
    experimentId: string,
  ) {
    event.preventDefault();
    const note = draft.note.trim();
    const source = draft.source.trim();

    if (!note || !source) {
      return;
    }

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
    setActiveExperimentId("");
  }

  return (
    <section className="rounded-lg border border-[#d8ded4] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#edf0ea] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff0eb] text-[#d85b3f]">
            <FlaskConical className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[#17201d]">
              Validation loop
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#607069]">
              Turn generated assumptions into evidence-backed product decisions.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:min-w-[310px] sm:max-w-sm">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md bg-[#eef0ed] px-3 py-2">
              <strong className="block text-sm text-[#17201d]">
                {progress.score}%
              </strong>
              progress
            </div>
            <div className="rounded-md bg-[#e5f4ef] px-3 py-2">
              <strong className="block text-sm text-[#0f766e]">
                {progress.withEvidence}/{progress.total}
              </strong>
              evidenced
            </div>
            <div className="rounded-md bg-[#f6df8f] px-3 py-2">
              <strong className="block text-sm text-[#493b08]">
                {progress.decided}/{progress.total}
              </strong>
              decided
            </div>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.score}
            aria-label="Validation progress"
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef0ed]"
          >
            <div
              className="h-full rounded-full bg-[#138a72] transition-all duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${progress.score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#edf0ea]">
        {execution.experiments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-[#17201d]">No validation experiments yet</p>
            <p className="mt-1 text-sm leading-6 text-[#607069]">
              Generate a workspace to seed starter assumptions, or add new hypotheses once your brief is in place.
            </p>
          </div>
        ) : null}
        {execution.experiments.map((experiment, index) => {
          const formOpen = activeExperimentId === experiment.id;
          const expanded = expandedExperimentId === experiment.id;
          const evidenceLimitReached = experiment.evidence.length >= 8;

          return (
            <article key={experiment.id} className="p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#d85b3f]">
                      H{index + 1}
                    </span>
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(experiment.status)}`}
                    >
                      {statusLabels[experiment.status]}
                    </span>
                    <span className="text-xs text-[#607069]">
                      {experiment.evidence.length} evidence item
                      {experiment.evidence.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h3 className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-[#17201d]">
                    {experiment.assumption}
                  </h3>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRequestedExpandedExperimentId((current) =>
                        current === experiment.id ? null : experiment.id,
                      )
                    }
                    aria-expanded={expanded}
                    aria-controls={`experiment-details-${experiment.id}`}
                    className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfd8d1] bg-white px-3 text-sm font-semibold text-[#40504a] transition hover:border-[#138a72] hover:text-[#17201d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
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
                    className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 text-sm font-semibold text-[#17201d] transition hover:border-[#138a72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <span className="mb-2 block text-xs font-semibold uppercase text-[#607069]">
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
                    className="h-10 w-full rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 text-sm text-[#17201d] outline-none focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-[#607069]">
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
                    className="h-10 w-full rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 text-sm capitalize text-[#17201d] outline-none focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <span className="mt-1 block text-xs leading-5 text-[#607069]">
                    Product judgment, not statistical certainty.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-[#607069]">
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
                    className="h-10 w-full rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 text-sm text-[#17201d] outline-none focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
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
                <ul className="mt-4 divide-y divide-[#dfe5dd] rounded-md bg-[#f6f8f4] px-4">
                  {experiment.evidence.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 py-3 text-sm"
                    >
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-[#138a72]"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-[#17201d]">
                            {item.source}
                          </span>
                          <span className="rounded-md bg-white px-2 py-1 font-medium text-[#607069]">
                            {signalLabels[item.signal]}
                          </span>
                          <time className="text-[#607069]">
                            {new Intl.DateTimeFormat("en", {
                              month: "short",
                              day: "numeric",
                            }).format(new Date(item.observedAt))}
                          </time>
                        </div>
                        <p className="mt-1 leading-6 text-[#40504a]">
                          {item.note}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateExperiment(experiment.id, (current) => ({
                            ...current,
                            evidence: current.evidence.filter(
                              (evidence) => evidence.id !== item.id,
                            ),
                          }))
                        }
                        title="Remove evidence"
                        aria-label={`Remove evidence from ${item.source}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#8b3d28] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d85b3f] focus-visible:ring-offset-1"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-md bg-[#f6f8f4] px-4 py-3 text-sm text-[#607069]">
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
                  className="mt-4 grid gap-3 rounded-md border border-[#cfd8d1] bg-[#fbfcfa] p-4 md:grid-cols-[160px_1fr_auto]"
                  inert={!formOpen}
                >
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase text-[#607069]">
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
                      className="h-10 w-full rounded-md border border-[#cfd8d1] bg-white px-3 text-sm outline-none focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                    >
                      {Object.entries(signalLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase text-[#607069]">
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
                        placeholder="Interview, metric, test"
                        className="h-10 w-full rounded-md border border-[#cfd8d1] bg-white px-3 text-sm outline-none focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase text-[#607069]">
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
                        placeholder="What did you learn?"
                        className="h-10 w-full rounded-md border border-[#cfd8d1] bg-white px-3 text-sm outline-none focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="mt-6 flex h-10 items-center justify-center gap-2 rounded-md bg-[#17201d] px-4 text-sm font-semibold text-white transition hover:bg-[#24312d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-2"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Record
                  </button>
                </form>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-[#607069]">
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
                    placeholder="What will change because of this evidence?"
                    className="w-full resize-y rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 py-3 text-sm leading-6 outline-none focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-[#607069]">
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
                    placeholder="What evidence should be collected next?"
                    className="w-full resize-y rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 py-3 text-sm leading-6 outline-none focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                  />
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
