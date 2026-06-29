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
import { toneClass } from "@/lib/launchlens/tone-class";
import { decisionLabel } from "@/lib/launchlens/decision-label";
import { claimStatusLabel } from "@/lib/launchlens/claim-status-label";
import { formatValidationTimelineTime } from "@/lib/launchlens/validation-date-format";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type DecisionCopilotProps = {
  execution: WorkspaceExecutionState;
  onChange: (execution: WorkspaceExecutionState) => void;
};

const evidenceStrengthMeta: Record<EvidenceStrength, { key: string; pct: number; color: string; bg: string }> = {
  insufficient: { key: "copilot.evidenceInsufficient", pct: 25, color: "text-signal-challenges", bg: "bg-signal-challenges" },
  mixed: { key: "copilot.evidenceMixed", pct: 50, color: "text-signal-neutral", bg: "bg-signal-neutral" },
  directional: { key: "copilot.evidenceDirectional", pct: 75, color: "text-signal-supports", bg: "bg-signal-supports" },
  strong: { key: "copilot.evidenceStrong", pct: 100, color: "text-signal-supports", bg: "bg-signal-supports" },
};

/** Resolve a decisionLabel/claimStatusLabel descriptor into a string. */
function resolveLabel(
  t: (key: string, params?: Record<string, string | number>) => string,
  descriptor: ReturnType<typeof decisionLabel> | ReturnType<typeof claimStatusLabel>,
): string {
  if (!descriptor) return "";
  if ("key" in descriptor) return t(descriptor.key);
  return descriptor.fallback;
}



