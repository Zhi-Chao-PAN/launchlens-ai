"use client";

import type { Ref } from "react";
import { Filter, Search, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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
  labelKey: "vFilter.statusAll" | "vFilter.statusActive" | "vFilter.statusDecided";
  count: (props: ValidationBoardFilterBarProps) => number;
}> = [
  { id: "all", labelKey: "vFilter.statusAll", count: (props) => props.experimentCount },
  { id: "active", labelKey: "vFilter.statusActive", count: (props) => props.activeCount },
  { id: "decided", labelKey: "vFilter.statusDecided", count: (props) => props.decidedCount },
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
  const { t } = useLocale();

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 xl:flex-row xl:items-center">
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        <Filter className="size-3.5 text-muted" aria-hidden="true" />
        <div
          role="tablist"
          aria-label={t("vFilter.ariaLabel")}
          className="flex flex-wrap gap-0.5"
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={statusFilter === tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === tab.id
                  ? "bg-accent text-primary-text"
                  : "text-muted hover:bg-muted hover:text-foreground"
              }`}
            >
              {t(tab.labelKey)}
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
              {t("vFilter.tagsLabel")}
            </span>
            <button
              type="button"
              onClick={() => onTagFilterChange(null)}
              title={t("vFilter.anyTagTitle")}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${
                tagFilter === null
                  ? "bg-accent text-primary-text"
                  : "bg-muted text-muted hover:text-foreground"
              }`}
            >
              {t("vFilter.anyTag")}
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
                    ? t("vFilter.clearTagTitle", { tag })
                    : t("vFilter.filterTagTitle", { tag })
                }
                aria-label={t("vFilter.filterTagAria", { tag })}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${
                  tagFilter === tag
                    ? "bg-accent text-primary-text"
                    : "bg-muted text-muted hover:text-foreground"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="relative min-w-[11rem] flex-1 sm:flex-none">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={t("vFilter.searchPlaceholder")}
            aria-label={t("vFilter.searchAria")}
            className="h-7 w-full rounded-md border border-input bg-card pl-7 pr-6 text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)] sm:w-40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              aria-label={t("vFilter.clearSearch")}
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
          title={t("vFilter.sortTitle")}
          className="h-7 max-w-full rounded-md border border-input bg-card px-2 py-1 text-xs font-semibold text-foreground/70 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          aria-label={t("vFilter.sortAria")}
        >
          <option value="default">{t("vFilter.sortDefault")}</option>
          <option value="confidence">{t("vFilter.sortConfidence")}</option>
          <option value="status">{t("vFilter.sortStatus")}</option>
          <option value="progress">{t("vFilter.sortEvidence")}</option>
        </select>
      </div>
    </div>
  );
}
