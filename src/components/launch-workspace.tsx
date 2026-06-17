"use client";

import {
  AlertTriangle,
  Upload,
  ArrowRight,
  X,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Copy,
  Download,
  Braces,
  Eye,
  FileText,
  Loader2,
  Megaphone,
  PencilLine,
  Plus,
  RotateCcw,
  Rocket,
  ChevronDown,
  Save,
  Sparkles,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatShortcut, useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useSrAnnounce } from "@/hooks/use-sr-announce";

import { ThemeToggle } from "./theme-toggle";
import { CloudWorkspaces } from "@/components/cloud-workspaces";
import { SystemStatus } from "@/components/system-status";
import { ReplayTourButton } from "@/components/onboarding-wizard";
import { useToast } from "@/components/toast";
import { DecisionCopilot } from "@/components/decision-copilot";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { useWorkspaceCommands } from "@/hooks/use-workspace-commands";
import { ValidationBoard } from "@/components/validation-board";
import { copyTextToClipboard, downloadTextFile } from "@/lib/launchlens/clipboard";
import { safeMarkdownFilename, workspaceToMarkdown } from "@/lib/launchlens/markdown-export";
import { workspaceFromJson, workspaceToJson, type WorkspaceImportResult } from "@/lib/launchlens/json-export";
import type { CloudWorkspaceRecord } from "@/lib/launchlens/cloud-workspace";
import {
  createExecutionState,
  evaluateExecutionProgress,
  normalizeExecutionState,
  type WorkspaceExecutionState,
} from "@/lib/launchlens/execution";
import type { ExampleWorkspace } from "@/lib/launchlens/example-workspaces";
import { formatGeneratedTime, formatRelativeTime } from "@/lib/launchlens/generated-time";
import { evaluateWorkspaceQuality } from "@/lib/launchlens/workspace-quality";
import { friendlyApiMessage } from "@/lib/launchlens/api-errors";
import type {
  GenerationResult,
  LaunchLensInput,
  LaunchLensWorkspace,
} from "@/lib/launchlens/types";
import {
  isLaunchLensInput,
  isLaunchLensWorkspace,
  isRecord,
} from "@/lib/launchlens/workspace-validation";

type LaunchWorkspaceProps = {
  initialInput: LaunchLensInput;
  initialWorkspace: LaunchLensWorkspace;
  initialExecution: WorkspaceExecutionState;
  exampleWorkspaces: ExampleWorkspace[];
};

type SectionProps = {
  title: React.ReactNode;
  icon: LucideIcon;
  children: React.ReactNode;
  collapsible?: boolean;
  sectionId?: string;
  collapsed?: boolean;
  onToggle?: () => void;
};

type EditableTextProps = {
  label: string;
  value: string;
  rows?: number;
  onCommit: (value: string) => void;
};

type EditableLinesProps = {
  label: string;
  items: string[];
  rows?: number;
  onCommit: (items: string[]) => void;
};

type WorkspaceListKey =
  | "targetUsers"
  | "pains"
  | "mvpScope"
  | "launchPlan"
  | "assumptions";

type GenerationMeta = {
  mode: "demo" | "real";
  provider: LaunchLensWorkspace["provider"];
  generatedAt: string;
  usedFallback: boolean;
  fallbackReason?: string;
};

const tones = [
  "Practical, crisp, and founder-friendly",
  "Analytical and investor-ready",
  "Warm and community-led",
  "Technical and product-led",
];

const LOCAL_WORKSPACE_KEY = "launchlens.currentWorkspace.v1";
const COLLAPSED_SECTIONS_KEY = "launchlens:collapsed-sections";
const loadingSteps = [
  "Reading founder brief",
  "Structuring GTM workspace",
  "Checking launch tasks",
];

type LocalWorkspaceSnapshot = {
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
  execution: WorkspaceExecutionState;
  savedAt: string;
};

