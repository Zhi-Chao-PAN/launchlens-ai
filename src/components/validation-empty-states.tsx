"use client";

import { Archive, Plus, Search, Target } from "lucide-react";

export type ValidationEmptyStatesProps = {
  activeCount: number;
  archivedCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onShowArchived: () => void;
  onAddHypothesis: () => void;
};

export function ValidationEmptyStates({
  activeCount,
  archivedCount,
  hasActiveFilters,
  onClearFilters,
  onShowArchived,
  onAddHypothesis,
}: ValidationEmptyStatesProps) {
  if (activeCount > 0) {
    return null;
  }

  if (hasActiveFilters) {
    return (
      <div className="mt-10 flex flex-col items-center gap-2 rounded-md border border-dashed border-input bg-muted/30 py-12 text-center">
        <Search className="size-6 text-muted/50" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground/70">
          No hypotheses match your current filters
        </p>
        <p className="text-xs text-muted">
          Try clearing your search, tag, or status filter.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-2 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium hover:border-accent"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  if (archivedCount > 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-2 rounded-md border border-dashed border-input bg-muted/30 py-10 text-center">
        <Archive className="size-6 text-muted/60" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground/70">
          All your hypotheses are archived
        </p>
        <p className="max-w-md text-xs leading-5 text-muted">
          Active hypotheses appear here. Expand the archived section below to
          restore one, or add a new hypothesis to begin validating again.
        </p>
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={onShowArchived}
            className="rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium hover:border-accent"
          >
            Show archived ({archivedCount})
          </button>
          <button
            type="button"
            onClick={onAddHypothesis}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-text hover:bg-primary-hover"
          >
            <Plus className="size-3.5" aria-hidden="true" /> New hypothesis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-muted/30 py-14 text-center">
      <Target className="size-8 text-accent/60" aria-hidden="true" />
      <p className="text-base font-semibold text-foreground">
        Map out your first validation hypotheses
      </p>
      <p className="max-w-md text-sm leading-6 text-muted">
        Each card captures one risky assumption. Add the boldest bets first,
        then attach evidence as you learn.
      </p>
      <button
        type="button"
        onClick={onAddHypothesis}
        className="mt-1 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Plus className="size-4" aria-hidden="true" /> Add your first hypothesis
      </button>
    </div>
  );
}
