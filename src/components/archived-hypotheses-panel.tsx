"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { ValidationExperiment } from "@/lib/launchlens/execution";
import {
  archivedStatusSummary,
  archivedStatusToneClass,
  experimentStatusLabel,
} from "@/lib/launchlens/experiment-status-labels";

export type ArchivedHypothesesPanelProps = {
  experiments: ValidationExperiment[];
  allExperimentIds: string[];
  open: boolean;
  onToggle: () => void;
  onUnarchive: (experimentId: string) => void;
};

export function ArchivedHypothesesPanel({
  experiments,
  allExperimentIds,
  open,
  onToggle,
  onUnarchive,
}: ArchivedHypothesesPanelProps) {
  if (experiments.length === 0) {
    return null;
  }

  const summary = archivedStatusSummary(experiments);

  return (
    <div className="mt-4 rounded-lg border border-dashed border-input bg-muted/30 p-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "Collapse archived hypotheses" : "Expand archived hypotheses"}
        title={
          open
            ? "Collapse archived hypotheses"
            : `${experiments.length} archived hypothesis/hypotheses. Click to expand.`
        }
        className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold uppercase text-muted transition hover:text-foreground"
      >
        <span>
          Archived ({experiments.length})
          {summary ? (
            <span className="ml-2 font-normal normal-case tracking-normal text-muted/70">
              {summary}
            </span>
          ) : null}
        </span>
        {open ? (
          <ChevronUp className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-3.5" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="mt-2 divide-y divide-border/50">
          {experiments.map((experiment) => {
            const index = allExperimentIds.indexOf(experiment.id);

            return (
              <div
                key={experiment.id}
                className="flex items-center gap-2 py-2 text-sm opacity-70"
              >
                <button
                  type="button"
                  onClick={() => onUnarchive(experiment.id)}
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted transition hover:bg-muted hover:text-foreground"
                >
                  Unarchive
                </button>
                <span className="font-mono text-[10px] text-signal-challenges/70">
                  H{index + 1}
                </span>
                <span
                  className={
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold " +
                    archivedStatusToneClass(experiment.status)
                  }
                >
                  {experimentStatusLabel(experiment.status)}
                </span>
                <span className="truncate text-foreground/70">
                  {experiment.assumption}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