function parseLocalWorkspaceSnapshot(
  value: unknown,
): LocalWorkspaceSnapshot | null {
  if (
    !isRecord(value) ||
    !isLaunchLensInput(value.input) ||
    !isLaunchLensWorkspace(value.workspace) ||
    typeof value.savedAt !== "string"
  ) {
    return null;
  }

  const execution = normalizeExecutionState(value.execution, value.workspace);

  return execution
    ? {
        input: value.input,
        workspace: value.workspace,
        execution,
        savedAt: value.savedAt,
      }
    : null;
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Section({ title, icon: Icon, children, collapsible = false, sectionId, collapsed: controlledCollapsed, onToggle }: SectionProps) {
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = collapsible && controlledCollapsed !== undefined
    ? !controlledCollapsed
    : internalOpen;

  const contentId = sectionId ? `${sectionId}-content` : undefined;

  const toggle = () => {
    if (!collapsible) return;
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(prev => !prev);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!collapsible) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <section className="rounded-lg border border-card bg-card shadow-sm overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="w-full flex items-center gap-2 p-5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-signal-supports text-signal-supports">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <h2 className="flex-1 text-base font-semibold text-foreground">{title}</h2>
          <ChevronDown
            className={`size-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex items-center gap-2 p-5 pb-0">
          <span className="flex size-8 items-center justify-center rounded-md bg-signal-supports text-signal-supports">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
      )}
      <div
        id={contentId}
        className={`transition-all ${
          collapsible && !isOpen ? "max-h-0 opacity-0 overflow-hidden" : "max-h-none opacity-100"
        }`}
      >
        <div className={collapsible ? "px-5 pb-5 pt-0" : "p-5 pt-4"}>
          {children}
        </div>
      </div>
    </section>
  );
}

function EditableText({ label, value, rows = 3, onCommit }: EditableTextProps) {
  return (
    <textarea
      aria-label={label}
      value={value}
      rows={rows}
      onChange={(event) => onCommit(event.target.value)}
      className="w-full resize-y rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
    />
  );
}

function EditableLines({
  label,
  items,
  rows = 5,
  onCommit,
}: EditableLinesProps) {
  return (
    <EditableText
      label={label}
      value={items.join("\n")}
      rows={rows}
      onCommit={(value) => onCommit(splitLines(value))}
    />
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex gap-3 text-sm leading-6 text-foreground/80"
        >
          <CheckCircle2
            className="mt-1 size-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LaunchWorkspace({
  initialInput,
  initialWorkspace,
  initialExecution,
  exampleWorkspaces,
}: LaunchWorkspaceProps) {
  const [input, setInput] = useState(initialInput);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [execution, setExecution] = useState(initialExecution);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Load collapsed section state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Defer to next tick to avoid cascading renders from mount
          window.setTimeout(() => {
            setCollapsedSections(new Set(parsed));
          }, 0);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);
  const [error, setError] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [exportText, setExportText] = useState("");
  const [exportFormat, setExportFormat] = useState<"markdown" | "json" | "">("");
  const [copyJustSucceeded, setCopyJustSucceeded] = useState<"markdown" | "json" | "">("");
  const [importPreview, setImportPreview] = useState<WorkspaceImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const switchTimerRef = useRef<number | null>(null);
  const { showToast } = useToast();

  /**
   * Brief opacity crossfade when switching examples or restoring snapshots:
   * fade out the existing panels (120ms), swap state mid-fade, then fade back
   * in (200ms). Avoids the content-pop that happens when all sections change
   * in a single paint.
   */
  function navigateToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    }
  }

  function switchWorkspace(apply: () => void) {
    if (switchTimerRef.current) {
      window.clearTimeout(switchTimerRef.current);
      switchTimerRef.current = null;
    }
    setIsSwitching(true);
    // Reduced-motion users skip the fade and get the instant swap.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      apply();
      setIsSwitching(false);
      return;
    }
    switchTimerRef.current = window.setTimeout(() => {
      apply();
      switchTimerRef.current = window.setTimeout(() => {
        setIsSwitching(false);
        switchTimerRef.current = null;
      }, 200);
    }, 120);
  }

  useEffect(() => {
    return () => {
      if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    };
  }, []);

  const [generationMeta, setGenerationMeta] = useState<GenerationMeta>({
    mode: "demo",
    provider: initialWorkspace.provider,
    generatedAt: initialWorkspace.generatedAt,
    usedFallback: false,
  });

  const providerLabel = useMemo(() => {
    if (workspace.provider === "minimax") {
      return "MiniMax provider";
    }

    if (workspace.provider === "openai") {
      return "OpenAI-compatible provider";
    }

    return "Demo mock provider";
  }, [workspace.provider]);

  const [saveFlash, setSaveFlash] = useState(false);
  const { announce: srSave } = useSrAnnounce();

  // Save label with relative time that updates periodically
  const [nowTick, setNowTick] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Update relative time display every 30 seconds
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick((t) => t + 1), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const saveLabel = useMemo(() => {
    void nowTick; // used as a periodic refresh tick
    if (!isStorageReady) return "Preparing save";
    if (!savedAt) return "Saved locally";
    return `Saved ${formatRelativeTime(savedAt)}`;
  }, [isStorageReady, savedAt, nowTick]);


  const generationModeLabel =
    generationMeta.mode === "real" && !generationMeta.usedFallback
      ? "Real provider"
      : "Demo mode";
  const qualityResult = useMemo(
    () => evaluateWorkspaceQuality(workspace),
    [workspace],
  );

  // Keyboard shortcuts
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Persist collapsed sections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        COLLAPSED_SECTIONS_KEY,
        JSON.stringify(Array.from(collapsedSections)),
      );
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  }, [collapsedSections]);


  const focusBrief = useCallback(() => {
    setIsBriefOpen(true);
    window.setTimeout(() => {
      const textarea = document.getElementById("founder-brief-idea") as HTMLTextAreaElement | null;
      textarea?.focus();
    }, 50);
  }, []);
  
  const toggleEdit = useCallback(() => {
    setIsEditing(current => !current);
  }, []);
  
  const handleSave = useCallback(() => {
    showToast("Use the Cloud history section below to save snapshots to cloud.", "info");
    window.setTimeout(() => {
      const cloudSection = document.getElementById("cloud-workspaces-section");
      cloudSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [showToast]);

  useKeyboardShortcuts({
    generate: () => { if (!isGenerating) generate(); },
    edit: toggleEdit,
    save: handleSave,
    focusBrief: focusBrief,
    collapseAll: () => {
      const allIds = Array.from(document.querySelectorAll("section[id$=\"-content\"]"))
        .map(el => el.id.replace("-content", ""))
        .filter(Boolean);
      setCollapsedSections(new Set(allIds));
    },
    expandAll: () => setCollapsedSections(new Set()),
    copyMarkdown: () => copyMarkdown(),
    reset: () => resetLocalWorkspace(),
  });

    const executionProgress = useMemo(
    () => evaluateExecutionProgress(execution),
    [execution],
  );

  useEffect(() => {
    let cancelled = false;

    window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      try {
        const rawSnapshot = localStorage.getItem(LOCAL_WORKSPACE_KEY);
    if (rawSnapshot) {
      try {
        const parsed = JSON.parse(rawSnapshot);
        if (parsed.savedAt) setSavedAt(parsed.savedAt);
      } catch {
        // ignore parse errors
      }
    }

        if (rawSnapshot) {
          const snapshot = parseLocalWorkspaceSnapshot(
            JSON.parse(rawSnapshot) as unknown,
          );

          if (snapshot) {
            setInput(snapshot.input);
            setWorkspace(snapshot.workspace);
            setExecution(snapshot.execution);
            setGenerationMeta({
              mode: snapshot.workspace.provider === "mock" ? "demo" : "real",
              provider: snapshot.workspace.provider,
              generatedAt: snapshot.workspace.generatedAt,
              usedFallback: false,
            });
            showToast("Local workspace restored from browser storage.", "success");
          }
        }
      } catch {
        showToast("Local storage unavailable - changes may not persist.", "error");
      } finally {
        setIsStorageReady(true);
      }
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    try {
      const nextSavedAt = new Date().toISOString();
      const snapshot: LocalWorkspaceSnapshot = {
        input,
        workspace,
        execution,
        savedAt: nextSavedAt,
      };

      localStorage.setItem(LOCAL_WORKSPACE_KEY, JSON.stringify(snapshot));

      // Flash the saved indicator and update timestamp label.
      // Defer to next tick to avoid cascading re-renders inside the effect.
      window.setTimeout(() => {
        setSavedAt(nextSavedAt);
        setSaveFlash(true);
        window.setTimeout(() => setSaveFlash(false), 900);
        srSave("Workspace saved locally.");
      }, 0);

      // Flash the saved indicator so users see the save took effect.
      // Defer to next tick to avoid cascading re-renders inside the effect.
      window.setTimeout(() => {
        setSaveFlash(true);
        window.setTimeout(() => setSaveFlash(false), 900);
        srSave("Workspace saved locally.");
      }, 0);
    } catch {
      window.setTimeout(() => {
        showToast("Local storage unavailable - changes may not persist.", "error");
      }, 0);
    }
  }, [execution, input, isStorageReady, setSaveFlash, showToast, srSave, workspace]);

  function updateList(key: WorkspaceListKey, items: string[]) {
    setWorkspace((current) => ({
      ...current,
      [key]: items,
    }));
  }

  function applyExample(example: ExampleWorkspace) {
    switchWorkspace(() => {
      setInput(example.input);
      setWorkspace(example.workspace);
      setExecution(example.execution);
      setGenerationMeta({
        mode: "demo",
        provider: example.workspace.provider,
        generatedAt: example.workspace.generatedAt,
        usedFallback: false,
      });
      setError("");
      setFallbackNotice("");
      setExportText("");
      setExportFormat("");
      setIsEditing(false);
      setIsBriefOpen(false);
    });
    showToast("Example workspace loaded.", "success");
  }

  function resetLocalWorkspace() {
    switchWorkspace(() => {
      setInput(initialInput);
      setWorkspace(initialWorkspace);
      setExecution(initialExecution);
      setGenerationMeta({
        mode: "demo",
        provider: initialWorkspace.provider,
        generatedAt: initialWorkspace.generatedAt,
        usedFallback: false,
      });
      setError("");
      setFallbackNotice("");
      setExportText("");
      setExportFormat("");
      setIsEditing(false);
      setIsBriefOpen(false);
    });
    showToast("Workspace reset to starter example.", "success");
  }

  function restoreCloudWorkspace(record: CloudWorkspaceRecord) {
    switchWorkspace(() => {
      setInput(record.input);
      setWorkspace(record.workspace);
      setExecution(record.execution);
      setGenerationMeta({
        mode: record.workspace.provider === "mock" ? "demo" : "real",
        provider: record.workspace.provider,
        generatedAt: record.workspace.generatedAt,
        usedFallback: false,
      });
      setError("");
      setFallbackNotice("");
      setExportText("");
      setExportFormat("");
      setIsEditing(false);
      setIsBriefOpen(false);
    });
    showToast("Cloud snapshot restored successfully.", "success");
  }

  async function generate() {
    setIsGenerating(true);
    setError("");
    setFallbackNotice("");
    setExportText("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await response.json()) as Partial<GenerationResult> & {
        error?: string;
        code?: string;
      };

      if (!response.ok || data.error || !data.workspace) {
        const fallback =
          response.status === 429
            ? "Too many requests —please wait a moment and try again."
            : "Generation failed.";
        const message = friendlyApiMessage(data.code, data.error ?? fallback);
        const err = new Error(message);
        (err as Error & { status?: number }).status = response.status;
        throw err;
      }

      setWorkspace(data.workspace);
      const freshExecution = createExecutionState(data.workspace);
      setExecution(freshExecution);
      setSrAnnouncement(
        `Workspace ready. ${data.workspace.targetUsers.length} audience segments, ${data.workspace.tasks.length} execution tasks, ${freshExecution.experiments.length} validation hypotheses.`,
      );
      setGenerationMeta({
        mode: data.mode ?? "demo",
        provider: data.workspace.provider,
        generatedAt: data.workspace.generatedAt,
        usedFallback: Boolean(data.usedFallback),
        fallbackReason: data.fallbackReason,
      });
      
      if (data.usedFallback) {
        showToast("Real provider unavailable - returned demo workspace instead.", "info");
        setFallbackNotice("Real provider failed, so LaunchLens returned the mock workspace.");
      } else {
        setFallbackNotice("");
      }
      setIsBriefOpen(false);
    } catch (caught) {
      const msg =
        caught instanceof Error
          ? caught.message
          : "Something went wrong during generation.";
      setError(msg);
      setSrAnnouncement(`Generation failed: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  }

  function flashCopySuccess(kind: "markdown" | "json") {
    setCopyJustSucceeded(kind);
    window.setTimeout(() => {
      setCopyJustSucceeded((current) => (current === kind ? "" : current));
    }, 1800);
  }

  async function copyMarkdown() {
    const markdown = workspaceToMarkdown(workspace, execution);
    setExportText(markdown);
    setExportFormat("markdown");

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(markdown);
        showToast("Markdown copied to clipboard", "success");
        flashCopySuccess("markdown");
        return;
      } catch {
        // fall through to sync path
      }
    }
    if (await copyTextToClipboard(markdown)) {
      showToast("Markdown copied to clipboard", "success");
      flashCopySuccess("markdown");
      return;
    }
    // Last-resort: download the file directly instead of making the user
    // manually select from the textarea.
    const filename = safeMarkdownFilename({
      projectName: null,
      landingPage: { headline: workspace.landingPage.headline },
    });
    downloadTextFile(filename, markdown, "text/markdown;charset=utf-8");
    showToast("Clipboard unavailable - downloaded Markdown file instead", "info");
  }

  async function copyJson() {
    const json = workspaceToJson(workspace, execution);
    setExportText(json);
    setExportFormat("json");

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(json);
        showToast("JSON copied to clipboard", "success");
        flashCopySuccess("json");
        return;
      } catch {
        // fall through to sync path
      }
    }
    if (await copyTextToClipboard(json)) {
      showToast("JSON copied to clipboard", "success");
      flashCopySuccess("json");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      `launchlens-workspace-${stamp}.json`,
      json,
      "application/json;charset=utf-8",
    );
    showToast("Clipboard unavailable - downloaded JSON file instead", "info");
  }

  function downloadExport() {
    if (!exportText || !exportFormat) return;
    const ext = exportFormat === "markdown" ? "md" : "json";
    const mime = exportFormat === "markdown" ? "text/markdown" : "application/json";
    const stamp = new Date().toISOString().slice(0, 10);
    const ok = downloadTextFile(
      `launchlens-workspace-${stamp}.${ext}`,
      exportText,
      `${mime};charset=utf-8`,
    );
    if (ok) showToast(`Exported as .${ext} file`, "success");
    else showToast(`Unable to download ${ext.toUpperCase()} file in this browser`, "error");
  }

  function downloadMarkdownFile() {
    const markdown = workspaceToMarkdown(workspace, execution);
    const filename = safeMarkdownFilename({
      landingPage: { headline: workspace.landingPage.headline },
    });
    if (downloadTextFile(filename, markdown, "text/markdown;charset=utf-8")) {
      showToast("Markdown file downloaded", "success");
    }
  }

  function downloadJsonFile() {
    const json = workspaceToJson(workspace, execution);
    const stamp = new Date().toISOString().slice(0, 10);
    if (
      downloadTextFile(
        `launchlens-workspace-${stamp}.json`,
        json,
        "application/json;charset=utf-8",
      )
    ) {
      showToast("JSON file downloaded", "success");
    }
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const result = workspaceFromJson(text);
      setImportPreview(result);
      showToast("File parsed successfully — review and confirm", "info");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown import error";
      showToast(`Import failed: ${msg}`, "error");
    }
  }

  function applyImport() {
    if (!importPreview) return;
    setWorkspace(importPreview.workspace);
    if (importPreview.execution) {
      setExecution(importPreview.execution);
    } else {
      setExecution(createExecutionState(importPreview.workspace));
    }
    setImportPreview(null);
    const warningCount = importPreview.warnings.length;
    if (warningCount > 0) {
      showToast(
        `Workspace imported (${warningCount} warning${warningCount === 1 ? "" : "s"})`,
        "info",
      );
    } else {
      showToast("Workspace imported successfully", "success");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelImport() {
    setImportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  async function retryCopyFromTextarea() {
    if (!exportText) return;
    try {
      await navigator.clipboard.writeText(exportText);
      showToast("Copied from export panel", "success");
      flashCopySuccess(exportFormat as "markdown" | "json");
    } catch {
      showToast("Clipboard still unavailable - use the Download button instead", "error");
    }
  }

  return (
    <>
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
    >
      {srAnnouncement}
    </div>
    <main id="main-content"
      aria-busy={isGenerating || isSwitching}
      className={[
        "min-h-screen bg-muted text-foreground",
        "animate-[fadeInDown_280ms_ease-out_both] motion-reduce:animate-none",
        isSwitching ? "opacity-40 pointer-events-none transition-opacity duration-150 ease-out motion-reduce:transition-none" : "transition-opacity duration-200 ease-out motion-reduce:transition-none",
      ].join(" ")}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 pb-20 sm:gap-6 sm:px-6 sm:py-6 sm:pb-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-card pb-4 sm:gap-4 sm:pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-foreground text-white sm:size-11">
              <Compass className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-signal-challenges sm:text-sm">LaunchLens AI</p>
              <h1 className="text-lg font-semibold text-foreground sm:text-2xl">
                Go-to-market workspace
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm sm:flex-wrap sm:overflow-visible sm:pb-0">
            <span className={`hidden items-center gap-2 rounded-md border border-card bg-card px-3 py-2 text-foreground/80 transition-colors sm:flex ${saveFlash ? "bg-signal-supports text-signal-supports border-accent" : ""}`}>
              <Save className="size-4 text-accent" aria-hidden="true" />
              {saveLabel}
            </span>
            <button
              type="button"
              onClick={resetLocalWorkspace}
              title="Reset local draft"
              aria-label="Reset local draft"
              className="flex size-9 items-center justify-center rounded-md border border-card bg-card text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:size-10"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
            <ThemeToggle />
            <SystemStatus />
            <span className="hidden rounded-md border border-card bg-card px-3 py-2 text-foreground/80 md:inline">
              {providerLabel}
            </span>
            <ReplayTourButton />
            <span className="hidden rounded-md bg-signal-neutral px-3 py-2 font-medium text-signal-neutral md:inline-flex">
              Portfolio-ready build
            </span>
            <a
              href="/pricing"
              className="rounded-md border border-input bg-card px-3 py-2 text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            >
              Pricing
            </a>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[370px_1fr]">
          <aside className="min-w-0 rounded-lg border border-card bg-card p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-signal-challenges" aria-hidden="true" />
                <h2 className="text-lg font-semibold">Founder brief</h2>
              </div>
              <button
                type="button"
                aria-controls="founder-brief-controls"
                aria-expanded={isBriefOpen}
                onClick={() => setIsBriefOpen((current) => !current)}
                className="flex h-9 items-center gap-2 rounded-md border border-input bg-input px-3 text-sm font-semibold text-foreground transition hover:border-accent lg:hidden"
              >
                <PencilLine className="size-4" aria-hidden="true" />
                {isBriefOpen ? "Hide brief" : "Edit brief"}
              </button>
            </div>

            {!isBriefOpen && (
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-foreground/80 lg:hidden">
                {input.idea}
              </p>
            )}

            <div
              id="founder-brief-controls"
              className={`${isBriefOpen ? "mt-5 block" : "hidden"} lg:mt-5 lg:block`}
            >
              <div className="mb-5 grid gap-2" role="group" aria-label="Sample briefs">
                {exampleWorkspaces.map((example) => {
                  const isSelected = workspace.generatedAt === example.workspace.generatedAt
                    && input.idea === example.input.idea;
                  return (
                    <button
                      key={example.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => applyExample(example)}
                      disabled={isSwitching}
                      className={[
                        "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
                        isSelected
                          ? "border-accent bg-signal-supports text-signal-supports"
                          : "border-card bg-input text-foreground/80 hover:border-accent hover:text-foreground",
                      ].join(" ")}
                    >
                      {example.label}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">
                    Product idea
                  </span>
                  <textarea
                    id="founder-brief-idea"
                    value={input.idea}
                    onChange={(event) =>
                      setInput((current) => ({
                        ...current,
                        idea: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !isGenerating) {
                        event.preventDefault();
                        generate();
                      }
                    }}
                    rows={5}
                    placeholder="Describe the product you are validating..."
                    className="w-full resize-none rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p className="mt-1 text-xs text-muted">
                    Tip: press{" "}
                    <kbd className="rounded border border-input bg-muted px-1 font-mono">
                      {formatShortcut({ key: "Enter", meta: true, ctrl: true, description: "", category: "" })}
                    </kbd>{" "}
                    to generate.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">
                    Target audience
                  </span>
                  <textarea
                    value={input.audience}
                    onChange={(event) =>
                      setInput((current) => ({
                        ...current,
                        audience: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full resize-none rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">
                    Market context
                  </span>
                  <input
                    value={input.market}
                    onChange={(event) =>
                      setInput((current) => ({
                        ...current,
                        market: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-input bg-input px-3 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">
                    Voice
                  </span>
                  <select
                    value={input.tone}
                    onChange={(event) =>
                      setInput((current) => ({
                        ...current,
                        tone: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-input bg-input px-3 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  >
                    {tones.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">
                    Constraints
                  </span>
                  <textarea
                    value={input.constraints}
                    onChange={(event) =>
                      setInput((current) => ({
                        ...current,
                        constraints: event.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full resize-none rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                </label>

                <button
                  type="button"
                  onClick={generate}
                  disabled={isGenerating}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-1" aria-hidden="true">
                      <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-card/80 [animation-delay:-0.32s]" />
                      <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-card/80 [animation-delay:-0.16s]" />
                      <span className="size-1.5 animate-[launchlens-dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-card/80" />
                    </span>
                  ) : (
                    <Rocket className="size-4" aria-hidden="true" />
                  )}
                  {isGenerating ? "Generating" : "Generate workspace"}
                </button>
                <p className="mt-2 text-center text-xs text-muted">
                  Tip: press{" "}
                  <kbd className="rounded border border-input bg-card px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    Ctrl
                  </kbd>
                  {" "}+{" "}
                  <kbd className="rounded border border-input bg-card px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    Enter
                  </kbd>{" "}
                  to generate; press{" "}
                  <kbd className="rounded border border-input bg-card px-1.5 py-0.5 font-mono text-[11px] text-foreground">?</kbd>{" "}
                  for all shortcuts.
                </p>
              </div>

              {isGenerating && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-4 animate-[launchlens-fade-in-up_260ms_ease-out_both] rounded-md border border-card bg-input p-3 motion-reduce:animate-none"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Loader2
                      className="size-4 animate-spin text-accent"
                      aria-hidden="true"
                    />
                    Generating workspace
                  </div>
                  <div className="space-y-2">
                    {loadingSteps.map((step, idx) => (
                      <div key={step} className="flex items-center gap-3" style={{ animationDelay: `${idx * 60}ms` }}>
                        <span className="size-2 animate-[launchlens-dot-pulse_1.4s_ease-in-out_infinite] rounded-full bg-primary" style={{ animationDelay: `${idx * 120}ms` }} />
                        <span className="text-sm text-foreground/80">{step}</span>
                        <span className="ml-auto h-2 w-12 overflow-hidden rounded-full bg-card">
                          <span className="block h-full w-1/3 rounded-full bg-primary motion-safe:animate-[launchlens-shimmer_1.4s_ease-in-out_infinite]" style={{ animationDelay: `${idx * 120}ms` }} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(error || fallbackNotice) && (
                <div
                  role={error ? "alert" : "status"}
                  className="mt-4 rounded-md border border-signal-challenges bg-signal-challenges p-3 text-sm leading-6 text-signal-challenges"
                >
                  {error || fallbackNotice}
                </div>
              )}

              
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <div id="cloud-workspaces-section">
            <CloudWorkspaces
              input={input}
              workspace={workspace}
              execution={execution}
              onRestore={restoreCloudWorkspace}
            />
            </div>

            <section className="rounded-lg border border-card bg-card p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 border-b border-card pb-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/80">
                  <span className="rounded-md bg-signal-supports px-3 py-2 font-medium text-signal-supports">
                    {workspace.backlog.length} backlog items
                  </span>
                  <span className="rounded-md bg-muted px-3 py-2">
                    {workspace.tasks.length} launch tasks
                  </span>
                  <span className="rounded-md bg-muted px-3 py-2">
                    {workspace.assumptions.length} assumptions
                  </span>
                  <span className="rounded-md bg-muted px-3 py-2">
                    {generationModeLabel}
                  </span>
                  <span className="rounded-md bg-muted px-3 py-2">
                    Generated {formatGeneratedTime(generationMeta.generatedAt)}
                  </span>
                  <span className="rounded-md bg-muted px-3 py-2">
                    Quality {qualityResult.score}%
                  </span>
                  <span className="rounded-md bg-signal-challenges px-3 py-2 text-signal-challenges">
                    Validation {executionProgress.score}%
                  </span>
                  {generationMeta.usedFallback && generationMeta.fallbackReason && (
                    <span className="rounded-md bg-signal-challenges px-3 py-2 font-medium text-signal-challenges">
                      Fallback: {generationMeta.fallbackReason}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing((current) => !current)}
                    className="flex h-9 items-center gap-2 rounded-md border border-input bg-input px-2 text-sm font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:h-10 sm:px-3"
                  >
                    {isEditing ? (
                      <Eye className="size-4" aria-hidden="true" />
                    ) : (
                      <PencilLine className="size-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">{isEditing ? "Preview" : "Edit"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyMarkdown}
                    aria-live="polite"
                    className="flex h-9 items-center gap-2 rounded-md bg-foreground px-2 text-sm font-semibold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:h-10 sm:px-3"
                  >
                    {copyJustSucceeded === "markdown" ? (
                      <CheckCircle2 className="size-4 text-signal-supports" aria-hidden="true" />
                    ) : (
                      <Copy className="size-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">{copyJustSucceeded === "markdown" ? "Copied!" : "Copy Markdown"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyJson}
                    aria-live="polite"
                    className="flex h-9 items-center gap-2 rounded-md border border-input bg-input px-2 text-sm font-semibold text-foreground transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:h-10 sm:px-3"
                  >
                    {copyJustSucceeded === "json" ? (
                      <CheckCircle2 className="size-4 text-accent" aria-hidden="true" />
                    ) : (
                      <Braces className="size-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">{copyJustSucceeded === "json" ? "Copied!" : "Copy JSON"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadMarkdownFile}
                    title="Download Markdown file"
                    className="flex h-9 items-center gap-1 rounded-md border border-input bg-card px-2 text-sm font-semibold text-foreground/80 transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:h-10 sm:gap-2 sm:px-3"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    .md
                  </button>
                  <button
                    type="button"
                    onClick={downloadJsonFile}
                    title="Download JSON file"
                    className="flex h-9 items-center gap-1 rounded-md border border-input bg-card px-2 text-sm font-semibold text-foreground/80 transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:h-10 sm:gap-2 sm:px-3"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    .json
                  </button>
                  <button
                    type="button"
                    onClick={triggerImport}
                    title="Import JSON workspace"
                    className="flex h-9 items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 sm:h-10 sm:gap-2 sm:px-3"
                  >
                    <Upload className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Import</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleImportFile(file);
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <div>
                  <p className="mb-2 text-sm font-medium text-signal-challenges">
                    Workspace summary
                  </p>
                  {isEditing ? (
                    <div className="space-y-3">
                      <EditableText
                        label="Landing page headline"
                        value={workspace.landingPage.headline}
                        rows={2}
                        onCommit={(value) =>
                          setWorkspace((current) => ({
                            ...current,
                            landingPage: {
                              ...current.landingPage,
                              headline: value || current.landingPage.headline,
                            },
                          }))
                        }
                      />
                      <EditableText
                        label="Workspace summary"
                        value={workspace.summary}
                        rows={4}
                        onCommit={(value) =>
                          setWorkspace((current) => ({
                            ...current,
                            summary: value || current.summary,
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-semibold leading-8 text-foreground">
                        {workspace.landingPage.headline}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/80">
                        {workspace.summary}
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-lg bg-signal-supports p-4">
                  <p className="text-sm font-medium text-signal-supports">
                    Launch CTA
                  </p>
                  {isEditing ? (
                    <EditableText
                      label="Launch call to action"
                      value={workspace.landingPage.cta}
                      rows={2}
                      onCommit={(value) =>
                        setWorkspace((current) => ({
                          ...current,
                          landingPage: {
                            ...current.landingPage,
                            cta: value || current.landingPage.cta,
                          },
                        }))
                      }
                    />
                  ) : (
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {workspace.landingPage.cta}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-sm font-medium text-signal-supports">
                    Next action
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {exportText && (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-card bg-input p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <FileText className="size-4" aria-hidden="true" />
                      Workspace export
                      <span className="rounded bg-signal-supports px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-signal-supports">
                        {exportFormat === "json" ? "JSON" : "Markdown"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => { setExportText(""); setExportFormat(""); }}
                      aria-label="Dismiss export"
                      className="text-muted transition hover:text-foreground"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  {exportText && (
                    <textarea
                      readOnly
                      aria-label={`Exported workspace in ${exportFormat === "json" ? "JSON" : "Markdown"} format, select and copy`}
                      value={exportText}
                      rows={8}
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-full resize-y rounded-md border border-input bg-card px-3 py-3 font-mono text-xs leading-5 text-foreground/80 focus:border-accent focus:outline-none"
                    />
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={retryCopyFromTextarea}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      <Copy className="size-3.5" aria-hidden="true" />
                      Copy selection
                    </button>
                    <button
                      type="button"
                      onClick={downloadExport}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      Download file
                    </button>
                    <p className="self-center text-[11px] leading-4 text-muted">
                      Focus the textarea to auto-select all text.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <ErrorBoundary label="Validation board">
              <ValidationBoard
                execution={execution}
                tasks={workspace.tasks}
                onChange={setExecution}
              />
            </ErrorBoundary>

            <ErrorBoundary label="Decision copilot">
              <DecisionCopilot
                execution={execution}
                onChange={setExecution}
              />
            </ErrorBoundary>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title="Target users" icon={UsersRound} collapsible sectionId="target-users" collapsed={collapsedSections.has("target-users")} onToggle={() => toggleSection("target-users")}>
                {isEditing ? (
                  <EditableLines
                    label="Target users"
                    items={workspace.targetUsers}
                    onCommit={(items) => updateList("targetUsers", items)}
                  />
                ) : (
                  <BulletList items={workspace.targetUsers} />
                )}
              </Section>

              <Section title="Pain map" icon={Target} collapsible sectionId="pain-map" collapsed={collapsedSections.has("pain-map")} onToggle={() => toggleSection("pain-map")}>
                {isEditing ? (
                  <EditableLines
                    label="Pain map"
                    items={workspace.pains}
                    onCommit={(items) => updateList("pains", items)}
                  />
                ) : (
                  <BulletList items={workspace.pains} />
                )}
              </Section>

              <Section title="MVP scope" icon={ClipboardList} collapsible sectionId="mvp-scope" collapsed={collapsedSections.has("mvp-scope")} onToggle={() => toggleSection("mvp-scope")}>
                {isEditing ? (
                  <EditableLines
                    label="MVP scope"
                    items={workspace.mvpScope}
                    onCommit={(items) => updateList("mvpScope", items)}
                  />
                ) : (
                  <BulletList items={workspace.mvpScope} />
                )}
              </Section>

              <Section title="Landing page copy" icon={Megaphone} collapsible sectionId="landing-page-copy" collapsed={collapsedSections.has("landing-page-copy")} onToggle={() => toggleSection("landing-page-copy")}>
                {isEditing ? (
                  <div className="space-y-3">
                    <EditableText
                      label="Landing page subheadline"
                      value={workspace.landingPage.subheadline}
                      rows={3}
                      onCommit={(value) =>
                        setWorkspace((current) => ({
                          ...current,
                          landingPage: {
                            ...current.landingPage,
                            subheadline:
                              value || current.landingPage.subheadline,
                          },
                        }))
                      }
                    />
                    <EditableLines
                      label="Landing page proof bullets"
                      items={workspace.landingPage.proofBullets}
                      onCommit={(items) =>
                        setWorkspace((current) => ({
                          ...current,
                          landingPage: {
                            ...current.landingPage,
                            proofBullets:
                              items.length > 0
                                ? items
                                : current.landingPage.proofBullets,
                          },
                        }))
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-3 text-sm leading-6 text-foreground/80">
                    <p className="font-semibold text-foreground">
                      {workspace.landingPage.subheadline}
                    </p>
                    <BulletList items={workspace.landingPage.proofBullets} />
                  </div>
                )}
              </Section>
            </div>

            <Section title="Feature backlog" icon={ClipboardCheck} collapsible sectionId="feature-backlog" collapsed={collapsedSections.has("feature-backlog")} onToggle={() => toggleSection("feature-backlog")}>
              {isEditing ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {workspace.backlog.map((item, index) => (
                    <div
                      key={`${item.feature}-${index}`}
                      className="rounded-md border border-card bg-input p-4 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.feature}
                          onChange={(e) =>
                            setWorkspace((current) => ({
                              ...current,
                              backlog: current.backlog.map((b, i) =>
                                i === index ? { ...b, feature: e.target.value } : b,
                              ),
                            }))
                          }
                          placeholder="Feature"
                          className="flex-1 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-semibold text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                        />
                        <select
                          value={item.priority}
                          onChange={(e) =>
                            setWorkspace((current) => ({
                              ...current,
                              backlog: current.backlog.map((b, i) =>
                                i === index ? { ...b, priority: e.target.value as "P0" | "P1" | "P2" } : b,
                              ),
                            }))
                          }
                          className="rounded-md border border-input bg-card px-2 py-1.5 text-xs font-semibold text-signal-neutral outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                        >
                          <option value="P0">P0</option>
                          <option value="P1">P1</option>
                          <option value="P2">P2</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setWorkspace((current) => ({
                              ...current,
                              backlog: current.backlog.filter((_, i) => i !== index),
                            }))
                          }
                          className="rounded-md p-1.5 text-muted transition hover:bg-muted hover:text-signal-challenges"
                          aria-label="Remove backlog item"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                      <textarea
                        value={item.why}
                        onChange={(e) =>
                          setWorkspace((current) => ({
                            ...current,
                            backlog: current.backlog.map((b, i) =>
                              i === index ? { ...b, why: e.target.value } : b,
                            ),
                          }))
                        }
                        rows={2}
                        placeholder="Why this matters"
                        className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm leading-6 text-foreground/80 outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {workspace.backlog.map((item, index) => (
                    <article
                      key={`${item.feature}-${index}`}
                      className="rounded-md border border-card bg-input p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">
                          {item.feature}
                        </h3>
                        <span className="rounded-md bg-signal-neutral px-2 py-1 text-xs font-semibold text-signal-neutral">
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-foreground/80">
                        {item.why}
                      </p>
                    </article>
                  ))}
                </div>
              )}
              {isEditing && (
                <button
                  type="button"
                  onClick={() =>
                    setWorkspace((current) => ({
                      ...current,
                      backlog: [
                        ...current.backlog,
                        { feature: "", why: "", priority: "P1" as const },
                      ],
                    }))
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input py-2 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add backlog item
                </button>
              )}
            </Section>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title="Pricing hypothesis" icon={CircleDollarSign} collapsible sectionId="pricing-hypothesis" collapsed={collapsedSections.has("pricing-hypothesis")} onToggle={() => toggleSection("pricing-hypothesis")}>
                {isEditing ? (
                  <div className="space-y-3">
                    <EditableText
                      label="Pricing hypothesis"
                      value={workspace.pricing.hypothesis}
                      rows={4}
                      onCommit={(value) =>
                        setWorkspace((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            hypothesis: value || current.pricing.hypothesis,
                          },
                        }))
                      }
                    />
                    <EditableLines
                      label="Pricing tiers"
                      items={workspace.pricing.tiers}
                      onCommit={(items) =>
                        setWorkspace((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            tiers:
                              items.length > 0
                                ? items
                                : current.pricing.tiers,
                          },
                        }))
                      }
                    />
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-sm leading-6 text-foreground/80">
                      {workspace.pricing.hypothesis}
                    </p>
                    <BulletList items={workspace.pricing.tiers} />
                  </>
                )}
              </Section>

              <Section title="Launch plan" icon={Rocket} collapsible sectionId="launch-plan" collapsed={collapsedSections.has("launch-plan")} onToggle={() => toggleSection("launch-plan")}>
                {isEditing ? (
                  <EditableLines
                    label="Launch plan"
                    items={workspace.launchPlan}
                    onCommit={(items) => updateList("launchPlan", items)}
                  />
                ) : (
                  <BulletList items={workspace.launchPlan} />
                )}
              </Section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title="Assumptions to validate" icon={AlertTriangle} collapsible sectionId="assumptions-to-validate" collapsed={collapsedSections.has("assumptions-to-validate")} onToggle={() => toggleSection("assumptions-to-validate")}>
                {isEditing ? (
                  <div className="space-y-3">
                    <EditableLines
                      label="Assumptions"
                      items={workspace.assumptions}
                      onCommit={(items) => updateList("assumptions", items)}
                    />
                    <p className="text-xs leading-5 text-signal-challenges">
                      Editing assumptions here does not automatically update
                      validation experiments below. Regenerate the workspace
                      or add hypotheses manually in the validation loop.
                    </p>
                  </div>
                ) : (
                  <>
                    <BulletList items={workspace.assumptions} />
                    <p className="mt-4 text-xs leading-5 text-muted">
                      Assumptions remain anchored to the generated plan. Track
                      evidence, confidence, decisions, and linked work in the
                      validation loop above.
                    </p>
                  </>
                )}
              </Section>

              <Section title="Pricing risks" icon={AlertTriangle} collapsible sectionId="pricing-risks" collapsed={collapsedSections.has("pricing-risks")} onToggle={() => toggleSection("pricing-risks")}>
                {isEditing ? (
                  <EditableLines
                    label="Pricing risks"
                    items={workspace.pricing.risks}
                    onCommit={(items) =>
                      setWorkspace((current) => ({
                        ...current,
                        pricing: {
                          ...current.pricing,
                          risks:
                            items.length > 0 ? items : current.pricing.risks,
                        },
                      }))
                    }
                  />
                ) : (
                  <BulletList items={workspace.pricing.risks} />
                )}
              </Section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title="Content calendar" icon={CalendarDays} collapsible sectionId="content-calendar" collapsed={collapsedSections.has("content-calendar")} onToggle={() => toggleSection("content-calendar")}>
                {isEditing ? (
                  <div className="space-y-3">
                    {workspace.contentCalendar.map((item, index) => (
                      <div
                        key={`${item.channel}-${item.angle}-${index}`}
                        className="rounded-md border border-card bg-input p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.channel}
                            onChange={(e) =>
                              setWorkspace((current) => ({
                                ...current,
                                contentCalendar: current.contentCalendar.map((c, i) =>
                                  i === index ? { ...c, channel: e.target.value } : c,
                                ),
                              }))
                            }
                            placeholder="Channel"
                            className="flex-1 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-semibold text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                          />
                          <input
                            type="text"
                            value={item.cadence}
                            onChange={(e) =>
                              setWorkspace((current) => ({
                                ...current,
                                contentCalendar: current.contentCalendar.map((c, i) =>
                                  i === index ? { ...c, cadence: e.target.value } : c,
                                ),
                              }))
                            }
                            placeholder="Cadence"
                            className="w-24 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-signal-challenges outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setWorkspace((current) => ({
                                ...current,
                                contentCalendar: current.contentCalendar.filter((_, i) => i !== index),
                              }))
                            }
                            className="rounded-md p-1.5 text-muted transition hover:bg-muted hover:text-signal-challenges"
                            aria-label="Remove content item"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                        <textarea
                          value={item.angle}
                          onChange={(e) =>
                            setWorkspace((current) => ({
                              ...current,
                              contentCalendar: current.contentCalendar.map((c, i) =>
                                i === index ? { ...c, angle: e.target.value } : c,
                              ),
                            }))
                          }
                          rows={2}
                          placeholder="Content angle or hook"
                          className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm leading-6 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setWorkspace((current) => ({
                          ...current,
                          contentCalendar: [
                            ...current.contentCalendar,
                            { channel: "", angle: "", cadence: "Weekly" },
                          ],
                        }))
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input py-2 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      Add content item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workspace.contentCalendar.map((item, index) => (
                      <article
                        key={`${item.channel}-${item.angle}-${index}`}
                        className="rounded-md border border-card bg-input p-4"
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-foreground">
                            {item.channel}
                          </h3>
                          <span className="text-xs font-medium text-signal-challenges">
                            {item.cadence}
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-foreground/80">
                          {item.angle}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </Section>

              <Section
                title={
                  <div className="flex items-center gap-2">
                    <span>Execution tasks</span>
                    <span className="text-xs font-normal text-muted">
                      {workspace.tasks.filter((t) => t.completed).length}/{workspace.tasks.length} completed
                    </span>
                  </div>
                }
                icon={CheckCircle2}
                collapsible sectionId="execution-tasks" collapsed={collapsedSections.has("execution-tasks")} onToggle={() => toggleSection("execution-tasks")}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    {workspace.tasks.map((task, index) => (
                      <div
                        key={`${task.title}-${task.due}-${index}`}
                        className="rounded-md border border-card bg-input p-4 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) =>
                              setWorkspace((current) => ({
                                ...current,
                                tasks: current.tasks.map((t, i) =>
                                  i === index ? { ...t, title: e.target.value } : t,
                                ),
                              }))
                            }
                            placeholder="Task title"
                            className="flex-1 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-semibold text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setWorkspace((current) => ({
                                ...current,
                                tasks: current.tasks.filter((_, i) => i !== index),
                              }))
                            }
                            className="rounded-md p-1.5 text-muted transition hover:bg-muted hover:text-signal-challenges"
                            aria-label="Remove task"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={task.owner}
                            onChange={(e) =>
                              setWorkspace((current) => ({
                                ...current,
                                tasks: current.tasks.map((t, i) =>
                                  i === index ? { ...t, owner: e.target.value } : t,
                                ),
                              }))
                            }
                            placeholder="Owner"
                            className="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                          />
                          <input
                            type="text"
                            value={task.due}
                            onChange={(e) =>
                              setWorkspace((current) => ({
                                ...current,
                                tasks: current.tasks.map((t, i) =>
                                  i === index ? { ...t, due: e.target.value } : t,
                                ),
                              }))
                            }
                            placeholder="Due"
                            className="rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-signal-supports outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                          />
                        </div>
                        <input
                          type="text"
                          value={task.outcome}
                          onChange={(e) =>
                            setWorkspace((current) => ({
                              ...current,
                              tasks: current.tasks.map((t, i) =>
                                i === index ? { ...t, outcome: e.target.value } : t,
                              ),
                            }))
                          }
                          placeholder="Outcome"
                          className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground/80 outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setWorkspace((current) => ({
                          ...current,
                          tasks: [
                            ...current.tasks,
                            { title: "", owner: "", due: "Week 1", outcome: "" },
                          ],
                        }))
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input py-2 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      Add task
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workspace.tasks.map((task, index) => (
                      <article
                        key={`${task.title}-${task.due}-${index}`}
                        className={`rounded-md border border-card bg-input p-4 transition ${
                          task.completed ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setWorkspace((current) => ({
                                ...current,
                                tasks: current.tasks.map((t, i) =>
                                  i === index ? { ...t, completed: !t.completed } : t,
                                ),
                              }))
                            }
                            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded transition ${
                              task.completed
                                ? "bg-accent text-white"
                                : "border-2 border-muted text-transparent hover:border-accent"
                            }`}
                            aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                          >
                            <CheckCircle2 className="size-3" aria-hidden="true" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h3 className={`text-sm font-semibold ${
                                task.completed ? "text-foreground/60 line-through" : "text-foreground"
                              }`}>
                                {task.title}
                              </h3>
                              <span className="rounded-md bg-signal-supports px-2 py-1 text-xs font-medium text-signal-supports">
                                {task.due}
                              </span>
                            </div>
                            <p className={`text-sm leading-6 ${task.completed ? "text-foreground/50" : "text-foreground/80"}`}>
                              {task.owner} owns {task.outcome}.
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>
      </div>
    </main>
        {importPreview && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-12"
          >
            <button
              type="button"
              aria-label="Cancel import"
              onClick={cancelImport}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div
              className="relative w-full max-w-md overflow-hidden rounded-xl border border-card bg-card shadow-2xl"
              style={{ animation: "fadeInDown 200ms ease-out both" }}
            >
              <div className="border-b border-input px-6 py-4">
                <h3 id="import-dialog-title" className="text-lg font-semibold text-foreground">
                  Import workspace
                </h3>
              </div>
              <div className="space-y-4 px-6 py-4">
                <p className="text-sm text-foreground/80">
                  This will replace your current workspace and validation state.
                  This cannot be undone.
                </p>
                <div className="rounded-md bg-muted p-3 text-xs text-muted">
                  <p className="font-medium text-foreground/70">Summary</p>
                  <p className="mt-1 line-clamp-3">
                    {importPreview.workspace.summary}
                  </p>
                </div>
                {importPreview.execution && (
                  <p className="text-xs text-signal-supports">
                    Includes validation state with{" "}
                    {importPreview.execution.experiments.length} experiments.
                  </p>
                )}
                {importPreview.warnings.length > 0 && (
                  <div className="rounded-md border border-signal-challenges bg-signal-challenges/5 p-3 text-xs text-signal-challenges">
                    <p className="font-semibold">
                      {importPreview.warnings.length} warning
                      {importPreview.warnings.length === 1 ? "" : "s"}:
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {importPreview.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t border-input px-6 py-4 sm:justify-end">
                <button
                  type="button"
                  onClick={cancelImport}
                  className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyImport}
                  className="flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  Import
                </button>
              </div>
            </div>
          </div>
        )}

        <CommandPalette
          actions={useWorkspaceCommands({
            workspace,
            execution,
            onNavigate: navigateToSection,
            onToggleEdit: () => setIsEditing(!isEditing),
            onGenerate: generate,
            onSave: () => showToast("Saved locally", "success"),
            onReset: resetLocalWorkspace,
            onCopyMarkdown: copyMarkdown,
          })}
        />
      </>
  );
}


