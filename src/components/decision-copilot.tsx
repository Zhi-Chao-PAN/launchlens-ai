"use client";

import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/skeleton";

import {
  decisionBriefIsCurrent,
  decisionSourceFromExperiment,
  normalizeDecisionBrief,
  type DecisionGenerationResult,
  type DecisionRecommendation,
  type GroundedClaim,
} from "@/lib/launchlens/decision";
import type {
  ValidationExperiment,
  WorkspaceExecutionState,
} from "@/lib/launchlens/execution";
import { friendlyApiMessage } from "@/lib/launchlens/api-errors";

type DecisionCopilotProps = {
  execution: WorkspaceExecutionState;
  onChange: (execution: WorkspaceExecutionState) => void;
};

const recommendationLabels: Record<DecisionRecommendation, string> = {
  proceed: "Proceed",
  iterate: "Iterate",
  pivot: "Pivot",
  pause: "Pause",
};

function recommendationClass(recommendation: DecisionRecommendation) {
  if (recommendation === "proceed") {
    return "bg-[#e5f4ef] text-[#0f766e]";
  }

  if (recommendation === "pivot") {
    return "bg-[#fff0eb] text-[#9a432d]";
  }

  if (recommendation === "iterate") {
    return "bg-[#f6df8f] text-[#493b08]";
  }

  return "bg-[#eef0ed] text-[#607069]";
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
      <h3 className="text-xs font-semibold uppercase text-[#607069]">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex gap-2 text-sm leading-6 text-[#40504a]"
            >
              <CheckCircle2
                className="mt-1 size-4 shrink-0 text-[#138a72]"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[#607069]">{empty}</p>
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
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-[#607069]">
        Grounded claims
      </h3>
      <ul aria-label="Evidence-grounded claims" className="mt-2 space-y-3">
        {claims.map((claim, index) => {
          const sources = claim.evidenceIds
            .map(
              (id) =>
                experiment.evidence.find((item) => item.id === id)?.source,
            )
            .filter(Boolean);

          return (
            <li
              key={`${claim.text}-${index}`}
              role="group"
              tabIndex={0}
              aria-label={`${claim.stance} claim: ${claim.text}. ${claim.evidenceIds.length} citation${claim.evidenceIds.length === 1 ? "" : "s"} from ${sources.join(", ")}.`}
              className="rounded-md bg-[#f6f8f4] p-3 outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold capitalize text-[#40504a]">
                  {claim.stance}
                </span>
                <span className="text-xs text-[#607069]">
                  {claim.evidenceIds.length} citation
                  {claim.evidenceIds.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#40504a]">
                {claim.text}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#607069]">
                Source: {sources.join(", ")}
              </p>
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
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [srGenerationAnnouncement, setSrGenerationAnnouncement] = useState("");
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

  function saveBrief(
    experimentId: string,
    brief: ValidationExperiment["decisionBrief"],
  ) {
    onChange({
      experiments: execution.experiments.map((item) =>
        item.id === experimentId ? { ...item, decisionBrief: brief } : item,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  async function generateBrief() {
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
  }

  return (
    <section className="rounded-lg border border-[#d8ded4] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#edf0ea] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#e9e7f7] text-[#554a8b]">
            <BrainCircuit className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[#17201d]">
              AI decision copilot
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#607069]">
              Synthesize only recorded evidence into a cautious recommendation,
              counter-signals, risks, and next actions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md bg-[#eef0ed] px-3 py-2 text-[#40504a]">
            {briefCount}/{execution.experiments.length} current briefs
          </span>
          <span className="flex items-center gap-1 rounded-md bg-[#e5f4ef] px-3 py-2 font-semibold text-[#0f766e]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Evidence-bound
          </span>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[280px_1fr]">
        <div>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase text-[#607069]">
              Hypothesis
            </span>
            <select
              value={selectedExperimentId}
              onChange={(event) => {
                setRequestedExperimentId(event.target.value);
                setError("");
                setNotice("");
              }}
              className="h-11 w-full rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 text-sm text-[#17201d] outline-none focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
            >
              {execution.experiments.map((item, index) => (
                <option key={item.id} value={item.id}>
                  H{index + 1} | {item.evidence.length} evidence | {item.status}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 rounded-md bg-[#f6f8f4] p-4">
            <p className="text-sm font-semibold leading-6 text-[#17201d]">
              {experiment?.assumption ?? "No hypothesis available"}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-[#607069]">
              <div>
                <dt>Evidence</dt>
                <dd className="mt-1 font-semibold text-[#17201d]">
                  {experiment?.evidence.length ?? 0}
                </dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd className="mt-1 font-semibold capitalize text-[#17201d]">
                  {experiment?.confidence ?? "low"}
                </dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={generateBrief}
            disabled={
              isGenerating || !experiment || experiment.evidence.length === 0
            }
            aria-busy={isGenerating}
            aria-describedby="decision-generation-status"
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#138a72] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f7665] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cbe8df] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-white/80 [animation-delay:-0.32s]" />
                <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-white/80 [animation-delay:-0.16s]" />
                <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-white/80" />
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
          <span id="decision-generation-status" role="status" aria-live="polite" className="sr-only">
            {srGenerationAnnouncement}
          </span>

          {!experiment?.evidence.length && (
            <p className="mt-3 text-xs leading-5 text-[#607069]">
              Record evidence in the validation loop before asking AI for a
              recommendation.
            </p>
          )}
          {experiment?.decisionBrief && !currentBrief && (
            <p className="mt-3 flex gap-2 text-xs leading-5 text-[#8b3d28]">
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
                  ? "border-[#e7c9bd] bg-[#fff6f1] text-[#8b3d28]"
                  : "border-[#cfe2db] bg-[#eef8f4] text-[#0f766e]"
              }`}
            >
              {error || notice}
            </p>
          )}
        </div>

        {isGenerating ? (
          <div className="min-h-64 rounded-md border border-dashed border-[#cfd8d1] bg-[#fbfcfa] p-6" role="status" aria-live="polite" aria-busy="true" aria-label="Synthesizing evidence">
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
            <p className="mt-5 flex items-center gap-2 text-xs text-[#607069]">
              <BrainCircuit className="size-4 animate-pulse text-[#8378aa]" aria-hidden="true" />
              Weighing signals against counter-signals…
            </p>
          </div>
        ) : currentBrief && experiment ? (
          <article className="min-w-0 motion-safe:animate-[launchlens-fade-in-up_260ms_ease-out_both]">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-1 text-xs font-semibold ${recommendationClass(currentBrief.recommendation)}`}
              >
                {recommendationLabels[currentBrief.recommendation]}
              </span>
              <span className="text-xs capitalize text-[#607069]">
                {currentBrief.evidenceStrength} evidence
              </span>
              <span className="text-xs text-[#607069]">
                {currentBrief.provider} | {citationCount} cited
              </span>
            </div>
            <h3 className="mt-3 text-xl font-semibold leading-8 text-[#17201d]">
              {currentBrief.headline}
            </h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
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
          <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-[#cfd8d1] bg-[#fbfcfa] p-8 text-center">
            <div className="max-w-md">
              <BrainCircuit
                className="mx-auto size-8 text-[#8378aa]"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-base font-semibold text-[#17201d]">
                Evidence first, AI second
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#607069]">
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
