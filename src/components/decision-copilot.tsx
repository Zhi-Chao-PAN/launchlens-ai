"use client";

import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSrAnnounce } from "@/hooks/use-sr-announce";
import { Skeleton } from "@/components/skeleton";

import {
  decisionBriefIsCurrent,
  decisionSourceFromExperiment,
  normalizeDecisionBrief, type EvidenceStrength,
  type DecisionGenerationResult,
  type DecisionRecommendation,
  type GroundedClaim,
} from "@/lib/launchlens/decision";
import type {
  ExperimentStatus,
  ValidationExperiment,
  WorkspaceExecutionState,
} from "@/lib/launchlens/execution";
import { friendlyApiMessage } from "@/lib/launchlens/api-errors";

type DecisionCopilotProps = {
  execution: WorkspaceExecutionState;
  onChange: (execution: WorkspaceExecutionState) => void;
};

const evidenceStrengthMeta: Record<EvidenceStrength, { label: string; pct: number; color: string; bg: string }> = {
  insufficient: { label: "Insufficient evidence", pct: 25, color: "text-signal-challenges", bg: "bg-signal-challenges" },
  mixed: { label: "Mixed signals", pct: 50, color: "text-signal-neutral", bg: "bg-signal-neutral" },
  directional: { label: "Directional evidence", pct: 75, color: "text-signal-supports", bg: "bg-signal-supports" },
  strong: { label: "Strong evidence", pct: 100, color: "text-signal-supports", bg: "bg-signal-supports" },
};

const recommendationLabels: Record<DecisionRecommendation, string> = {
  proceed: "Proceed",
  iterate: "Iterate",
  pivot: "Pivot",
  pause: "Pause",
};

function recommendationClass(recommendation: DecisionRecommendation) {
  if (recommendation === "proceed") {
    return "bg-signal-supports text-signal-supports";
  }

  if (recommendation === "pivot") {
    return "bg-signal-challenges text-signal-challenges";
  }

  if (recommendation === "iterate") {
    return "bg-signal-neutral text-signal-neutral";
  }

  return "bg-muted text-muted";
}

function TextList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-muted">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex gap-2 text-sm leading-6 text-foreground/80"
            >
              <CheckCircle2
                className="mt-1 size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted">{empty}</p>
      )}
    </div>
  );
}

