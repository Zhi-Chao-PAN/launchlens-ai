"use client";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  ChevronUp,
  CircleGauge,
  FlaskConical,
  Download,
  Link2,
  PencilLine,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSrAnnounce } from "@/hooks/use-sr-announce";
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
    const sourceError = draftTouched.source && draft.source.trim().length < 2 ? "Source needs at least 2 characters." : "";
  const noteError = draftTouched.note && draft.note.trim().length < 8 ? "Observation needs at least 8 characters." : "";
  const [weightPreset, setWeightPreset] = useState<"default" | "evidence" | "decision">("default");
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "decided">("all");
  const [sortBy, setSortBy] = useState<"default" | "confidence" | "status" | "progress">("default");
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
  }, [execution.experiments, statusFilter, sortBy]);

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
    const lines = [
      "# " + experiment.assumption,
      "",
      "- **Status**: " + status,
      "- **Confidence**: " + confidence + (experiment.confidenceManual ? " (manual)" : ""),
      "- **Evidence**: " + experiment.evidence.length + " items",
      "",
      "## Evidence",
      "",
    ];
    if (experiment.evidence.length === 0) {
      lines.push("_No evidence recorded yet._");
    } else {
      experiment.evidence.forEach((item, itemIdx) => {
        lines.push(
          "### " + (itemIdx + 1) + ". " + signalLabel[item.signal] + " — " + item.source,
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

    const lines: string[] = [];
    lines.push("# Validation Board");
    lines.push("");
    lines.push(
      "- **Hypotheses**: " +
        execution.experiments.length +
        " total — " +
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
              " — " +
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
      `Confidence updated: ${labels[oldConfidence]} �?${labels[newConfidence]}`,
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
          // Detect signal prefix
          let signal: EvidenceSignal = draft.signal;
          let rest = line;
          if (line.startsWith("+")) {
            signal = "supports";
            rest = line.slice(1).trim();
          } else if (line.startsWith("-")) {
            signal = "challenges";
            rest = line.slice(1).trim();
          } else if (line.startsWith("~")) {
            signal = "neutral";
            rest = line.slice(1).trim();
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
            weight: draft.weight,
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
        {filteredExperiments.map((experiment, index) => {
          const formOpen = activeExperimentId === experiment.id;
          const expanded = expandedExperimentId === experiment.id;
          const evidenceLimitReached = experiment.evidence.length >= 8;

          return (
            <article
              role="group"
              key={experiment.id}
              data-experiment-article
              tabIndex={0}
              onKeyDown={(e) => handleExperimentKeyDown(e, experiment.id)}
              aria-label={`Hypothesis ${index + 1}: ${experiment.assumption}. Status: ${statusLabels[experiment.status]}. ${experiment.evidence.length} evidence items.}`}
              className="p-5 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
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
                        <span className="text-[10px] font-medium opacity-75">�?auto</span>
                      )}
                    </span>
                    <span className="text-xs text-muted" aria-label={`${experiment.evidence.length} evidence item${experiment.evidence.length === 1 ? "" : "s"}`}>
                      {experiment.evidence.length} evidence item
                      {experiment.evidence.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h3 className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-foreground">
                    {experiment.assumption}
                  </h3>
                </div>

                <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
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

              {experiment.evidence.length > 0 ? (
                <ul ref={evidenceListRef} data-experiment-id={experiment.id} tabIndex={-1} aria-label="Evidence items" aria-live="polite" onKeyDown={handleEvidenceKeyDown} className="mt-4 divide-y divide-card rounded-md bg-muted px-4 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">
                  {experiment.evidence.map((item) => (
                    <li
                      data-evidence-id={item.id}
                      key={item.id}
                      className="flex items-start gap-3 py-3 text-sm"
                    >
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
                          {item.note}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveEvidence(experiment.id, item.id, "up")}
                          disabled={experiment.evidence.findIndex((e) => e.id === item.id) === 0}
                          title="Move evidence up"
                          aria-label={`Move evidence from ${item.source} up`}
                          className="flex size-12 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent sm:size-9"
                        >
                          <ChevronUp className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEvidence(experiment.id, item.id, "down")}
                          disabled={experiment.evidence.findIndex((e) => e.id === item.id) === experiment.evidence.length - 1}
                          title="Move evidence down"
                          aria-label={`Move evidence from ${item.source} down`}
                          className="flex size-12 shrink-0 items-center justify-center rounded-md text-foreground/80 transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent sm:size-9"
                        >
                          <ChevronDown className="size-4" aria-hidden="true" />
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
                id={`evidence-form-${experiment.id}`}
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
                            "Format: Source - Observation\n" +
                            "Prefix lines with + for supports, - for challenges, ~ for neutral\n" +
                            "Example:\n" +
                            "+ User interview #3 - Said theyd pay for this tomorrow\n" +
                            "- App Store review - Too expensive compared to alternatives"
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
                          as {signalLabels[draft.signal]} (moderate weight). Prefix with{" "}
                          <code className="font-mono">+</code>,{" "}
                          <code className="font-mono">-</code>, or{" "}
                          <code className="font-mono">~</code> to override signal per line.
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
                          �?                        </span>
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
                      <span className="mb-2 block text-xs font-semibold uppercase text-muted">
                        Source
                      </span>
                      <input
                        required
                        maxLength={160}
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
                        placeholder="Interview, metric, test"
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
                      <span className="mb-2 block text-xs font-semibold uppercase text-muted">
                        Observation
                      </span>
                      <input
                        required
                        maxLength={800}
                        value={draft.note}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            note: event.target.value,
                          }))
                        }
                        onBlur={() => setDraftTouched((cur) => ({ ...cur, note: true }))}
                        aria-invalid={!!noteError}
                        aria-describedby={noteError ? "evidence-note-error" : undefined}
                        placeholder="What did you learn?"
                        className={`h-10 w-full rounded-md border bg-card px-3 text-sm outline-none ${
                          noteError
                            ? "border-signal-challenges focus:border-signal-challenges focus:ring-2 focus:ring-[var(--signal-challenges-border)]"
                            : "border-input focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                        }`}
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
                      className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
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
              </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
