"use client";

import type { ExperimentStatus } from "@/lib/launchlens/execution";

export type ValidationBatchTagMode = "add" | "remove" | null;

export type ValidationTagUsage = {
  tag: string;
  count: number;
};

export type ValidationSelectedTags = {
  union: Set<string>;
  intersection: Set<string>;
};

export type ValidationBulkActionsToolbarProps = {
  batchCount: number;
  batchTagInput: string;
  batchTagMode: ValidationBatchTagMode;
  allWorkspaceTags: ValidationTagUsage[];
  selectedTags: ValidationSelectedTags;
  isBatchBriefing: boolean;
  batchBriefProgress: { done: number; total: number };
  onSelectAll: () => void;
  onSetStatus: (status: ExperimentStatus) => void;
  onBatchTagModeChange: (mode: ValidationBatchTagMode) => void;
  onBatchTagInputChange: (value: string) => void;
  onApplyBatchTagInput: (mode: Exclude<ValidationBatchTagMode, null>) => void;
  onBatchAddTag: (tag: string) => void;
  onBatchRemoveTag: (tag: string) => void;
  onGenerateBriefs: () => void | Promise<void>;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
};

const actionClass = "rounded px-2 py-1 hover:bg-muted";

export function ValidationBulkActionsToolbar({
  batchCount,
  batchTagInput,
  batchTagMode,
  allWorkspaceTags,
  selectedTags,
  isBatchBriefing,
  batchBriefProgress,
  onSelectAll,
  onSetStatus,
  onBatchTagModeChange,
  onBatchTagInputChange,
  onApplyBatchTagInput,
  onBatchAddTag,
  onBatchRemoveTag,
  onGenerateBriefs,
  onArchive,
  onDelete,
  onClear,
}: ValidationBulkActionsToolbarProps) {
  if (batchCount <= 0) {
    return null;
  }

  const addableTags = allWorkspaceTags
    .slice(0, 8)
    .filter((tag) => !selectedTags.intersection.has(tag.tag));
  const removableTags = Array.from(selectedTags.union).slice(0, 8);

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions on selected hypotheses"
      data-hypothesis-bulk-toolbar
      className="flex w-full flex-wrap items-center gap-2 rounded-md border border-accent/60 bg-accent/5 p-2 text-xs"
    >
      <span className="px-1 font-semibold text-foreground">
        {batchCount} selected
      </span>
      <span className="sr-only">
        Shift+click range
      </span>
      <button type="button" onClick={onSelectAll} className={actionClass}>
        All
      </button>
      <span className="mx-1 h-4 w-px bg-border" />
      <button
        type="button"
        onClick={() => onSetStatus("untested")}
        className={actionClass}
      >
        Mark untested
      </button>
      <button
        type="button"
        onClick={() => onSetStatus("testing")}
        className="rounded px-2 py-1 text-accent hover:bg-muted"
      >
        Mark testing
      </button>
      <button
        type="button"
        onClick={() => onSetStatus("supported")}
        className="rounded px-2 py-1 text-signal-supports hover:bg-muted"
      >
        Mark supported
      </button>
      <button
        type="button"
        onClick={() => onSetStatus("refuted")}
        className="rounded px-2 py-1 text-signal-challenges hover:bg-muted"
      >
        Mark refuted
      </button>
      <span className="mx-1 h-4 w-px bg-border" />

      <div className="relative">
        <button
          type="button"
          onClick={() =>
            onBatchTagModeChange(batchTagMode === "add" ? null : "add")
          }
          aria-expanded={batchTagMode === "add"}
          className={
            "rounded px-2 py-1 " +
            (batchTagMode === "add" ? "bg-accent text-primary-text" : "hover:bg-muted")
          }
        >
          + Tag
        </button>
        {batchTagMode === "add" && (
          <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-input bg-card p-2 shadow-lg">
            <div className="mb-1.5 flex flex-wrap gap-1">
              {addableTags.map((tag) => (
                <button
                  key={tag.tag}
                  type="button"
                  onClick={() => onBatchAddTag(tag.tag)}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted hover:bg-accent hover:text-primary-text"
                  title={`Add "${tag.tag}" (used ${tag.count}x)`}
                >
                  {tag.tag}
                </button>
              ))}
              {allWorkspaceTags.length === 0 && (
                <span className="text-[10px] text-muted">
                  No existing tags yet.
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={batchTagInput}
                onChange={(event) => onBatchTagInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onApplyBatchTagInput("add");
                  }
                  if (event.key === "Escape") {
                    onBatchTagModeChange(null);
                  }
                }}
                placeholder="new or existing tag"
                className="flex-1 rounded bg-input px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => onApplyBatchTagInput("add")}
                className="rounded bg-accent px-2 py-1 text-xs text-primary-text"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() =>
            onBatchTagModeChange(batchTagMode === "remove" ? null : "remove")
          }
          aria-expanded={batchTagMode === "remove"}
          className={
            "rounded px-2 py-1 " +
            (batchTagMode === "remove"
              ? "bg-signal-challenges text-primary-text"
              : "hover:bg-muted")
          }
        >
          - Tag
        </button>
        {batchTagMode === "remove" && (
          <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-input bg-card p-2 shadow-lg">
            <div className="mb-1.5 flex flex-wrap gap-1">
              {removableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onBatchRemoveTag(tag)}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted hover:bg-signal-challenges hover:text-primary-text"
                  title={`Remove "${tag}"`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.union.size === 0 && (
                <span className="text-[10px] text-muted">
                  No tags on selected.
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={batchTagInput}
                onChange={(event) => onBatchTagInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onApplyBatchTagInput("remove");
                  }
                  if (event.key === "Escape") {
                    onBatchTagModeChange(null);
                  }
                }}
                placeholder="tag to remove"
                className="flex-1 rounded bg-input px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => onApplyBatchTagInput("remove")}
                className="rounded bg-signal-challenges px-2 py-1 text-xs text-primary-text"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {!isBatchBriefing ? (
        <button
          type="button"
          onClick={() => void onGenerateBriefs()}
          className={actionClass}
          title="Generate decision briefs for selected hypotheses with evidence and no brief"
        >
          Briefs
        </button>
      ) : (
        <span className="rounded px-2 py-1 text-xs text-muted">
          {batchBriefProgress.done}/{batchBriefProgress.total}
        </span>
      )}
      <button type="button" onClick={onArchive} className={actionClass}>
        Archive
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded px-2 py-1 text-signal-challenges hover:bg-signal-challenges/10"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto rounded px-2 py-1 text-muted hover:bg-muted hover:text-foreground"
      >
        Clear
      </button>
    </div>
  );
}
