"use client";
import { registerShortcut, useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

import {
  Check,
  CheckCircle2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  FlaskConical,
  Archive,
  GripVertical,
  Download,
  Copy,
  Link2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Trash2,
  Star,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useDeferredValue, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useSrAnnounce } from "@/hooks/use-sr-announce";
import { parseInlineMarkdown } from "@/lib/launchlens/inline-markdown";
import { decisionSourceFromExperiment, normalizeDecisionBrief } from "@/lib/launchlens/decision";
import { extractSourceUrl } from "@/lib/launchlens/source-url";
import { statusClass } from "@/lib/launchlens/status-class";
import { tagStyle } from "@/lib/launchlens/tag-style";
import { evidenceId } from "@/lib/launchlens/evidence-id";
import { titleCase } from "@/lib/launchlens/title-case";
import { patchEvidenceFilter } from "@/lib/launchlens/evidence-filter-patch";
import { SIGNAL_LABELS, WEIGHT_LABELS } from "@/lib/launchlens/evidence-labels";
import {
  SIGNAL_DESCRIPTIONS,
  WEIGHT_DESCRIPTIONS,
} from "@/lib/launchlens/evidence-descriptions";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FilterChip } from "@/components/filter-chip";
import { ArchivedHypothesesPanel } from "@/components/archived-hypotheses-panel";
import {
  ValidationBoardFilterBar,
  type ValidationBoardSortMode,
  type ValidationBoardStatusFilter,
} from "@/components/validation-board-filter-bar";
import { ValidationBoardExportMenu } from "@/components/validation-board-export-menu";
import { ValidationBoardFooter } from "@/components/validation-board-footer";
import { ValidationEmptyStates } from "@/components/validation-empty-states";
import {
  ValidationBulkActionsToolbar,
  type ValidationBatchTagMode,
} from "@/components/validation-bulk-actions-toolbar";
import { ValidationHistoryPreview } from "@/components/validation-history-preview";
import { ValidationTimeline } from "@/components/validation-timeline";
import { copyTextToClipboard, downloadTextFile } from "@/lib/launchlens/clipboard";
import { EXPERIMENT_STATUS_LABELS } from "@/lib/launchlens/experiment-status-labels";
import {
  createNewValidationExperiment,
  isDuplicateAssumption,
} from "@/lib/launchlens/new-validation-experiment";
import {
  formatValidationObservedDate,
  formatValidationObservedDateTitle,
} from "@/lib/launchlens/validation-date-format";
import {
  validationBoardFilename,
  validationBoardToJson,
  validationBoardToMarkdown,
  validationExperimentFilename,
  validationExperimentToJson,
  validationExperimentToMarkdown,
} from "@/lib/launchlens/validation-export";
import { matchesValidationExperimentSearch } from "@/lib/launchlens/validation-search";

import {
  DEFAULT_PROGRESS_WEIGHTS,
  DECISION_BIASED_WEIGHTS,
  EVIDENCE_BIASED_WEIGHTS,
  evaluateExecutionProgress,
  taskIdentity,
  type EvidenceSignal,
  type EvidenceWeight,
  type ExperimentStatus,
  type ExecutionProgressWeights,
  type ConfidenceLevel,
  type HypothesisChangeEvent,
  type ValidationEvidence,
  type ValidationExperiment,
  type WorkspaceExecutionState,
  computeExperimentConfidence,
} from "@/lib/launchlens/execution";
import type { LaunchTask } from "@/lib/launchlens/types";
import { rangeSelectAdd, toggleSingle, rangeSelectEvidence } from "@/lib/launchlens/range-select";

const STATUS_LABEL_KEYS = {
  untested: "vBoard.status.untested",
  testing: "vBoard.status.testing",
  supported: "vBoard.status.supported",
  refuted: "vBoard.status.refuted",
} as const satisfies Record<ExperimentStatus, string>;

const STATUS_DESC_KEYS = {
  untested: "vBoard.statusDesc.untested",
  testing: "vBoard.statusDesc.testing",
  supported: "vBoard.statusDesc.supported",
  refuted: "vBoard.statusDesc.refuted",
} as const satisfies Record<ExperimentStatus, string>;

const SIGNAL_LABEL_KEYS = {
  supports: "vBoard.signal.supports",
  challenges: "vBoard.signal.challenges",
  neutral: "vBoard.signal.neutral",
} as const satisfies Record<EvidenceSignal, string>;

const SIGNAL_DESC_KEYS = {
  supports: "vBoard.signalDesc.supports",
  challenges: "vBoard.signalDesc.challenges",
  neutral: "vBoard.signalDesc.neutral",
} as const satisfies Record<EvidenceSignal, string>;

const WEIGHT_LABEL_KEYS = {
  anecdotal: "vBoard.weight.anecdotal",
  moderate: "vBoard.weight.moderate",
  strong: "vBoard.weight.strong",
} as const satisfies Record<EvidenceWeight, string>;

const CONFIDENCE_LABEL_KEYS = {
  low: "vBoard.confidence.low",
  medium: "vBoard.confidence.medium",
  high: "vBoard.confidence.high",
} as const satisfies Record<ConfidenceLevel, string>;

const CONFIDENCE_DESC_KEYS = {
  low: "vBoard.confidenceDesc.low",
  medium: "vBoard.confidenceDesc.medium",
  high: "vBoard.confidenceDesc.high",
} as const satisfies Record<ConfidenceLevel, string>;

type ValidationBoardProps = {
  execution: WorkspaceExecutionState;
  tasks: LaunchTask[];
  onChange: (execution: WorkspaceExecutionState) => void;
};

type EvidenceDraft = {
  note: string;
  source: string;
  signal: EvidenceSignal;
  weight: EvidenceWeight;
};

const emptyDraft: EvidenceDraft = {
  note: "",
  source: "",
  signal: "supports",
  weight: "moderate",
};

const InlineMarkdown = memo(function InlineMarkdown({ text }: { text: string }) {
  const segments = parseInlineMarkdown(text);
  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.type === "bold") {
          return <strong key={idx} className="font-semibold text-foreground">{seg.value}</strong>;
        }
        if (seg.type === "italic") {
          return <em key={idx} className="italic text-foreground/85">{seg.value}</em>;
        }
        if (seg.type === "code") {
          return (
            <code key={idx} className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-accent">
              {seg.value}
            </code>
          );
        }
        if (seg.type === "link") {
          const isSafe = /^https?:\/\//i.test(seg.href);
          if (isSafe) {
            return (
              <a
                key={idx}
                href={seg.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
              >
                {seg.value}
              </a>
            );
          }
          return <span key={idx}>{seg.value}</span>;
        }
        return <span key={idx}>{seg.value}</span>;
      })}
    </>
  );
});

const EVIDENCE_SNIPPETS: { label: string; source: string; note: string }[] = [
  { label: "Interview", source: "User interview #", note: "Said they " },
  { label: "Survey", source: "Survey Q", note: "Of respondents, % said " },
  { label: "Review", source: "App Store review", note: "User reported: " },
  { label: "Support", source: "Support ticket #", note: "Customer wrote: " },
  { label: "Analytics", source: "Analytics", note: "Metric moved from ___ to ___: " },
  { label: "Usability", source: "Usability test", note: "Participant struggled with " },
  { label: "Sales call", source: "Sales call", note: "Prospect said " },
  { label: "Churn", source: "Churn interview", note: "Left because " },
];

// Map snippet button labels to their i18n keys. The prefill `source`/`note`
// template strings stay as-is (they seed editable draft text); only the
// visible button label is translated.
const SNIPPET_LABEL_KEYS: Record<string, string> = {
  Interview: "vBoard.snippet.interview",
  Survey: "vBoard.snippet.survey",
  Review: "vBoard.snippet.review",
  Support: "vBoard.snippet.support",
  Analytics: "vBoard.snippet.analytics",
  Usability: "vBoard.snippet.usability",
  "Sales call": "vBoard.snippet.salesCall",
  Churn: "vBoard.snippet.churn",
};

export function ValidationBoard({
  execution,
  tasks,
  onChange,
}: ValidationBoardProps) {
  const [activeExperimentId, setActiveExperimentId] = useState("");
  const [focusedExperimentId, setFocusedExperimentId] = useState<string | null>(null);
  const [requestedExpandedExperimentId, setRequestedExpandedExperimentIdState] =
    useState<string | null>(() => { try { const v = window.localStorage.getItem("launchlens:expanded-experiment"); return v ? v : null; } catch { return null; } });
  const setRequestedExpandedExperimentId = useCallback((v: string | null | ((curr: string | null | undefined) => string | null)) => { setRequestedExpandedExperimentIdState((curr) => { const next = typeof v === "function" ? (v as (c: string | null | undefined) => string | null)(curr) : v; try { if (next === null) window.localStorage.removeItem("launchlens:expanded-experiment"); else if (next) window.localStorage.setItem("launchlens:expanded-experiment", next); } catch {} return next; }); }, []);
  const [draft, setDraft] = useState<EvidenceDraft>(emptyDraft);
  const [draftTouched, setDraftTouched] = useState<{source: boolean; note: boolean}>({ source: false, note: false });
  const [draftSubmitError, setDraftSubmitError] = useState<string>("");
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [draggedEvidenceId, setDraggedEvidenceId] = useState<string | null>(null);
  const [draggedExperimentId, setDraggedExperimentId] = useState<string | null>(null);
  const [dragOverExperimentId, setDragOverExperimentId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedExperimentIds, setSelectedExperimentIds] = useState<Set<string>>(new Set());
  const [evidenceSelectMode, setEvidenceSelectMode] = useState<Record<string, boolean>>({});
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<Record<string, Set<string>>>({});
  // Shift+Click range-select anchors. Anchor moves on plain click; held in place
  // during Shift+Click so successive shift-clicks extend from the same origin.
  const lastExperimentAnchorRef = useRef<string | null>(null);
  const lastEvidenceAnchorRef = useRef<{ expId: string; evId: string } | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState<{ expId: string; count: number } | null>(null);
  type BatchConfirmKind = "archive" | "delete";
  const [pendingBatch, setPendingBatch] = useState<{ kind: BatchConfirmKind; count: number } | null>(null);
  const [evidenceFilters, setEvidenceFilters] = useState<Record<string, { signal: "all" | EvidenceSignal; weight: "all" | EvidenceWeight }>>({});
  function getEvidenceFilter(id: string) { return evidenceFilters[id] ?? { signal: "all" as const, weight: "all" as const }; }
  const batchCount = selectedExperimentIds.size;
  const [dragOverEvidenceId, setDragOverEvidenceId] = useState<string | null>(null);


  const { announce: srAnnounce, message: srEvidenceAnnouncement } = useSrAnnounce();
  const { showToast } = useToast();
  const { t } = useLocale();

  // Display labels + descriptions for the validation-board enums. The shared
  // constants (EXPERIMENT_STATUS_LABELS, SIGNAL_LABELS, …) stay English so the
  // Markdown / JSON exporters keep stable output; the board translates at the
  // call site via these locale-aware maps.
  const statusLabel = useCallback(
    (status: ExperimentStatus) => t(STATUS_LABEL_KEYS[status]),
    [t],
  );
  const statusDesc = (status: ExperimentStatus) => t(STATUS_DESC_KEYS[status]);
  const signalLabel = (signal: EvidenceSignal) => t(SIGNAL_LABEL_KEYS[signal]);
  const signalDesc = (signal: EvidenceSignal) => t(SIGNAL_DESC_KEYS[signal]);
  const weightLabel = (weight: EvidenceWeight) => t(WEIGHT_LABEL_KEYS[weight]);
  const confidenceLabel = (c: ConfidenceLevel) => t(CONFIDENCE_LABEL_KEYS[c]);
  const confidenceDesc = (c: ConfidenceLevel) => t(CONFIDENCE_DESC_KEYS[c]);

  const evidenceListRef = useRef<HTMLUListElement | null>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const newExperimentInputRef = useRef<HTMLInputElement | null>(null);
  const [timelinePulseKey, setTimelinePulseKey] = useState<string | null>(null);
  const [flashEvidenceId, setFlashEvidenceId] = useState<string | null>(null);
  const [showFullHistory, setShowFullHistory] = useState<Set<string>>(new Set());
  const [timelineKindFilter, setTimelineKindFilter] = useState<Record<string, string>>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.sessionStorage.getItem("launchlens:timeline-filter") : null;
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch { return {}; }
  });
  // Persist timeline filters per-experiment to sessionStorage so refresh/back nav keeps the view.
  useEffect(() => {
    try { if (typeof window !== "undefined") window.sessionStorage.setItem("launchlens:timeline-filter", JSON.stringify(timelineKindFilter)); } catch {}
  }, [timelineKindFilter]);
  const timelinePulseTimer = useRef<number | null>(null);
  const undoStack = useRef<{snapshot: WorkspaceExecutionState; label: string}[]>([]);
  const redoStack = useRef<{snapshot: WorkspaceExecutionState; label: string}[]>([]);
  const applyingHistory = useRef(false);
  const HISTORY_CAP = 50;
  // Snapshot-based undo/redo: wrap onChange to record pre-change state.
  function pushHistory(prev: WorkspaceExecutionState, label?: string) {
    if (applyingHistory.current) return;
    undoStack.current.push({ snapshot: structuredClone(prev), label: label || "change" });
    if (undoStack.current.length > HISTORY_CAP) undoStack.current.shift();
    redoStack.current.length = 0;
  }
  const applyHistory = useCallback((next: WorkspaceExecutionState) => {
    applyingHistory.current = true;
    onChange(next);
    window.setTimeout(() => { applyingHistory.current = false; }, 0);
  }, [onChange]);
  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push({ snapshot: structuredClone(execution), label: prev.label });
    applyHistory(prev.snapshot);
    srAnnounce(t("vBoard.toast.undo")); showToast(t("vBoard.toast.undo") + ": " + prev.label, "info", 1800);
  }, [execution, applyHistory, srAnnounce, showToast, t]);
  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push({ snapshot: structuredClone(execution), label: next.label });
    applyHistory(next.snapshot);
    srAnnounce(t("vBoard.toast.redo")); showToast(t("vBoard.toast.redo") + ": " + next.label, "info", 1800);
  }, [execution, applyHistory, srAnnounce, showToast, t]);
  const flashEvidenceTimer = useRef<number | null>(null);
  function onTimelineEventClick(experimentId: string, kind: string, targetId?: string) {
    setTimelinePulseKey(experimentId);
    if (timelinePulseTimer.current) window.clearTimeout(timelinePulseTimer.current);
    timelinePulseTimer.current = window.setTimeout(() => setTimelinePulseKey(null), 1200);
    if (flashEvidenceTimer.current) window.clearTimeout(flashEvidenceTimer.current);
    setFlashEvidenceId(null);
    if (kind === "evidence_added" || kind === "evidence_removed") {
      window.setTimeout(() => {
        const root = document.querySelector(`[data-experiment-article][data-experiment-id-card="${experimentId}"]`) || evidenceListRef.current?.closest(`[data-experiment-article]`);
        if (targetId) {
          const row = (root || document).querySelector(`[data-evidence-id="${targetId}"]`) as HTMLElement | null;
          if (row) {
            setFlashEvidenceId(targetId);
            flashEvidenceTimer.current = window.setTimeout(() => setFlashEvidenceId(null), 1600);
            row.scrollIntoView({ behavior: "smooth", block: "center" });
            (row as HTMLElement).focus?.({ preventScroll: true });
            return;
          }
        }
        evidenceListRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        (evidenceListRef.current as HTMLElement | null)?.focus?.({ preventScroll: true });
      }, 30);
    } else if (kind === "status" || kind === "confidence" || kind === "decision" || kind === "archived" || kind === "pinned" || kind === "created") {
      window.setTimeout(() => {
        const root = document.querySelector(`[data-experiment-article][data-experiment-id="${experimentId}"]`) as HTMLElement | null;
        if (!root) return;
        const target = root.querySelector(`[data-meta-target="${kind}"]`) as HTMLElement | null;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          (target as HTMLElement).tabIndex = -1;
          (target as HTMLElement).focus?.({ preventScroll: true });
          target.classList.add("ring-2", "ring-accent", "ring-offset-1", "ring-offset-[var(--card-bg)]");
          window.setTimeout(() => target.classList.remove("ring-2", "ring-accent", "ring-offset-1", "ring-offset-[var(--card-bg)]"), 1600);
        } else {
          root.scrollIntoView({ behavior: "smooth", block: "center" });
          root.tabIndex = -1;
          root.focus?.({ preventScroll: true });
        }
      }, 30);
    }
  }
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ experimentId: string; evidence: ValidationEvidence; index: number } | null>(null);
  const [recentlyDeletedExperiment, setRecentlyDeletedExperiment] = useState<{ experiment: ValidationExperiment; index: number } | null>(null);
  const evidenceUndoTimerRef = useRef<number | null>(null);
  const experimentUndoTimerRef = useRef<number | null>(null);
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [confidenceFlashIds, setConfidenceFlashIds] = useState<Set<string>>(new Set());

  // Global keyboard shortcuts via the shared registry so they appear in ? help.
  useKeyboardShortcuts({
    addEvidence: () => {
      const first = execution.experiments[0];
      if (!first) return;
      setActiveExperimentId(first.id);
      setRequestedExpandedExperimentId(first.id);
      setIsAddingExperiment(false);
      srAnnounce(t("vBoard.sr.openEvidenceForm"));
      setTimeout(() => {
        document.getElementById(`evidence-source-${first.id}`)?.focus();
      }, 50);
    },
    newHypothesis: () => {
      setIsAddingExperiment(true);
      setActiveExperimentId("");
      srAnnounce(t("vBoard.sr.openNewHypothesis"));
      setTimeout(() => {
        document.querySelector<HTMLInputElement>('[data-new-experiment-input]')?.focus();
      }, 50);
    },
  });
    const SOURCE_MAX = 80;
  const NOTE_MAX = 500;
  const sourceLen = draft.source.length;
  const noteLen = draft.note.length;
  const sourceError = (
    (draftTouched.source && draft.source.trim().length < 2)
      ? t("vBoard.err.sourceShort")
      : sourceLen > SOURCE_MAX
      ? t("vBoard.err.sourceLong", { max: SOURCE_MAX })
      : ""
  );
  const noteError = (
    (draftTouched.note && draft.note.trim().length < 8)
      ? t("vBoard.err.noteShort")
      : noteLen > NOTE_MAX
      ? t("vBoard.err.noteLong", { max: NOTE_MAX })
      : ""
  );
  const sourceNear = sourceLen > SOURCE_MAX * 0.8 && sourceLen <= SOURCE_MAX;
  const noteNear = noteLen > NOTE_MAX * 0.8 && noteLen <= NOTE_MAX;
  const formInvalid = sourceLen > SOURCE_MAX || noteLen > NOTE_MAX;
  const [weightPreset, setWeightPresetState] = useState<"default" | "evidence" | "decision">(() => { if (typeof window === "undefined") return "default"; try { const v = window.localStorage.getItem("launchlens:weight-preset"); if (v === "default" || v === "evidence" || v === "decision") return v; } catch {} return "default"; });
  const setWeightPreset = useCallback((v: "default" | "evidence" | "decision") => { setWeightPresetState(v); try { window.localStorage.setItem("launchlens:weight-preset", v); } catch {} }, []);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<ValidationBoardStatusFilter>("all");
  const [sortBy, setSortBy] = useState<ValidationBoardSortMode>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [newExperimentTagDraft, setNewExperimentTagDraft] = useState("");
  const [newExperimentTags, setNewExperimentTags] = useState<string[]>([]);
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const exp of execution.experiments) {
      for (const t of exp.tags ?? []) set.add(t);
    }
    return Array.from(set).sort();
  }, [execution.experiments]);
  const [isAddingExperiment, setIsAddingExperiment] = useState(false);
  const [newExperimentDraft, setNewExperimentDraft] = useState("");

  // Clean up undo timers on unmount
  useEffect(() => {
    return () => {
      if (evidenceUndoTimerRef.current) window.clearTimeout(evidenceUndoTimerRef.current);
      if (experimentUndoTimerRef.current) window.clearTimeout(experimentUndoTimerRef.current);
    };
  }, []);

    const currentWeights: ExecutionProgressWeights = useMemo(() => {
    if (weightPreset === "evidence") return EVIDENCE_BIASED_WEIGHTS;
    if (weightPreset === "decision") return DECISION_BIASED_WEIGHTS;
    return DEFAULT_PROGRESS_WEIGHTS;
  }, [weightPreset]);

  const progress = useMemo(
    () => evaluateExecutionProgress(execution, currentWeights),
    [execution, currentWeights],
  );