function recommendationClass(recommendation: DecisionRecommendation) {
  return toneClass(recommendation);
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
  const { t } = useLocale();
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);

  const stanceClass = (stance: string) => toneClass(stance);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-muted">
        {t("copilot.groundedClaims")}
      </h3>
      <ul
        aria-label={t("copilot.claimsAria")}
        className="relative mt-2 space-y-3 pl-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-input"
      >
        {claims.map((claim, index) => {
          const citedEvidence = claim.evidenceIds
            .map((id) => experiment.evidence.find((item) => item.id === id))
            .filter(Boolean);
          const sources = citedEvidence.map((item) => item!.source);
          const expanded = expandedClaim === index;
          const citation = claim.evidenceIds.length === 1
            ? t("copilot.citationOne", { count: claim.evidenceIds.length })
            : t("copilot.citationMany", { count: claim.evidenceIds.length });

          return (
            <li
              key={`${claim.text}-${index}`}
              tabIndex={0}
              aria-label={t("copilot.claimAria", {
                stance: claim.stance,
                text: claim.text,
                citation,
                sources: sources.join(", "),
              })}
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
                  {t("copilot.citationCountInline", { count: claim.evidenceIds.length, plural: claim.evidenceIds.length === 1 ? "" : "s" })}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground/80">
                {claim.text}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {t("copilot.sourceLabel", { sources: sources.join(", ") || t("copilot.noneCited") })}
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
                        {t("copilot.noMatchingEvidence")}
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
  const { t } = useLocale();
  const firstReadyExperiment = execution.experiments.find(
    (experiment) => experiment.evidence.length > 0,
  );
  const [requestedExperimentId, setRequestedExperimentId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [revealStep, setRevealStep] = useState(0);
  const revealTimerRef = useRef<number | null>(null);
  const lastBriefIdRef = useRef<string | null>(null);
  const batchAbortRef = useRef<AbortController | null>(null);
  const singleAbortRef = useRef<AbortController | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0, currentName: "" });
  const [briefHistory, setBriefHistory] = useState<Record<string, Array<NonNullable<ValidationExperiment["decisionBrief"]>>>>(() => { return {}; });
  const HISTORY_CAP = 5;
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

  const pendingBatch = execution.experiments.filter(
    (item) => item.evidence.length > 0 && !item.decisionBrief,
  );
  const batchDisabledReason =
    isBatchGenerating
      ? t("copilot.batchInProgressReason")
      : isGenerating
        ? t("copilot.waitSingleReason")
        : pendingBatch.length === 0
          ? t("copilot.noReadyReason")
          : "";
  const generateDisabledReason =
    isGenerating
      ? t("copilot.synthesizingReason")
      : !experiment
        ? t("copilot.selectHypothesisReason")
        : experiment.evidence.length === 0
          ? t("copilot.needEvidenceReason")
          : "";
  const historyForExperiment = experiment ? ((briefHistory[experiment.id] && briefHistory[experiment.id].length > 0) ? briefHistory[experiment.id] : (experiment.decisionBriefHistory ?? [])).filter((b) => !currentBrief || b.generatedAt !== currentBrief.generatedAt).slice(0, HISTORY_CAP) : [];

  const briefCount = useMemo(
    () =>
      execution.experiments.filter(
        (item) => item.decisionBrief && decisionBriefIsCurrent(item),
      ).length,
    [execution],
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

    const recommendationText = resolveLabel(t, decisionLabel(rec));
    const newDecision = `${recommendationText} - ${headline}`;
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

    setNotice(t("copilot.applyNotice"));
    setSrGenerationAnnouncement(t("copilot.applySr"));
  }


  function cancelBatch() {
    batchAbortRef.current?.abort();
  }

  function cancelSingle() {
    singleAbortRef.current?.abort();
  }

  async function generateBatchBriefs() {
    const pending = execution.experiments.filter(
      (item) => item.evidence.length > 0 && !item.decisionBrief,
    );
    if (pending.length === 0) {
      setNotice(t("copilot.batchNoopNotice"));
      return;
    }

    setIsBatchGenerating(true);
    setBatchProgress({ done: 0, total: pending.length, currentName: pending[0]?.assumption ?? "" });
    setError("");
    setNotice("");
    setSrGenerationAnnouncement(
      t("copilot.batchStartSr", { count: pending.length }),
    );

    let successCount = 0;
    let failCount = 0;
    const failedNames: string[] = [];
    let cancelled = false;
    const abort = new AbortController();
    batchAbortRef.current = abort;
    const updatedExperiments = [...execution.experiments];

    for (let i = 0; i < pending.length; i++) {
      if (abort.signal.aborted) { cancelled = true; break; }
      const item = pending[i];
      try {
        const source = decisionSourceFromExperiment(item);
        const response = await fetch("/api/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experiment: source }),
          signal: abort.signal,
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
                        // Flush incrementally: each brief appears immediately and survives cancel/unload.
                        onChange({ ...execution, experiments: updatedExperiments.slice(), updatedAt: new Date().toISOString() });
        } else {
          failCount += 1;
        }
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") { cancelled = true; break; }
        failCount += 1;
      }
      setBatchProgress({ done: i + 1, total: pending.length, currentName: item.assumption.length > 60 ? item.assumption.slice(0, 60) + '...' : item.assumption });
    }

    batchAbortRef.current = null;
    setIsBatchGenerating(false);
    if (cancelled) {
      const remaining = pending.length - successCount - failCount;
      const msg = t("copilot.batchCancelledNotice", {
        success: successCount,
        total: pending.length,
        fail: failCount,
        pending: remaining > 0 ? t("copilot.batchCancelledPending", { count: remaining }) : "",
      });
      setNotice(msg);
      setSrGenerationAnnouncement(msg);
      if (successCount > 0) {
        onChange({ ...execution, experiments: updatedExperiments, updatedAt: new Date().toISOString() });
      }
      return;
    }
    onChange({
      ...execution,
      experiments: updatedExperiments,
      updatedAt: new Date().toISOString(),
    });
    const summary = t("copilot.batchSummaryNotice", { success: successCount, total: pending.length });
    let srSummary = summary;
    if (failCount > 0) {
      const listed = failedNames.slice(0, 3);
      const extra = failedNames.length > listed.length ? t("copilot.batchMore", { count: failedNames.length - listed.length }) : "";
      srSummary = t("copilot.batchFailedSr", { summary, fail: failCount, listed: listed.join("; "), extra });
    }
    if (failCount > 0) {
      setError(srSummary);
    } else {
      setNotice(summary);
    }
    setSrGenerationAnnouncement(srSummary);
  }

  const generateBrief = useCallback(async () => {
    if (!experiment || experiment.evidence.length === 0) {
      setError(t("copilot.needEvidenceError"));
      return;
    }

    const source = decisionSourceFromExperiment(experiment);
    const abort = new AbortController();
    singleAbortRef.current?.abort();
    singleAbortRef.current = abort;
    setIsGenerating(true);
    setError("");
    setNotice("");
    setSrGenerationAnnouncement(t("copilot.generatingSr"));

    try {
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experiment: source }),
        signal: abort.signal,
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
            ? t("copilot.rateLimitError")
            : briefInvalid
              ? t("copilot.parseError")
              : t("copilot.genFailedError");
        const errorCode = briefInvalid ? "decision_invalid_response" : data.code;
        throw new Error(friendlyApiMessage(errorCode, data.error ?? fallback));
      }

      // capture prior brief in local history before overwriting
        setBriefHistory((prev) => {
          const prior = experiment.decisionBrief;
          if (!prior) return prev;
          const list = prev[experiment.id] ?? [];
          if (list.some((b) => b.generatedAt === prior.generatedAt)) return prev;
          const next = [prior, ...list].slice(0, HISTORY_CAP);
          return { ...prev, [experiment.id]: next };
        });
        const priorList = experiment.decisionBrief ? [experiment.decisionBrief, ...(experiment.decisionBriefHistory ?? [])] : (experiment.decisionBriefHistory ?? []);
        const dedup = priorList.filter((b: NonNullable<ValidationExperiment["decisionBrief"]>) => b.generatedAt !== brief.generatedAt).slice(0, HISTORY_CAP);
        const finalList = dedup.length ? dedup : undefined;
        // push prior to local ui history
        setBriefHistory((prev) => {
          const list = prev[experiment.id] ?? [];
          if (!experiment.decisionBrief) return prev;
          if (list.some((b) => b.generatedAt === experiment.decisionBrief!.generatedAt)) return prev;
          return { ...prev, [experiment.id]: [experiment.decisionBrief, ...list].slice(0, HISTORY_CAP) };
        });
        // persist via saveBrief wrapper: save both current brief and history in one onChange
        onChange({
          ...execution,
          experiments: execution.experiments.map((it) => it.id === experiment.id ? { ...it, decisionBrief: brief, decisionBriefHistory: finalList } : it),
          updatedAt: new Date().toISOString(),
        });
      const modeLabel = data.mode === "real" ? t("copilot.realProviderLabel") : t("copilot.demoLabel");
      setNotice(
        data.usedFallback
          ? t("copilot.fallbackNotice")
          : t("copilot.realSavedNotice", { mode: modeLabel }),
      );
      setSrGenerationAnnouncement(
        data.usedFallback
          ? t("copilot.fallbackSavedSr")
          : t("copilot.realSavedSr", { mode: modeLabel }),
      );
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setNotice(t("copilot.cancelledNotice"));
        setSrGenerationAnnouncement(t("copilot.cancelledSr"));
      } else {
        const msg =
          caught instanceof Error
            ? caught.message
            : t("copilot.genFailedError");
        setError(msg);
        setSrGenerationAnnouncement(t("copilot.genFailedSr", { msg }));
      }
    } finally {
      setIsGenerating(false);
      if (singleAbortRef.current === abort) singleAbortRef.current = null;
    }
  // Including execution and onChange in the dependency array keeps the linter happy without changing semantics (they both change on every parent render, which re-creates this callback already).
  }, [experiment, setSrGenerationAnnouncement, execution, onChange, t]);


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
    <section className="overflow-hidden rounded-md border border-card bg-card shadow-[0_24px_80px_-68px_rgba(17,19,18,0.55)]">
      <div className="flex flex-col gap-4 border-b border-card p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
            <BrainCircuit className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t("copilot.title")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              {t("copilot.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border border-input bg-card px-3 py-2 text-foreground/80">
            {t("copilot.briefCount", { count: briefCount, total: execution.experiments.length })}
          </span>
          <span className="flex items-center gap-1 rounded-md border border-input bg-card px-3 py-2 font-semibold text-signal-supports">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {t("copilot.evidenceBound")}
          </span>
          <button
            type="button"
            onClick={generateBatchBriefs}
            disabled={!!batchDisabledReason}
            aria-busy={isBatchGenerating}
            aria-describedby={batchDisabledReason ? "decision-batch-generate-reason" : undefined}
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
                    {batchProgress.currentName || t("copilot.preparing")}
                  </span>
                </span>
              ) : (
                t("copilot.generateAllBriefs")
              )}
          </button>

          {batchDisabledReason && (
            <p id="decision-batch-generate-reason" className="sr-only">{batchDisabledReason}</p>
          )}
          {isBatchGenerating && (
            <button type="button" onClick={cancelBatch} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted underline-offset-2 transition hover:text-challenges hover:underline">
              {t("copilot.cancelBatch")}
            </button>
          )}
        </div>
        {isBatchGenerating && batchProgress.total > 0 && (
          <div className="border-t border-card bg-input/40 px-5 py-2">
            <span role="status" aria-live="polite" className="sr-only">{t("copilot.batchSrReady", { done: batchProgress.done, total: batchProgress.total, name: batchProgress.currentName })}</span>
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
              <span>
                {t("copilot.batchGenerating", { done: batchProgress.done, total: batchProgress.total })}
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
              aria-label={t("copilot.batchProgressAria")}
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
              {t("copilot.hypothesis")}
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
                  {t("copilot.hypothesisOption", { index: index + 1, count: item.evidence.length, status: item.status })}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 rounded-md border border-input bg-input p-4">
            <p className="text-sm font-semibold leading-6 text-foreground">
              {experiment?.assumption ?? t("copilot.noHypothesis")}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted">
              <div>
                <dt>{t("copilot.evidence")}</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {experiment?.evidence.length ?? 0}
                </dd>
              </div>
              <div>
                <dt>{t("copilot.confidence")}</dt>
                <dd className="mt-1 font-semibold capitalize text-foreground">
                  {experiment?.confidence ?? "low"}
                </dd>
              </div>
            </dl>
          </div>

          {currentBrief && (
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
              <span>{t("copilot.lastGenerated", { time: formatValidationTimelineTime(currentBrief.generatedAt) })}</span>
              {experiment && !decisionBriefIsCurrent(experiment) && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">{t("copilot.staleBadge")}</span>
              )}
            </div>
          )}
          {currentBrief && historyForExperiment.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">{t("copilot.previousRecs")}</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("copilot.restoreAriaGroup")}>
                {historyForExperiment.map((brief, idx) => {
                  const rec = brief.recommendation;
                  const recLabel = resolveLabel(t, decisionLabel(rec));
                  const time = formatValidationTimelineTime(brief.generatedAt);
                  return (
                    <button
                      key={brief.generatedAt}
                      type="button"
                      onClick={() => { if (!experiment) return; const remaining = historyForExperiment.filter((b) => b.generatedAt !== brief.generatedAt); onChange({ ...execution, experiments: execution.experiments.map((it) => it.id === experiment.id ? { ...it, decisionBrief: brief, decisionBriefHistory: (remaining.length ? remaining.slice(0, HISTORY_CAP) : undefined) } : it), updatedAt: new Date().toISOString() }); setBriefHistory((prev) => ({ ...prev, [experiment.id]: remaining.slice(0, HISTORY_CAP) })); setNotice(t("copilot.restoreNotice", { version: historyForExperiment.length - idx, time })); }}
                      title={t("copilot.restoreTitle", { rec: rec.toUpperCase(), time })}
                      aria-label={t("copilot.restoreAria", { rec: recLabel, time })}
                      className={"rounded-full border px-2 py-0.5 text-[11px] font-medium transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " + recommendationClass(rec)}
                    >
                      v{historyForExperiment.length - idx} {recLabel}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => { if (!experiment) return; setBriefHistory((prev) => ({ ...prev, [experiment.id]: [] })); onChange({ ...execution, experiments: execution.experiments.map((it) => it.id === experiment.id ? { ...it, decisionBriefHistory: undefined } : it), updatedAt: new Date().toISOString() }); setNotice(t("copilot.historyClearedNotice")); }} className="text-[10px] uppercase tracking-wide text-muted underline-offset-2 hover:text-foreground hover:underline">{t("copilot.clearHistory")}</button>
            </div>
          )},
          <button
            ref={generateButtonRef}
            type="button"
            onClick={generateBrief}
            disabled={!!generateDisabledReason}
            aria-busy={isGenerating}
            aria-describedby={"decision-generation-status" + (generateDisabledReason ? " decision-generate-reason" : "")}
            title={t("copilot.generateTitle")}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              ? t("copilot.synthesizing")
              : currentBrief
                ? t("copilot.regenerate")
                : t("copilot.generate")}
          </button>

          {generateDisabledReason && !isGenerating && (
            <p id="decision-generate-reason" className="sr-only">{generateDisabledReason}</p>
          )}
          {isGenerating && (
            <button type="button" onClick={cancelSingle} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted underline-offset-2 transition hover:text-challenges hover:underline">
              {t("copilot.cancelGeneration")}
            </button>
          )}

          {currentBrief && experiment && (() => {
            const rec = currentBrief.recommendation;
            let newStatus: string = experiment.status;
            if (rec === "proceed") newStatus = "supported";
            else if (rec === "pivot" || rec === "pause") newStatus = "refuted";
            else if (rec === "iterate") newStatus = "testing";
            const nextAction = currentBrief.nextActions?.[0] || experiment.nextAction || "";
            const newDecision = resolveLabel(t, decisionLabel(rec)) + " - " + (currentBrief.headline || "");
            const changed = (a: string, b: string) => (a || "").trim() !== (b || "").trim();
            const emptyLabel = t("copilot.emptyPlaceholder");
            const fields: Array<{k: string; from: string; to: string}> = [];
            if (changed(experiment.status, newStatus)) fields.push({ k: t("copilot.fieldStatus"), from: resolveLabel(t, claimStatusLabel(experiment.status)), to: resolveLabel(t, claimStatusLabel(newStatus)) });
            if (changed(experiment.decision || "", newDecision)) fields.push({ k: t("copilot.fieldDecision"), from: experiment.decision || emptyLabel, to: newDecision });
            if (changed(experiment.nextAction || "", nextAction)) fields.push({ k: t("copilot.fieldNextAction"), from: experiment.nextAction || emptyLabel, to: nextAction });
            return (
              <div className="mt-2">
                {fields.length > 0 && (
                  <div className="mb-2 rounded-md border border-input bg-input/40 p-2 text-[11px]">
                    <p className="mb-1 font-semibold uppercase tracking-wide text-muted">{t("copilot.changesToApply")}</p>
                    <ul className="space-y-1">
                      {fields.map((f) => (
                        <li key={f.k} className="flex gap-2 leading-4">
                          <span className="shrink-0 font-medium text-muted">{f.k}:</span>
                          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-1">
                            <span className="rounded bg-signal-challenges/15 px-1 text-signal-challenges line-through">{f.from}</span>
                            <span className="text-muted">&rarr;</span>
                            <span className="rounded bg-signal-supports/15 px-1 text-signal-supports">{f.to}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  type="button"
                  onClick={applyRecommendation}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-accent bg-transparent px-4 text-sm font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {t("copilot.applyRecommendation")}
                </button>
              </div>
            );
          })()}

          <span id="decision-generation-status" role="status" aria-live="polite" className="sr-only">
            {srGenerationAnnouncement}
          </span>

          {!experiment?.evidence.length && (
            <p className="mt-3 text-xs leading-5 text-muted">
              {t("copilot.recordEvidenceHint")}
            </p>
          )}
          {experiment?.decisionBrief && !currentBrief && (
            <p className="mt-3 flex gap-2 text-xs leading-5 text-signal-challenges">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              {t("copilot.evidenceChangedWarn")}
            </p>
          )}
          {(notice || error) && (
            <p
              role={error ? "alert" : "status"}
              className={`mt-3 rounded-md border px-3 py-2 text-xs leading-5 ${
                error
                  ? "border-signal-challenges bg-signal-challenges text-signal-challenges"
                  : "border-signal-supports bg-card text-signal-supports"
              }`}
            >
              {error || notice}
            </p>
          )}
        </div>

        {isGenerating ? (
          <div className="min-h-64 rounded-md border border-dashed border-input bg-input p-6" role="status" aria-live="polite" aria-busy="true" aria-label={t("copilot.synthesizingAria")}>
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
              {t("copilot.weighingSignals")}
            </p>
          </div>
        ) : currentBrief && experiment ? (
          <article className="min-w-0 motion-safe:animate-[launchlens-fade-in-up_260ms_ease-out_both]">
            <div
              className={`space-y-4 transition-opacity duration-300 ${
                revealStep >= 1 ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold ${recommendationClass(currentBrief.recommendation)}`}
                >
                  {resolveLabel(t, decisionLabel(currentBrief.recommendation))}
                </span>
                {currentBrief.usedFallback ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-signal-challenges/40 px-2 py-1 text-[10px] font-semibold uppercase text-signal-challenges"
                    title={t("copilot.fallbackTagTitle")}
                  >
                    <span className="size-1.5 rounded-full bg-signal-challenges" />
                    {t("copilot.fallbackTag")}
                  </span>
                ) : currentBrief.mode === "real" ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-signal-supports/15 px-2 py-1 text-[10px] font-semibold uppercase text-signal-supports"
                    title={t("copilot.aiTagTitle")}
                  >
                    <span className="size-1.5 rounded-full bg-signal-supports" />
                    {t("copilot.aiTag")}
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase text-muted"
                    title={t("copilot.demoTagTitle")}
                  >
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    {t("copilot.demoTag")}
                  </span>
                )}
                <span className="text-xs capitalize text-muted">
                  {t("copilot.cited", { provider: currentBrief.provider, count: citationCount })}
                </span>
              </div>
              <div className="rounded-md border border-input bg-input p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-foreground">
                    {t("copilot.evidenceStrength")}
                  </span>
                  <span
                    className={`font-semibold ${evidenceStrengthMeta[currentBrief.evidenceStrength].color}`}
                  >
                    {t(evidenceStrengthMeta[currentBrief.evidenceStrength].key)}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={
                    evidenceStrengthMeta[currentBrief.evidenceStrength].pct
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t("copilot.evidenceStrengthAria")}
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={`h-full rounded-full ${evidenceStrengthMeta[currentBrief.evidenceStrength].bg} transition-all duration-500 ease-out`}
                    style={{
                      width: `${evidenceStrengthMeta[currentBrief.evidenceStrength].pct}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <h3
              className={`mt-4 text-xl font-semibold leading-8 text-foreground transition-opacity duration-300 ${
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
                title={t("copilot.unresolvedRisks")}
                items={currentBrief.unresolvedRisks}
                empty={t("copilot.noRisk")}
              />
              <TextList
                title={t("copilot.nextActions")}
                items={currentBrief.nextActions}
                empty={t("copilot.noNextAction")}
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
                {t("copilot.emptyTitle")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t("copilot.emptyBody")}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

