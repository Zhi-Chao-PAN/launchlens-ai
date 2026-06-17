"use client";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

import {
  Check,
  CheckCircle2,
  CheckSquare,
  Square,
  ChevronDown,
  Filter,
  ChevronUp,
  CircleGauge,
  FlaskConical,
  Archive,
  GripVertical,
  Download,
  Link2,
  PencilLine,
  Search,
  Plus,
  Trash2,
  Target,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSrAnnounce } from "@/hooks/use-sr-announce";
import { parseInlineMarkdown } from "@/lib/launchlens/inline-markdown";
import { useToast } from "@/components/toast";
import { copyTextToClipboard, downloadTextFile } from "@/lib/launchlens/clipboard";

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
  type ValidationEvidence,
  type ValidationExperiment,
  assumptionIdentity,
  type WorkspaceExecutionState,
  computeExperimentConfidence,
} from "@/lib/launchlens/execution";
import type { LaunchTask } from "@/lib/launchlens/types";

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

const statusLabels = {
  untested: "Untested",
  testing: "Testing",
  supported: "Supported",
  refuted: "Refuted",
} as const;

const weightLabels: Record<EvidenceWeight, string> = {
  anecdotal: "Anecdotal",
  moderate: "Moderate",
  strong: "Strong",
};

function InlineMarkdown({ text }: { text: string }) {
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
}

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

const signalLabels = {
  supports: "Supports",
  challenges: "Challenges",
  neutral: "Neutral",
} as const;

function statusClass(status: ValidationExperiment["status"]) {
  if (status === "supported") {
    return "bg-signal-supports text-signal-supports";
  }

  if (status === "refuted") {
    return "bg-signal-challenges text-signal-challenges";
  }

  if (status === "testing") {
    return "bg-signal-neutral text-signal-neutral";
  }

  return "bg-muted text-muted";
}

function evidenceId() {
  return crypto.randomUUID();
}