function EvidenceOverflowMenu({ onDuplicate, onEdit, onDelete, sourceLabel }: { onDuplicate: () => void; onEdit: () => void; onDelete: () => void; sourceLabel: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    const previously = previouslyFocusedRef.current;
    if (previously && typeof previously.focus === "function") {
      window.requestAnimationFrame(() => previously.focus());
    } else if (triggerRef.current) triggerRef.current.focus();
  }, []);
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open, close]);
  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("vBoard.overflowAria", { source: sourceLabel })}
        className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg" onClick={(e) => e.stopPropagation()}>
          <button type="button" role="menuitem" onClick={(e) => { e.stopPropagation(); close(); onDuplicate(); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent">
            <Copy className="size-4" aria-hidden="true" /> {t("vBoard.overflowDuplicate")}
          </button>
          <button type="button" role="menuitem" onClick={(e) => { e.stopPropagation(); close(); onEdit(); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent">
            <PencilLine className="size-4" aria-hidden="true" /> {t("vBoard.overflowEdit")}
          </button>
          <button type="button" role="menuitem" onClick={(e) => { e.stopPropagation(); close(); onDelete(); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-signal-challenges hover:bg-accent hover:text-signal-challenges focus-visible:outline-none focus-visible:bg-accent">
            <Trash2 className="size-4" aria-hidden="true" /> {t("vBoard.overflowDelete")}
          </button>
        </div>
      )}
    </div>
  );
}
  const filteredExperiments = useMemo(() => {
    let list = execution.experiments;
    if (deferredSearchQuery.trim()) {
      list = list.filter((exp) =>
        matchesValidationExperimentSearch(exp, deferredSearchQuery),
      );
    }
    if (statusFilter === "active") {
      list = list.filter(
        (exp) => exp.status === "untested" || exp.status === "testing",
      );
    } else if (statusFilter === "decided") {
      list = list.filter(
        (exp) => exp.status === "supported" || exp.status === "refuted",
      );
    }

    if (sortBy === "confidence") {
      const order = { high: 3, medium: 2, low: 1 };
      list = [...list].sort(
        (a, b) =>
          order[b.confidence] - order[a.confidence] ||
          b.evidence.length - a.evidence.length,
      );
    } else if (sortBy === "status") {
      const order = {
        supported: 0,
        testing: 1,
        untested: 2,
        refuted: 3,
      };
      list = [...list].sort(
        (a, b) => order[a.status] - order[b.status],
      );
    } else if (sortBy === "progress") {
      list = [...list].sort(
        (a, b) => b.evidence.length - a.evidence.length,
      );
    } else {
      list = [...list].sort((a, b) => {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? -1 : 1;
        return execution.experiments.indexOf(a) - execution.experiments.indexOf(b);
      });
    }

    return list;
  }, [execution.experiments, statusFilter, sortBy, deferredSearchQuery]);
  const activeExperiments = filteredExperiments.filter((e) => !e.archived);
  const allWorkspaceTags = useMemo(() => {
    const counts = new Map<string, number>();
    execution.experiments.forEach((e) => (e.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
  }, [execution.experiments]);
  const selectedTagsUnion = useMemo(() => {
    const union = new Set<string>();
    const intersection = new Set<string>();
    let first = true;
    selectedExperimentIds.forEach((id) => {
      const exp = execution.experiments.find((e) => e.id === id);
      if (!exp) return;
      const s = new Set(exp.tags || []);
      s.forEach((t) => union.add(t));
      if (first) { s.forEach((t) => intersection.add(t)); first = false; }
      else { intersection.forEach((t) => { if (!s.has(t)) intersection.delete(t); }); }
    });
    return { union, intersection };
  }, [execution.experiments, selectedExperimentIds]);

  const archivedExperiments = filteredExperiments.filter((e) => e.archived);

  const expandedExperimentId =
    requestedExpandedExperimentId === null
      ? ""
      : requestedExpandedExperimentId &&
          execution.experiments.some(
            (experiment) => experiment.id === requestedExpandedExperimentId,
          )
        ? requestedExpandedExperimentId
        : (execution.experiments[0]?.id ?? "");

  function pushHistoryEvent(experimentId: string, evt: Omit<HypothesisChangeEvent, "id" | "at">) {
    pushHistory(execution, "edit");
    onChange({
      ...execution,
      experiments: execution.experiments.map((e) => e.id === experimentId ? {
        ...e,
        history: [...(e.history || []), { id: "evt-" + Math.random().toString(36).slice(2, 9), at: new Date().toISOString(), kind: evt.kind, from: evt.from, to: evt.to, source: evt.source, targetId: evt.targetId, label: evt.label }],
      } : e),
      updatedAt: new Date().toISOString(),
    });
  }

  function updateExperiment(
    experimentId: string,
    update: (experiment: ValidationExperiment) => ValidationExperiment,
  ) {
    pushHistory(execution, "edit");
    onChange({
      experiments: execution.experiments.map((experiment) =>
        experiment.id === experimentId
          ? { ...update(experiment), decisionBrief: undefined }
          : experiment,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function removeExperimentTag(experimentId: string, tag: string) {
    updateExperiment(experimentId, (exp) => ({
      ...exp,
      tags: (exp.tags ?? []).filter((t) => t !== tag),
    }));
    if (tagFilter === tag) setTagFilter(null);
  }

  function commitNewExperimentTag() {
    const raw = newExperimentTagDraft.trim().replace(/^#/, "").trim();
    if (!raw) return;
    if (newExperimentTags.includes(raw) || newExperimentTags.length >= 8) {
      setNewExperimentTagDraft("");
      return;
    }
    setNewExperimentTags([...newExperimentTags, raw]);
    setNewExperimentTagDraft("");
  }

  function isInvalidNewExperimentDraft() {
    const assumption = newExperimentDraft.trim();
    return (
      assumption.length < 5 ||
      isDuplicateAssumption(assumption, execution.experiments)
    );
  }

  function submitNewExperiment() {
    const assumption = newExperimentDraft.trim();

    if (
      assumption.length < 5 ||
      isDuplicateAssumption(assumption, execution.experiments)
    ) {
      return;
    }

    const newExperiment = createNewValidationExperiment({
      assumption,
      index: execution.experiments.length,
      tags: newExperimentTags,
    });

    pushHistory(execution, "add hypothesis");
    onChange({
      ...execution,
      experiments: [...execution.experiments, newExperiment],
      updatedAt: new Date().toISOString(),
    });
    setNewExperimentDraft("");
    setNewExperimentTags([]);
    setNewExperimentTagDraft("");
    setIsAddingExperiment(false);
    setRequestedExpandedExperimentId(newExperiment.id);
    if (statusFilter !== "all") setStatusFilter("all");
    srAnnounce(t("vBoard.sr.newHypothesis", { assumption: newExperiment.assumption }));
    window.requestAnimationFrame(() => {
      const element = document.querySelector(
        `[data-experiment-article][data-experiment-id="${newExperiment.id}"]`,
      ) as HTMLElement | null;
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.focus();
    });
  }

  function openEvidenceForm(experimentId: string) {
    setRequestedExpandedExperimentId(experimentId);
    setActiveExperimentId((current) =>
      current === experimentId ? "" : experimentId,
    );
    setDraft(emptyDraft);
    setEditingEvidenceId(null);
  }
  async function copyExperimentMarkdown(experiment: ValidationExperiment) {
    const md = validationExperimentToMarkdown(experiment);
    const ok = await copyTextToClipboard(md);
    if (ok) {
      showToast(t("vBoard.toast.hypMdCopied"), "success", 2500);
      srAnnounce(t("vBoard.toast.hypMdCopiedSr"));
    } else {
      showToast(t("vBoard.toast.clipboardFail"), "error", 3000);
    }
  }

  function downloadExperimentMarkdown(experiment: ValidationExperiment) {
    const now = new Date();
    const md = validationExperimentToMarkdown(experiment, { now });
    const ok = downloadTextFile(
      validationExperimentFilename(experiment, "md", now),
      md,
      "text/markdown;charset=utf-8",
    );
    if (ok) {
      showToast(t("vBoard.toast.mdDownloaded"), "success", 2000);
      srAnnounce(t("vBoard.toast.hypMdDownloadedSr"));
    } else {
      showToast(t("vBoard.toast.mdDownloadFail"), "error", 3000);
    }
  }

  function downloadExperimentJson(experiment: ValidationExperiment) {
    const now = new Date();
    const json = validationExperimentToJson(experiment);
    const ok = downloadTextFile(
      validationExperimentFilename(experiment, "json", now),
      json,
      "application/json;charset=utf-8",
    );
    if (ok) {
      showToast(t("vBoard.toast.jsonDownloaded"), "success", 2000);
      srAnnounce(t("vBoard.toast.hypJsonDownloadedSr"));
    } else {
      showToast(t("vBoard.toast.jsonDownloadFail"), "error", 3000);
    }
  }

  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  const [boardExportOpen, setBoardExportOpen] = useState(false);
  const [batchTagInput, setBatchTagInput] = useState("");
  const [batchTagMode, setBatchTagMode] =
    useState<ValidationBatchTagMode>(null);
  const [isBatchBriefing, setIsBatchBriefing] = useState(false);
  const [batchBriefProgress, setBatchBriefProgress] = useState({ done: 0, total: 0 });

  async function copyBoardMarkdown() {
    const md = validationBoardToMarkdown(execution.experiments);
    const ok = await copyTextToClipboard(md);
    if (ok) {
      showToast(t("vBoard.toast.boardMdCopied"), "success", 2500);
      srAnnounce(t("vBoard.toast.boardMdCopiedSr"));
    } else {
      showToast(t("vBoard.toast.clipboardFail"), "error", 3000);
    }
    setBoardExportOpen(false);
  }

  function downloadBoardMarkdown() {
    const now = new Date();
    const md = validationBoardToMarkdown(execution.experiments, { now });
    const ok = downloadTextFile(
      validationBoardFilename("md", now),
      md,
      "text/markdown;charset=utf-8",
    );
    if (ok) {
      showToast(t("vBoard.toast.mdDownloaded"), "success", 2000);
      srAnnounce(t("vBoard.toast.boardMdDownloadedSr"));
    } else {
      showToast(t("vBoard.toast.mdDownloadFail"), "error", 3000);
    }
    setBoardExportOpen(false);
  }

  function downloadBoardJson() {
    const now = new Date();
    const json = validationBoardToJson(execution.experiments);
    const ok = downloadTextFile(
      validationBoardFilename("json", now),
      json,
      "application/json;charset=utf-8",
    );
    if (ok) {
      showToast(t("vBoard.toast.jsonDownloaded"), "success", 2000);
      srAnnounce(t("vBoard.toast.boardJsonDownloadedSr"));
    } else {
      showToast(t("vBoard.toast.jsonDownloadFail"), "error", 3000);
    }
    setBoardExportOpen(false);
  }



  function startEditingEvidence(experimentId: string, evidenceId: string) {
    const experiment = execution.experiments.find((e) => e.id === experimentId);
    const evidence = experiment?.evidence.find((e) => e.id === evidenceId);
    if (!experiment || !evidence) return;

    setRequestedExpandedExperimentId(experimentId);
    setActiveExperimentId(experimentId);
    setDraft({ signal: evidence.signal ?? "supports", weight: evidence.weight ?? "moderate", source: evidence.source, note: evidence.note });
    setEditingEvidenceId(evidenceId);
    setDraftTouched({ source: false, note: false });
    window.requestAnimationFrame(() => noteTextareaRef.current?.focus());
  }

  function cycleEvidenceSignal(experimentId: string, evidenceId: string) {
    const experiment = execution.experiments.find((e) => e.id === experimentId);
    const evidence = experiment?.evidence.find((e) => e.id === evidenceId);
    if (!experiment || !evidence) return;

    const order: EvidenceSignal[] = ["supports", "challenges", "neutral"];
    const currentIdx = order.indexOf(evidence.signal);
    const nextSignal = order[(currentIdx + 1) % order.length];

    const oldConfidence = experiment.confidence;
    const isManual = experiment.confidenceManual;

    updateExperiment(experimentId, (exp) => {
      const newEvidence = exp.evidence.map((e) =>
        e.id === evidenceId ? { ...e, signal: nextSignal } : e,
      );
      return {
        ...exp,
        evidence: newEvidence,
        confidence: isManual
          ? exp.confidence
          : computeExperimentConfidence(newEvidence),
      };
    });

    // Notify confidence change if auto
    if (!isManual) {
      const updatedExperiment = execution.experiments.find((e) => e.id === experimentId);
      const newEvidence = updatedExperiment?.evidence.map((e) =>
        e.id === evidenceId ? { ...e, signal: nextSignal } : e,
      ) ?? [];
      const newConfidence = computeExperimentConfidence(newEvidence);
      if (oldConfidence !== newConfidence) {
        notifyConfidenceChange(experimentId, oldConfidence, newConfidence);
      }
    }

    srAnnounce(t("vBoard.sr.signalChanged", { signal: signalLabel(nextSignal) }));
  }

  function cycleEvidenceWeight(experimentId: string, evidenceId: string) {
    const experiment = execution.experiments.find((e) => e.id === experimentId);
    const evidence = experiment?.evidence.find((e) => e.id === evidenceId);
    if (!experiment || !evidence) return;

    const order: EvidenceWeight[] = ["anecdotal", "moderate", "strong"];
    const currentIdx = order.indexOf(evidence.weight);
    const nextWeight = order[(currentIdx + 1) % order.length];

    const oldConfidence = experiment.confidence;
    const isManual = experiment.confidenceManual;

    updateExperiment(experimentId, (exp) => {
      const newEvidence = exp.evidence.map((e) =>
        e.id === evidenceId ? { ...e, weight: nextWeight } : e,
      );
      return {
        ...exp,
        evidence: newEvidence,
        confidence: isManual
          ? exp.confidence
          : computeExperimentConfidence(newEvidence),
      };
    });

    // Notify confidence change if auto
    if (!isManual) {
      const updatedExperiment = execution.experiments.find((e) => e.id === experimentId);
      const newEvidence = updatedExperiment?.evidence.map((e) =>
        e.id === evidenceId ? { ...e, weight: nextWeight } : e,
      ) ?? [];
      const newConfidence = computeExperimentConfidence(newEvidence);
      if (oldConfidence !== newConfidence) {
        notifyConfidenceChange(experimentId, oldConfidence, newConfidence);
      }
    }

    srAnnounce(t("vBoard.sr.weightChanged", { weight: weightLabel(nextWeight) }));
  }

  function moveExperiment(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    pushHistory(execution, "reorder hypotheses");
    onChange({
      ...execution,
      experiments: (() => {
        const arr = [...execution.experiments];
        const from = arr.findIndex((e) => e.id === draggedId);
        const to = arr.findIndex((e) => e.id === targetId);
        if (from < 0 || to < 0) return arr;
        const [m] = arr.splice(from, 1);
        arr.splice(to, 0, m);
        return arr;
      })(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Toggle a single experiment's selection, OR perform a Shift+Click range
   * select using the visible (filtered) order as the canonical sequence.
   * Anchor is the last plain-clicked id and stays fixed across Shift+clicks.
   */
  function toggleExperimentSelection(id: string, shiftKey = false) {
    const visibleOrder = filteredExperiments.map((e) => e.id);
    if (shiftKey) {
      setSelectedExperimentIds((prev) =>
        rangeSelectAdd(prev, visibleOrder, lastExperimentAnchorRef.current, id),
      );
      return;
    }
    setSelectedExperimentIds((prev) => toggleSingle(prev, id));
    lastExperimentAnchorRef.current = id;
  }
  const toggleSelectAllExperiments = useCallback(() => {
    const visibleIds = activeExperiments.map((e) => e.id);
    const allSelected = visibleIds.every((id) => selectedExperimentIds.has(id));
    setSelectedExperimentIds(new Set(allSelected ? [] : visibleIds));
  }, [activeExperiments, selectedExperimentIds]);
  const setSelectedStatus = useCallback((status: ExperimentStatus) => {
    if (batchCount === 0) return;
    pushHistory(execution, `bulk status ${status}`); onChange({ ...execution, experiments: execution.experiments.map((e) => selectedExperimentIds.has(e.id) ? { ...e, status } : e), updatedAt: new Date().toISOString() });
    const msg = t("vBoard.toast.bulkStatus", { count: batchCount, status: statusLabel(status) });
    showToast(msg, "success", 5000, { label: t("vBoard.toast.undoLabel"), onClick: () => undo() });
    srAnnounce(msg);
  }, [batchCount, execution, onChange, selectedExperimentIds, showToast, srAnnounce, undo, t, statusLabel]);
  const performBatchArchive = useCallback((archived: boolean) => {
    if (batchCount === 0) return;
    pushHistory(execution, archived ? "bulk archive" : "bulk unarchive"); onChange({ ...execution, experiments: execution.experiments.map((e) => selectedExperimentIds.has(e.id) ? { ...e, archived } : e), updatedAt: new Date().toISOString() });
    const msg = archived ? t("vBoard.toast.bulkArchived", { count: batchCount }) : t("vBoard.toast.bulkUnarchived", { count: batchCount });
    showToast(msg, "success", 5000, { label: t("vBoard.toast.undoLabel"), onClick: () => undo() });
    srAnnounce(msg);
  }, [batchCount, execution, onChange, selectedExperimentIds, showToast, srAnnounce, undo, t]);
  const batchArchive = useCallback((archived: boolean) => {
    if (batchCount === 0) return;
    if (archived) { setPendingBatch({ kind: "archive", count: batchCount }); return; }
    performBatchArchive(false);
  }, [batchCount, performBatchArchive, setPendingBatch]);
  function batchAddTag(tag: string) {
    const tagName = tag.trim();
    if (!tagName || batchCount === 0) return;
    pushHistory(execution, "bulk add tag");
    onChange({
      ...execution,
      experiments: execution.experiments.map((e) => selectedExperimentIds.has(e.id) ? { ...e, tags: Array.from(new Set([...(e.tags || []), tagName])) } : e),
      updatedAt: new Date().toISOString(),
    });
    const msg = t("vBoard.toast.bulkTagAdded", { tag: tagName, count: batchCount });
    showToast(msg, "success", 5000, { label: t("vBoard.toast.undoLabel"), onClick: () => undo() });
    srAnnounce(msg);
  }
  function batchRemoveTag(tag: string) {
    const tagName = tag.trim();
    if (!tagName || batchCount === 0) return;
    pushHistory(execution, "bulk remove tag");
    onChange({
      ...execution,
      experiments: execution.experiments.map((e) => selectedExperimentIds.has(e.id) ? { ...e, tags: (e.tags || []).filter((x) => x !== tagName) } : e),
      updatedAt: new Date().toISOString(),
    });
    const msg = t("vBoard.toast.bulkTagRemoved", { tag: tagName, count: batchCount });
    showToast(msg, "success", 5000, { label: t("vBoard.toast.undoLabel"), onClick: () => undo() });
    srAnnounce(msg);
  }
  async function batchGenerateBriefs() {
    if (batchCount === 0 || isBatchBriefing) return;
    const selectedExps = execution.experiments.filter((e) => selectedExperimentIds.has(e.id) && e.evidence.length > 0 && !e.decisionBrief);
    if (selectedExps.length === 0) {
      showToast(t("vBoard.toast.bulkNoBriefs"), "info");
      return;
    }
    setIsBatchBriefing(true);
    setBatchBriefProgress({ done: 0, total: selectedExps.length });
    let success = 0;
    let failed = 0;
    const updated = [...execution.experiments];
    for (let i = 0; i < selectedExps.length; i++) {
      const item = selectedExps[i];
      try {
        const source = decisionSourceFromExperiment(item);
        const res = await fetch("/api/decision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ experiment: source }) });
        const data = await res.json();
        const brief = data.brief ? normalizeDecisionBrief(data.brief, source) : null;
        if (res.ok && brief) {
          const idx = updated.findIndex((e) => e.id === item.id);
          if (idx >= 0) updated[idx] = { ...updated[idx], decisionBrief: brief };
          success += 1;
        } else { failed += 1; }
      } catch { failed += 1; }
      setBatchBriefProgress({ done: i + 1, total: selectedExps.length });
    }
    pushHistory(execution, "generate briefs"); onChange({ ...execution, experiments: updated, updatedAt: new Date().toISOString() });
    setIsBatchBriefing(false);
    const summary = `Generated ${success} brief${success === 1 ? "" : "s"}${failed > 0 ? `; ${failed} failed` : ""}.`;
    showToast(summary, failed > 0 ? "error" : "success", 6000, { label: t("vBoard.toast.undoLabel"), onClick: () => undo() });
    srAnnounce(summary);
  }
  function applyBatchTagFromInput(mode: "add" | "remove") {
    const tags = batchTagInput.split(/[,;\s]+/).map((tg) => tg.trim()).filter(Boolean);
    tags.forEach((tg) => (mode === "add" ? batchAddTag(tg) : batchRemoveTag(tg)));
    setBatchTagInput("");
    setBatchTagMode(null);
  }
  function performBatchDelete() {
    if (batchCount === 0) return;
    const toDelete = selectedExperimentIds;
    pushHistory(execution, "bulk delete hypotheses");
    onChange({
      ...execution,
      experiments: execution.experiments.filter((e) => !toDelete.has(e.id)),
      updatedAt: new Date().toISOString(),
    });
    setSelectedExperimentIds(new Set());
    const msg = `Deleted ${toDelete.size} hypotheses.`;
    showToast(msg, "success", 6000, { label: t("vBoard.toast.undoLabel"), onClick: () => undo() });
    srAnnounce(msg);
  }
  function batchDeleteExperiments() {
    if (batchCount === 0) return;
    setPendingBatch({ kind: "delete", count: batchCount });
  }
  function moveEvidence(
    experimentId: string,
    evidenceId: string,
    direction: "up" | "down",
  ) {
    updateExperiment(experimentId, (experiment) => {
      const idx = experiment.evidence.findIndex((e) => e.id === evidenceId);
      if (idx === -1) return experiment;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= experiment.evidence.length) {
        return experiment;
      }
      const next = [...experiment.evidence];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return { ...experiment, evidence: next };
    });
    const experiment = execution.experiments.find((e) => e.id === experimentId);
    const evidence = experiment?.evidence.find((e) => e.id === evidenceId);
    if (evidence) {
      srAnnounce("Evidence moved " + direction + ": " + evidence.source + ".");
    }
  }

  
  
  function toggleEvidenceSelection(expId: string, evId: string, shiftKey = false) {
    const exp = execution.experiments.find((e) => e.id === expId);
    if (!exp) return;
    const ef = getEvidenceFilter(expId);
    const visibleOrder = exp.evidence
      .filter((it) => (ef.signal === "all" || it.signal === ef.signal) && (ef.weight === "all" || it.weight === ef.weight))
      .map((it) => it.id);

    if (shiftKey) {
      setSelectedEvidenceIds((prev) =>
        rangeSelectEvidence(prev, expId, visibleOrder, lastEvidenceAnchorRef.current, evId),
      );
      return;
    }
    setSelectedEvidenceIds((prev) => {
      const next = { ...prev };
      const set = new Set(next[expId] || []);
      if (set.has(evId)) set.delete(evId); else set.add(evId);
      next[expId] = set;
      return next;
    });
    lastEvidenceAnchorRef.current = { expId, evId };
  }
  function toggleSelectAllEvidence(expId: string) {
    const exp = execution.experiments.find((e) => e.id === expId);
    if (!exp) return;
    setSelectedEvidenceIds((prev) => {
      const next = { ...prev };
      const current = new Set(next[expId] || []);
      const allIds = exp.evidence.map((x) => x.id);
      const allSelected = allIds.every((id) => current.has(id));
      next[expId] = new Set(allSelected ? [] : allIds);
      return next;
    });
  }
  function bulkDeleteEvidence(expId: string) {
    const exp = execution.experiments.find((e) => e.id === expId);
    const ids = new Set(selectedEvidenceIds[expId] || []);
    if (!exp || ids.size === 0) return;
    setPendingBulkDelete({ expId, count: ids.size });
  }

  function performBulkDelete(expId: string) {
    const exp = execution.experiments.find((e) => e.id === expId);
    const ids = new Set(selectedEvidenceIds[expId] || []);
    if (!exp || ids.size === 0) return;
    pushHistory(execution, "bulk evidence delete");
    const removed = exp.evidence.filter((e) => ids.has(e.id));
    onChange({
      ...execution,
      experiments: execution.experiments.map((e) => {
        if (e.id !== expId) return e;
        const newEvidence = e.evidence.filter((x) => !ids.has(x.id));
        const isManual = e.confidenceManual;
        return { ...e, evidence: newEvidence, confidence: isManual ? e.confidence : computeExperimentConfidence(newEvidence) };
      }),
      updatedAt: new Date().toISOString(),
    });
    removed.forEach((ev) => pushHistoryEvent(expId, { kind: "evidence_removed", source: ev.source, targetId: ev.id, label: ev.note.slice(0, 60) }));
    setSelectedEvidenceIds((prev) => ({ ...prev, [expId]: new Set() }));
    setEvidenceSelectMode((prev) => ({ ...prev, [expId]: false }));
    showToast(t("vBoard.evidenceItems", { count: ids.size }) + " " + t("vBoard.toast.evidenceDeleted"), "success", 5000, { label: t("vBoard.toast.undoLabel"), onClick: () => undo() });
  }
  
  function bulkSetEvidenceWeight(expId: string, weight: "strong" | "moderate" | "anecdotal") {
    const ids = new Set(selectedEvidenceIds[expId] || []);
    if (ids.size === 0) return;
    pushHistory(execution, "bulk evidence weight " + weight);
    onChange({
      ...execution,
      experiments: execution.experiments.map((e) => {
        if (e.id !== expId) return e;
        const newEvidence = e.evidence.map((x) => ids.has(x.id) ? { ...x, weight } : x);
        const isManual = e.confidenceManual;
        return { ...e, evidence: newEvidence, confidence: isManual ? e.confidence : computeExperimentConfidence(newEvidence) };
      }),
      updatedAt: new Date().toISOString(),
    });
    showToast(t("vBoard.toast.evidenceWeightSet", { weight, count: ids.size }), "success", 5000, { label: t("vBoard.toast.undoLabel"), onClick: () => undo() });
  }

  function bulkSetEvidenceSignal(expId: string, signal: "supports" | "challenges" | "neutral") {
    const ids = new Set(selectedEvidenceIds[expId] || []);
    if (ids.size === 0) return;
    pushHistory(execution, "bulk evidence signal " + signal);
    onChange({
      ...execution,
      experiments: execution.experiments.map((e) => {
        if (e.id !== expId) return e;
        const newEvidence = e.evidence.map((x) => ids.has(x.id) ? { ...x, signal } : x);
        const isManual = e.confidenceManual;
        return { ...e, evidence: newEvidence, confidence: isManual ? e.confidence : computeExperimentConfidence(newEvidence) };
      }),
      updatedAt: new Date().toISOString(),
    });
    showToast(t("vBoard.toast.evidenceSignalSet", { count: ids.size, signal }), "success", 5000, { label: t("vBoard.toast.undoLabel"), onClick: () => undo() });
  }

  function toggleHypothesisPin(experimentId: string) {
    const exp = execution.experiments.find((e) => e.id === experimentId);
    if (!exp) return;
    const next = !exp.pinned;
    pushHistoryEvent(experimentId, { kind: "pinned", from: exp.pinned ? "pinned" : "unpinned", to: next ? "pinned" : "unpinned", label: next ? "Pinned to top" : "Unpinned" });
    onChange({
      ...execution,
      experiments: execution.experiments.map((e) =>
        e.id === experimentId ? { ...e, pinned: next } : e,
      ),
      updatedAt: new Date().toISOString(),
    });
  }
  function toggleEvidencePin(experimentId: string, evidenceId: string) {
    updateExperiment(experimentId, (exp) => ({
      ...exp,
      evidence: exp.evidence.map((ev) =>
        ev.id === evidenceId ? { ...ev, pinned: !ev.pinned } : ev,
      ),
    }));
  }
    function duplicateEvidence(experimentId: string, evId: string) {
    const exp = execution.experiments.find((e) => e.id === experimentId);
    if (!exp) return;
    const src = exp.evidence.find((e) => e.id === evId);
    if (!src) return;
    if (exp.evidence.length >= 8) { setDraftSubmitError("Maximum 8 evidence items per hypothesis."); return; }
    const clone: ValidationEvidence = { ...src, id: evidenceId(), source: src.source + " (copy)", observedAt: new Date().toISOString() };
    pushHistory(execution, "duplicate evidence");
    onChange({
      experiments: execution.experiments.map((item) =>
        item.id === experimentId ? { ...item, evidence: [...item.evidence, clone], updatedAt: new Date().toISOString() } : item,
      ),
      updatedAt: new Date().toISOString(),
    });
    setFlashEvidenceId(clone.id);
    if (flashEvidenceTimer.current) window.clearTimeout(flashEvidenceTimer.current);
    flashEvidenceTimer.current = window.setTimeout(() => setFlashEvidenceId(null), 1600);
    window.setTimeout(() => {
      const el = document.querySelector(`[data-evidence-id="${clone.id}"]`) as HTMLElement | null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }
function deleteEvidence(experimentId: string, evidenceId: string) {
    const experiment = execution.experiments.find((e) => e.id === experimentId);
    if (!experiment) return;
    const idx = experiment.evidence.findIndex((e) => e.id === evidenceId);
    if (idx === -1) return;
    const evidence = experiment.evidence[idx];
    setRecentlyDeleted({ experimentId, evidence, index: idx });
    const allDeleteButtons = Array.from(
      evidenceListRef.current?.querySelectorAll("button[data-delete-confirm]") || [],
    );
    const deleteBtn = evidenceListRef.current?.querySelector(
      "[data-evidence-id=" + evidenceId + "] [data-delete-confirm]",
    );
    const currentIndex = deleteBtn ? allDeleteButtons.indexOf(deleteBtn) : -1;
    const nextFocusTarget =
      allDeleteButtons[currentIndex + 1] ||
      allDeleteButtons[currentIndex - 1] ||
      evidenceListRef.current;
    updateExperiment(experimentId, (exp) => {
      const newEvidence = exp.evidence.filter((e) => e.id !== evidenceId);
      const isManual = exp.confidenceManual;
      return {
        ...exp,
        evidence: newEvidence,
        confidence: isManual
          ? exp.confidence
          : computeExperimentConfidence(newEvidence),
        history: [...(exp.history || []), { id: "evt-" + Math.random().toString(36).slice(2, 9), at: new Date().toISOString(), kind: "evidence_removed", source: evidence.source, targetId: evidence.id, label: evidence.note.slice(0, 60) }],
      };
    });

    // Notify confidence change if auto-computed and value changed
    const oldConfidence = experiment.confidence;
    if (!experiment.confidenceManual) {
      const newEvidenceAfter = experiment.evidence.filter((e) => e.id !== evidenceId);
      const newConfidence = computeExperimentConfidence(newEvidenceAfter);
      if (oldConfidence !== newConfidence) {
        notifyConfidenceChange(experimentId, oldConfidence, newConfidence);
      }
    }

    srAnnounce("Evidence from " + evidence.source + " removed. Press Ctrl+Z to undo.");
    showToast(t("vBoard.toast.evidenceRemoved"), "info", 5000, {
      label: t("vBoard.toast.undoLabel"),
      onClick: () => undoDeleteEvidence(),
    });
    setPendingDeleteId(null);
    requestAnimationFrame(() => {
      if (nextFocusTarget instanceof HTMLElement) {
        nextFocusTarget.focus();
      }
    });
  }

  function deleteExperiment(experimentId: string) {
    const idx = execution.experiments.findIndex((e) => e.id === experimentId);
    if (idx === -1) return;
    const experiment = execution.experiments[idx];
    setRecentlyDeletedExperiment({ experiment, index: idx });
    pushHistory(execution, "delete hypothesis");
    onChange({
      ...execution,
      experiments: execution.experiments.filter((e) => e.id !== experimentId),
      updatedAt: new Date().toISOString(),
    });
    if (activeExperimentId === experimentId) setActiveExperimentId("");
    if (requestedExpandedExperimentId === experimentId) setRequestedExpandedExperimentId(null);
    showToast(t("vBoard.toast.hypothesisRemoved"), "info", 5000, {
      label: t("vBoard.toast.undoLabel"),
      onClick: () => undoDeleteExperiment(),
    });
    if (experimentUndoTimerRef.current) window.clearTimeout(experimentUndoTimerRef.current);
    experimentUndoTimerRef.current = window.setTimeout(() => {
      setRecentlyDeletedExperiment(null);
      experimentUndoTimerRef.current = null;
    }, 5000);
    srAnnounce("Hypothesis " + experiment.assumption + " removed.");
  }

  function undoDeleteExperiment() {
    if (!recentlyDeletedExperiment) return;
    const { experiment, index } = recentlyDeletedExperiment;
    const next = [...execution.experiments];
    next.splice(index, 0, experiment);
    pushHistory(execution, "restore hypothesis");
    onChange({
      ...execution,
      experiments: next,
      updatedAt: new Date().toISOString(),
    });
    if (experimentUndoTimerRef.current) {
      window.clearTimeout(experimentUndoTimerRef.current);
      experimentUndoTimerRef.current = null;
    }
    setRecentlyDeletedExperiment(null);
    srAnnounce("Hypothesis " + experiment.assumption + " restored.");
  }

  function undoDeleteEvidence() {
    if (!recentlyDeleted) return;
    const { experimentId, evidence, index } = recentlyDeleted;
    const experiment = execution.experiments.find((e) => e.id === experimentId);
    const oldConfidence = experiment?.confidence ?? "low";
    const isManual = experiment?.confidenceManual ?? false;

    updateExperiment(experimentId, (exp) => {
      const next = [...exp.evidence];
      next.splice(index, 0, evidence);
      const manual = exp.confidenceManual;
      return {
        ...exp,
        evidence: next,
        confidence: manual
          ? exp.confidence
          : computeExperimentConfidence(next),
      };
    });

    if (!isManual && experiment) {
      const next = [...experiment.evidence];
      next.splice(index, 0, evidence);
      const newConfidence = computeExperimentConfidence(next);
      if (oldConfidence !== newConfidence) {
        notifyConfidenceChange(experimentId, oldConfidence, newConfidence);
      }
    }

    if (evidenceUndoTimerRef.current) {
      window.clearTimeout(evidenceUndoTimerRef.current);
      evidenceUndoTimerRef.current = null;
    }
    srAnnounce("Evidence from " + evidence.source + " restored.");
    setRecentlyDeleted(null);
  }

  function handleEvidenceKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    const target = e.currentTarget;
    const experimentId = target.getAttribute("data-experiment-id") || "";
    const items = Array.from(target.querySelectorAll("[data-evidence-id]"));
    if (items.length === 0) return;

    const active = document.activeElement;
    let currentIdx = -1;
    let currentEvidenceId: string | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].contains(active)) {
        currentIdx = i;
        currentEvidenceId = items[i].getAttribute("data-evidence-id");
        break;
      }
    }

    if (e.altKey && e.key === "ArrowUp" && currentIdx > 0 && currentEvidenceId) {
      // Move evidence up and keep focus on it
      e.preventDefault();
      moveEvidence(experimentId, currentEvidenceId, "up");
      // After re-render, focus the same evidence in its new position
      requestAnimationFrame(() => {
        const moved = target.querySelector(`[data-evidence-id="\${currentEvidenceId}"]`);
        if (moved) {
          const focusable = (moved as HTMLElement).querySelector("button");
          focusable?.focus();
        }
      });
    } else if (e.altKey && e.key === "ArrowDown" && currentIdx < items.length - 1 && currentEvidenceId) {
      // Move evidence down and keep focus on it
      e.preventDefault();
      moveEvidence(experimentId, currentEvidenceId, "down");
      requestAnimationFrame(() => {
        const moved = target.querySelector(`[data-evidence-id="\${currentEvidenceId}"]`);
        if (moved) {
          const focusable = (moved as HTMLElement).querySelector("button");
          focusable?.focus();
        }
      });
    } else if (e.key === "ArrowUp" && currentIdx > 0 && !e.altKey) {
      e.preventDefault();
      const prev = items[currentIdx - 1] as HTMLElement;
      const focusable = prev.querySelector("button");
      focusable?.focus();
    } else if (e.key === "ArrowDown" && currentIdx < items.length - 1 && !e.altKey) {
      e.preventDefault();
      const next = items[currentIdx + 1] as HTMLElement;
      const focusable = next.querySelector("button");
      focusable?.focus();
    } else if (e.key === "Home" && items.length > 0) {
      e.preventDefault();
      const first = items[0] as HTMLElement;
      (first.querySelector("button") as HTMLElement | null)?.focus();
    } else if (e.key === "End" && items.length > 0) {
      e.preventDefault();
      const last = items[items.length - 1] as HTMLElement;
      (last.querySelector("button") as HTMLElement | null)?.focus();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      if (recentlyDeleted) {
        e.preventDefault();
        undoDeleteEvidence();
      } else if (recentlyDeletedExperiment) {
        e.preventDefault();
        undoDeleteExperiment();
      }
    }
  }



  function handleExperimentKeyDown(
    e: React.KeyboardEvent<HTMLElement>,
    experimentId: string,
  ) {
    const experiment = execution.experiments.find((ex) => ex.id === experimentId);
    if (!experiment) return;

    // Enter to toggle expand
    if (e.key === "Enter" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setRequestedExpandedExperimentId((current) =>
        current === experimentId ? null : experimentId,
      );
      return;
    }

    // Number keys to change status (1=untested, 2=testing, 3=supported, 4=refuted)
    const statusOrder: Array<keyof typeof EXPERIMENT_STATUS_LABELS> = [
      "untested",
      "testing",
      "supported",
      "refuted",
    ];
    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= statusOrder.length) {
      const newStatus = statusOrder[num - 1];
      if (experiment.status !== newStatus) {
        e.preventDefault();
        updateExperiment(experimentId, (current) => ({
          ...current,
          status: newStatus,
        }));
      }
    }

    // Alt+ArrowUp/Down to reorder hypothesis
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const idx = execution.experiments.findIndex((ex) => ex.id === experimentId);
      const targetIdx = e.key === "ArrowUp" ? idx - 1 : idx + 1;
      if (idx >= 0 && targetIdx >= 0 && targetIdx < execution.experiments.length) {
        e.preventDefault();
        const next = [...execution.experiments];
        const [m] = next.splice(idx, 1);
        next.splice(targetIdx, 0, m);
        pushHistory(execution, "reorder experiments"); onChange({ ...execution, experiments: next, updatedAt: new Date().toISOString() });
        srAnnounce("Hypothesis moved " + (e.key === "ArrowUp" ? "up" : "down") + ".");
        requestAnimationFrame(() => (e.currentTarget as HTMLElement).focus());
      }
      return;
    }

    // ArrowUp/Down/Home/End to move focus between experiments
    const articles = Array.from(
      document.querySelectorAll("[data-experiment-article]"),
    );
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const currentIdx = articles.findIndex((el) => el === e.currentTarget);
      if (currentIdx === -1) return;

      let nextIdx = currentIdx;
      if (e.key === "ArrowUp" && currentIdx > 0) {
        nextIdx = currentIdx - 1;
      } else if (
        e.key === "ArrowDown" &&
        currentIdx < articles.length - 1
      ) {
        nextIdx = currentIdx + 1;
      }

      if (nextIdx !== currentIdx) {
        e.preventDefault();
        (articles[nextIdx] as HTMLElement).focus();
      }
    } else if (e.key === "Home" && articles.length > 0) {
      e.preventDefault();
      (articles[0] as HTMLElement).focus();
    } else if (e.key === "End" && articles.length > 0) {
      e.preventDefault();
      (articles[articles.length - 1] as HTMLElement).focus();
    }
  }

  function notifyConfidenceChange(
    experimentId: string,
    oldConfidence: ConfidenceLevel,
    newConfidence: ConfidenceLevel,
  ) {
    if (oldConfidence === newConfidence) return;

    // Flash animation
    setConfidenceFlashIds((prev) => {
      const next = new Set(prev);
      next.add(experimentId);
      return next;
    });
    window.setTimeout(() => {
      setConfidenceFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(experimentId);
        return next;
      });
    }, 1200);

    // Toast notification - subtle, auto-dismisses
    const labels: Record<ConfidenceLevel, string> = { low: "Low", medium: "Medium", high: "High" };
    showToast(
      `Confidence updated: ${labels[oldConfidence]} -> ${labels[newConfidence]}`,
      "info",
      2200,
    );
    srAnnounce(
      `Confidence changed from ${labels[oldConfidence]} to ${labels[newConfidence]}`,
    );
  }

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const doFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, []);
  const doToggleSelectMode = useCallback(() => {
    setSelectMode((v) => { const next = !v; if (!next) setSelectedExperimentIds(new Set()); return next; });
  }, []);
  const doClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setTagFilter(null);
    setSortBy("default");
    setSelectMode(false);
    setSelectedExperimentIds(new Set());
    searchInputRef.current?.blur();
  }, [setSearchQuery, setStatusFilter, setTagFilter, setSortBy, setSelectMode, setSelectedExperimentIds]);
  const doCollapseAll = useCallback(() => setRequestedExpandedExperimentId(null), [setRequestedExpandedExperimentId]);
  useEffect(() => {
    if (!selectMode) return;
    window.requestAnimationFrame(() => {
      const tb = document.querySelector('[data-hypothesis-bulk-toolbar] button') as HTMLElement | null;
      tb?.focus();
    });
  }, [selectMode]);
  useEffect(() => {
    const off1 = registerShortcut('focusSearch', (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      event.preventDefault();
      doFocusSearch();
    });
    const off2 = registerShortcut('toggleSelectMode', (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      event.preventDefault();
      doToggleSelectMode();
    });
    const offUndo = registerShortcut('undo', (event: KeyboardEvent) => {
      const t = event.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      event.preventDefault();
      undo();
    });
    const offRedo = registerShortcut('redo', (event: KeyboardEvent) => {
      const t = event.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      event.preventDefault();
      redo();
    });
    const onFocusEvent = () => doFocusSearch();
    const onToggleEvent = () => doToggleSelectMode();
    const onClearFilters = () => doClearFilters();
    const onFilterStatus = (e: Event) => { const v = (e as CustomEvent<"all" | "active" | "decided">).detail; if (v !== "all" && v !== "active" && v !== "decided") return; setStatusFilter(v); setSearchQuery(""); setTagFilter(null); };
    const onCollapseAll = () => doCollapseAll();
    const onBulkStatus = (e: Event) => { const s = (e as CustomEvent<string>).detail as ExperimentStatus; if (s) setSelectedStatus(s); };
    const onBulkArchive = () => batchArchive(true);
    const onBulkUnarchive = () => batchArchive(false);
    const onBulkSelectAll = () => toggleSelectAllExperiments();
    const onBulkClear = () => { setSelectedExperimentIds(new Set()); setSelectMode(false); };
    const onNewExperiment = () => { setIsAddingExperiment(true); window.setTimeout(() => newExperimentInputRef.current?.focus(), 50); newExperimentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); };
    const onFocusExperiment = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (!id) return;
      setTimelinePulseKey(id);
      if (timelinePulseTimer.current) window.clearTimeout(timelinePulseTimer.current);
      timelinePulseTimer.current = window.setTimeout(() => setTimelinePulseKey(null), 1600);
      window.setTimeout(() => {
        const el = document.querySelector(`[data-experiment-article][data-experiment-id="${id}"]`) as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    };
        function onFocusCard(dir: 1 | -1) {
      const cards = Array.from(document.querySelectorAll("[data-experiment-article]") as NodeListOf<HTMLElement>);
      if (cards.length === 0) return;
      const active = document.activeElement as HTMLElement | null;
      const currentIdx = active ? cards.findIndex((el) => el.contains(active)) : -1;
      let nextIdx = currentIdx < 0 ? 0 : currentIdx + dir;
      if (nextIdx < 0) nextIdx = cards.length - 1;
      if (nextIdx >= cards.length) nextIdx = 0;
      const next = cards[nextIdx];
      next.scrollIntoView({ behavior: "smooth", block: "center" });
      next.tabIndex = 0;
      next.focus({ preventScroll: true });
      setTimelinePulseKey(next.getAttribute("data-experiment-id"));
      if (timelinePulseTimer.current) window.clearTimeout(timelinePulseTimer.current);
      timelinePulseTimer.current = window.setTimeout(() => setTimelinePulseKey(null), 1600);
    }
    const onCardNav = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "j") { e.preventDefault(); onFocusCard(1); }
      else if (e.key === "k") { e.preventDefault(); onFocusCard(-1); }
    };
    window.addEventListener("keydown", onCardNav);
    const onHistoryNav = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onHistoryNav);
    window.addEventListener("launchlens:focus-search", onFocusEvent);
    window.addEventListener("launchlens:toggle-select-mode", onToggleEvent);
    window.addEventListener("launchlens:clear-filters", onClearFilters);
    window.addEventListener("launchlens:filter-status", onFilterStatus as EventListener);
    window.addEventListener("launchlens:collapse-all", onCollapseAll);
    window.addEventListener("launchlens:bulk-status", onBulkStatus as EventListener);
    window.addEventListener("launchlens:bulk-archive", onBulkArchive);
    window.addEventListener("launchlens:bulk-unarchive", onBulkUnarchive);
    window.addEventListener("launchlens:bulk-select-all", onBulkSelectAll);
    window.addEventListener("launchlens:bulk-clear", onBulkClear);
    window.addEventListener("launchlens:new-experiment", onNewExperiment);
    window.addEventListener("launchlens:focus-experiment", onFocusExperiment as EventListener);
    return () => { off1?.(); off2?.(); offUndo?.(); offRedo?.(); const w = window; w.removeEventListener("keydown", onCardNav); w.removeEventListener("keydown", onHistoryNav); w.removeEventListener("launchlens:focus-search", onFocusEvent); w.removeEventListener("launchlens:toggle-select-mode", onToggleEvent); w.removeEventListener("launchlens:clear-filters", onClearFilters); w.removeEventListener("launchlens:filter-status", onFilterStatus as EventListener); w.removeEventListener("launchlens:collapse-all", onCollapseAll); w.removeEventListener("launchlens:bulk-status", onBulkStatus as EventListener); w.removeEventListener("launchlens:bulk-archive", onBulkArchive); w.removeEventListener("launchlens:bulk-unarchive", onBulkUnarchive); w.removeEventListener("launchlens:bulk-select-all", onBulkSelectAll); w.removeEventListener("launchlens:bulk-clear", onBulkClear); w.removeEventListener("launchlens:new-experiment", onNewExperiment); w.removeEventListener("launchlens:focus-experiment", onFocusExperiment as EventListener); };
  }, [doFocusSearch, doToggleSelectMode, doClearFilters, doCollapseAll, setSelectedStatus, batchArchive, toggleSelectAllExperiments, undo, redo]);

  function addEvidence(
    event: React.FormEvent<HTMLFormElement>,
    experimentId: string,
  ) {
    event.preventDefault();

    // Batch paste mode
    if (isBatchMode) {
      const lines = batchText.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        setDraftSubmitError("Paste at least one evidence line.");
        return;
      }
      if (lines.length > 8) {
        setDraftSubmitError("Maximum 8 evidence items per hypothesis.");
        return;
      }

      const items = lines
        .map((raw) => {
          const line = raw.trim();
          // Detect signal + optional weight prefix
          // Prefix format: [signal][weight?]
          //   + supports, - challenges, ~ neutral
          //   +s strong support, +m moderate support, +a anecdotal support
          //   -s strong challenge, -m moderate challenge, -a anecdotal challenge
          let signal: EvidenceSignal = draft.signal;
          let weight: EvidenceWeight = draft.weight;
          let rest = line;
          // Prefix signals: +/-/~ with optional weight letter s/m/a.
          const signalMap: Record<string, EvidenceSignal> = {
            "+": "supports",
            "-": "challenges",
            "~": "neutral",
          };
          const weightMap: Record<string, EvidenceWeight> = {
            s: "strong",
            S: "strong",
            m: "moderate",
            M: "moderate",
            a: "anecdotal",
            A: "anecdotal",
          };
          const c0 = line[0];
          if (c0 in signalMap) {
            signal = signalMap[c0];
            let consume = 1;
            const c1 = line[1];
            if (c1 && c1 in weightMap) {
              const c2 = line[2];
              const isSep = !c2 || c2 === " " || c2 === "\t" || c2 === ":" || c2 === "-";
              if (isSep) {
                weight = weightMap[c1];
                consume = 2;
              }
            }
            rest = line.slice(consume).trim();
          } else {
            // Heuristic signal inference from keywords when no prefix is present.
            const lower = line.toLowerCase();
            if (/\b(support(s|ed)?|confirm(s|ed)?|prove[sn]?|proven|validat(e|ed|es|ion)|works|work(s|ed)?|success(ful|fully)?|pass(ed|es)?|win|won|ship(ped)?|launch(ed)?|live|good|great|positive|up)\b/.test(lower)) signal = "supports";
            else if (/\b(challenge[sd]?|refute[sd]?|contradict|fail(s|ed|ing|ure)?|broke(n)?|bug(s|gy)?|issue(s|d)?|problem(s|atic)?|block(ed|er|s)?|risk(s|y)?|bad|neg(ative)?|down|drop(ped)?|loss|decline|concern)\b/.test(lower)) signal = "challenges";
            else if (/\b(mixed|neutral|unclear|maybe|uncertain|tbd|unknown|inconclusive|ambiguous|\?)\b/.test(lower)) signal = "neutral";
          }
          // Split on " - " or first ":" for source/note
          let source = "";
          let note = "";
          let sepIdx = -1;
          const sepCandidates = [" - ", "\t", ": "];
          for (const s of sepCandidates) { const i = rest.indexOf(s); if (i >= 0 && (sepIdx === -1 || i < sepIdx)) sepIdx = i; }
          if (sepIdx >= 0) {
            const matched = sepCandidates.find((s) => rest.indexOf(s) === sepIdx) ?? " - ";
            source = rest.slice(0, sepIdx).trim();
            note = rest.slice(sepIdx + matched.length).trim();
          } else {
            note = rest;
            source = `Observation`;
          }

          if (note.length < 2) return null;

          return {
            id: evidenceId(),
            note,
            source: source || "Observation",
            signal,
            weight,
            observedAt: new Date().toISOString(),
          };
        })
        .filter(Boolean) as ValidationEvidence[];

      if (items.length === 0) {
        setDraftSubmitError("No valid evidence lines found.");
        return;
      }

      const experimentBefore = execution.experiments.find((e) => e.id === experimentId);
      const wasManual = experimentBefore?.confidenceManual ?? false;
      const oldConfidence = experimentBefore?.confidence ?? "low";

      updateExperiment(experimentId, (experiment) => {
        const newEvidence = [...experiment.evidence, ...items].slice(0, 8);
        const isManual = experiment.confidenceManual;
        return {
          ...experiment,
          status: experiment.status === "untested" ? "testing" : experiment.status,
          evidence: newEvidence,
          confidence: isManual
            ? experiment.confidence
            : computeExperimentConfidence(newEvidence),
        };
      });

      setBatchText("");
      setIsBatchMode(false);
      setDraftSubmitError("");

      if (!wasManual && experimentBefore) {
        const updatedExperiment = execution.experiments.find((e) => e.id === experimentId);
        const currentItems = updatedExperiment?.evidence ?? [];
        const combined = [...currentItems, ...items];
        const newConfidence = computeExperimentConfidence(combined);
        if (newConfidence !== oldConfidence) {
          notifyConfidenceChange(experimentId, oldConfidence, newConfidence);
        }
      }

      items.forEach((it) => pushHistoryEvent(experimentId, { kind: "evidence_added", source: it.source, targetId: it.id, label: it.note.slice(0, 60) }));
      srAnnounce(`Added ${items.length} evidence items.`);
      showToast(`Added ${items.length} evidence items.`, "success", 3000);
      return;
    }

    const note = draft.note.trim();
    const source = draft.source.trim();

    setDraftTouched({ source: true, note: true });
    if (source.length < 2 || note.length < 8) {
      setDraftSubmitError("Please fill in the source and observation before recording evidence.");
      srAnnounce("Evidence not recorded. Please fill in the source and observation.");
      return;
    }
    if (source.length > 80 || note.length > 500) {
      setDraftSubmitError("Source and observation must be within length limits.");
      return;
    }
    setDraftSubmitError("");

    const newEvidenceId = evidenceId();
    const experimentBefore = execution.experiments.find((e) => e.id === experimentId);
    const oldConfidence = experimentBefore?.confidence ?? "low";
    const wasManual = experimentBefore?.confidenceManual ?? false;

    if (editingEvidenceId) {
      // Update existing evidence
      updateExperiment(experimentId, (experiment) => {
        const newEvidence = experiment.evidence.map((item) =>
          item.id === editingEvidenceId
            ? { ...item, note, source, signal: draft.signal, weight: draft.weight }
            : item,
        );
        const isManual = experiment.confidenceManual;
        return {
          ...experiment,
          evidence: newEvidence,
          confidence: isManual
            ? experiment.confidence
            : computeExperimentConfidence(newEvidence),
        };
      });
      srAnnounce(`Evidence from ${source} updated.`);
      setEditingEvidenceId(null);
    } else {
      // Add new evidence
      updateExperiment(experimentId, (experiment) => {
        const newEvidence = [
          ...experiment.evidence,
          {
            id: newEvidenceId,
            note,
            source,
            signal: draft.signal,
            weight: draft.weight,
            observedAt: new Date().toISOString(),
          },
        ];
        const isManual = experiment.confidenceManual;
        return {
          ...experiment,
          status: experiment.status === "untested" ? "testing" : experiment.status,
          evidence: newEvidence,
          confidence: isManual
            ? experiment.confidence
            : computeExperimentConfidence(newEvidence),
        };
      });
      const updatedExperiment = execution.experiments.find((e) => e.id === experimentId);
      const count = updatedExperiment ? updatedExperiment.evidence.length + 1 : 1;
      pushHistoryEvent(experimentId, { kind: "evidence_added", source, targetId: newEvidenceId, label: note.slice(0, 60) });
      srAnnounce(
        `Evidence recorded: ${source}. ${count} items total.`,
      );
    }

    // Notify of confidence change if auto-computed
    if (!wasManual && experimentBefore) {
      // Compute what the new confidence will be
      let newConfidence = oldConfidence;
      if (editingEvidenceId) {
        const updated = experimentBefore.evidence.map((item) =>
          item.id === editingEvidenceId
            ? { ...item, note, source, signal: draft.signal, weight: draft.weight }
            : item,
        );
        newConfidence = computeExperimentConfidence(updated);
      } else {
        const withNew = [
          ...experimentBefore.evidence,
          { id: "", note, source, signal: draft.signal, weight: draft.weight, observedAt: "" },
        ];
        newConfidence = computeExperimentConfidence(withNew);
      }
      if (oldConfidence !== newConfidence) {
        notifyConfidenceChange(experimentId, oldConfidence, newConfidence);
      }
    }

    setDraft(emptyDraft);
    setDraftTouched({ source: false, note: false });
    setDraftSubmitError("");
    setActiveExperimentId("");
    // Move focus to the evidence list region for keyboard / screen-reader users
    if (evidenceListRef.current) {
      evidenceListRef.current.focus();
    }
  }

  return (
    <section id="validation-board" aria-label={t("vBoard.sectionAria")} className="overflow-hidden rounded-md border border-card bg-card shadow-[0_24px_80px_-68px_rgba(17,19,18,0.55)]">
      <span role="status" aria-live="polite" className="sr-only">
        {srEvidenceAnnouncement}
      </span>
      <div className="flex flex-col gap-3 border-b border-card p-4 sm:gap-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background sm:size-9">
            <FlaskConical className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Validation loop
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-muted sm:mt-1 sm:text-sm sm:leading-6">
              Turn generated assumptions into evidence-backed product decisions.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:min-w-[310px] sm:max-w-sm">
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs sm:gap-2">
            <div className="rounded-md border border-input bg-card px-2 py-1.5 sm:px-3 sm:py-2">
              <strong className="block text-sm font-semibold text-foreground">
                {progress.score}%
              </strong>
              progress
            </div>
            <div className="rounded-md border border-input bg-card px-3 py-2">
              <strong className="block text-sm text-signal-supports">
                {progress.withEvidence}/{progress.total}
              </strong>
              evidenced
            </div>
            <div className="rounded-md border border-input bg-card px-3 py-2">
              <strong className="block text-sm text-signal-neutral">
                {progress.decided}/{progress.total}
              </strong>
              decided
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWeightPicker(!showWeightPicker)}
              aria-haspopup="menu"
              aria-expanded={showWeightPicker}
              aria-label={t("vBoard.progress")}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground/70 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            >
              <span className="font-medium">
                Weights: {weightPreset === "default" ? "Balanced" : weightPreset === "evidence" ? "Evidence-heavy" : "Decision-heavy"}
              </span>
              <ChevronDown
                className={`size-3.5 transition-transform ${showWeightPicker ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {showWeightPicker && (
              <div
                role="menu"
                className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-md border border-card bg-card shadow-lg"
              >
                {([
                  ["default", "Balanced", "All checkpoints equal"],
                  ["evidence", "Evidence-heavy", "Evidence gathering counts more"],
                  ["decision", "Decision-heavy", "Reaching conclusions counts more"],
                ] as const).map(([value, label, desc]) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setWeightPreset(value);
                      setShowWeightPicker(false);
                    }}
                    aria-current={weightPreset === value}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-foreground/80 transition hover:bg-muted hover:text-foreground"
                  >
                    <div>
                      <div className="font-semibold">{label}</div>
                      <div className="text-[10px] text-muted">{desc}</div>
                    </div>
                    {weightPreset === value && (
                      <Check className="size-3.5 text-accent" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.score}
            aria-labelledby="validation-progress-label"
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${progress.score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2 border-b border-card px-3 py-2 sm:px-5 xl:flex xl:items-center xl:justify-between">
        <ValidationBoardFilterBar
          experimentCount={execution.experiments.length}
          activeCount={
            execution.experiments.filter(
              (experiment) =>
                experiment.status === "untested" ||
                experiment.status === "testing",
            ).length
          }
          decidedCount={
            execution.experiments.filter(
              (experiment) =>
                experiment.status === "supported" ||
                experiment.status === "refuted",
            ).length
          }
          statusFilter={statusFilter}
          sortBy={sortBy}
          tags={allTags}
          tagFilter={tagFilter}
          searchQuery={searchQuery}
          searchInputRef={searchInputRef}
          onStatusFilterChange={setStatusFilter}
          onTagFilterChange={setTagFilter}
          onSearchQueryChange={setSearchQuery}
          onSortByChange={setSortBy}
        />
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
          {selectMode && batchCount > 0 && (
            <ValidationBulkActionsToolbar
              batchCount={batchCount}
              batchTagInput={batchTagInput}
              batchTagMode={batchTagMode}
              allWorkspaceTags={allWorkspaceTags}
              selectedTags={selectedTagsUnion}
              isBatchBriefing={isBatchBriefing}
              batchBriefProgress={batchBriefProgress}
              onSelectAll={toggleSelectAllExperiments}
              onSetStatus={setSelectedStatus}
              onBatchTagModeChange={setBatchTagMode}
              onBatchTagInputChange={setBatchTagInput}
              onApplyBatchTagInput={applyBatchTagFromInput}
              onBatchAddTag={batchAddTag}
              onBatchRemoveTag={batchRemoveTag}
              onGenerateBriefs={batchGenerateBriefs}
              onArchive={() => batchArchive(true)}
              onDelete={batchDeleteExperiments}
              onClear={() => setSelectedExperimentIds(new Set())}
            />
          )}
          <button
            type="button"
            onClick={() => { setSelectMode((v) => { if (v) setSelectedExperimentIds(new Set()); return !v; }); }}
            aria-pressed={selectMode}
            className={"flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 " + (selectMode ? "border-accent bg-accent text-primary-text" : "border-input bg-card text-foreground/80 hover:border-accent hover:text-foreground")}
            title={t("vBoard.selectModeTitle")}
          >
            <CheckSquare className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t("vBoard.select")}</span>
          </button>
          <ValidationBoardExportMenu
            open={boardExportOpen}
            onToggle={() => setBoardExportOpen((open) => !open)}
            onClose={() => setBoardExportOpen(false)}
            onCopyMarkdown={copyBoardMarkdown}
            onDownloadMarkdown={downloadBoardMarkdown}
            onDownloadJson={downloadBoardJson}
          />
          <button
            type="button"
            onClick={() => { const opening = !isAddingExperiment; setIsAddingExperiment(opening); if (opening) window.setTimeout(() => newExperimentInputRef.current?.focus(), 50); }}
            aria-expanded={isAddingExperiment}
            className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-primary-text transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t("vBoard.newHypothesis")}</span>
            <span className="sm:hidden">{t("vBoard.newShort")}</span>
          </button>
        </div>
      </div>
      {isAddingExperiment && (
        <div className="border-b border-card bg-input p-3 sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">
              {t("vBoard.newHypothesisLabel")}
            </span>
            {(() => {
                const trimmed = newExperimentDraft.trim();
                const dup =
                  trimmed.length >= 5 &&
                  isDuplicateAssumption(trimmed, execution.experiments);
                const tooShort = trimmed.length > 0 && trimmed.length < 5;
                return (<>
                  <p id="new-hypothesis-hint" className="sr-only">{t("vBoard.newHypothesisHint")}</p>
                  {(tooShort || dup) && <p id="new-hypothesis-error" role="alert" className="mt-1 text-[11px] text-signal-challenges">{dup ? t("vBoard.newHypothesisDup") : t("vBoard.newHypothesisTooShort")}</p>}
                </>);
              })()}
            <input
              type="text"
              value={newExperimentDraft}
              onChange={(e) => setNewExperimentDraft(e.target.value)}
              placeholder={t("vBoard.newHypothesisPlaceholder")}
              autoFocus
              ref={newExperimentInputRef}
              data-new-experiment-input
              aria-describedby="new-hypothesis-hint new-hypothesis-error"
              aria-invalid={newExperimentDraft.trim().length > 0 && newExperimentDraft.trim().length < 5}
              className={"h-10 w-full rounded-md border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--ring-color)] " + (newExperimentDraft.trim().length > 0 && newExperimentDraft.trim().length < 5 ? "border-signal-challenges focus:border-signal-challenges" : "border-input focus:border-accent")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isInvalidNewExperimentDraft()) {
                  e.preventDefault();
                  submitNewExperiment();
                }
              }}
            />
          {newExperimentTags.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {newExperimentTags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted">
                  #{t}
                  <button type="button" aria-label={`Remove tag ${t}`} onClick={() => setNewExperimentTags(newExperimentTags.filter((x) => x !== t))} className="text-muted/60 hover:text-foreground"><X className="size-2.5" /></button>
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={newExperimentTagDraft}
              onChange={(e) => setNewExperimentTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  commitNewExperimentTag();
                } else if (e.key === "Backspace" && newExperimentTagDraft.length === 0 && newExperimentTags.length > 0) {
                  setNewExperimentTags(newExperimentTags.slice(0, -1));
                }
              }}
              onBlur={() => commitNewExperimentTag()}
              placeholder={t("vBoard.tagPlaceholder")}
              list="existing-tags-datalist"
              className="h-8 flex-1 rounded-md border border-input bg-card px-3 text-xs text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <datalist id="existing-tags-datalist">{allTags.map((t) => <option key={t} value={t} />)}</datalist>
          </div>
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingExperiment(false);
                setNewExperimentDraft("");
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
            >
              {t("vBoard.cancel")}
            </button>
            <button
              type="button"
              onClick={submitNewExperiment}
              disabled={isInvalidNewExperimentDraft()}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-primary-text transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("vBoard.addHypothesis")}
            </button>
          </div>
        </div>
      )}
      <div className="divide-y divide-[#edf0ea]">
        {filteredExperiments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-foreground">{t("vBoard.emptyTitle")}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted sm:mt-1 sm:text-sm sm:leading-6">
              {t("vBoard.emptyBody")}
            </p>
          </div>
        ) : null}
        {[...activeExperiments].map((experiment, index) => {
          const formOpen = activeExperimentId === experiment.id;
          const expanded = expandedExperimentId === experiment.id;
          const evidenceLimitReached = experiment.evidence.length >= 8;

          return (
            <article
              role="group"
              key={experiment.id}
              data-experiment-article
              data-experiment-id={experiment.id}
              draggable
              onDragStart={(e) => {
                setDraggedExperimentId(experiment.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", experiment.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverExperimentId !== experiment.id) setDragOverExperimentId(experiment.id);
              }}
              onDragLeave={() => {
                if (dragOverExperimentId === experiment.id) setDragOverExperimentId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = draggedExperimentId ?? e.dataTransfer.getData("text/plain");
                setDraggedExperimentId(null);
                setDragOverExperimentId(null);
                if (draggedId) moveExperiment(draggedId, experiment.id);
              }}
              onDragEnd={() => {
                setDraggedExperimentId(null);
                setDragOverExperimentId(null);
              }}
              tabIndex={focusedExperimentId === null ? (index === 0 ? 0 : -1) : focusedExperimentId === experiment.id ? 0 : -1}
              onFocus={() => setFocusedExperimentId(experiment.id)}
              onKeyDown={(e) => handleExperimentKeyDown(e, experiment.id)}
              aria-label={t("vBoard.hypothesisAria", { index: index + 1, assumption: experiment.assumption, status: statusLabel(experiment.status), count: experiment.evidence.length })}
              className={
                "relative flex flex-col rounded-md border bg-card p-5 outline-none transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset " +
                (draggedExperimentId === experiment.id ? "opacity-40 " : "") +
                (dragOverExperimentId === experiment.id && draggedExperimentId !== experiment.id ? "border-t-2 border-accent " : "") +
                (timelinePulseKey === experiment.id ? " ring-2 ring-accent/60 shadow-[0_0_0_4px_rgba(120,120,255,0.12)] " : "")
              }
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectMode && (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={selectedExperimentIds.has(experiment.id)}
                        aria-label={`Select hypothesis ${index + 1}: ${experiment.assumption.slice(0, 80)}${experiment.assumption.length > 80 ? "..." : ""}`} title={`Select hypothesis: ${experiment.assumption.slice(0, 100)}`}
                        onClick={(e) => { e.stopPropagation(); toggleExperimentSelection(experiment.id, e.shiftKey); }}
                        className="flex size-5 shrink-0 items-center justify-center rounded text-muted transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {selectedExperimentIds.has(experiment.id) ? <CheckSquare className="size-3.5" aria-hidden="true" /> : <Square className="size-3.5" aria-hidden="true" />}
                      </button>
                    )}
                    <button
                      type="button"
                      data-experiment-grip={experiment.id} aria-label={t("vBoard.gripAria")} title={t("vBoard.gripTitle")}
                      className="-ml-1 flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted/40 transition hover:bg-muted hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (!event.altKey) return;
                        const list = activeExperiments;
                        const idx = list.findIndex((e) => e.id === experiment.id);
                        if (idx < 0) return;
                        if (event.key === "ArrowUp" && idx > 0) {
                          event.preventDefault();
                          moveExperiment(experiment.id, list[idx - 1].id);
                          const movedId = experiment.id;
                          requestAnimationFrame(() => {
                            const sel = '[data-experiment-grip="' + movedId + '"]';
                            const el = document.querySelector(sel) as HTMLElement | null;
                            el?.focus();
                          });
                        } else if (event.key === "ArrowDown" && idx < list.length - 1) {
                          event.preventDefault();
                          moveExperiment(experiment.id, list[idx + 1].id);
                          const movedId = experiment.id;
                          requestAnimationFrame(() => {
                            const sel = '[data-experiment-grip="' + movedId + '"]';
                            const el = document.querySelector(sel) as HTMLElement | null;
                            el?.focus();
                          });
                        }
                      }}
                    >
                      <GripVertical className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); if (experiment.archived) return; toggleHypothesisPin(experiment.id); }}
                      disabled={experiment.archived}
                      title={experiment.archived ? "Unarchive to pin" : (experiment.pinned ? "Unpin hypothesis" : "Pin hypothesis to top of default order")}
                      aria-label={experiment.archived ? "Unarchive to pin" : (experiment.pinned ? ("Unpin hypothesis: " + experiment.assumption.slice(0,60)) : ("Pin hypothesis to top: " + experiment.assumption.slice(0,60)))}
                      aria-pressed={Boolean(experiment.pinned)}
                      className={"flex size-5 shrink-0 items-center justify-center rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-30 " + (experiment.archived ? "text-muted/25 " : (experiment.pinned ? "text-amber-500 hover:text-amber-600 " : "text-muted/40 hover:text-amber-500 "))}
                    >
                      <Star className={"size-3.5 " + (experiment.pinned && !experiment.archived ? "fill-current" : "")} aria-hidden="true" />
                    </button>
                    <span className="font-mono text-xs font-semibold text-signal-challenges">
                      H{index + 1}
                    </span>
                    <span
                      role="status"
                      aria-label={t("vBoard.statusAria", { status: statusLabel(experiment.status), desc: statusDesc(experiment.status) })}
                      title={statusDesc(experiment.status)}
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(experiment.status)}`}
                    >
                      {EXPERIMENT_STATUS_LABELS[experiment.status]}
                    </span>
                    <span
                      aria-label={t("vBoard.confidenceAria", { confidence: confidenceLabel(experiment.confidence), desc: confidenceDesc(experiment.confidence), mode: experiment.confidenceManual ? t("vBoard.confidenceManualSuffix") : (experiment.evidence.length > 0 ? t("vBoard.confidenceAutoEvidenceSuffix") : "") })}
                      title={confidenceDesc(experiment.confidence) + (experiment.confidenceManual ? " (" + t("vBoard.confidenceManualSuffix") + ")" : experiment.evidence.length > 0 ? " (" + t("vBoard.confidenceAutoEvidenceSuffix") + ")" : "")}
                      className={
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold " +
                        (experiment.confidence === "low"
                          ? "bg-signal-challenges/15 text-signal-challenges"
                          : experiment.confidence === "medium"
                          ? "bg-signal-supports/30 text-signal-supports"
                          : "bg-signal-supports/15 text-signal-supports")
                      }
                    >
                      <span
                        className={
                          "size-1.5 rounded-full " +
                          (experiment.confidence === "low"
                            ? "bg-signal-challenges"
                            : experiment.confidence === "medium"
                            ? "bg-signal-supports/70"
                            : "bg-signal-supports")
                        }
                      />
                      {titleCase(experiment.confidence)}
                      {!experiment.confidenceManual && experiment.evidence.length > 0 && (
                        <span className="text-[10px] font-medium opacity-75">-auto</span>
                      )}
                    </span>
                    <span className="text-xs text-muted" aria-label={`${experiment.evidence.length} evidence item${experiment.evidence.length === 1 ? "" : "s"}`}>
                      {experiment.evidence.length} evidence item
                      {experiment.evidence.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {experiment.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {experiment.tags.map((t) => {
                        const ts = tagStyle(t);
                        return (
                        <span key={t} className={"group inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium " + ts.pill + " " + ts.text}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setTagFilter(tagFilter === t ? null : t); }}
                            className="hover:text-accent"
                          >
                            #{t}
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove tag ${t}`}
                            onClick={(e) => { e.stopPropagation(); removeExperimentTag(experiment.id, t); }}
                            className="ml-0.5 rounded-full text-muted/50 opacity-0 transition hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                          >
                            <X className="size-2.5" />
                          </button>
                        </span>
                      ); })}
                    </div>
                  )}
                  <h3 className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-foreground">
                    {experiment.assumption}
                  </h3>
                </div>

                <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                                    <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateExperiment(experiment.id, (exp) => ({ ...exp, archived: !exp.archived }));
                      srAnnounce(experiment.archived ? "Hypothesis unarchived." : "Hypothesis archived.");
                    }}
                    title={experiment.archived ? "Unarchive" : "Archive hypothesis"}
                    aria-label={experiment.archived ? "Unarchive" : "Archive hypothesis"}
                    data-meta-target="archived"
                    className={"flex h-11 w-11 items-center justify-center rounded-md border border-input bg-card text-foreground/60 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:h-10 sm:w-10 " + (experiment.archived ? "text-accent" : "")}
                  >
                    <Archive className="size-4" aria-hidden="true" />
                  </button>
<button
                    type="button"
                    onClick={() =>
                      setRequestedExpandedExperimentId((current) =>
                        current === experiment.id ? null : experiment.id,
                      )
                    }
                    aria-expanded={expanded}
                    aria-controls={`experiment-details-${experiment.id}`}
                    className="flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-semibold text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:h-10"
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
                    onClick={() => { if (experiment.archived) return; openEvidenceForm(experiment.id); }}
                    disabled={evidenceLimitReached || experiment.archived}
                    aria-expanded={formOpen}
                    aria-controls={`evidence-form-${experiment.id}`}
                    className="flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-input px-4 text-sm font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {formOpen ? "Cancel" : "Add evidence"}
                  </button>
                
                  <div className="relative">
                     <button
                       type="button"
                       onClick={() =>
                         setExportMenuId((current) =>
                           current === experiment.id ? null : experiment.id,
                         )
                       }
                       aria-expanded={exportMenuId === experiment.id}
                       aria-haspopup="true"
                       aria-label={t("vBoard.exportAria")}
                       title={t("vBoard.exportTitle")}
                       className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:h-10 sm:w-10"
                     >
                       <Download className="size-4" aria-hidden="true" />
                     </button>
                     {exportMenuId === experiment.id && (
                       <>
                         <div
                           className="fixed inset-0 z-10"
                           onClick={() => setExportMenuId(null)}
                           aria-hidden="true"
                         />
                         <div
                           role="menu"
                           className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-input bg-card py-1 text-sm shadow-lg"
                         >
                           <button
                             type="button"
                             role="menuitem"
                             onClick={() => {
                               copyExperimentMarkdown(experiment);
                               setExportMenuId(null);
                             }}
                             className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground/80 transition hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none"
                           >
                             Copy Markdown
                           </button>
                           <button
                             type="button"
                             role="menuitem"
                             onClick={() => {
                               downloadExperimentMarkdown(experiment);
                               setExportMenuId(null);
                             }}
                             className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground/80 transition hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none"
                           >
                             Download Markdown
                           </button>
                           <button
                             type="button"
                             role="menuitem"
                             onClick={() => {
                               downloadExperimentJson(experiment);
                               setExportMenuId(null);
                             }}
                             className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground/80 transition hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none"
                           >
                             Download JSON
                           </button>
                         </div>
                       </>
                     )}
                   </div>
                   <button
                    type="button"
                    onClick={() => {
                      if (confirm("Remove this hypothesis? All evidence will be lost.")) {
                        deleteExperiment(experiment.id);
                      }
                    }}
                    aria-label={t("vBoard.removeHypothesisAria")}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-input bg-card text-muted transition hover:border-signal-challenges hover:text-signal-challenges focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 sm:h-10 sm:w-10"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button></div>
              </div>

              <div
                id={`experiment-details-${experiment.id}`}
                className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
                aria-hidden={!expanded}
              >
                <div className="min-h-0 overflow-hidden" inert={!expanded}>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="block" data-meta-target="status">
                  <span className="mb-2 block text-xs font-semibold uppercase text-muted">
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
                    className="h-10 w-full rounded-md border border-input bg-input px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  >
                    {Object.entries(EXPERIMENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block" data-meta-target="confidence">
                  <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                    Confidence
                    {!experiment.confidenceManual && experiment.evidence.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-signal-supports/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-signal-supports">
                        Auto
                      </span>
                    )}
                    {experiment.confidenceManual && (
                      <button
                        type="button"
                        onClick={() => {
                          updateExperiment(experiment.id, (current) => ({
                            ...current,
                            confidence: computeExperimentConfidence(current.evidence),
                            confidenceManual: false,
                          }));
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted transition hover:border-accent hover:text-accent"
                        aria-label={t("vBoard.confidenceTitleAuto")}
                      >
                        {t("vBoard.confidenceManualLabel")}
                      </button>
                    )}
                  </span>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className={
                        "pointer-events-none absolute left-3 top-1/2 size-2.5 -translate-y-1/2 rounded-full " +
                        (experiment.confidence === "low"
                          ? "bg-signal-challenges"
                          : experiment.confidence === "medium"
                          ? "bg-signal-supports/60"
                          : "bg-signal-supports")
                      }
                    />
                    <select
                      value={experiment.confidence}
                      data-conf={experiment.confidence}
                      data-flash={confidenceFlashIds.has(experiment.id) ? "true" : "false"}
                      onChange={(event) =>
                        updateExperiment(experiment.id, (current) => ({
                          ...current,
                          confidence: event.target
                            .value as ValidationExperiment["confidence"],
                          confidenceManual: true,
                        }))
                      }
                      className="h-12 w-full appearance-none rounded-md border border-input bg-input pl-10 pr-8 text-sm font-semibold capitalize text-foreground outline-none transition-all duration-500 focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)] sm:h-10 data-[flash=true]:scale-[1.02] data-[conf=low]:text-signal-challenges data-[conf=medium]:text-signal-supports data-[conf=high]:text-signal-supports"
                    >
                    <option value="low">{t("vBoard.confidence.low")}</option>
                    <option value="medium">{t("vBoard.confidence.medium")}</option>
                    <option value="high">{t("vBoard.confidence.high")}</option>
                  </select>
                  </div>
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    {t("vBoard.confidenceHint")}
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-muted">
                    <Link2 className="size-3.5" aria-hidden="true" />
                    {t("vBoard.linkedTaskLabel")}
                  </span>
                  <select
                    value={experiment.linkedTaskId}
                    onChange={(event) =>
                      updateExperiment(experiment.id, (current) => ({
                        ...current,
                        linkedTaskId: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-input px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  >
                    <option value="">{t("vBoard.noLinkedTask")}</option>
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

              {(() => {
                const ef = getEvidenceFilter(experiment.id);
                const supportsCount = experiment.evidence.filter((e) => e.signal === "supports").length;
                const challengesCount = experiment.evidence.filter((e) => e.signal === "challenges").length;
                const neutralCount = experiment.evidence.filter((e) => e.signal === "neutral").length;
                const setSig = (s: "all" | EvidenceSignal) => setEvidenceFilters((prev) => patchEvidenceFilter(prev, experiment.id, { signal: s }, { signal: "all" as const, weight: "all" as const }));
                const chipTitleForSignal = (sig: "all" | EvidenceSignal) => sig === "all" ? t("vBoard.chipShowAllSignal") : signalDesc(sig);
                return (<>
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    <FilterChip label={t("vBoard.all")} count={experiment.evidence.length} active={ef.signal === "all"} onClick={() => setSig("all")} title={chipTitleForSignal("all")} ariaLabelPrefix={t("vBoard.signalLabel")} ariaValue="all" />
                    <FilterChip label={t("vBoard.signal.supports")} count={supportsCount} active={ef.signal === "supports"} onClick={() => setSig("supports")} title={chipTitleForSignal("supports")} ariaLabelPrefix={t("vBoard.signalLabel")} ariaValue="supports" />
                    <FilterChip label={t("vBoard.signal.challenges")} count={challengesCount} active={ef.signal === "challenges"} onClick={() => setSig("challenges")} title={chipTitleForSignal("challenges")} ariaLabelPrefix={t("vBoard.signalLabel")} ariaValue="challenges" />
                    <FilterChip label={t("vBoard.signal.neutral")} count={neutralCount} active={ef.signal === "neutral"} onClick={() => setSig("neutral")} title={chipTitleForSignal("neutral")} ariaLabelPrefix={t("vBoard.signalLabel")} ariaValue="neutral" />
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1">
                    {(() => {
                      const strongCount = experiment.evidence.filter((e) => e.weight === "strong").length;
                      const moderateCount = experiment.evidence.filter((e) => e.weight === "moderate").length;
                      const anecdotalCount = experiment.evidence.filter((e) => e.weight === "anecdotal").length;
                      const setWt = (w: "all" | EvidenceWeight) => setEvidenceFilters((prev) => patchEvidenceFilter(prev, experiment.id, { weight: w }, { signal: "all" as const, weight: "all" as const }));
                      const chipTitleForWeight = (w: "all" | EvidenceWeight) => w === "all" ? t("vBoard.chipShowAllWeight") : WEIGHT_DESCRIPTIONS[w];
                      return (<>
                        <FilterChip variant="ringed" label={t("vBoard.weightsLabel")} count={experiment.evidence.length} active={ef.weight === "all"} onClick={() => setWt("all")} title={chipTitleForWeight("all")} ariaLabelPrefix={t("vBoard.weightLabel")} ariaValue="all" />
                        <FilterChip variant="ringed" label={t("vBoard.weight.strong")} count={strongCount} active={ef.weight === "strong"} onClick={() => setWt("strong")} title={chipTitleForWeight("strong")} ariaLabelPrefix={t("vBoard.weightLabel")} ariaValue="strong" />
                        <FilterChip variant="ringed" label={t("vBoard.weight.moderate")} count={moderateCount} active={ef.weight === "moderate"} onClick={() => setWt("moderate")} title={chipTitleForWeight("moderate")} ariaLabelPrefix={t("vBoard.weightLabel")} ariaValue="moderate" />
                        <FilterChip variant="ringed" label={t("vBoard.weight.anecdotal")} count={anecdotalCount} active={ef.weight === "anecdotal"} onClick={() => setWt("anecdotal")} title={chipTitleForWeight("anecdotal")} ariaLabelPrefix={t("vBoard.weightLabel")} ariaValue="anecdotal" />
                      </>);
                    })()}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {(ef.signal !== "all" || ef.weight !== "all") && (<button type="button" onClick={() => setEvidenceFilters((prev) => patchEvidenceFilter(prev, experiment.id, { signal: "all", weight: "all" }, { signal: "all" as const, weight: "all" as const }))} className="rounded-full px-2 py-0.5 text-[10px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t("vBoard.resetFilters")}</button>)}
                    {experiment.evidence.length > 1 && (<button type="button" onClick={(e) => { e.stopPropagation(); const on = !evidenceSelectMode[experiment.id]; setEvidenceSelectMode((prev) => ({ ...prev, [experiment.id]: on })); if (on) setSelectedEvidenceIds((prev) => ({ ...prev, [experiment.id]: new Set() })); else setSelectedEvidenceIds((prev) => ({ ...prev, [experiment.id]: new Set() })); }} className={"rounded-full px-2 py-0.5 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " + (evidenceSelectMode[experiment.id] ? "bg-accent text-primary-text" : "text-muted hover:text-foreground hover:underline")} title={evidenceSelectMode[experiment.id] ? t("vBoard.exitSelect") : t("vBoard.bulkHint")} aria-pressed={Boolean(evidenceSelectMode[experiment.id])} data-evidence-select-pill data-experiment-id={experiment.id}>{evidenceSelectMode[experiment.id] ? t("vBoard.exitSelect") : t("vBoard.select")}</button>)}
                    {evidenceSelectMode[experiment.id] && (() => {
                      const sel = selectedEvidenceIds[experiment.id] || new Set();
                      const visible = experiment.evidence.filter((it) => (ef.signal === "all" || it.signal === ef.signal) && (ef.weight === "all" || it.weight === ef.weight));
                      const allSel = visible.length > 0 && visible.every((v) => sel.has(v.id));
                      const tidx = execution.experiments.findIndex((x) => x.id === experiment.id);
                      return (<div role="toolbar" aria-label={t("vBoard.bulkEvidenceAria", { index: tidx + 1 })} data-evidence-toolbar={experiment.id} className="contents">
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleSelectAllEvidence(experiment.id); }} className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={allSel ? t("vBoard.clearSelAria") : t("vBoard.selectAllAria")} title={allSel ? t("vBoard.clearSelAria") : t("vBoard.selectAllAria")}>{allSel ? <CheckSquare className="size-3" aria-hidden="true"/> : <Square className="size-3" aria-hidden="true"/>}{sel.size > 0 ? sel.size : t("vBoard.all")}</button>
                        {sel.size > 0 && (<>
                          <button type="button" onClick={(e) => { e.stopPropagation(); bulkSetEvidenceSignal(experiment.id, "supports"); }} className="rounded-full px-2 py-0.5 text-[10px] font-medium text-signal-supports hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t("vBoard.proSupports")}</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); bulkSetEvidenceSignal(experiment.id, "challenges"); }} className="rounded-full px-2 py-0.5 text-[10px] font-medium text-signal-challenges hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t("vBoard.proChallenges")}</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); bulkSetEvidenceSignal(experiment.id, "neutral"); }} className="rounded-full px-2 py-0.5 text-[10px] font-medium text-muted hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t("vBoard.proNeutral")}</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); bulkSetEvidenceWeight(experiment.id, "strong"); }} className="hidden md:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t("vBoard.weight.strong")}</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); bulkSetEvidenceWeight(experiment.id, "moderate"); }} className="hidden md:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-300 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t("vBoard.weight.moderate")}</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); bulkSetEvidenceWeight(experiment.id, "anecdotal"); }} className="hidden md:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-muted hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t("vBoard.weight.anecdotal")}</button>
                          <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            // Cycle all selected to next weight: strong -> moderate -> anecdotal -> strong
                            const sel = selectedEvidenceIds[experiment.id] || new Set();
                            if (sel.size === 0) return;
                            // Use first selected current weight to decide next; default anecdotal->strong
                            const first = experiment.evidence.find((ev) => sel.has(ev.id));
                            const order: Array<"strong"|"moderate"|"anecdotal"> = ["strong","moderate","anecdotal"];
                            const cur = (first?.weight as "strong"|"moderate"|"anecdotal") ?? "anecdotal";
                            const nextW = order[(Math.max(0, order.indexOf(cur as "strong"|"moderate"|"anecdotal")) + 1) % order.length];
                            bulkSetEvidenceWeight(experiment.id, nextW);
                            showToast(t("vBoard.toast.evidenceWeightCycle", { count: sel.size, weight: nextW }), "info", 2500);
                          }} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-muted hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden" title={t("vBoard.weightCycleTitle")}>{t("vBoard.weightCycleShort")}</button>
                          <span className="mx-0.5 hidden md:inline-block h-3 w-px bg-border" aria-hidden="true"/>
                          <button ref={(el) => { if (el && evidenceSelectMode[experiment.id]) window.requestAnimationFrame(() => el.focus()); }} type="button" onClick={(e) => { e.stopPropagation(); bulkDeleteEvidence(experiment.id); }} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-signal-challenges hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Trash2 className="size-3" aria-hidden="true"/>{t("vBoard.overflowDelete")}</button>
                        </>)}
                      </div>);
                    })()}
                  </div>
                  </div>
                  </>);
              })()}
              {experiment.evidence.length > 0 ? (
                <ul ref={evidenceListRef} data-experiment-id={experiment.id} tabIndex={-1} aria-label={t("vBoard.evidenceListAria")} aria-live="polite" onKeyDown={handleEvidenceKeyDown} className="mt-4 divide-y divide-card rounded-md bg-muted px-4 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">
                  {experiment.evidence.filter((it) => { const f = getEvidenceFilter(experiment.id); return (f.signal === "all" || it.signal === f.signal) && (f.weight === "all" || it.weight === f.weight); }).map((item, itemIdx) => (
                    <li
                      data-evidence-id={item.id}
                      key={item.id}
                      draggable={!experiment.archived}
                      onDragStart={(e) => {
                        setDraggedEvidenceId(item.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", item.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverEvidenceId !== item.id) setDragOverEvidenceId(item.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverEvidenceId === item.id) setDragOverEvidenceId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = draggedEvidenceId ?? e.dataTransfer.getData("text/plain");
                        setDraggedEvidenceId(null);
                        setDragOverEvidenceId(null);
                        if (!draggedId || draggedId === item.id) return;
                        const fromIdx = experiment.evidence.findIndex((ev) => ev.id === draggedId);
                        const toIdx = itemIdx;
                        if (fromIdx < 0 || fromIdx === toIdx) return;
                        updateExperiment(experiment.id, (exp) => {
                          const next = [...exp.evidence];
                          const [moved] = next.splice(fromIdx, 1);
                          next.splice(toIdx, 0, moved);
                          return { ...exp, evidence: next };
                        });
                        srAnnounce("Evidence reordered.");
                      }}
                      onDragEnd={() => {
                        setDraggedEvidenceId(null);
                        setDragOverEvidenceId(null);
                      }}
                      className={
                        "flex items-start gap-3 py-3 text-sm transition " +
                        (draggedEvidenceId === item.id ? "opacity-40 " : "") +
                        (dragOverEvidenceId === item.id && draggedEvidenceId !== item.id ? "border-t-2 border-accent " : "") +
                        (flashEvidenceId === item.id ? " ring-2 ring-accent/60 ring-inset rounded-sm " : "")
                      }
                    >
                      {evidenceSelectMode[experiment.id] ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleEvidenceSelection(experiment.id, item.id, e.shiftKey); }} aria-label={selectedEvidenceIds[experiment.id]?.has(item.id) ? "Deselect evidence from " + item.source : "Select evidence from " + item.source} aria-pressed={Boolean(selectedEvidenceIds[experiment.id]?.has(item.id))} className={"mt-0.5 flex size-5 shrink-0 items-center justify-center rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " + (selectedEvidenceIds[experiment.id]?.has(item.id) ? "text-accent" : "text-muted hover:text-accent")}>
                          {selectedEvidenceIds[experiment.id]?.has(item.id) ? <CheckSquare className="size-3.5" aria-hidden="true"/> : <Square className="size-3.5" aria-hidden="true"/>}
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={t("vBoard.dragReorder")}
                          className="mt-0.5 flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted/40 transition hover:bg-muted hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
                          tabIndex={-1}
                        >
                          <GripVertical className="size-3.5" aria-hidden="true" />
                        </button>
                      )}
                      <CheckCircle2
                        className={
                          "mt-0.5 size-4 shrink-0 " +
                          (item.signal === "supports"
                            ? "text-signal-supports"
                            : item.signal === "challenges"
                            ? "text-signal-challenges"
                            : "text-muted-foreground/40")
                        }
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {(() => {
                            const u = extractSourceUrl(item.source);
                            if (u) return <a href={u} target="_blank" rel="noopener noreferrer" title={item.source} aria-label={`Open source: ${item.source}`} className="font-semibold text-foreground underline decoration-dotted underline-offset-2 hover:text-accent" onClick={(e) => e.stopPropagation()}>{item.source}</a>;
                            return <span className="font-semibold text-foreground">{item.source}</span>;
                          })()}
                          <button
                            type="button"
                            onClick={(e) => { if (experiment.archived) { e.stopPropagation(); return; } cycleEvidenceSignal(experiment.id, item.id); }}
                            aria-disabled={experiment.archived} aria-label={experiment.archived ? "Archived" : "Evidence signal: " + SIGNAL_LABELS[item.signal] + ". " + SIGNAL_DESCRIPTIONS[item.signal] + " Click to cycle."}
                            title={SIGNAL_DESCRIPTIONS[item.signal] + " (click to cycle: supports, challenges, neutral)"}
                            className={
                              "rounded-md px-2 py-1 text-[11px] font-semibold uppercase transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 " +
                              (item.signal === "supports"
                                ? "bg-signal-supports/15 text-signal-supports"
                                : item.signal === "challenges"
                                ? "bg-signal-challenges/15 text-signal-challenges"
                                : "bg-muted text-muted")
                            }
                          >
                            {SIGNAL_LABELS[item.signal]}
                          </button>
                          <button type="button" onClick={() => cycleEvidenceWeight(experiment.id, item.id)}
                            aria-label={`Evidence weight: ${item.weight}. ${WEIGHT_DESCRIPTIONS[item.weight]} Click to cycle.`}
                            title={WEIGHT_DESCRIPTIONS[item.weight] + " (click to cycle)"}
                            className="inline-flex items-center gap-0.5 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded-sm"
                          >
                            {(["anecdotal", "moderate", "strong"] as const).map((lvl) => (
                              <span
                                key={lvl}
                                className={
                                  ["anecdotal", "moderate", "strong"].indexOf(item.weight) >=
                                  ["anecdotal", "moderate", "strong"].indexOf(lvl)
                                    ? "size-1.5 rounded-full bg-signal-supports"
                                    : "size-1.5 rounded-full bg-muted-foreground/20"
                                }
                              />
                            ))}
                          </button>
                          <time className="text-muted" dateTime={item.observedAt} title={formatValidationObservedDateTitle(item.observedAt)}>
                            {formatValidationObservedDate(item.observedAt)}
                          </time>
                        </div>
                        <p className="mt-1 break-words leading-6 text-foreground/80">
                          <InlineMarkdown text={item.note} />
                        </p>
                      </div>
{!experiment.archived && (<>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveEvidence(experiment.id, item.id, "up")}
                          disabled={(() => { const sorted=[...experiment.evidence].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)); return sorted.findIndex((e) => e.id === item.id) === 0 || (itemIdx > 0 && !!(experiment.evidence.find((e)=>e.id===item.id)?.pinned) !== !!sorted[itemIdx-1].pinned); })()}
                          title={t("vBoard.moveEvidenceUpTitle")}
                          aria-label={`Move evidence from ${item.source} up`}
                          className="flex size-12 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent sm:size-9"
                        >
                          <ChevronUp className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEvidence(experiment.id, item.id, "down")}
                          disabled={(() => { const sorted=[...experiment.evidence].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)); const i = sorted.findIndex((e) => e.id === item.id); return i === sorted.length - 1 || (i < sorted.length - 1 && !!sorted[i].pinned !== !!sorted[i+1].pinned); })()}
                          title={t("vBoard.moveEvidenceDownTitle")}
                          aria-label={`Move evidence from ${item.source} down`}
                          className="flex size-12 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent sm:size-9"
                        >
                          <ChevronDown className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleEvidencePin(experiment.id, item.id); }}
                          title={item.pinned ? "Unpin evidence" : "Pin to top"}
                          aria-label={item.pinned ? ("Unpin evidence from " + item.source) : ("Pin evidence from " + item.source)}
                          aria-pressed={!!item.pinned}
                          className={"flex size-11 shrink-0 items-center justify-center rounded-md transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:size-8 " + (item.pinned ? "text-amber-500" : "text-foreground/80")}
                        >
                          <Star className={"size-4 " + (item.pinned ? "fill-current" : "")} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); duplicateEvidence(experiment.id, item.id); }}
                          title={t("vBoard.duplicateEvidenceTitle")}
                          aria-label={`Duplicate evidence from ${item.source}`}
                          className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 "
                        >
                          <Copy className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingEvidence(experiment.id, item.id)}
                          title={t("vBoard.editEvidenceTitle")}
                          aria-label={`Edit evidence from ${item.source}`}
                          className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 "
                        >
                          <PencilLine className="size-4" aria-hidden="true" />
                        </button>
                        {pendingDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => deleteEvidence(experiment.id, item.id)}
                            data-delete-confirm
                            title={t("vBoard.confirmDeleteTitle")}
                            aria-label={`Confirm delete evidence from ${item.source}`}
                            className="flex size-11 shrink-0 items-center justify-center rounded-md border border-signal-challenges/30 bg-signal-challenges/15 text-signal-challenges transition hover:bg-signal-challenges/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 sm:size-8"
                          >
                            <Check className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDeleteId(null);
                            }}
                            title={t("vBoard.cancelDeleteTitle")}
                            aria-label={t("vBoard.cancelDeleteAria")}
                            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 sm:size-8"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (<>
                        {!experiment.archived && (<button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(item.id);
                          }}
                          title={t("vBoard.removeEvidenceTitle")}
                          aria-label={`Remove evidence from ${item.source}`}
                          className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-md text-signal-challenges transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>)}
                        {!experiment.archived && (<EvidenceOverflowMenu onDuplicate={() => duplicateEvidence(experiment.id, item.id)} onEdit={() => startEditingEvidence(experiment.id, item.id)} onDelete={() => setPendingDeleteId(item.id)} sourceLabel={item.source} />)}</>)}
                      </div>
</>)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-md bg-muted px-4 py-3 text-sm text-muted">
                  No evidence recorded yet. Add an interview signal, metric, or
                  market observation.
                </p>
              )}

              <div
                id={`evidence-source-${experiment.id}`}
                  aria-label={t("vBoard.evidenceSourceAria")}
                className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
                style={{ gridTemplateRows: formOpen ? "1fr" : "0fr" }}
                aria-hidden={!formOpen}
              >
                <div className="min-h-0 overflow-hidden">
                <form
                  onSubmit={(event) => addEvidence(event, experiment.id)}
                  className="mt-4 grid gap-3 rounded-md border border-input bg-input p-4 md:grid-cols-[160px_1fr_auto]"
                  inert={!formOpen}
                >
                  <div className="flex items-center justify-between md:col-span-3">
                    <span className="text-xs font-semibold uppercase text-muted">
                      Evidence
                    </span>
                    <div className="flex items-center gap-1 rounded-md border border-input bg-card p-0.5 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setIsBatchMode(false)}
                        className={
                          "rounded px-2 py-0.5 transition " +
                          (!isBatchMode
                            ? "bg-accent text-primary-text"
                            : "text-muted hover:text-foreground")
                        }
                        aria-pressed={!isBatchMode}
                      >
                        Single
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBatchMode(true)}
                        className={
                          "rounded px-2 py-0.5 transition " +
                          (isBatchMode
                            ? "bg-accent text-primary-text"
                            : "text-muted hover:text-foreground")
                        }
                        aria-pressed={isBatchMode}
                      >
                        Bulk paste
                      </button>
                    </div>
                  </div>

                  {!isBatchMode && !editingEvidenceId && (
                    <div className="flex flex-wrap items-center gap-1 md:col-span-3">
                      <span className="pr-1 text-[10px] font-semibold uppercase text-muted">{t("vBoard.snippetsLabel")}</span>
                      {EVIDENCE_SNIPPETS.map((s) => {
                        const snippetLabelKey = SNIPPET_LABEL_KEYS[s.label] ?? s.label;
                        return (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => {
                            setDraft((d) => ({
                              ...d,
                              source: d.source.trim() ? d.source : s.source,
                              note: d.note.trim() ? d.note : s.note,
                            }));
                            setDraftTouched({ source: true, note: true });
                          }}
                          className="rounded-full border border-input bg-card px-2 py-0.5 text-[10px] font-medium text-muted transition hover:border-accent hover:text-accent"
                          title={t("vBoard.snippetTitle", { source: s.source, note: s.note })}
                        >
                          {t(snippetLabelKey)}
                        </button>
                        );
                      })}
                    </div>
                  )}

                  {isBatchMode ? (
                    <div className="md:col-span-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">
                          Paste evidence (one per line)
                        </span>
                        <textarea
                          value={batchText}
                          onChange={(e) => setBatchText(e.target.value)}
                          placeholder={
                            "Format: [prefix] Source - Observation\n" +
                            "Prefix: + supports | - challenges | ~ neutral\n" +
                            "Append s/m/a for weight: +s strong, +m moderate, +a anecdotal\n" +
                            "Examples:\n" +
                            "+s Interview #12 - Would pay  immediately\n" +
                            "- App review #45 - Crashes on launch\n" +
                            "+ Survey Q3 - 70% said feature is useful"
                          }
                          rows={6}
                          className="w-full resize-y rounded-md border border-input bg-card px-3 py-2.5 font-mono text-xs leading-5 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                          onPaste={(e) => {
                            // Auto-detect bulk mode on paste with multiple lines
                            const pasted = e.clipboardData.getData("text");
                            const lines = pasted.split("\n").filter((l) => l.trim().length > 0);
                            if (lines.length > 1) {
                              setIsBatchMode(true);
                            }
                          }}
                        />
                        <p className="mt-1 text-[11px] leading-4 text-muted">
                          Will add{" "}
                          <span className="font-mono font-semibold">
                            {
                              batchText.split("\n").filter((l) => l.trim().length > 0)
                                .length
                            }{" "}
                            evidence items
                          </span>{" "}
                          as {SIGNAL_LABELS[draft.signal]} ({draft.weight} weight). Prefix
                          per line:{" "}
                          <code className="font-mono">+</code>/<code className="font-mono">-</code>/<code className="font-mono">~</code>{" "}
                          for signal, append{" "}
                          <code className="font-mono">s</code>/<code className="font-mono">m</code>/<code className="font-mono">a</code>{" "}
                          for weight (e.g.{" "}
                          <code className="font-mono">+s</code> = strong support).
                        </p>
                      </label>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={
                            batchText.trim().length === 0 ||
                            batchText.split("\n").filter((l) => l.trim()).length === 0
                          }
                          className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus className="size-4" aria-hidden="true" />
                          Add all
                        </button>
                        {draftSubmitError && (
                          <p role="alert" className="text-[11px] leading-4 text-error">
                            {draftSubmitError}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Live preview */}
                      {draft.source || draft.note ? (
                    <div className="md:col-span-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase text-muted">
                        Preview
                      </p>
                      <div className="flex items-start gap-3 rounded-md border border-dashed border-muted/60 bg-card/60 p-3">
                        <span
                          className={
                            "mt-0.5 size-4 shrink-0 " +
                            (draft.signal === "supports"
                              ? "text-signal-supports"
                              : draft.signal === "challenges"
                              ? "text-signal-challenges"
                              : "text-muted-foreground/40")
                          }
                          aria-hidden="true"
                        >
                          *
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-foreground">
                              {draft.source || "Untitled source"}
                            </span>
                            <span
                              className={
                                draft.signal === "supports"
                                  ? "rounded-md bg-signal-supports/15 px-2 py-1 text-[11px] font-semibold uppercase text-signal-supports"
                                  : draft.signal === "challenges"
                                  ? "rounded-md bg-signal-challenges/15 px-2 py-1 text-[11px] font-semibold uppercase text-signal-challenges"
                                  : "rounded-md bg-muted px-2 py-1 text-[11px] font-semibold uppercase text-muted"
                              }
                            >
                              {SIGNAL_LABELS[draft.signal]}
                            </span>
                            <span
                              aria-label={`Evidence weight: ${draft.weight}`}
                              className="inline-flex items-center gap-0.5 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded-sm"
                            >
                              {(["anecdotal", "moderate", "strong"] as const).map((lvl) => (
                                <span
                                  key={lvl}
                                  className={
                                    ["anecdotal", "moderate", "strong"].indexOf(
                                      draft.weight,
                                    ) >=
                                    ["anecdotal", "moderate", "strong"].indexOf(lvl)
                                      ? "size-1.5 rounded-full bg-signal-supports"
                                      : "size-1.5 rounded-full bg-muted-foreground/20"
                                  }
                                />
                              ))}
                            </span>
                          </div>
                          <p className="mt-1 break-words text-sm leading-6 text-foreground/70">
                            {draft.note || "Your observation will appear here..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase text-muted">
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
                      aria-describedby={`evidence-signal-hint-${experiment.id}`}
                      className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                    >
                      {Object.entries(SIGNAL_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <p id={`evidence-signal-hint-${experiment.id}`} className="sr-only">
                      Choose the evidence signal strength for this validation finding.
                    </p>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase text-muted">
                      Weight
                    </span>
                    <select
                      value={draft.weight}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          weight: event.target.value as EvidenceWeight,
                        }))
                      }
                      aria-describedby={`evidence-weight-hint-${experiment.id}`}
                      className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                    >
                      {Object.entries(WEIGHT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <p id={`evidence-weight-hint-${experiment.id}`} className="sr-only">
                      Choose the evidence weight / strength for this validation finding.
                    </p>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                    <label className="block">
                      <span className="mb-2 flex items-center justify-between text-xs font-semibold uppercase text-muted">
                        <span>{t("vBoard.sourceLabel")}</span>
                        <span className={"font-mono tabular-nums " + (sourceLen > SOURCE_MAX ? "text-signal-challenges" : sourceNear ? "text-signal-supports" : "text-muted/60")}>{sourceLen}/{SOURCE_MAX}</span>
                      </span>
                      <input
                        required
                        value={draft.source}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            source: event.target.value,
                          }))
                        }
                        onBlur={() => setDraftTouched((cur) => ({ ...cur, source: true }))}
                        aria-invalid={!!sourceError}
                        aria-describedby={sourceError ? "evidence-source-error" : undefined}
                        id={`evidence-source-${experiment.id}`}
                        placeholder={t("vBoard.sourcePlaceholder")}
                        maxLength={SOURCE_MAX + 20}
                        className={`h-10 w-full rounded-md border bg-card px-3 text-sm outline-none ${
                          sourceError
                            ? "border-signal-challenges focus:border-signal-challenges focus:ring-2 focus:ring-[var(--signal-challenges-border)]"
                            : "border-input focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                        }`}
                      />
                      {sourceError && (
                        <p id="evidence-source-error" role="alert" className="mt-1 text-[11px] leading-4 text-error">{sourceError}</p>
                      )}
                    </label>
                    <label className="block">
                      <span className="mb-2 flex items-center justify-between text-xs font-semibold uppercase text-muted">
                        <span>{t("vBoard.observationLabel")}</span>
                        <span className={"font-mono tabular-nums " + (noteLen > NOTE_MAX ? "text-signal-challenges" : noteNear ? "text-signal-supports" : "text-muted/60")}>{noteLen}/{NOTE_MAX}</span>
                      </span>
                      <textarea
                        ref={noteTextareaRef}
                        required
                        rows={2}
                        maxLength={NOTE_MAX + 20}
                        value={draft.note}
                        onChange={(event) => {
                          setDraft((current) => ({
                            ...current,
                            note: event.target.value,
                          }));
                          // Auto-grow up to 8 rows
                          const el = event.target as HTMLTextAreaElement;
                          el.style.height = "auto";
                          el.style.height = Math.min(el.scrollHeight, 240) + "px";
                        }}
                        onBlur={() => setDraftTouched((cur) => ({ ...cur, note: true }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.currentTarget.form?.requestSubmit();
                          }
                        }}
                        aria-invalid={!!noteError}
                        aria-describedby={noteError ? "evidence-note-error" : undefined}
                        placeholder={t("vBoard.observationPlaceholder")}
                        className={"min-h-[48px] w-full resize-y rounded-md border bg-card px-3 py-2 text-sm leading-6 outline-none field-sizing-content " + (
                          noteError
                            ? "border-signal-challenges focus:border-signal-challenges focus:ring-2 focus:ring-[var(--signal-challenges-border)]"
                            : "border-input focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                        )}
                      />
                      {noteError && (
                        <p id="evidence-note-error" role="alert" className="mt-1 text-[11px] leading-4 text-error">{noteError}</p>
                      )}
                    </label>
                  </div>
                  <div className="mt-6 flex flex-col items-start gap-2 md:mt-0 md:justify-end">
                    {draftSubmitError && (
                      <p role="alert" className="text-[11px] leading-4 text-error">{draftSubmitError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={formInvalid}
                      aria-disabled={formInvalid}
                      className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      {editingEvidenceId ? "Save" : "Record"}
                    </button>
                  </div>
                  </>
                  )}
                </form>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block" data-meta-target="decision">
                  <span className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-muted">
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
                    aria-describedby={`decision-count-${experiment.id}`}
                    placeholder={t("vBoard.decisionPlaceholder")}
                    className="w-full resize-y rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p id={`decision-count-${experiment.id}`} className="mt-1 text-right text-[11px] leading-4 text-muted">
                    {experiment.decision.length}/800 characters
                  </p>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-muted">
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
                    aria-describedby={`next-action-count-${experiment.id}`}
                    placeholder={t("vBoard.nextActionPlaceholder")}
                    className="w-full resize-y rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p id={`next-action-count-${experiment.id}`} className="mt-1 text-right text-[11px] leading-4 text-muted">
                    {experiment.nextAction.length}/800 characters
                  </p>
                </label>
                <ValidationHistoryPreview history={experiment.history ?? []} />
                {experiment.history && experiment.history.length > 0 && (
                  <ValidationTimeline
                    experimentId={experiment.id}
                    history={experiment.history}
                    expanded={showFullHistory.has(experiment.id)}
                    selectedKind={timelineKindFilter[experiment.id] || "all"}
                    onToggleExpanded={(experimentId) => {
                      setShowFullHistory((current) => {
                        const next = new Set(current);
                        if (next.has(experimentId)) next.delete(experimentId);
                        else next.add(experimentId);
                        return next;
                      });
                    }}
                    onSelectKind={(experimentId, kind) => {
                      setTimelineKindFilter((current) => ({
                        ...current,
                        [experimentId]: kind,
                      }));
                    }}
                    onEventClick={onTimelineEventClick}
                  />
                )}
              </div>
                </div>
              </div>
            </article>
          );
        })}


      <ValidationEmptyStates
        activeCount={activeExperiments.length}
        archivedCount={archivedExperiments.length}
        hasActiveFilters={Boolean(searchQuery || statusFilter !== "all" || tagFilter)}
        onClearFilters={() => {
          setSearchQuery("");
          setStatusFilter("all");
          setTagFilter(null);
        }}
        onShowArchived={() => setShowArchived(true)}
        onAddHypothesis={() => setIsAddingExperiment(true)}
      />

      <ArchivedHypothesesPanel
        experiments={archivedExperiments}
        allExperimentIds={execution.experiments.map((experiment) => experiment.id)}
        open={showArchived}
        onToggle={() => setShowArchived((value) => !value)}
        onUnarchive={(experimentId) =>
          updateExperiment(experimentId, (experiment) => ({
            ...experiment,
            archived: false,
          }))
        }
      />
      </div>
      <ValidationBoardFooter />

      <ConfirmDialog
        open={pendingBatch?.kind === "delete"}
        title={t("vBoard.confirm.bulkDeleteHypTitle")}
        body={pendingBatch?.kind === "delete" ? t("vBoard.confirm.bulkDeleteHypBody", { count: pendingBatch.count }) : ""}
        confirmLabel={t("vBoard.confirm.delete")}
        danger
        onCancel={() => setPendingBatch(null)}
        onConfirm={() => { performBatchDelete(); }}
      />
      <ConfirmDialog
        open={pendingBatch?.kind === "archive"}
        title={t("vBoard.confirm.bulkArchiveHypTitle")}
        body={pendingBatch?.kind === "archive" ? t("vBoard.confirm.bulkArchiveHypBody", { count: pendingBatch.count }) : ""}
        confirmLabel={t("vBoard.confirm.archive")}
        onCancel={() => setPendingBatch(null)}
        onConfirm={() => { performBatchArchive(true); }}
      />
      <ConfirmDialog
        open={Boolean(pendingBulkDelete)}
        title={t("vBoard.confirm.bulkDeleteEvidenceTitle")}
        body={pendingBulkDelete ? t("vBoard.confirm.bulkDeleteEvidenceBody", { count: pendingBulkDelete.count }) : ""}
        confirmLabel={t("vBoard.confirm.delete")}
        danger
        onCancel={() => setPendingBulkDelete(null)}
        onConfirm={() => {
          if (!pendingBulkDelete) return;
          const { expId } = pendingBulkDelete;
          performBulkDelete(expId);
        }}
      />
    </section>
  );
}