function ClaimList({
  claims,
  experiment,
}: {
  claims: GroundedClaim[];
  experiment: ValidationExperiment;
}) {
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);

  const stanceClass = (stance: string) => {
    if (stance === "supports") return "bg-signal-supports text-signal-supports";
    if (stance === "challenges")
      return "bg-signal-challenges text-signal-challenges";
    return "bg-signal-neutral text-signal-neutral";
  };

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-muted">
        Grounded claims
      </h3>
      <ul
        aria-label="Evidence-grounded claims"
        className="relative mt-2 space-y-3 pl-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-input"
      >
        {claims.map((claim, index) => {
          const citedEvidence = claim.evidenceIds
            .map((id) => experiment.evidence.find((item) => item.id === id))
            .filter(Boolean);
          const sources = citedEvidence.map((item) => item!.source);
          const expanded = expandedClaim === index;

          return (
            <li
              key={`${claim.text}-${index}`}
              tabIndex={0}
              aria-label={`${claim.stance} claim: ${claim.text}. ${claim.evidenceIds.length} citation${claim.evidenceIds.length === 1 ? "" : "s"} from ${sources.join(", ")}.`}
              onClick={() => setExpandedClaim(expanded ? null : index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedClaim(expanded ? null : index);
                }
              }}
              className="relative cursor-pointer rounded-md bg-muted p-3 outline-none transition hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 before:absolute before:-left-4 before:top-4 before:size-2.5 before:rounded-full before:border-2 before:border-card before:bg-accent"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${stanceClass(claim.stance)}`}
                >
                  {claim.stance}
                </span>
                <span className="text-xs text-muted">
                  {claim.evidenceIds.length} citation
                  {claim.evidenceIds.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground/80">
                {claim.text}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Source: {sources.join(", ") || "none cited"}
              </p>

              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
                  expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
                aria-hidden={!expanded}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="mt-3 space-y-2 border-t border-input pt-3">
                    {citedEvidence.length === 0 ? (
                      <p className="text-xs text-muted">
                        No matching evidence records found.
                      </p>
                    ) : (
                      citedEvidence.map((item) => (
                        <div
                          key={item!.id}
                          className="rounded-md bg-card px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {item!.source}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                item!.signal === "supports"
                                  ? "bg-signal-supports text-signal-supports"
                                  : item!.signal === "challenges"
                                    ? "bg-signal-challenges text-signal-challenges"
                                    : "bg-signal-neutral text-signal-neutral"
                              }`}
                            >
                              {item!.signal}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-foreground/70">
                            {item!.note}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DecisionCopilot({
  execution,
  onChange,
}: DecisionCopilotProps) {
  const firstReadyExperiment = execution.experiments.find(
    (experiment) => experiment.evidence.length > 0,
  );
  const [requestedExperimentId, setRequestedExperimentId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [revealStep, setRevealStep] = useState(0);
  const revealTimerRef = useRef<number | null>(null);
  const lastBriefIdRef = useRef<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0, currentName: "" });
  const { announce: setSrGenerationAnnouncement, message: srGenerationAnnouncement } = useSrAnnounce();
  const selectedExperimentId =
    requestedExperimentId &&
    execution.experiments.some(
      (experiment) => experiment.id === requestedExperimentId,
    )
      ? requestedExperimentId
      : (firstReadyExperiment?.id ?? execution.experiments[0]?.id ?? "");
  const experiment = execution.experiments.find(
    (item) => item.id === selectedExperimentId,
  );
  const currentBrief =
    experiment?.decisionBrief && decisionBriefIsCurrent(experiment)
      ? experiment.decisionBrief
      : null;
  const citationCount = currentBrief
    ? new Set(
        currentBrief.claims.flatMap((claim) => claim.evidenceIds),
      ).size
    : 0;
  const briefCount = useMemo(
    () =>
      execution.experiments.filter(
        (item) => item.decisionBrief && decisionBriefIsCurrent(item),
      ).length,
    [execution],
  );

  const saveBrief = useCallback(
    (
      experimentId: string,
      brief: ValidationExperiment["decisionBrief"],
    ) => {
      onChange({
        experiments: execution.experiments.map((item) =>
          item.id === experimentId ? { ...item, decisionBrief: brief } : item,
        ),
        updatedAt: new Date().toISOString(),
      });
    },
    [onChange, execution.experiments],
  );

  function applyRecommendation() {
    if (!currentBrief || !experiment) return;

    const rec = currentBrief.recommendation;
    let newStatus: ExperimentStatus = experiment.status;
    const headline = currentBrief.headline || "";

    if (rec === "proceed") {
      newStatus = "supported";
    } else if (rec === "pivot" || rec === "pause") {
      newStatus = "refuted";
    } else if (rec === "iterate") {
      newStatus = "testing";
    }

    const decisionLabel = rec.charAt(0).toUpperCase() + rec.slice(1);
    const newDecision = `${decisionLabel} - ${headline}`;
    const nextAction = currentBrief.nextActions?.[0] || experiment.nextAction;

    onChange({
      ...execution,
      experiments: execution.experiments.map((item) =>
        item.id === experiment.id
          ? { ...item, status: newStatus, decision: newDecision, nextAction }
          : item,
      ),
      updatedAt: new Date().toISOString(),
    });

    setNotice("Recommendation applied to hypothesis status and decision.");
    setSrGenerationAnnouncement("Recommendation applied.");
  }


  async function generateBatchBriefs() {
    const pending = execution.experiments.filter(
      (item) => item.evidence.length > 0 && !item.decisionBrief,
    );
    if (pending.length === 0) {
      setNotice("All hypotheses with evidence already have decision briefs.");
      return;
    }

    setIsBatchGenerating(true);
    setBatchProgress({ done: 0, total: pending.length, currentName: pending[0]?.assumption ?? "" });
    setError("");
    setNotice("");
    setSrGenerationAnnouncement(
      `Generating ${pending.length} decision briefs. This will take a moment.`,
    );

    let successCount = 0;
    let failCount = 0;
    const updatedExperiments = [...execution.experiments];

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      try {
        const source = decisionSourceFromExperiment(item);
        const response = await fetch("/api/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experiment: source }),
        });
        const data = (await response.json()) as Partial<DecisionGenerationResult> & {
          error?: string;
          code?: string;
        };
        const brief = data.brief ? normalizeDecisionBrief(data.brief, source) : null;

        if (response.ok && brief) {
          const idx = updatedExperiments.findIndex((e) => e.id === item.id);
          if (idx >= 0) {
            updatedExperiments[idx] = { ...updatedExperiments[idx], decisionBrief: brief };
          }
          successCount += 1;
        } else {
          failCount += 1;
        }
      } catch {
        failCount += 1;
      }
      setBatchProgress({ done: i + 1, total: pending.length, currentName: item.assumption });
    }

    // Apply all changes at once
    onChange({
      ...execution,
      experiments: updatedExperiments,
      updatedAt: new Date().toISOString(),
    });

    setIsBatchGenerating(false);
    const summary = `${successCount} of ${pending.length} briefs generated successfully.`;
    if (failCount > 0) {
      setError(`${summary} ${failCount} failed.`);
    } else {
      setNotice(summary);
    }
    setSrGenerationAnnouncement(summary);
  }

  const generateBrief = useCallback(async () => {
    if (!experiment || experiment.evidence.length === 0) {
      setError("Add at least one evidence item before generating a brief.");
      return;
    }

    const source = decisionSourceFromExperiment(experiment);
    setIsGenerating(true);
    setError("");
    setNotice("");
    setSrGenerationAnnouncement("Generating decision brief. Please wait.");

    try {
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experiment: source }),
      });
      const data = (await response.json()) as Partial<DecisionGenerationResult> & {
        error?: string;
        code?: string;
      };
      const brief = data.brief ? normalizeDecisionBrief(data.brief, source) : null;
      const briefInvalid = data.brief && !brief;

      if (!response.ok || data.error || !brief) {
        const fallback =
          response.status === 429
            ? "Too many decision requests - wait a moment and retry."
            : briefInvalid
              ? "The decision brief returned by the provider could not be parsed. Please retry."
              : "Decision brief generation failed.";
        const errorCode = briefInvalid ? "decision_invalid_response" : data.code;
        throw new Error(friendlyApiMessage(errorCode, data.error ?? fallback));
      }

      saveBrief(experiment.id, brief);
      const modeLabel = data.mode === "real" ? "Real-provider" : "Demo";
      setNotice(
        data.usedFallback
          ? "The real provider failed, so a deterministic demo brief was saved."
          : `${modeLabel} decision brief saved.`,
      );
      setSrGenerationAnnouncement(
        data.usedFallback
          ? "Decision brief saved using demo fallback."
          : `${modeLabel} decision brief generated and saved.`,
      );
    } catch (caught) {
      const msg =
        caught instanceof Error
          ? caught.message
          : "Decision brief generation failed.";
      setError(msg);
      setSrGenerationAnnouncement(`Decision brief generation failed: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  }, [experiment, saveBrief, setSrGenerationAnnouncement]);


  // Staggered reveal animation when a new brief finishes generating
  useEffect(() => {
    const briefId =
      currentBrief && experiment ? currentBrief.headline + experiment.id : null;
    if (briefId && briefId !== lastBriefIdRef.current && !isGenerating) {
      lastBriefIdRef.current = briefId;
      setRevealStep(0);
      const totalSteps = 4;
      let step = 0;
      const tick = () => {
        step += 1;
        setRevealStep(step);
        if (step < totalSteps) {
          revealTimerRef.current = window.setTimeout(tick, 120);
        }
      };
      revealTimerRef.current = window.setTimeout(tick, 80);
    }
    return () => {
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
    };
  }, [currentBrief, experiment, isGenerating]);

  // Keyboard shortcut: Cmd/Ctrl+Shift+B triggers brief generation when possible
  const generateButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier || !event.shiftKey) return;
      if (event.key.toLowerCase() !== "b") return;
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) {
          return;
        }
      }
      event.preventDefault();
      if (isGenerating || isBatchGenerating || !experiment || experiment.evidence.length === 0) return;
      void generateBrief();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isGenerating, isBatchGenerating, experiment, generateBrief]);

  return (
    <section className="rounded-lg border border-card bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-card p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ai text-ai">
            <BrainCircuit className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              AI decision copilot
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Synthesize only recorded evidence into a cautious recommendation,
              counter-signals, risks, and next actions.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md bg-muted px-3 py-2 text-foreground/80">
            {briefCount}/{execution.experiments.length} current briefs
          </span>
          <span className="flex items-center gap-1 rounded-md bg-signal-supports px-3 py-2 font-semibold text-signal-supports">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Evidence-bound
          </span>
          <button
            type="button"
            onClick={generateBatchBriefs}
            disabled={isBatchGenerating || isGenerating}
            aria-busy={isBatchGenerating}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 lg:ml-0"
          >
            {isBatchGenerating ? (
              <span className="flex items-center gap-1">
                <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-accent [animation-delay:-0.32s]" />
                <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-accent [animation-delay:-0.16s]" />
                <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-accent" />
              </span>
            ) : (
              <Sparkles className="size-3.5" aria-hidden="true" />
            )}
            {isBatchGenerating ? (
                <span className="text-left">
                  <span className="block font-semibold">
                    {batchProgress.done}/{batchProgress.total}
                  </span>
                  <span className="block max-w-20 truncate text-[10px] font-medium text-muted">
                    {batchProgress.currentName || "Preparing..."}
                  </span>
                </span>
              ) : (
                "Generate all briefs"
              )}
          </button>
        </div>
        {isBatchGenerating && batchProgress.total > 0 && (
          <div className="border-t border-card bg-input/40 px-5 py-2">
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
              <span>
                Generating {batchProgress.done} of {batchProgress.total}
              </span>
              <span className="font-mono font-semibold">
                {Math.round((batchProgress.done / batchProgress.total) * 100)}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={batchProgress.done}
              aria-valuemin={0}
              aria-valuemax={batchProgress.total}
              aria-label="Batch generation progress"
              className="h-1 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
                style={{
                  width: `${(batchProgress.done / batchProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[280px_1fr]">
        <div>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase text-muted">
              Hypothesis
            </span>
            <select
              value={selectedExperimentId}
              onChange={(event) => {
                setRequestedExperimentId(event.target.value);
                setError("");
                setNotice("");
              }}
              className="h-11 w-full rounded-md border border-input bg-input px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
            >
              {execution.experiments.map((item, index) => (
                <option key={item.id} value={item.id}>
                  H{index + 1} | {item.evidence.length} evidence | {item.status}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 rounded-md bg-muted p-4">
            <p className="text-sm font-semibold leading-6 text-foreground">
              {experiment?.assumption ?? "No hypothesis available"}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted">
              <div>
                <dt>Evidence</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {experiment?.evidence.length ?? 0}
                </dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd className="mt-1 font-semibold capitalize text-foreground">
                  {experiment?.confidence ?? "low"}
                </dd>
              </div>
            </dl>
          </div>

          <button
            ref={generateButtonRef}
            type="button"
            onClick={generateBrief}
            disabled={
              isGenerating || !experiment || experiment.evidence.length === 0
            }
            aria-busy={isGenerating}
            aria-describedby="decision-generation-status"
            title="Generate decision brief (Ctrl+Shift+B / Cmd+Shift+B)"
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-text shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-card/80 [animation-delay:-0.32s]" />
                <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-card/80 [animation-delay:-0.16s]" />
                <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-card/80" />
              </span>
            ) : currentBrief ? (
              <RefreshCw className="size-4" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {isGenerating
              ? "Synthesizing evidence"
              : currentBrief
                ? "Regenerate brief"
                : "Generate decision brief"}
          </button>

          {currentBrief && (
            <button
              type="button"
              onClick={applyRecommendation}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-accent bg-transparent px-4 text-sm font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Apply recommendation
            </button>
          )}

          <span id="decision-generation-status" role="status" aria-live="polite" className="sr-only">
            {srGenerationAnnouncement}
          </span>

          {!experiment?.evidence.length && (
            <p className="mt-3 text-xs leading-5 text-muted">
              Record evidence in the validation loop before asking AI for a
              recommendation. Shortcut:{" "}
              <kbd className="rounded border border-muted/30 bg-muted px-1 font-mono text-[10px]">Ctrl</kbd>{" "}
              +{" "}
              <kbd className="rounded border border-muted/30 bg-muted px-1 font-mono text-[10px]">Shift</kbd>{" "}
              +{" "}
              <kbd className="rounded border border-muted/30 bg-muted px-1 font-mono text-[10px]">B</kbd>
            </p>
          )}
          {experiment?.decisionBrief && !currentBrief && (
            <p className="mt-3 flex gap-2 text-xs leading-5 text-signal-challenges">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              Evidence changed after the last brief. Regenerate before using it.
            </p>
          )}
          {(notice || error) && (
            <p
              role={error ? "alert" : "status"}
              className={`mt-3 rounded-md border px-3 py-2 text-xs leading-5 ${
                error
                  ? "border-signal-challenges bg-signal-challenges text-signal-challenges"
                  : "border border-signal-supports bg-signal-supports text-signal-supports"
              }`}
            >
              {error || notice}
            </p>
          )}
        </div>

        {isGenerating ? (
          <div className="min-h-64 rounded-md border border-dashed border-input bg-input p-6" role="status" aria-live="polite" aria-busy="true" aria-label="Synthesizing evidence">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton shimmer rounded="md" className="h-5 w-24" />
              <Skeleton shimmer rounded="md" className="h-5 w-20" />
              <Skeleton shimmer rounded="md" className="h-5 w-28" />
            </div>
            <Skeleton shimmer className="mb-2 h-4 w-full" />
            <Skeleton shimmer className="mb-2 h-4 w-11/12" />
            <Skeleton shimmer className="mb-5 h-4 w-4/5" />
            <div className="space-y-2">
              <Skeleton shimmer className="h-3 w-full" />
              <Skeleton shimmer className="h-3 w-10/12" />
              <Skeleton shimmer className="h-3 w-9/12" />
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted">
              <BrainCircuit className="size-4 animate-pulse text-ai-muted" aria-hidden="true" />
              Weighing signals against counter-signals…
            </p>
          </div>
        ) : currentBrief && experiment ? (
          <article className="min-w-0 motion-safe:animate-[launchlens-fade-in-up_260ms_ease-out_both]">
            <div
              className={`flex flex-wrap items-center gap-2 transition-opacity duration-300 ${
                revealStep >= 1 ? "opacity-100" : "opacity-0"
              }`}
            >
              <span
                className={`rounded-md px-2 py-1 text-xs font-semibold ${recommendationClass(currentBrief.recommendation)}`}
              >
                {recommendationLabels[currentBrief.recommendation]}
              </span>
              {currentBrief.usedFallback ? (
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-signal-challenges/40 px-2 py-1 text-[10px] font-semibold uppercase text-signal-challenges"
                  title="Real AI provider failed; this is a deterministic fallback brief."
                >
                  <span className="size-1.5 rounded-full bg-signal-challenges" />
                  Fallback
                </span>
              ) : currentBrief.mode === "real" ? (
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-signal-supports/15 px-2 py-1 text-[10px] font-semibold uppercase text-signal-supports"
                  title="Generated by real AI provider."
                >
                  <span className="size-1.5 rounded-full bg-signal-supports" />
                  AI
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase text-muted"
                  title="Demo mode - deterministic brief, no AI used."
                >
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                  Demo
                </span>
              )}
              <span className="text-xs capitalize text-muted">
                
                <div className="w-full">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      Evidence strength
                    </span>
                    <span className={`font-semibold ${evidenceStrengthMeta[currentBrief.evidenceStrength].color}`}>
                      {evidenceStrengthMeta[currentBrief.evidenceStrength].label}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={evidenceStrengthMeta[currentBrief.evidenceStrength].pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Evidence strength"
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={`h-full rounded-full ${evidenceStrengthMeta[currentBrief.evidenceStrength].bg} transition-all duration-500 ease-out`}
                      style={{ width: `${evidenceStrengthMeta[currentBrief.evidenceStrength].pct}%` }}
                    />
                  </div>
                </div>
              </span>
              <span className="text-xs text-muted">
                {currentBrief.provider} | {citationCount} cited
              </span>
            </div>
            <h3
              className={`mt-3 text-xl font-semibold leading-8 text-foreground transition-opacity duration-300 ${
                revealStep >= 2 ? "opacity-100" : "opacity-0"
              }`}
            >
              {currentBrief.headline}
            </h3>
            <div
              className={`mt-5 grid gap-5 transition-opacity duration-300 md:grid-cols-2 ${
                revealStep >= 3 ? "opacity-100" : "opacity-0"
              }`}
            >
              <ClaimList claims={currentBrief.claims} experiment={experiment} />
              <TextList
                title="Unresolved risks"
                items={currentBrief.unresolvedRisks}
                empty="No unresolved risk returned."
              />
              <TextList
                title="Recommended next actions"
                items={currentBrief.nextActions}
                empty="No next action returned."
              />
            </div>
          </article>
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-input bg-input p-8 text-center">
            <div className="max-w-md">
              <BrainCircuit
                className="mx-auto size-8 text-ai-muted"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-base font-semibold text-foreground">
                Evidence first, AI second
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                The copilot cannot create evidence. It summarizes the selected
                experiment and cites only evidence IDs already present in the
                workspace.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