export function ValidationBoard({
  execution,
  tasks,
  onChange,
}: ValidationBoardProps) {
  const [activeExperimentId, setActiveExperimentId] = useState("");
  const [requestedExpandedExperimentId, setRequestedExpandedExperimentId] =
    useState<string | null>();
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
  const [evidenceFilters, setEvidenceFilters] = useState<Record<string, { signal: "all" | EvidenceSignal; weight: "all" | EvidenceWeight }>>({});
  function getEvidenceFilter(id: string) { return evidenceFilters[id] ?? { signal: "all" as const, weight: "all" as const }; }
  const batchCount = selectedExperimentIds.size;
  const [dragOverEvidenceId, setDragOverEvidenceId] = useState<string | null>(null);


  const { announce: srAnnounce, message: srEvidenceAnnouncement } = useSrAnnounce();
  const { showToast } = useToast();
  const evidenceListRef = useRef<HTMLUListElement | null>(null);
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
      srAnnounce("Opening evidence form for first hypothesis.");
      setTimeout(() => {
        document.getElementById(`evidence-source-${first.id}`)?.focus();
      }, 50);
    },
    newHypothesis: () => {
      setIsAddingExperiment(true);
      setActiveExperimentId("");
      srAnnounce("Opening new hypothesis form.");
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
      ? "Source needs at least 2 characters."
      : sourceLen > SOURCE_MAX
      ? "Source is too long (max " + SOURCE_MAX + " characters)."
      : ""
  );
  const noteError = (
    (draftTouched.note && draft.note.trim().length < 8)
      ? "Observation needs at least 8 characters."
      : noteLen > NOTE_MAX
      ? "Observation is too long (max " + NOTE_MAX + " characters)."
      : ""
  );
  const sourceNear = sourceLen > SOURCE_MAX * 0.8 && sourceLen <= SOURCE_MAX;
  const noteNear = noteLen > NOTE_MAX * 0.8 && noteLen <= NOTE_MAX;
  const formInvalid = sourceLen > SOURCE_MAX || noteLen > NOTE_MAX;
  const [weightPreset, setWeightPreset] = useState<"default" | "evidence" | "decision">("default");
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "decided">("all");
  const [sortBy, setSortBy] = useState<"default" | "confidence" | "status" | "progress">("default");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredExperiments = useMemo(() => {
    let list = execution.experiments;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((exp) => {
        const haystack = [exp.assumption, exp.decision, exp.nextAction, ...(exp.tags || []), ...exp.evidence.flatMap((ev) => [ev.note, ev.source])].join(" ").toLowerCase();
        return haystack.includes(q);
      });
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
    }

    return list;
  }, [execution.experiments, statusFilter, sortBy, searchQuery]);
  const activeExperiments = filteredExperiments.filter((e) => !e.archived);
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

  function updateExperiment(
    experimentId: string,
    update: (experiment: ValidationExperiment) => ValidationExperiment,
  ) {
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

  function openEvidenceForm(experimentId: string) {
    setRequestedExpandedExperimentId(experimentId);
    setActiveExperimentId((current) =>
      current === experimentId ? "" : experimentId,
    );
    setDraft(emptyDraft);
    setEditingEvidenceId(null);
  }
  function experimentToMarkdown(experiment: ValidationExperiment) {
    const signalLabel: Record<EvidenceSignal, string> = {
      supports: "Supports",
      challenges: "Challenges",
      neutral: "Neutral",
    };
    const weightLabel: Record<EvidenceWeight, string> = {
      anecdotal: "Anecdotal",
      moderate: "Moderate",
      strong: "Strong",
    };
    const status = experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1);
    const confidence = experiment.confidence.charAt(0).toUpperCase() + experiment.confidence.slice(1);
    const yamlQuote = (s: string) => "\"" + s.replace(/["\\]/g, "\\$&") + "\"";
    const yamlTags = experiment.tags && experiment.tags.length ? "[" + experiment.tags.map((t) => yamlQuote(t)).join(", ") + "]" : "[]";
    const yamlPinned = experiment.evidence.filter((e) => e.pinned).length;
    const fm = [
      "---",
      "title: " + yamlQuote(experiment.assumption),
      "status: " + experiment.status,
      "confidence: " + experiment.confidence,
      "evidence_count: " + experiment.evidence.length,
      "pinned_evidence: " + yamlPinned,
      "archived: " + (experiment.archived ? "true" : "false"),
      "tags: " + yamlTags,
      "updated: " + new Date().toISOString(),
      "source: launchlens-ai",
      "---",
      "",
    ];
    const lines = fm.concat([
      "# " + experiment.assumption,
      "",
      "- **Status**: " + status,
      "- **Confidence**: " + confidence + (experiment.confidenceManual ? " (manual)" : ""),
      "- **Evidence**: " + experiment.evidence.length + " items",
      "",
      "## Evidence",
      "",
    ]);
    if (experiment.evidence.length === 0) {
      lines.push("_No evidence recorded yet._");
    } else {
      [...experiment.evidence].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)).forEach((item, itemIdx) => {
        lines.push(
          "### " + (item.pinned ? "鐚?" : "") + (itemIdx + 1) + ". " + signalLabel[item.signal] + " 闂?" + item.source,
        );
        lines.push("");
        lines.push("- **Weight**: " + weightLabel[item.weight]);
        lines.push("- **Observed**: " + new Date(item.observedAt).toLocaleDateString());
        lines.push("");
        lines.push(item.note);
        lines.push("");
      });
    }
    return lines.join("\n");
  }

  function experimentToJson(experiment: ValidationExperiment) {
    return JSON.stringify(experiment, null, 2);
  }

  function safeHypothesisFilename(experiment: ValidationExperiment, ext: string) {
    const base = experiment.assumption
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    return (base || "hypothesis") + "." + ext;
  }

  async function copyExperimentMarkdown(experiment: ValidationExperiment) {
    const md = experimentToMarkdown(experiment);
    const ok = await copyTextToClipboard(md);
    if (ok) {
      showToast("Hypothesis markdown copied", "success", 2500);
      srAnnounce("Hypothesis markdown copied to clipboard.");
    } else {
      showToast("Could not copy to clipboard", "error", 3000);
    }
  }

  function downloadExperimentMarkdown(experiment: ValidationExperiment) {
    const md = experimentToMarkdown(experiment);
    downloadTextFile(md, safeHypothesisFilename(experiment, "md"), "text/markdown");
    showToast("Markdown downloaded", "success", 2000);
    srAnnounce("Hypothesis markdown downloaded.");
  }

  function downloadExperimentJson(experiment: ValidationExperiment) {
    const json = experimentToJson(experiment);
    downloadTextFile(json, safeHypothesisFilename(experiment, "json"), "application/json");
    showToast("JSON downloaded", "success", 2000);
    srAnnounce("Hypothesis JSON downloaded.");
  }

  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  const [boardExportOpen, setBoardExportOpen] = useState(false);

  function boardToMarkdown() {
    const signalLabel: Record<EvidenceSignal, string> = {
      supports: "Supports",
      challenges: "Challenges",
      neutral: "Neutral",
    };
    const weightLabel: Record<EvidenceWeight, string> = {
      anecdotal: "Anecdotal",
      moderate: "Moderate",
      strong: "Strong",
    };
    const statusLabel: Record<string, string> = {
      untested: "Untested",
      testing: "Testing",
      supported: "Supported",
      refuted: "Refuted",
    };
    const confidenceLabel: Record<ConfidenceLevel, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
    };

    const yamlQuote = (s: string) => "\"" + s.replace(/["\\]/g, "\\$&") + "\"";
    const allTags = Array.from(new Set(execution.experiments.flatMap((e) => e.tags || [])));
    const lines: string[] = [
      "---",
      "title: " + yamlQuote("Validation Board"),
      "source: launchlens-ai",
      "hypotheses: " + execution.experiments.length,
      "supported: " + execution.experiments.filter((e) => e.status === "supported").length,
      "refuted: " + execution.experiments.filter((e) => e.status === "refuted").length,
      "testing: " + execution.experiments.filter((e) => e.status === "testing").length,
      "untested: " + execution.experiments.filter((e) => e.status === "untested").length,
      "tags: [" + allTags.map((t) => yamlQuote(t)).join(", ") + "]",
      "updated: " + new Date().toISOString(),
      "---",
      "",
      "# Validation Board",
    ];
    lines.push("");
    lines.push(
      "- **Hypotheses**: " +
        execution.experiments.length +
        " total 闂?" +
        execution.experiments.filter((e) => e.status === "supported").length +
        " supported, " +
        execution.experiments.filter((e) => e.status === "refuted").length +
        " refuted, " +
        execution.experiments.filter((e) => e.status === "testing").length +
        " testing, " +
        execution.experiments.filter((e) => e.status === "untested").length +
        " untested",
    );
    lines.push("");

    execution.experiments.forEach((experiment, expIdx) => {
      const status = statusLabel[experiment.status] || experiment.status;
      const confidence = confidenceLabel[experiment.confidence] || experiment.confidence;
      lines.push("## " + (expIdx + 1) + ". " + experiment.assumption);
      lines.push("");
      lines.push("- **Status**: " + status);
      lines.push(
        "- **Confidence**: " +
          confidence +
          (experiment.confidenceManual ? " (manual)" : " (auto)"),
      );
      lines.push("- **Evidence**: " + experiment.evidence.length + " items");
      lines.push("");

      if (experiment.evidence.length === 0) {
        lines.push("_No evidence recorded yet._");
        lines.push("");
      } else {
        experiment.evidence.forEach((item, itemIdx) => {
          lines.push(
            "### " +
              (itemIdx + 1) +
              ". " +
              signalLabel[item.signal] +
              " 闂?" +
              item.source,
          );
          lines.push("");
          lines.push("- **Weight**: " + weightLabel[item.weight]);
          lines.push(
            "- **Observed**: " + new Date(item.observedAt).toLocaleDateString(),
          );
          lines.push("");
          lines.push(item.note);
          lines.push("");
        });
      }
    });

    return lines.join("\n");
  }

  function boardToJson() {
    return JSON.stringify(execution.experiments, null, 2);
  }

  async function copyBoardMarkdown() {
    const md = boardToMarkdown();
    const ok = await copyTextToClipboard(md);
    if (ok) {
      showToast("Validation board copied as markdown", "success", 2500);
      srAnnounce("Validation board markdown copied to clipboard.");
    } else {
      showToast("Could not copy to clipboard", "error", 3000);
    }
    setBoardExportOpen(false);
  }

  function downloadBoardMarkdown() {
    const md = boardToMarkdown();
    downloadTextFile(md, "validation-board.md", "text/markdown");
    showToast("Markdown downloaded", "success", 2000);
    srAnnounce("Validation board markdown downloaded.");
    setBoardExportOpen(false);
  }

  function downloadBoardJson() {
    const json = boardToJson();
    downloadTextFile(json, "validation-board.json", "application/json");
    showToast("JSON downloaded", "success", 2000);
    srAnnounce("Validation board JSON downloaded.");
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

    srAnnounce("Evidence signal changed to " + nextSignal + ".");
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

    srAnnounce("Evidence weight changed to " + nextWeight + ".");
  }

  function moveExperiment(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
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

  function toggleExperimentSelection(id: string) {
    setSelectedExperimentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAllExperiments() {
    const visibleIds = activeExperiments.map((e) => e.id);
    const allSelected = visibleIds.every((id) => selectedExperimentIds.has(id));
    setSelectedExperimentIds(new Set(allSelected ? [] : visibleIds));
  }
  function setSelectedStatus(status: ExperimentStatus) {
    if (batchCount === 0) return;
    onChange({
      ...execution,
      experiments: execution.experiments.map((e) => selectedExperimentIds.has(e.id) ? { ...e, status } : e),
      updatedAt: new Date().toISOString(),
    });
    srAnnounce(`Set ${batchCount} hypotheses to ${status}.`);
  }
  function batchArchive(archived: boolean) {
    if (batchCount === 0) return;
    onChange({
      ...execution,
      experiments: execution.experiments.map((e) => selectedExperimentIds.has(e.id) ? { ...e, archived } : e),
      updatedAt: new Date().toISOString(),
    });
    srAnnounce(archived ? `Archived ${batchCount} hypotheses.` : `Unarchived ${batchCount} hypotheses.`);
  }
  function batchDeleteExperiments() {
    if (batchCount === 0) return;
    const toDelete = selectedExperimentIds;
    onChange({
      ...execution,
      experiments: execution.experiments.filter((e) => !toDelete.has(e.id)),
      updatedAt: new Date().toISOString(),
    });
    setSelectedExperimentIds(new Set());
    srAnnounce(`Deleted ${toDelete.size} hypotheses.`);
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

  function toggleEvidencePin(experimentId: string, evidenceId: string) {
    updateExperiment(experimentId, (exp) => ({
      ...exp,
      evidence: exp.evidence.map((ev) =>
        ev.id === evidenceId ? { ...ev, pinned: !ev.pinned } : ev,
      ),
    }));
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
    showToast("Evidence removed", "info", 5000, {
      label: "Undo",
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
    onChange({
      ...execution,
      experiments: execution.experiments.filter((e) => e.id !== experimentId),
      updatedAt: new Date().toISOString(),
    });
    if (activeExperimentId === experimentId) setActiveExperimentId("");
    if (requestedExpandedExperimentId === experimentId) setRequestedExpandedExperimentId(null);
    showToast("Hypothesis removed", "info", 5000, {
      label: "Undo",
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
    const statusOrder: Array<keyof typeof statusLabels> = [
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
        onChange({ ...execution, experiments: next, updatedAt: new Date().toISOString() });
        srAnnounce("Hypothesis moved " + (e.key === "ArrowUp" ? "up" : "down") + ".");
        requestAnimationFrame(() => (e.currentTarget as HTMLElement).focus());
      }
      return;
    }

    // ArrowUp/Down to move focus between experiments
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const articles = Array.from(
        document.querySelectorAll("[data-experiment-article]"),
      );
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
      `Confidence updated: ${labels[oldConfidence]} 闂?${labels[newConfidence]}`,
      "info",
      2200,
    );
    srAnnounce(
      `Confidence changed from ${labels[oldConfidence]} to ${labels[newConfidence]}`,
    );
  }

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
          // Prefix signals: +/-/~ or Chinese 鏀?姝?鍙?璐?涓??. Optional weight letter s/m/a or Chinese 寮?寮?
          const signalMap: Record<string, EvidenceSignal> = {
            "+": "supports", "支": "supports", "正": "supports",
            "-": "challenges", "反": "challenges", "负": "challenges",
            "~": "neutral", "?": "neutral", "中": "neutral",
          };
          const weightMap: Record<string, EvidenceWeight> = {
            s: "strong", S: "strong", "强": "strong",
            m: "moderate", M: "moderate", "重": "moderate",
            a: "anecdotal", A: "anecdotal", "弱": "anecdotal",
          };
          const c0 = line[0];
          if (c0 in signalMap) {
            signal = signalMap[c0];
            let consume = 1;
            const c1 = line[1];
            if (c1 && c1 in weightMap) {
              const c2 = line[2];
              const isSep = !c2 || c2 === " " || c2 === ":" || c2 === "-" || c2 === "\t";
              if (isSep) {
                weight = weightMap[c1];
                consume = 2;
              }
            }
            rest = line.slice(consume).trim();
          }
          // Split on " - " or first ":" for source/note
          let source = "";
          let note = "";
          const sepMatch = rest.indexOf(" - ");
          if (sepMatch >= 0) {
            source = rest.slice(0, sepMatch).trim();
            note = rest.slice(sepMatch + 3).trim();
          } else {
            // Use whole line as note, generate source
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
            id: evidenceId(),
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
    <section className="rounded-lg border border-card bg-card shadow-sm">
      <span role="status" aria-live="polite" className="sr-only">
        {srEvidenceAnnouncement}
      </span>
      <div className="flex flex-col gap-3 border-b border-card p-4 sm:gap-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-signal-challenges text-signal-challenges sm:size-9">
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
            <div className="rounded-md bg-muted px-2 py-1.5 sm:px-3 sm:py-2">
              <strong className="block text-sm font-semibold text-foreground">
                {progress.score}%
              </strong>
              progress
            </div>
            <div className="rounded-md bg-signal-supports px-3 py-2">
              <strong className="block text-sm text-signal-supports">
                {progress.withEvidence}/{progress.total}
              </strong>
              evidenced
            </div>
            <div className="rounded-md bg-signal-neutral px-3 py-2">
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
              aria-label="Progress weight preset"
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

      <div className="flex items-center justify-between gap-2 border-b border-card px-3 py-2 sm:px-5">
        <div className="flex items-center gap-1">
          <Filter className="size-3.5 text-muted" aria-hidden="true" />
          <div role="tablist" aria-label="Filter experiments by status" className="flex gap-0.5">
          {[
            { id: "all", label: "All", count: execution.experiments.length },
            { id: "active", label: "Active", count: execution.experiments.filter((e) => e.status === "untested" || e.status === "testing").length },
            { id: "decided", label: "Decided", count: execution.experiments.filter((e) => e.status === "supported" || e.status === "refuted").length },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={statusFilter === tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === tab.id
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1 opacity-70">({tab.count})</span>
            </button>
          ))}
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="pr-1 text-[11px] font-semibold uppercase text-muted">Tags:</span>
              <button type="button" onClick={() => setTagFilter(null)} className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${tagFilter === null ? "bg-accent text-white" : "bg-muted text-muted hover:text-foreground"}`}>all</button>
              {allTags.map((tag) => (
                <button key={tag} type="button" onClick={() => setTagFilter(tagFilter === tag ? null : tag)} className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${tagFilter === tag ? "bg-accent text-white" : "bg-muted text-muted hover:text-foreground"}`}>#{tag}</button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            aria-label="Search hypotheses, evidence, tags"
            className="h-7 w-40 rounded-md border border-input bg-card pl-7 pr-6 text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-1 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(
              e.target.value as "default" | "confidence" | "status" | "progress",
            )
          }
          className="rounded-md border border-input bg-card px-2 py-1 text-xs font-semibold text-foreground/70 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          aria-label="Sort hypotheses"
        >
          <option value="default">Default order</option>
          <option value="confidence">Highest confidence</option>
          <option value="status">By status</option>
          <option value="progress">Most evidence</option>
        </select>
        {selectMode && batchCount > 0 && (
          <div role="toolbar" aria-label="Bulk actions on selected hypotheses" className="flex w-full flex-wrap items-center gap-2 rounded-md border border-accent/60 bg-accent/5 p-2 text-xs">
            <span className="px-1 font-semibold text-foreground">{batchCount} selected</span>
            <button type="button" onClick={toggleSelectAllExperiments} className="rounded px-2 py-1 hover:bg-muted">All</button>
            <span className="mx-1 h-4 w-px bg-border" />
            <button type="button" onClick={() => setSelectedStatus("untested")} className="rounded px-2 py-1 hover:bg-muted">Mark untested</button>
            <button type="button" onClick={() => setSelectedStatus("testing")} className="rounded px-2 py-1 text-accent hover:bg-muted">Mark testing</button>
            <button type="button" onClick={() => setSelectedStatus("supported")} className="rounded px-2 py-1 text-signal-supports hover:bg-muted">Mark supported</button>
            <button type="button" onClick={() => setSelectedStatus("refuted")} className="rounded px-2 py-1 text-signal-challenges hover:bg-muted">Mark refuted</button>
            <span className="mx-1 h-4 w-px bg-border" />
            <button type="button" onClick={() => batchArchive(true)} className="rounded px-2 py-1 hover:bg-muted">Archive</button>
            <button type="button" onClick={batchDeleteExperiments} className="rounded px-2 py-1 text-signal-challenges hover:bg-signal-challenges/10">Delete</button>
            <button type="button" onClick={() => setSelectedExperimentIds(new Set())} className="ml-auto rounded px-2 py-1 text-muted hover:bg-muted hover:text-foreground">Clear</button>
          </div>
        )}
        <button
            type="button"
            onClick={() => { setSelectMode((v) => { if (v) setSelectedExperimentIds(new Set()); return !v; }); }}
            aria-pressed={selectMode}
            className={"flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 " + (selectMode ? "border-accent bg-accent text-white" : "border-input bg-card text-foreground/80 hover:border-accent hover:text-foreground")}
            title="Select multiple hypotheses"
          >
            <CheckSquare className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Select</span>
          </button>
          <div className="relative">
          <button
            type="button"
            onClick={() => setBoardExportOpen(!boardExportOpen)}
            aria-expanded={boardExportOpen}
            aria-haspopup="true"
            aria-label="Export validation board"
            title="Export all hypotheses"
            className="flex items-center gap-1 rounded-md border border-input bg-card px-2 py-1 text-xs font-medium text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {boardExportOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setBoardExportOpen(false)}
                aria-hidden="true"
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-input bg-card py-1 text-sm shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={copyBoardMarkdown}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground/80 transition hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none"
                >
                  Copy Markdown
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={downloadBoardMarkdown}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground/80 transition hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none"
                >
                  Download Markdown
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={downloadBoardJson}
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
          onClick={() => setIsAddingExperiment(!isAddingExperiment)}
          aria-expanded={isAddingExperiment}
          className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">New hypothesis</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
      {isAddingExperiment && (
        <div className="border-b border-card bg-input/50 p-3 sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">
              New hypothesis
            </span>
            <input
              type="text"
              value={newExperimentDraft}
              onChange={(e) => setNewExperimentDraft(e.target.value)}
              placeholder="What assumption do you want to validate?"
              autoFocus
              data-new-experiment-input
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newExperimentDraft.trim().length >= 5) {
                  e.preventDefault();
                  const assumption = newExperimentDraft.trim();
                  const newExp: ValidationExperiment = {
                    id: assumptionIdentity(assumption, execution.experiments.length),
                    assumption,
                    status: "untested",
                    confidence: "low",
      confidenceManual: false,
                    decision: "",
                    nextAction: "",
                    linkedTaskId: "",
                    evidence: [],
                    tags: newExperimentTags.slice(0, 8),
                  };
                  onChange({
                    ...execution,
                    experiments: [...execution.experiments, newExp],
                    updatedAt: new Date().toISOString(),
                  });
                  setNewExperimentDraft("");
                  setIsAddingExperiment(false);
                  setRequestedExpandedExperimentId(newExp.id);
                  if (statusFilter !== "all") setStatusFilter("all");
              srAnnounce("New hypothesis added: " + newExp.assumption);
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
              placeholder="Add tags (press Enter to add, e.g. acquisition)"
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
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (newExperimentDraft.trim().length < 5) return;
                const assumption = newExperimentDraft.trim();
                const newExp: ValidationExperiment = {
                  id: assumptionIdentity(assumption, execution.experiments.length),
                  assumption,
                  status: "untested",
                  confidence: "low",
      confidenceManual: false,
                  decision: "",
                  nextAction: "",
                  linkedTaskId: "",
                  evidence: [],
                  tags: [],
                };
                onChange({
                  ...execution,
                  experiments: [...execution.experiments, newExp],
                  updatedAt: new Date().toISOString(),
                });
                setNewExperimentDraft("");
                setIsAddingExperiment(false);
                setRequestedExpandedExperimentId(newExp.id);
                if (statusFilter !== "all") setStatusFilter("all");
              srAnnounce("New hypothesis added: " + newExp.assumption);
              }}
              disabled={newExperimentDraft.trim().length < 5}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add hypothesis
            </button>
          </div>
        </div>
      )}
      <div className="divide-y divide-[#edf0ea]">
        {filteredExperiments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-foreground">No validation experiments yet</p>
            <p className="mt-0.5 text-xs leading-5 text-muted sm:mt-1 sm:text-sm sm:leading-6">
              Generate a workspace to seed starter assumptions, or add new hypotheses once your brief is in place.
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
              tabIndex={0}
              onKeyDown={(e) => handleExperimentKeyDown(e, experiment.id)}
              aria-label={`Hypothesis ${index + 1}: ${experiment.assumption}. Status: ${statusLabels[experiment.status]}. ${experiment.evidence.length} evidence items.}`}
              className={
                "relative p-5 outline-none transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset " +
                (draggedExperimentId === experiment.id ? "opacity-40 " : "") +
                (dragOverExperimentId === experiment.id && draggedExperimentId !== experiment.id
                  ? "border-t-2 border-accent "
                  : "")
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
                        aria-label={`Select hypothesis ${index + 1}`}
                        onClick={(e) => { e.stopPropagation(); toggleExperimentSelection(experiment.id); }}
                        className="flex size-5 shrink-0 items-center justify-center rounded text-muted transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {selectedExperimentIds.has(experiment.id) ? <CheckSquare className="size-3.5" aria-hidden="true" /> : <Square className="size-3.5" aria-hidden="true" />}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Drag to reorder hypothesis"
                      className="-ml-1 flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted/40 transition hover:bg-muted hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
                      tabIndex={-1}
                    >
                      <GripVertical className="size-3.5" aria-hidden="true" />
                    </button>
                    <span className="font-mono text-xs font-semibold text-signal-challenges">
                      H{index + 1}
                    </span>
                    <span
                      role="status"
                      aria-label={`Validation status: ${statusLabels[experiment.status]}`}
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(experiment.status)}`}
                    >
                      {statusLabels[experiment.status]}
                    </span>
                    <span
                      aria-label={`Confidence: ${experiment.confidence}`}
                      className={
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold " +
                        (experiment.confidence === "low"
                          ? "bg-signal-challenges/15 text-signal-challenges"
                          : experiment.confidence === "medium"
                          ? "bg-signal-supports/30 text-signal-supports"
                          : "bg-signal-supports text-white")
                      }
                    >
                      <span
                        className={
                          "size-1.5 rounded-full " +
                          (experiment.confidence === "low"
                            ? "bg-signal-challenges"
                            : experiment.confidence === "medium"
                            ? "bg-signal-supports/70"
                            : "bg-white")
                        }
                      />
                      {experiment.confidence.charAt(0).toUpperCase() + experiment.confidence.slice(1)}
                      {!experiment.confidenceManual && experiment.evidence.length > 0 && (
                        <span className="text-[10px] font-medium opacity-75">闂?auto</span>
                      )}
                    </span>
                    <span className="text-xs text-muted" aria-label={`${experiment.evidence.length} evidence item${experiment.evidence.length === 1 ? "" : "s"}`}>
                      {experiment.evidence.length} evidence item
                      {experiment.evidence.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {experiment.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {experiment.tags.map((t) => (
                        <span key={t} className="group inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted">
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
                      ))}
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
                    onClick={() => openEvidenceForm(experiment.id)}
                    disabled={evidenceLimitReached}
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
                       aria-label="Export hypothesis"
                       title="Export hypothesis"
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
                    aria-label="Remove hypothesis"
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
                <label className="block">
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
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
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
                        aria-label="Reset confidence to auto-calculated"
                      >
                        Manual
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
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  </div>
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    Product judgment, not statistical certainty.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-muted">
                    <Link2 className="size-3.5" aria-hidden="true" />
                    Linked execution task
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
                    <option value="">No linked task</option>
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
                const setSig = (s: "all" | EvidenceSignal) => setEvidenceFilters((prev) => ({ ...prev, [experiment.id]: { ...getEvidenceFilter(experiment.id), signal: s } }));
                const chip = (active: boolean, label: string, count: number, sig: "all" | EvidenceSignal) => (
                  <button type="button" onClick={() => setSig(sig)} aria-pressed={active} className={"rounded-full px-2 py-0.5 text-[10px] font-medium transition " + (active ? "bg-accent text-white" : "bg-card text-muted hover:text-foreground")}>
                    {label} ({count})
                  </button>
                );
                return (<>
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    {chip(ef.signal === "all", "All", experiment.evidence.length, "all")}
                    {chip(ef.signal === "supports", "Supports", supportsCount, "supports")}
                    {chip(ef.signal === "challenges", "Challenges", challengesCount, "challenges")}
                    {chip(ef.signal === "neutral", "Neutral", neutralCount, "neutral")}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1">
                    {(() => {
                      const strongCount = experiment.evidence.filter((e) => e.weight === "strong").length;
                      const moderateCount = experiment.evidence.filter((e) => e.weight === "moderate").length;
                      const anecdotalCount = experiment.evidence.filter((e) => e.weight === "anecdotal").length;
                      const setWt = (w: "all" | EvidenceWeight) => setEvidenceFilters((prev) => ({ ...prev, [experiment.id]: { ...getEvidenceFilter(experiment.id), weight: w } }));
                      const wchip = (active: boolean, label: string, count: number, w: "all" | EvidenceWeight) => (
                        <button type="button" onClick={() => setWt(w)} aria-pressed={active} className={"rounded-full px-2 py-0.5 text-[10px] font-medium transition " + (active ? "bg-card ring-1 ring-accent text-foreground" : "bg-transparent text-muted hover:text-foreground")}>
                          {label} ({count})
                        </button>
                      );
                      return (<>
                        {wchip(ef.weight === "all", "All wts", experiment.evidence.length, "all")}
                        {wchip(ef.weight === "strong", "Strong", strongCount, "strong")}
                        {wchip(ef.weight === "moderate", "Moderate", moderateCount, "moderate")}
                        {wchip(ef.weight === "anecdotal", "Anecdotal", anecdotalCount, "anecdotal")}
                      </>);
                    })()}
                  </div>
                  </>);
              })()}
              {experiment.evidence.length > 0 ? (
                <ul ref={evidenceListRef} data-experiment-id={experiment.id} tabIndex={-1} aria-label="Evidence items" aria-live="polite" onKeyDown={handleEvidenceKeyDown} className="mt-4 divide-y divide-card rounded-md bg-muted px-4 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">
                  {experiment.evidence.filter((it) => { const f = getEvidenceFilter(experiment.id); return (f.signal === "all" || it.signal === f.signal) && (f.weight === "all" || it.weight === f.weight); }).map((item, itemIdx) => (
                    <li
                      data-evidence-id={item.id}
                      key={item.id}
                      draggable
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
                        (dragOverEvidenceId === item.id && draggedEvidenceId !== item.id
                          ? "border-t-2 border-accent "
                          : "")
                      }
                    >
                      <button
                        type="button"
                        aria-label="Drag to reorder"
                        className="mt-0.5 flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted/40 transition hover:bg-muted hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
                        tabIndex={-1}
                      >
                        <GripVertical className="size-3.5" aria-hidden="true" />
                      </button>
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
                          <span className="font-semibold text-foreground">
                            {item.source}
                          </span>
                          <button
                            type="button"
                            onClick={() => cycleEvidenceSignal(experiment.id, item.id)}
                            aria-label={
                              "Evidence signal: " +
                              signalLabels[item.signal] +
                              ". Click to cycle."
                            }
                            title="Click to cycle signal (supports challenges neutral)"
                            className={
                              "rounded-md px-2 py-1 text-[11px] font-semibold uppercase transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 " +
                              (item.signal === "supports"
                                ? "bg-signal-supports/15 text-signal-supports"
                                : item.signal === "challenges"
                                ? "bg-signal-challenges/15 text-signal-challenges"
                                : "bg-muted text-muted")
                            }
                          >
                            {signalLabels[item.signal]}
                          </button>
                          <button type="button" onClick={() => cycleEvidenceWeight(experiment.id, item.id)}
                            aria-label={`Evidence weight: ${item.weight}`}
                            title={item.weight.charAt(0).toUpperCase() + item.weight.slice(1)}
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
                          <time className="text-muted">
                            {new Intl.DateTimeFormat("en", {
                              month: "short",
                              day: "numeric",
                            }).format(new Date(item.observedAt))}
                          </time>
                        </div>
                        <p className="mt-1 break-words leading-6 text-foreground/80">
                          <InlineMarkdown text={item.note} />
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveEvidence(experiment.id, item.id, "up")}
                          disabled={(() => { const sorted=[...experiment.evidence].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)); return sorted.findIndex((e) => e.id === item.id) === 0 || (itemIdx > 0 && !!(experiment.evidence.find((e)=>e.id===item.id)?.pinned) !== !!sorted[itemIdx-1].pinned); })()}
                          title="Move evidence up"
                          aria-label={`Move evidence from ${item.source} up`}
                          className="flex size-12 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent sm:size-9"
                        >
                          <ChevronUp className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEvidence(experiment.id, item.id, "down")}
                          disabled={(() => { const sorted=[...experiment.evidence].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)); const i = sorted.findIndex((e) => e.id === item.id); return i === sorted.length - 1 || (i < sorted.length - 1 && !!sorted[i].pinned !== !!sorted[i+1].pinned); })()}
                          title="Move evidence down"
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
                          onClick={() => startEditingEvidence(experiment.id, item.id)}
                          title="Edit evidence"
                          aria-label={`Edit evidence from ${item.source}`}
                          className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:size-8"
                        >
                          <PencilLine className="size-4" aria-hidden="true" />
                        </button>
                        {pendingDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => deleteEvidence(experiment.id, item.id)}
                            data-delete-confirm
                            title="Confirm delete"
                            aria-label={`Confirm delete evidence from ${item.source}`}
                            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-signal-challenges text-white transition hover:bg-[color-mix(in_srgb,var(--signal-challenges-bg)_85%,black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 sm:size-8"
                          >
                            <Check className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDeleteId(null);
                            }}
                            title="Cancel delete"
                            aria-label="Cancel delete evidence"
                            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 sm:size-8"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(item.id);
                          }}
                          title="Remove evidence"
                          aria-label={`Remove evidence from ${item.source}`}
                          className="flex size-11 shrink-0 items-center justify-center rounded-md text-signal-challenges transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 sm:size-8"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      </div>
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
                  aria-label="Evidence source"
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
                            ? "bg-accent text-white"
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
                            ? "bg-accent text-white"
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
                      <span className="pr-1 text-[10px] font-semibold uppercase text-muted">Snippets:</span>
                      {EVIDENCE_SNIPPETS.map((s) => (
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
                          title={"Insert template: " + s.source + " - " + s.note}
                        >
                          {s.label}
                        </button>
                      ))}
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
                          as {signalLabels[draft.signal]} ({draft.weight} weight). Prefix
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
                          className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                          闂?                        </span>
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
                              {signalLabels[draft.signal]}
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
                      {Object.entries(signalLabels).map(([value, label]) => (
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
                      {Object.entries(weightLabels).map(([value, label]) => (
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
                        <span>Source</span>
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
                        placeholder="Interview #5, Mixpanel, App Store review..."
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
                        <span>Observation</span>
                        <span className={"font-mono tabular-nums " + (noteLen > NOTE_MAX ? "text-signal-challenges" : noteNear ? "text-signal-supports" : "text-muted/60")}>{noteLen}/{NOTE_MAX}</span>
                      </span>
                      <textarea
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
                        placeholder="What did you learn? (Markdown supported: **bold**, *italic*, `code`, [link](url))"
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
                      className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
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
                <label className="block">
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
                    placeholder="What will change because of this evidence?"
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
                    placeholder="What evidence should be collected next?"
                    className="w-full resize-y rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p id={`next-action-count-${experiment.id}`} className="mt-1 text-right text-[11px] leading-4 text-muted">
                    {experiment.nextAction.length}/800 characters
                  </p>
                </label>
                {experiment.history && experiment.history.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase text-muted">Timeline</h3>
                    <ol className="space-y-1.5 border-l border-border/60 pl-3">
                      {experiment.history.slice(-8).reverse().map((evt) => {
                        const when = new Date(evt.at);
                        const timeLabel = when.toLocaleString();
                        const kindLabel: Record<string, string> = {
                          created: "Created",
                          status: "Status",
                          confidence: "Confidence",
                          decision: "Decision updated",
                          archived: evt.to === "true" ? "Archived" : "Unarchived",
                          evidence_added: "Evidence added",
                          evidence_removed: "Evidence removed",
                        };
                        const detail = evt.kind === "status" || evt.kind === "confidence"
                          ? (evt.from ?? "?") + " → " + (evt.to ?? "?")
                          : evt.kind === "archived" ? "" : (evt.source ?? "");
                        return (
                          <li key={evt.id} className="relative text-xs leading-5">
                            <span className="absolute -left-[15px] top-2 size-2 rounded-full bg-accent/70 ring-2 ring-background" aria-hidden="true" />
                            <span className="font-medium text-foreground/80">{kindLabel[evt.kind] || evt.kind}</span>
                            {detail ? <span className="ml-1.5 text-muted">{detail}</span> : null}
                            <span className="ml-1 text-[10px] text-muted/80">· {timeLabel}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
                </div>
              </div>
            </article>
          );
        })}


      {activeExperiments.length === 0 && (searchQuery || statusFilter !== "all" || tagFilter) ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 py-12 text-center">
          <Search className="size-6 text-muted/50" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground/70">No hypotheses match your current filters</p>
          <p className="text-xs text-muted">Try clearing your search, tag, or status filter.</p>
          <button type="button" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setTagFilter(null); }} className="mt-2 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium hover:border-accent">Clear all filters</button>
        </div>
      ) : activeExperiments.length === 0 && archivedExperiments.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border border-dashed border-input bg-muted/30 py-14 text-center">
          <Target className="size-8 text-accent/60" aria-hidden="true" />
          <p className="text-base font-semibold text-foreground">Map out your first validation hypotheses</p>
          <p className="max-w-md text-sm leading-6 text-muted">Each card captures one risky assumption. Add the boldest bets first, then attach evidence as you learn.</p>
          <button type="button" onClick={() => setIsAddingExperiment(true)} className="mt-1 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-text shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Plus className="size-4" aria-hidden="true" /> Add your first hypothesis
          </button>
        </div>
      )}

      {archivedExperiments.length > 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-input bg-muted/30 p-3">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
            className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold uppercase text-muted transition hover:text-foreground"
          >
            <span>Archived ({archivedExperiments.length})</span>
            {showArchived ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          {showArchived && (
            <div className="mt-2 divide-y divide-border/50">
              {archivedExperiments.map((experiment) => {
                const gIdx = execution.experiments.findIndex((e) => e.id === experiment.id);
                const stCls = experiment.status === "supported" ? "bg-signal-supports/20 text-signal-supports"
                  : experiment.status === "refuted" ? "bg-signal-challenges/20 text-signal-challenges"
                  : experiment.status === "testing" ? "bg-accent/20 text-accent"
                  : "bg-muted text-muted";
                return (
                  <div key={experiment.id} className="flex items-center gap-2 py-2 text-sm opacity-70">
                    <button
                      type="button"
                      onClick={() => updateExperiment(experiment.id, (exp) => ({ ...exp, archived: false }))}
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted transition hover:bg-muted hover:text-foreground"
                    >
                      Unarchive
                    </button>
                    <span className="font-mono text-[10px] text-signal-challenges/70">H{gIdx + 1}</span>
                    <span className={"rounded px-1.5 py-0.5 text-[10px] font-semibold " + stCls}>{statusLabels[experiment.status]}</span>
                    <span className="truncate text-foreground/70">{experiment.assumption}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </section>
  );
}
