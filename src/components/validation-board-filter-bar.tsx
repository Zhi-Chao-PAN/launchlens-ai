"use client";

import type { Ref } from "react";
import { Filter, Search, X } from "lucide-react";

export type ValidationBoardStatusFilter = "all" | "active" | "decided";
export type ValidationBoardSortMode =
  | "default"
  | "confidence"
  | "status"
  | "progress";

export type ValidationBoardFilterBarProps = {
  experimentCount: number;
  activeCount: number;
  decidedCount: number;
  statusFilter: ValidationBoardStatusFilter;
  sortBy: ValidationBoardSortMode;
  tags: string[];
  tagFilter: string | null;
  searchQuery: string;
  searchInputRef?: Ref<HTMLInputElement>;
  onStatusFilterChange: (status: ValidationBoardStatusFilter) => void;
  onTagFilterChange: (tag: string | null) => void;
  onSearchQueryChange: (query: string) => void;
  onSortByChange: (sortBy: ValidationBoardSortMode) => void;
};

const statusTabs: Array<{
  id: ValidationBoardStatusFilter;
  label: string;
  count: (props: ValidationBoardFilterBarProps) => number;
}> = [
  { id: "all", label: "All", count: (props) => props.experimentCount },
  { id: "active", label: "Active", count: (props) => props.activeCount },
  { id: "decided", label: "Decided", count: (props) => props.decidedCount },
];

export function ValidationBoardFilterBar({
  experimentCount,
  activeCount,
  decidedCount,
  statusFilter,
  sortBy,
  tags,
  tagFilter,
  searchQuery,
  searchInputRef,
  onStatusFilterChange,
  onTagFilterChange,
  onSearchQueryChange,
  onSortByChange,
}: ValidationBoardFilterBarProps) {
  const counts = { experimentCount, activeCount, decidedCount };

  return (
    <>
      <div className="flex items-center gap-1">
        <Filter className="size-3.5 text-muted" aria-hidden="true" />
        <div
          role="tablist"
          aria-label="Filter experiments by status"
          className="flex gap-0.5"
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={statusFilter === tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === tab.id
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1 opacity-70">
                (
                {tab.id === "all"
                  ? counts.experimentCount
                  : tab.id === "active"
                    ? counts.activeCount
                    : counts.decidedCount}
                )
              </span>
            </button>
          ))}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="pr-1 text-[11px] font-semibold uppercase text-muted">
              Tags:
            </span>
            <button
              type="button"
              onClick={() => onTagFilterChange(null)}
              title="Show hypotheses with any tag"
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${
                tagFilter === null
                  ? "bg-accent text-white"
                  : "bg-muted text-muted hover:text-foreground"
              }`}
            >
              all
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  onTagFilterChange(tagFilter === tag ? null : tag)
                }
                title={
                  tagFilter === tag
                    ? `Clear tag filter "${tag}"`
                    : `Filter to hypotheses tagged "${tag}" (click again to clear)`
                }
                aria-label={`Filter by tag ${tag}`}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${
                  tagFilter === tag
                    ? "bg-accent text-white"
                    : "bg-muted text-muted hover:text-foreground"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search..."
          aria-label="Search hypotheses, evidence, tags"
          className="h-7 w-40 rounded-md border border-input bg-card pl-7 pr-6 text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchQueryChange("")}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        )}
      </div>

      <select
        value={sortBy}
        onChange={(event) =>
          onSortByChange(event.target.value as ValidationBoardSortMode)
        }
        title="Default: manual order. Highest confidence: high to low. By status: supported/testing/untested/refuted. Most evidence: evidence count descending."
        className="rounded-md border border-input bg-card px-2 py-1 text-xs font-semibold text-foreground/70 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        aria-label="Sort hypotheses"
      >
        <option value="default">Default order</option>
        <option value="confidence">Highest confidence</option>
        <option value="status">By status</option>
        <option value="progress">Most evidence</option>
      </select>
    </>
  );
}
