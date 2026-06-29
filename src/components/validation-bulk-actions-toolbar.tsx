"use client";

import type { ExperimentStatus } from "@/lib/launchlens/execution";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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
  const { t } = useLocale();
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
      aria-label={t("vBulk.ariaLabel")}
      data-hypothesis-bulk-toolbar
      className="flex w-full flex-wrap items-center gap-2 rounded-md border border-accent/60 bg-accent/5 p-2 text-xs"
    >
      <span className="px-1 font-semibold text-foreground">
        {batchCount} {t("vBulk.selected")}
      </span>
      <span className="sr-only">
        {t("vBulk.shiftRange")}
      </span>
      <button type="button" onClick={onSelectAll} className={actionClass}>
        {t("vBulk.all")}
      </button>
      <span className="mx-1 h-4 w-px bg-border" />
      <button
        type="button"
        onClick={() => onSetStatus("untested")}
        className={actionClass}
      >
        {t("vBulk.markUntested")}
      </button>
      <button
        type="button"
        onClick={() => onSetStatus("testing")}
        className="rounded px-2 py-1 text-accent hover:bg-muted"
      >
        {t("vBulk.markTesting")}
      </button>
      <button
        type="button"
        onClick={() => onSetStatus("supported")}
        className="rounded px-2 py-1 text-signal-supports hover:bg-muted"
      >
        {t("vBulk.markSupported")}
      </button>
      <button
        type="button"
        onClick={() => onSetStatus("refuted")}
        className="rounded px-2 py-1 text-signal-challenges hover:bg-muted"
      >
        {t("vBulk.markRefuted")}
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
          {t("vBulk.addTag")}
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
                  title={t("vBulk.addTagTitle", { tag: tag.tag, count: String(tag.count) })}
                >
                  {tag.tag}
                </button>
              ))}
              {allWorkspaceTags.length === 0 && (
                <span className="text-[10px] text-muted">
                  {t("vBulk.noTagsYet")}
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
                placeholder={t("vBulk.newTagPlaceholder")}
                className="flex-1 rounded bg-input px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => onApplyBatchTagInput("add")}
                className="rounded bg-accent px-2 py-1 text-xs text-primary-text"
              >
                {t("vBulk.add")}
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
          {t("vBulk.removeTag")}
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
                  title={t("vBulk.removeTagTitle", { tag })}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.union.size === 0 && (
                <span className="text-[10px] text-muted">
                  {t("vBulk.noTagsSelected")}
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
                placeholder={t("vBulk.removeTagPlaceholder")}
                className="flex-1 rounded bg-input px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => onApplyBatchTagInput("remove")}
                className="rounded bg-signal-challenges px-2 py-1 text-xs text-primary-text"
              >
                {t("vBulk.remove")}
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
          title={t("vBulk.briefsTitle")}
        >
          {t("vBulk.briefs")}
        </button>
      ) : (
        <span className="rounded px-2 py-1 text-xs text-muted">
          {batchBriefProgress.done}/{batchBriefProgress.total}
        </span>
      )}
      <button type="button" onClick={onArchive} className={actionClass}>
        {t("vBulk.archive")}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded px-2 py-1 text-signal-challenges hover:bg-signal-challenges/10"
      >
        {t("vBulk.delete")}
      </button>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto rounded px-2 py-1 text-muted hover:bg-muted hover:text-foreground"
      >
        {t("vBulk.clear")}
      </button>
    </div>
  );
}
