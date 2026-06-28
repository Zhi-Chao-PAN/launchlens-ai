"use client";

import {
  AlertTriangle,
  Upload,
  ArrowRight,
  BarChart3,
  X,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  ClipboardPaste,
  Compass,
  Copy,
  Download,
  Braces,
  Eye,
  ExternalLink,
  FileText,
  FlaskConical,
  Gauge,
  History,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Megaphone,
  PencilLine,
  Plus,
  RotateCcw,
  Rocket,
  ChevronDown,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { formatShortcut, useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useSrAnnounce } from "@/hooks/use-sr-announce";

import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { EditableText } from "./editable-text";
import { EditableLines } from "./editable-lines";
import { CloudWorkspaces } from "@/components/cloud-workspaces";
import { SystemStatus } from "@/components/system-status";
import { ReplayTourButton } from "@/components/onboarding-wizard";
import { useToast } from "@/components/toast";
import { DecisionCopilot } from "@/components/decision-copilot";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { ShortcutsHelp } from "@/components/shortcuts-help";
import { useWorkspaceCommands } from "@/hooks/use-workspace-commands";
import { ValidationBoard } from "@/components/validation-board";
import { copyTextToClipboard, downloadTextFile } from "@/lib/launchlens/clipboard";
import { safeMarkdownFilename, workspaceToMarkdown } from "@/lib/launchlens/markdown-export";
import { SCHEMA_VERSION, workspaceFromJson, workspaceToJson, type WorkspaceImportResult } from "@/lib/launchlens/json-export";
import { briefFromFile, briefFromJson, type BriefImportResult } from "@/lib/launchlens/brief-from-json";
import { briefFromHashFragment } from "@/lib/launchlens/brief-fragment";
import { getOrCreateOwnerToken } from "@/lib/launchlens/owner-token";
import { decryptToJson, encryptJson, isEncryptedPayload, randomPassword } from "@/lib/launchlens/encrypt-export";
import type { CloudWorkspaceRecord } from "@/lib/launchlens/cloud-workspace";
import {
  createExecutionState,
  evaluateExecutionProgress,
  normalizeExecutionState,
  type WorkspaceExecutionState,
} from "@/lib/launchlens/execution";
import type { ExampleWorkspace } from "@/lib/launchlens/example-workspaces";
import { formatGeneratedTime } from "@/lib/launchlens/generated-time";
import { formatGenerationModeLabel } from "@/lib/launchlens/generation-mode-label";
import { formatProviderLabel } from "@/lib/launchlens/provider-label";
import { formatSaveLabel } from "@/lib/launchlens/save-label";
import { Bullets } from "@/components/bullets";
import { clearIfStill, FLASH_STATE_DURATION_MS } from "@/lib/launchlens/flash-state";
import { evaluateWorkspaceQuality } from "@/lib/launchlens/workspace-quality";
import { friendlyApiMessage } from "@/lib/launchlens/api-errors";
import type {
  GenerationResult,
  LaunchLensInput,
  LaunchLensWorkspace,
  LaunchLensWorkspaceSourceBrief,
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

type PendingBriefImport = {
  previousInput: LaunchLensInput;
  previousSourceBrief: LaunchLensWorkspaceSourceBrief | null;
};

const tones = [
  "Practical, crisp, and founder-friendly",
  "Analytical and investor-ready",
  "Warm and community-led",
  "Technical and product-led",
];

const LOCAL_WORKSPACE_KEY = "launchlens.currentWorkspace.v1";
const COLLAPSED_SECTIONS_KEY = "launchlens:collapsed-sections";

function formatSourceScore(label: string, value: number | null) {
  return `${label} ${typeof value === "number" ? Math.round(value) : "n/a"}`;
}

type LocalWorkspaceSnapshot = {
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
  execution: WorkspaceExecutionState;
  savedAt: string;
  schemaVersion: number;
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

  // v0 -> v1 migration: add completed=false to tasks without the field
  // (runs idempotently - spread preserves existing completed values)
  const ws = value.workspace as Record<string, unknown> | undefined;
  if (ws && Array.isArray(ws.tasks)) {
    ws.tasks = ws.tasks.map((t) => ({
      completed: false,
      ...t,
    }));
  }

  const parsedSchemaVersion = typeof value.schemaVersion === "number" ? value.schemaVersion : 0;

  return execution
    ? {
        input: value.input,
        workspace: value.workspace,
        execution,
        savedAt: value.savedAt,
        schemaVersion: parsedSchemaVersion,
      }
    : null;
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
    <section className="overflow-hidden rounded-md border border-card bg-card shadow-[0_18px_70px_-62px_rgba(17,19,18,0.45)]">
      {collapsible ? (
        <button
          type="button"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex w-full items-center gap-2 p-5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        >
          <span className="flex size-8 items-center justify-center rounded-md border border-input bg-input text-foreground/75">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <h2 className="flex-1 text-base font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
          <ChevronDown
            className={`size-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex items-center gap-2 p-5 pb-0">
          <span className="flex size-8 items-center justify-center rounded-md border border-input bg-input text-foreground/75">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
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


function BulletList({ items }: { items: string[] }) {
  return <Bullets items={items} />;
}

type WorkspaceMetricTone = "primary" | "support" | "neutral" | "risk" | "plain";

const metricToneClass: Record<WorkspaceMetricTone, string> = {
  primary: "border-card bg-card text-accent before:bg-accent",
  support: "border-card bg-card text-signal-supports before:bg-signal-supports",
  neutral: "border-card bg-card text-signal-neutral before:bg-signal-neutral",
  risk: "border-card bg-card text-signal-challenges before:bg-signal-challenges",
  plain: "border-card bg-card text-foreground before:bg-input",
};

function WorkspaceMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "plain",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: WorkspaceMetricTone;
}) {
  return (
    <article
      className={[
        "relative min-h-[118px] overflow-hidden rounded-md border p-4 shadow-[0_24px_80px_-64px_rgba(17,19,18,0.5)] before:absolute before:inset-x-0 before:top-0 before:h-0.5",
        metricToneClass[tone],
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/55">
          {label}
        </p>
        <span className="flex size-7 items-center justify-center rounded-md border border-input bg-input/60">
          <Icon className="size-3.5 text-current" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 break-words font-mono text-xl font-semibold leading-7 tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </article>
  );
}

function WorkspaceNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <a
      href={href}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-transparent px-3 text-sm font-medium text-white/68 transition hover:border-white/12 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </a>
  );
}

function EncryptedImportDialog({
  fileName,
  error,
  busy,
  onSubmit,
  onCancel,
}: {
  fileName: string;
  error: string | null;
  busy: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const errorId = useId();

  useEffect(() => {
    cancelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (!busy && submitRef.current) submitRef.current.click();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel, busy]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="w-full max-w-md rounded-md bg-card p-5 shadow-xl ring-1 ring-black/5"
      >
        <h3 id={titleId} className="text-base font-semibold text-foreground">
          Enter passphrase
        </h3>
        <p id={bodyId} className="mt-2 text-sm leading-6 text-muted">
          <span className="font-mono text-xs text-foreground/80">{fileName}</span>{" "}
          is password-protected. Type the passphrase you used when exporting.
        </p>
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (password && !busy) onSubmit(password);
          }}
        >
          <label className="block">
            <span className="sr-only">Passphrase</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                spellCheck={false}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? errorId : undefined}
                placeholder="Passphrase"
                className="h-10 w-full rounded-md border border-input bg-input px-3 pr-20 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 inline-flex h-8 -translate-y-1/2 items-center rounded px-2 text-[10px] font-semibold uppercase text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          {error && (
            <p id={errorId} role="alert" className="text-xs text-signal-challenges">
              {error}
            </p>
          )}
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex h-9 items-center rounded-md border border-input bg-input px-3 text-sm font-medium text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              ref={submitRef}
              type="submit"
              disabled={busy || !password}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-text transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-1 disabled:opacity-60"
            >
              {busy ? "Decrypting..." : "Decrypt & preview"}
            </button>
          </div>
          <p className="sr-only">
            Press Control or Command Enter to submit.
          </p>
        </form>
      </div>
    </div>
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
  const [briefSource, setBriefSource] =
    useState<LaunchLensWorkspaceSourceBrief | null>(
      initialWorkspace.sourceBrief ?? null,
    );
  const [isGenerating, setIsGenerating] = useState(false);
  const generateAbortRef = useRef<AbortController | null>(null);
  const briefHashProcessedRef = useRef<string | null>(null);
  // An imported brief changes the five input fields without regenerating the
  // workspace. Keep the previous input so the user can genuinely discard the
  // pending import instead of only hiding the warning.
  const [pendingBriefImport, setPendingBriefImport] =
    useState<PendingBriefImport | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  // mounted gate for client-only UI (language switcher) to avoid SSR/CSR
  // hydration mismatch — the server renders the default-locale placeholder.
  const [mounted, setMounted] = useState(false);
  const { t } = useLocale();

  // R255: live provider (MiniMax) requires a per-browser owner token via the
  // x-launchlens-owner header — the /api/generate route hashes it before
  // metering live-provider usage. Without a token, live mode rejects the call
  // with invalid_owner_token. Cloud-workspaces and billing panels already
  // mint tokens via getOrCreateOwnerToken, but the main brief builder did
  // not. Read from localStorage, otherwise mint and persist.
  const OWNER_TOKEN_STORAGE_KEY = "launchlens.ownerToken";
  const [ownerToken, setOwnerToken] = useState<string>("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOwnerToken(
        getOrCreateOwnerToken(
          window.localStorage,
          OWNER_TOKEN_STORAGE_KEY,
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Load collapsed section state from localStorage on mount
  useEffect(() => {
    // mounted gate for client-only UI (language switcher); this is a
    // deliberate post-hydration flag, not a derived-state cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
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
  const [exportEncrypted, setExportEncrypted] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [importPreview, setImportPreview] = useState<WorkspaceImportResult | null>(null);
  const [pendingEncrypted, setPendingEncrypted] = useState<{ text: string; fileName: string } | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [briefImportPreview, setBriefImportPreview] = useState<BriefImportResult | null>(null);
  // R252: paste-JSON entry point. When the user picks "Paste JSON" in the brief
  // import chooser, we open a small dialog with a textarea instead of the file
  // picker. This is the single-point-of-failure fallback for when the URL hash
  // handoff is blocked (popup blocked, URL too long) — the user can always paste
  // the envelope they copied from Research Studio.
  const [briefPasteOpen, setBriefPasteOpen] = useState(false);
  const [briefPasteText, setBriefPasteText] = useState("");
  const briefFileInputRef = useRef<HTMLInputElement>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const switchTimerRef = useRef<number | null>(null);
  const { showToast } = useToast();

  const applyBriefImportResult = useCallback(
    (
      result: BriefImportResult,
      options: { successMessage?: string; focus?: boolean } = {},
    ) => {
      const { input: nextInput, warnings, source } = result;
      // R254: when the brief's tone is Research Studio's non-researched default
      // (flagged via toneIsDefault), preserve the user's existing tone instead
      // of overwriting it. The other four fields are always taken from the
      // brief — only tone, which Research Studio can't actually research, is
      // kept user-authored.
      const mergedInput =
        result.toneIsDefault
          ? { ...nextInput, tone: input.tone }
          : nextInput;
      setPendingBriefImport((current) =>
        current ?? {
          previousInput: input,
          previousSourceBrief: briefSource,
        },
      );
      setInput(mergedInput);
      setBriefSource(result.sourceBrief ?? null);
      setError("");
      setFallbackNotice("");
      const label =
        source === "research-studio" ? t("toast.label.researchStudioBrief", "Research Studio brief") : t("toast.label.brief", "brief");
      if (warnings.length > 0) {
        showToast(
          t("toast.briefLoadedWarn", { label, count: warnings.length }),
          "info",
        );
      } else {
        showToast(
          options.successMessage ?? t("toast.briefLoaded", { label }),
          "success",
        );
      }

      if (options.focus !== false) {
        const ideaField = document.getElementById("founder-brief-idea");
        if (ideaField) ideaField.focus();
      }
    },
    [
      briefSource,
      input,
      setError,
      setFallbackNotice,
      setPendingBriefImport,
      showToast,
      t,
    ],
  );

  useEffect(() => {
    if (briefHashProcessedRef.current || typeof window === "undefined") {
      return;
    }

    const hash = window.location.hash;
    if (!hash.startsWith("#brief=")) {
      return;
    }

    try {
      const result = briefFromHashFragment(hash);
      if (!result) {
        throw new Error("Missing brief payload.");
      }
      // Mark the hash as valid before the local-storage restore effect runs.
      // Otherwise its queued restore can overwrite the freshly imported fields.
      briefHashProcessedRef.current = hash;
      window.setTimeout(() => {
        applyBriefImportResult(result, {
          successMessage: t("toast.briefFromHash"),
        });
        // R253: acknowledge the handoff to the opening tab (research-studio's
        // "Send to LaunchLens AI" window.open). The opener arms a one-shot
        // message listener expecting {type:"launchlens:brief-applied"} so it
        // can toast a meaningful "applied" instead of a generic "opened".
        // Guarded: only postMessage when an opener exists, and we don't care
        // if the message never arrives (older research-studio builds don't
        // listen) — this is purely a best-effort confirmation.
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(
              { type: "launchlens:brief-applied" },
              "*",
            );
          } catch {
            // Cross-origin opener may throw on postMessage in some browsers;
            // swallow — the import already succeeded on our side.
          }
        }
      }, 0);
    } catch {
      showToast(
        t("toast.briefLinkError"),
        "error",
      );
    } finally {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, [applyBriefImportResult, showToast, t]);

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

  const providerLabel = useMemo(
    () => formatProviderLabel(workspace.provider),
    [workspace.provider],
  );

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
    return formatSaveLabel({ isStorageReady, savedAt });
  }, [isStorageReady, savedAt, nowTick]);


  const generationModeLabel = formatGenerationModeLabel({
    mode: generationMeta.mode,
    usedFallback: generationMeta.usedFallback,
  });
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
  
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
        const hasExplicitBriefHandoff = Boolean(
          briefHashProcessedRef.current,
        );
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
            setWorkspace(snapshot.workspace);
            setExecution(snapshot.execution);
            if (hasExplicitBriefHandoff) {
              // Keep the imported fields/source, but restore the user's prior
              // generated workspace and retain its input for a real discard.
              setPendingBriefImport({
                previousInput: snapshot.input,
                previousSourceBrief: snapshot.workspace.sourceBrief ?? null,
              });
            } else {
              setInput(snapshot.input);
              setBriefSource(snapshot.workspace.sourceBrief ?? null);
              setPendingBriefImport(null);
            }
            setGenerationMeta({
              mode: snapshot.workspace.provider === "mock" ? "demo" : "real",
              provider: snapshot.workspace.provider,
              generatedAt: snapshot.workspace.generatedAt,
              usedFallback: false,
            });
            if (!hasExplicitBriefHandoff) {
              showToast(
                "Local workspace restored from browser storage.",
                "success",
              );
            }
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
        schemaVersion: SCHEMA_VERSION,
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
      setBriefSource(null);
      setPendingBriefImport(null);
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
      // Move keyboard/screen-reader focus to the validation board so AT
      // users land on the generated workspace without an extra tab sequence.
      window.requestAnimationFrame(() => {
        const board = document.getElementById("validation-board");
        if (board) {
          board.setAttribute("tabindex", "-1");
          board.focus({ preventScroll: false });
          board.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          const main = document.getElementById("workspace-main");
          if (main) main.focus?.({ preventScroll: false });
        }
      });
      requestAnimationFrame(() => {
        const el = document.getElementById("workspace-main");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          (el as HTMLElement).focus?.();
        }
      });
    });
    showToast("Example workspace loaded.", "success");
  }

  function resetLocalWorkspace() {
    switchWorkspace(() => {
      setInput(initialInput);
      setWorkspace(initialWorkspace);
      setExecution(initialExecution);
      setBriefSource(initialWorkspace.sourceBrief ?? null);
      setPendingBriefImport(null);
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
      // Move keyboard/screen-reader focus to the validation board so AT
      // users land on the generated workspace without an extra tab sequence.
      window.requestAnimationFrame(() => {
        const board = document.getElementById("validation-board");
        if (board) {
          board.setAttribute("tabindex", "-1");
          board.focus({ preventScroll: false });
          board.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          const main = document.getElementById("workspace-main");
          if (main) main.focus?.({ preventScroll: false });
        }
      });
    });
    showToast("Workspace reset to starter example.", "success");
  }

  function restoreCloudWorkspace(record: CloudWorkspaceRecord) {
    switchWorkspace(() => {
      setInput(record.input);
      setWorkspace(record.workspace);
      setExecution(record.execution);
      setBriefSource(record.workspace.sourceBrief ?? null);
      setPendingBriefImport(null);
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
      // Move keyboard/screen-reader focus to the validation board so AT
      // users land on the generated workspace without an extra tab sequence.
      window.requestAnimationFrame(() => {
        const board = document.getElementById("validation-board");
        if (board) {
          board.setAttribute("tabindex", "-1");
          board.focus({ preventScroll: false });
          board.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          const main = document.getElementById("workspace-main");
          if (main) main.focus?.({ preventScroll: false });
        }
      });
    });
    showToast("Cloud snapshot restored successfully.", "success");
  }

  const ideaTrimmed = input.idea.trim();
  // R255: gate Generate on owner token readiness so users never see a raw
  // "invalid_owner_token" 401 from /api/generate. The mount effect that
  // mints the token runs synchronously in setState on first render, so
  // token arrives by the time the user clicks — but a guarded disabled
  // state prevents the visible red error if anything ever delays it.
  const canGenerate = ideaTrimmed.length >= 20 && !isGenerating && ownerToken.length > 0;
  const generateBlockedReason =
    ideaTrimmed.length < 20
      ? t("generate.blockedTooShort")
      : isGenerating
        ? t("generate.blockedAlready")
: ownerToken.length === 0
            ? t("generate.blockedOwnerToken")
            : "";
  // Localized loading-step labels for the generation loading UI.
  const loadingStepLabels = [t("generate.step.brief"), t("generate.step.structure"), t("generate.step.tasks")];

  function updateInput(mutator: Parameters<typeof setInput>[0]) { setInput(mutator); if (error) setError(""); if (fallbackNotice) setFallbackNotice(""); }

  async function generate() {
    const abort = new AbortController();
    generateAbortRef.current?.abort();
    generateAbortRef.current = abort;
    setIsGenerating(true);
    setError("");
    setFallbackNotice("");
    setExportText("");
    setSrAnnouncement(t("sr.generating"));

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        // R255: send the per-browser owner token so /api/generate can hash it
        // and meter live-provider usage. Without this header the live provider
        // path (MiniMax) rejects with invalid_owner_token. Falls back to an
        // empty header in the (very narrow) window before the mount effect
        // mints a token — the server treats empty as invalid, so the call
        // surfaces an actionable error instead of silently bypassing metering.
        headers: {
          "Content-Type": "application/json",
          ...(ownerToken ? { "x-launchlens-owner": ownerToken } : {}),
        },
        body: JSON.stringify(
          briefSource ? { input, sourceBrief: briefSource } : input,
        ),
        signal: abort.signal,
      });
      const data = (await response.json()) as Partial<GenerationResult> & {
        error?: string;
        code?: string;
      };

      if (!response.ok || data.error || !data.workspace) {
        const fallback =
          response.status === 429
            ? t("fallback.tooManyRequests")
            : t("fallback.generationFailed");
        const message = friendlyApiMessage(data.code, data.error ?? fallback);
        const err = new Error(message);
        (err as Error & { status?: number }).status = response.status;
        throw err;
      }

      setWorkspace(data.workspace);
      setBriefSource(data.workspace.sourceBrief ?? briefSource ?? null);
      setPendingBriefImport(null);
      const freshExecution = createExecutionState(data.workspace);
      setExecution(freshExecution);
      setSrAnnouncement(
        t("sr.ready", { segments: data.workspace.targetUsers.length, tasks: data.workspace.tasks.length, hypotheses: freshExecution.experiments.length }),
      );
      setGenerationMeta({
        mode: data.mode ?? "demo",
        provider: data.workspace.provider,
        generatedAt: data.workspace.generatedAt,
        usedFallback: Boolean(data.usedFallback),
        fallbackReason: data.fallbackReason,
      });

      if (data.usedFallback) {
        showToast(t("toast.demoFallback"), "info");
        setFallbackNotice(t("fallback.demoNotice"));
      } else {
        setFallbackNotice("");
      }
      setIsBriefOpen(false);
      // Move keyboard/screen-reader focus to the validation board so AT
      // users land on the generated workspace without an extra tab sequence.
      window.requestAnimationFrame(() => {
        const board = document.getElementById("validation-board");
        if (board) {
          board.setAttribute("tabindex", "-1");
          board.focus({ preventScroll: false });
          board.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          const main = document.getElementById("workspace-main");
          if (main) main.focus?.({ preventScroll: false });
        }
      });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setFallbackNotice("");
        setSrAnnouncement(t("sr.cancelled"));
      } else {
        const msg =
          caught instanceof Error
            ? caught.message
            : t("sr.fallbackError");
        setError(msg);
        setSrAnnouncement(t("sr.generationFailed", { msg }));
      }
    } finally {
      setIsGenerating(false);
      if (generateAbortRef.current === abort) generateAbortRef.current = null;
    }
  }


  useEffect(() => {
    if (!isGenerating) return;
    const onEscape = () => { generateAbortRef.current?.abort(); };
    window.addEventListener("launchlens:escape", onEscape);
    return () => window.removeEventListener("launchlens:escape", onEscape);
  }, [isGenerating]);

  function flashCopySuccess(kind: "markdown" | "json") {
    setCopyJustSucceeded(kind);
    window.setTimeout(() => {
      setCopyJustSucceeded((current) => clearIfStill(current, kind));
    }, FLASH_STATE_DURATION_MS);
  }

  async function copyMarkdown() {
    const markdown = workspaceToMarkdown(workspace, execution);
    let outText = markdown;
    let mime = "text/markdown;charset=utf-8";
    let label = "Markdown";
    if (exportEncrypted && exportPassword.trim()) {
      outText = await encryptJson(markdown, exportPassword.trim());
      label = "Encrypted Markdown";
      mime = "text/plain;charset=utf-8";
    }
    setExportText(outText);
    setExportFormat("markdown");

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(outText);
        showToast(exportEncrypted ? `${label} copied (password not stored)` : `${label} copied to clipboard`, "success");
        flashCopySuccess("markdown");
    setSrAnnouncement("Markdown exported and copied to clipboard.");
        return;
      } catch {
        // fall through to sync path
      }
    }
    if (await copyTextToClipboard(outText)) {
      showToast(exportEncrypted ? `${label} copied (password not stored)` : `${label} copied to clipboard`, "success");
      flashCopySuccess("markdown");
      return;
    }
    // Last-resort: download the file directly instead of making the user
    // manually select from the textarea.
    const filename = safeMarkdownFilename({
      projectName: null,
      landingPage: { headline: workspace.landingPage.headline },
    });
    downloadTextFile(filename, outText, mime);
    showToast(exportEncrypted ? `Clipboard unavailable - downloaded ${label} file instead` : "Clipboard unavailable - downloaded Markdown file instead", "info");
  }

  async function copyJson() {
    const json = workspaceToJson(workspace, execution);
    let outText = json;
    let mime = "application/json;charset=utf-8";
    let label = "JSON";
    if (exportEncrypted && exportPassword.trim()) {
      outText = await encryptJson(json, exportPassword.trim());
      label = "Encrypted JSON";
      mime = "text/plain;charset=utf-8";
    }
    setExportText(outText);
    setExportFormat("json");

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(outText);
        showToast(exportEncrypted ? `${label} copied (password not stored)` : `${label} copied to clipboard`, "success");
        flashCopySuccess("json");
    setSrAnnouncement("JSON exported and copied to clipboard.");
        return;
      } catch {
        // fall through to sync path
      }
    }
    if (await copyTextToClipboard(outText)) {
      showToast(exportEncrypted ? `${label} copied (password not stored)` : `${label} copied to clipboard`, "success");
      flashCopySuccess("json");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      exportEncrypted ? `launchlens-workspace-${stamp}.launchlens.enc` : `launchlens-workspace-${stamp}.json`,
      outText,
      mime,
    );
    showToast(exportEncrypted ? `Clipboard unavailable - downloaded ${label} file instead` : "Clipboard unavailable - downloaded JSON file instead", "info");
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

  async function downloadMarkdownFile() {
    const markdown = workspaceToMarkdown(workspace, execution);
    let outText = markdown;
    let filename = safeMarkdownFilename({
      landingPage: { headline: workspace.landingPage.headline },
    });
    let mime = "text/markdown;charset=utf-8";
    if (exportEncrypted && exportPassword.trim()) {
      outText = await encryptJson(markdown, exportPassword.trim());
      filename = filename.replace(/\.md$/, ".launchlens.enc.md");
      mime = "text/plain;charset=utf-8";
    }
    if (downloadTextFile(filename, outText, mime)) {
      showToast(exportEncrypted ? "Encrypted Markdown downloaded. Password not stored - remember it!" : "Markdown file downloaded", "success");
    }
  }

  async function downloadJsonFile() {
    const json = workspaceToJson(workspace, execution);
    const stamp = new Date().toISOString().slice(0, 10);
    let outText = json;
    let filename = `launchlens-workspace-${stamp}.json`;
    let mime = "application/json;charset=utf-8";
    if (exportEncrypted && exportPassword.trim()) {
      outText = await encryptJson(json, exportPassword.trim());
      filename = `launchlens-workspace-${stamp}.launchlens.enc`;
      mime = "text/plain;charset=utf-8";
    }
    if (downloadTextFile(filename, outText, mime)) {
      showToast(
        exportEncrypted
          ? "Encrypted file downloaded. Password not stored - remember it!"
          : "JSON file downloaded",
        "success",
      );
    }
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      if (isEncryptedPayload(text)) {
        // Show in-app passphrase dialog instead of window.prompt.
        setPendingEncrypted({ text, fileName: file.name });
        setDecryptError(null);
        return;
      }
      parseAndPreviewImport(text);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown import error";
      showToast(`Import failed: ${msg}`, "error");
    }
  }

  async function submitEncryptedImport(password: string) {
    if (!pendingEncrypted) return;
    setDecrypting(true);
    setDecryptError(null);
    try {
      const plain = await decryptToJson(pendingEncrypted.text, password);
      setPendingEncrypted(null);
      parseAndPreviewImport(plain);
    } catch {
      setDecryptError("Decryption failed - check your passphrase.");
    } finally {
      setDecrypting(false);
    }
  }

  function cancelEncryptedImport() {
    setPendingEncrypted(null);
    setDecryptError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function parseAndPreviewImport(text: string) {
    try {
      const result = workspaceFromJson(text);
      setImportPreview(result);
      showToast("File parsed successfully - review and confirm", "info");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown import error";
      showToast(`Import failed: ${msg}`, "error");
    }
  }

  function applyImport() {
    if (!importPreview) return;
    setWorkspace(importPreview.workspace);
    setBriefSource(importPreview.workspace.sourceBrief ?? null);
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

  // --- Import a Research Studio brief (sets `input`, leaves workspace alone so
  //     the user reviews and clicks Generate). Mirrors the workspace import
  //     flow but targets the brief fields instead of the generated workspace. ---
  async function handleBriefImportFile(file: File) {
    try {
      const result = await briefFromFile(file);
      setBriefImportPreview(result);
      showToast("Brief parsed - review and confirm", "info");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown import error";
      showToast(`Brief import failed: ${msg}`, "error");
    } finally {
      if (briefFileInputRef.current) briefFileInputRef.current.value = "";
    }
  }

  function applyBriefImport() {
    if (!briefImportPreview) return;
    applyBriefImportResult(briefImportPreview);
    setBriefImportPreview(null);
  }

  function cancelBriefImport() {
    setBriefImportPreview(null);
    if (briefFileInputRef.current) briefFileInputRef.current.value = "";
  }

  function triggerBriefImport() {
    briefFileInputRef.current?.click();
  }

  // R252: open the paste-JSON dialog. The user pastes a Research Studio brief
  // envelope (or any LaunchLensInput JSON) into a textarea; we parse it with the
  // same briefFromJson the file and hash paths use, then route through the same
  // preview-and-confirm flow so all three entry points are identical downstream.
  function openBriefPaste() {
    setBriefPasteText("");
    setBriefPasteOpen(true);
  }

  function cancelBriefPaste() {
    setBriefPasteOpen(false);
    setBriefPasteText("");
  }

  function applyBriefPaste() {
    const text = briefPasteText.trim();
    if (!text) {
      showToast(t("briefDialog.pasteEmpty"), "error");
      return;
    }
    try {
      const result = briefFromJson(text);
      setBriefPasteOpen(false);
      setBriefPasteText("");
      setBriefImportPreview(result);
      showToast(t("briefDialog.pasteParsed"), "info");
    } catch (error) {
      const msg =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "Invalid JSON";
      showToast(t("briefDialog.pasteError", { msg }), "error");
    }
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

  const qualityPassed = qualityResult.checks.filter((check) => check.passed).length;
  const completedTasks = workspace.tasks.filter((task) => task.completed).length;
  const qualityTone: WorkspaceMetricTone =
    qualityResult.score >= 90 ? "support" : qualityResult.score >= 70 ? "neutral" : "risk";
  const validationTone: WorkspaceMetricTone =
    executionProgress.score >= 70 ? "support" : executionProgress.score >= 30 ? "neutral" : "risk";

  return (
    <>
    <div
      id="founder-generate-status"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
    >
      {srAnnouncement}
    </div>
    <main
      id="main-content"
      aria-busy={isGenerating || isSwitching}
      className={[
        "min-h-screen bg-background text-foreground",
        "animate-[fadeInDown_280ms_ease-out_both] motion-reduce:animate-none",
        isSwitching ? "opacity-40 pointer-events-none transition-opacity duration-150 ease-out motion-reduce:transition-none" : "transition-opacity duration-200 ease-out motion-reduce:transition-none",
      ].join(" ")}
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-4 py-4 pb-20 sm:px-6 sm:py-5 sm:pb-8 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#111312] px-4 py-3 text-white shadow-[0_18px_70px_-44px_rgba(17,19,18,0.88)] backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1480px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-[#111312]">
                <Compass className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  {t("header.brand")}
                </p>
                <h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
                  {t("header.title")}
                </h1>
              </div>
              <span className="hidden rounded-md border border-white/10 bg-white/[0.08] px-2.5 py-1 text-xs font-semibold text-white/70 md:inline-flex">
                {t("header.badge")}
              </span>
            </div>

            <nav
              aria-label={t("header.navAria")}
              className="grid grid-cols-3 gap-1 rounded-md border border-white/10 bg-white/[0.06] p-1 sm:flex sm:overflow-x-auto"
            >
              <WorkspaceNavLink href="#founder-brief" label={t("nav.brief")} icon={Sparkles} />
              <WorkspaceNavLink href="#cloud-workspaces-section" label={t("nav.history")} icon={History} />
              <WorkspaceNavLink href="#workspace-main" label={t("nav.evidence")} icon={BarChart3} />
              <WorkspaceNavLink href="#decision-copilot-section" label={t("nav.decisions")} icon={Workflow} />
              <WorkspaceNavLink href="/billing" label={t("nav.account")} icon={CircleDollarSign} />
              <WorkspaceNavLink href="/readiness" label={t("nav.readiness")} icon={ShieldCheck} />
            </nav>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm sm:pb-0 xl:justify-end">
              <span className={`hidden items-center gap-2 rounded-md border border-white/10 bg-white/[0.08] px-3 py-2 text-white/70 transition-colors sm:flex ${saveFlash ? "border-accent bg-accent/20 text-white" : ""}`}>
                <Save className="size-4 text-accent" aria-hidden="true" />
                {saveLabel}
              </span>
              <button
                type="button"
                onClick={resetLocalWorkspace}
                title={t("header.resetTitle")}
                aria-label={t("header.resetTitle")}
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.08] text-white/72 transition hover:border-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>
              <LanguageSwitcher mounted={mounted} />
              <ThemeToggle />
              <SystemStatus />
              <ReplayTourButton />
            </div>
          </div>
        </header>

        <section
          aria-label={t("metrics.sectionAria")}
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          <WorkspaceMetric
            label={t("metrics.quality")}
            value={`${qualityResult.score}%`}
            detail={t("metrics.qualityDetail", { passed: qualityPassed, total: qualityResult.checks.length })}
            icon={Gauge}
            tone={qualityTone}
          />
          <WorkspaceMetric
            label={t("metrics.validation")}
            value={`${executionProgress.score}%`}
            detail={t("metrics.validationDetail", { with: executionProgress.withEvidence, total: executionProgress.total })}
            icon={BarChart3}
            tone={validationTone}
          />
          <WorkspaceMetric
            label={t("metrics.execution")}
            value={`${completedTasks}/${workspace.tasks.length}`}
            detail={t("metrics.executionDetail")}
            icon={ListChecks}
            tone={completedTasks === workspace.tasks.length ? "support" : "plain"}
          />
          <WorkspaceMetric
            label={t("metrics.backlog")}
            value={`${workspace.backlog.length}`}
            detail={t("metrics.backlogDetail", { count: workspace.assumptions.length })}
            icon={ClipboardCheck}
            tone="plain"
          />
          <WorkspaceMetric
            label={t("metrics.aiMode")}
            value={generationModeLabel}
            detail={providerLabel}
            icon={LayoutDashboard}
            tone={generationMeta.usedFallback ? "risk" : "primary"}
          />
        </section>

        <div className="grid gap-5 lg:grid-cols-[372px_minmax(0,1fr)]">
          <aside id="founder-brief" aria-label={t("brief.asideAria")} className="min-w-0 rounded-md border border-card bg-card p-4 shadow-[0_30px_90px_-72px_rgba(17,19,18,0.62)] lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {t("brief.inputLabel")}
                  </p>
                  <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
                    {t("brief.builderTitle")}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                aria-controls="founder-brief-controls"
                aria-expanded={isBriefOpen}
                onClick={() => setIsBriefOpen((current) => !current)}
                className="flex h-9 items-center gap-2 rounded-md border border-input bg-input px-3 text-sm font-semibold text-foreground transition hover:border-accent lg:hidden"
              >
                <PencilLine className="size-4" aria-hidden="true" />
                {isBriefOpen ? t("brief.hide") : t("brief.edit")}
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
              <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                {t("brief.examplesLabel")}
              </p>
              <div className="mb-5 grid gap-2" role="group" aria-label={t("brief.examplesAria")}>
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
                          ? "border-foreground bg-foreground text-background"
                          : "border-input bg-card text-foreground/78 hover:border-accent hover:bg-input hover:text-foreground",
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
                    {t("field.idea.label")}
                  </span>
                  <textarea
                    id="founder-brief-idea" aria-invalid={(ideaTrimmed.length > 0 && ideaTrimmed.length < 20) || input.idea.length > 500} aria-describedby={`founder-brief-idea-hint founder-brief-idea-count${(ideaTrimmed.length > 0 && ideaTrimmed.length < 20) ? " founder-generate-blocked" : ""}`}
                    value={input.idea}
                    onChange={(event) =>
                      updateInput((current) => ({
                        ...current,
                        idea: event.target.value,
                      }))
                    }
                    onBlur={(event) => {
                      const v = event.target.value.trim();
                      if (v !== event.target.value) setInput((current) => ({ ...current, idea: v }));
                    }}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !isGenerating) {
                        event.preventDefault();
                        generate();
                      }
                    }}
                    rows={3}
                    placeholder={t("field.idea.placeholder")}
                    className="w-full field-sizing-content resize-y min-h-[96px] max-h-[400px] rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p id="founder-brief-idea-count" className="mt-1 flex items-center justify-between text-xs text-muted">
                    <span id="founder-brief-idea-hint" className="sr-only">{t("field.idea.hint", { shortcut: formatShortcut({ key: "Enter", meta: true, ctrl: true, description: "", category: "" }) })}</span>
                    <span className={input.idea.length < 20 || input.idea.length > 500 ? "text-signal-challenges" : input.idea.length > 400 ? "text-amber-500" : "text-muted/70"} title={t("field.idea.recommended") + (input.idea.length > 500 ? t("field.pleaseShorten") : "")}>{input.idea.length} {t("field.charsSuffix")}{input.idea.length > 500 ? <span className="ml-1 font-semibold">{t("field.idea.tooLong")}</span> : null}</span>
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">
                    {t("field.audience.label")}
                  </span>
                  <textarea
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !isGenerating) {
                        event.preventDefault();
                        generate();
                      }
                    }}
                    id="founder-brief-audience"
                    aria-invalid={input.audience.length > 400}
                    aria-describedby="founder-brief-audience-count"
                    value={input.audience}
                    onChange={(event) =>
                      updateInput((current) => ({
                        ...current,
                        audience: event.target.value,
                      }))
                    }
                    onBlur={(event) => {
                      const v = event.target.value.trim();
                      if (v !== event.target.value) setInput((current) => ({ ...current, audience: v }));
                    }}
                    rows={2}
                    className="w-full field-sizing-content resize-y min-h-[64px] max-h-[240px] rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p id="founder-brief-audience-count" className={"mt-1 text-right text-[11px] " + (input.audience.length > 400 ? "text-signal-challenges" : input.audience.length > 240 ? "text-amber-500" : "text-muted/70")} title={t("field.audience.recommended") + (input.audience.length > 400 ? t("field.pleaseShorten") : "")}>{input.audience.length} {t("field.charsSuffix")}{input.audience.length > 400 ? <span className="ml-1 font-semibold">{t("field.audience.tooLong")}</span> : null}</p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">
                    {t("field.market.label")}
                  </span>
                  <textarea
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !isGenerating) {
                        event.preventDefault();
                        generate();
                      }
                    }}
                    id="founder-brief-market"
                    aria-invalid={input.market.length > 200}
                    aria-describedby="founder-brief-market-count"
                    value={input.market}
                    onChange={(event) =>
                      updateInput((current) => ({
                        ...current,
                        market: event.target.value,
                      }))
                    }
                    onBlur={(event) => {
                      const v = event.target.value.trim();
                      if (v !== event.target.value) setInput((current) => ({ ...current, market: v }));
                    }}
                    rows={2}
                    className="w-full field-sizing-content min-h-[64px] max-h-[180px] resize-y rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p id="founder-brief-market-count" className={"mt-1 text-right text-[11px] " + (input.market.length > 200 ? "text-signal-challenges" : input.market.length > 120 ? "text-amber-500" : "text-muted/70")} title={t("field.market.recommended") + (input.market.length > 200 ? t("field.pleaseShorten") : "")}>{input.market.length} {t("field.charsSuffix")}{input.market.length > 200 ? <span className="ml-1 font-semibold">{t("field.market.tooLong")}</span> : null}</p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">
                    {t("field.voice.label")}
                  </span>
                  <select
                    value={input.tone}
                    onChange={(event) =>
                      updateInput((current) => ({
                        ...current,
                        tone: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-input bg-input px-3 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  >
                    {tones.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone === "Practical, crisp, and founder-friendly" ? t("voice.practical")
                          : tone === "Analytical and investor-ready" ? t("voice.analytical")
                          : tone === "Warm and community-led" ? t("voice.warm")
                          : tone === "Technical and product-led" ? t("voice.technical")
                          : tone}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">
                    {t("field.constraints.label")}
                  </span>
                  <textarea
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !isGenerating) {
                        event.preventDefault();
                        generate();
                      }
                    }}
                    id="founder-brief-constraints"
                    aria-invalid={input.constraints.length > 500}
                    aria-describedby="founder-brief-constraints-count"
                    value={input.constraints}
                    onChange={(event) =>
                      updateInput((current) => ({
                        ...current,
                        constraints: event.target.value,
                      }))
                    }
                    onBlur={(event) => {
                      const v = event.target.value.trim();
                      if (v !== event.target.value) setInput((current) => ({ ...current, constraints: v }));
                    }}
                    rows={4}
                    className="w-full resize-none rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                  />
                  <p id="founder-brief-constraints-count" className={"mt-1 text-right text-[11px] " + (input.constraints.length > 500 ? "text-signal-challenges" : input.constraints.length > 320 ? "text-amber-500" : "text-muted/70")} title={t("field.constraints.recommended") + (input.constraints.length > 500 ? t("field.pleaseShorten") : "")}>{input.constraints.length} {t("field.charsSuffix")}{input.constraints.length > 500 ? <span className="ml-1 font-semibold">{t("field.constraints.tooLong")}</span> : null}</p>
                </label>

                <button
                  type="button"
                  onClick={generate}
                  disabled={!canGenerate}
                  aria-describedby={(!canGenerate ? "founder-generate-blocked " : "") + (isGenerating ? "founder-generate-status founder-generate-reason" : "founder-generate-status")}
                  aria-busy={isGenerating}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted"
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
                  {isGenerating ? t("generate.generating") : t("generate.button")}
                </button>
                {isGenerating && <p id="founder-generate-reason" className="sr-only">{t("generate.srReason")}</p>}
                {!canGenerate && generateBlockedReason && (<p id="founder-generate-blocked" role="alert" className="mt-2 text-center text-[11px] text-signal-challenges">{generateBlockedReason}</p>)}
                                {isGenerating && (
                  <button type="button" onClick={() => generateAbortRef.current?.abort()} className="mt-2 block w-full text-center text-xs font-medium text-muted underline-offset-2 transition hover:text-signal-challenges hover:underline">
                    {t("generate.cancel")}
                  </button>
                )}
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
                    {t("generate.loadingHeading")}
                  </div>
                  <div className="space-y-2">
                    {loadingStepLabels.map((step, idx) => (
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
                  className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-signal-challenges bg-signal-challenges p-3 text-sm leading-6 text-signal-challenges"
                >
                  <span className="flex-1 min-w-[200px]">{error || fallbackNotice}</span>
                  {error && (
                    <button
                      type="button"
                      onClick={() => generate()}
                      className="shrink-0 rounded-md border border-signal-challenges px-3 py-1 text-xs font-semibold text-signal-challenges transition hover:bg-signal-challenges hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal-challenges)]"
                    >
                      {t("generate.errorRetry")}
                    </button>
                  )}
                </div>
              )}

              
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            <div id="cloud-workspaces-section" className="scroll-mt-28">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-accent">
                    {t("account.label")}
                  </p>
                  <h2 className="text-base font-semibold text-foreground">
                    {t("account.title")}
                  </h2>
                </div>
                <span className="hidden rounded-md border border-card bg-card px-3 py-2 text-xs font-semibold text-foreground/70 sm:inline-flex">
                  {saveLabel}
                </span>
              </div>
              <CloudWorkspaces
                input={input}
                workspace={workspace}
                execution={execution}
                onRestore={restoreCloudWorkspace}
              />
            </div>

            <section className="overflow-hidden rounded-md border border-card bg-card shadow-[0_30px_90px_-72px_rgba(17,19,18,0.62)]">
              <div className="border-b border-card bg-card p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                      {t("snapshot.label")}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em] text-foreground">
                      {t("snapshot.title")}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-foreground/75">
                      <span className="rounded-md border border-input bg-input px-2.5 py-1">
                        {t("snapshot.generatedPrefix")}{formatGeneratedTime(generationMeta.generatedAt)}
                      </span>
                      <span className="rounded-md border border-input bg-input px-2.5 py-1">
                        {generationModeLabel}
                      </span>
                      <span className="rounded-md border border-input bg-input px-2.5 py-1">
                        {providerLabel}
                      </span>
                      {generationMeta.usedFallback && generationMeta.fallbackReason && (
                        <span className="rounded-md bg-signal-challenges px-2.5 py-1 text-signal-challenges">
                          {t("snapshot.fallbackPrefix")}{generationMeta.fallbackReason}
                        </span>
                      )}
                    </div>
                    {workspace.sourceBrief && (
                      <div className="mt-3 flex flex-col gap-3 rounded-md border border-accent/30 bg-accent/10 px-3 py-3 text-sm text-foreground/85 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-2">
                          <FlaskConical
                            className="mt-0.5 size-4 shrink-0 text-accent"
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">
                              {t("sourceBrief.heading")}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                              {t("sourceBrief.session")}{" "}
                              <span className="break-all font-mono">
                                {workspace.sourceBrief.sessionId}
                              </span>{" "}
                              / {formatSourceScore(t("sourceBrief.opportunity"), workspace.sourceBrief.opportunityScore)} /{" "}
                              {formatSourceScore(t("sourceBrief.risk"), workspace.sourceBrief.riskScore)}
                            </p>
                          </div>
                        </div>
                        {workspace.sourceBrief.reportUrl ? (
                          <a
                            href={workspace.sourceBrief.reportUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-accent/40 bg-card px-2.5 text-xs font-semibold text-accent transition hover:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                          >
                            {t("sourceBrief.viewReport")}
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="inline-flex h-8 shrink-0 items-center rounded-md border border-input bg-input px-2.5 text-xs font-semibold text-muted">
                            {t("sourceBrief.linkPending")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing((current) => !current)}
                      className="flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      {isEditing ? (
                        <Eye className="size-4" aria-hidden="true" />
                      ) : (
                        <PencilLine className="size-4" aria-hidden="true" />
                      )}
                      {isEditing ? t("toolbar.preview") : t("toolbar.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={copyMarkdown}
                      aria-label={copyJustSucceeded === "markdown" ? t("toolbar.copiedMarkdownAria") : t("toolbar.copyMarkdownAria")}
                      aria-live="polite"
                      className="flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-semibold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      {copyJustSucceeded === "markdown" ? (
                        <CheckCircle2 className="size-4 text-signal-supports" aria-hidden="true" />
                      ) : (
                        <Copy className="size-4" aria-hidden="true" />
                      )}
                      {copyJustSucceeded === "markdown" ? t("toolbar.copied") : t("toolbar.markdown")}
                    </button>
                    <button
                      type="button"
                      onClick={copyJson}
                      aria-label={copyJustSucceeded === "json" ? t("toolbar.copiedJsonAria") : t("toolbar.copyJsonAria")}
                      aria-live="polite"
                      className="flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      {copyJustSucceeded === "json" ? (
                        <CheckCircle2 className="size-4 text-accent" aria-hidden="true" />
                      ) : (
                        <Braces className="size-4" aria-hidden="true" />
                      )}
                      {copyJustSucceeded === "json" ? t("toolbar.copied") : t("toolbar.json")}
                    </button>
                    <button
                      type="button"
                      onClick={downloadMarkdownFile}
                      title={t("toolbar.downloadMdTitle")}
                      className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground/80 transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      .md
                    </button>
                    <button
                      type="button"
                      onClick={downloadJsonFile}
                      title={t("toolbar.downloadJsonTitle")}
                      className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground/80 transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      .json
                    </button>
                    <button
                      type="button"
                      onClick={triggerImport}
                      title={t("toolbar.importJsonTitle")}
                      className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-input px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      <Upload className="size-4" aria-hidden="true" />
                      {t("toolbar.import")}
                    </button>
                    <button
                      type="button"
                      onClick={triggerBriefImport}
                      title={t("toolbar.importBriefTitle")}
                      className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-input px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      <FlaskConical className="size-4" aria-hidden="true" />
                      {t("toolbar.researchStudio")}
                    </button>
                    {/* R252: paste-JSON fallback entry. Sits beside the file
                        picker so a blocked hash handoff never strands the user
                        — they can always paste the envelope they copied. */}
                    <button
                      type="button"
                      onClick={openBriefPaste}
                      title={t("toolbar.pasteBriefTitle")}
                      className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-input px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      <ClipboardPaste className="size-4" aria-hidden="true" />
                      {t("toolbar.pasteBrief")}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.launchlens.enc,.launchlens.enc.md,.md,application/json,text/plain,text/markdown"
                      className="hidden"
                      aria-hidden="true"
                      tabIndex={-1}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleImportFile(file);
                      }}
                    />
                    <input
                      ref={briefFileInputRef}
                      type="file"
                      accept=".json,application/json,text/plain"
                      className="hidden"
                      aria-hidden="true"
                      tabIndex={-1}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleBriefImportFile(file);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-card pt-3 text-xs">
                  <label className="flex items-center gap-1.5 text-muted">
                    <input type="checkbox" checked={exportEncrypted} onChange={(e) => { setExportEncrypted(e.target.checked); if (e.target.checked && !exportPassword) setExportPassword(randomPassword()); }} className="h-3.5 w-3.5 rounded border-input" />
                    {t("toolbar.passwordProtect")}
                  </label>
                  {exportEncrypted && (
                    <>
                      <input type="text" value={exportPassword} onChange={(e) => setExportPassword(e.target.value)} placeholder={t("toolbar.passphrasePlaceholder")} className="w-40 rounded bg-input px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent" aria-label={t("toolbar.passphraseAria")} />
                      <button type="button" onClick={() => setExportPassword(randomPassword())} className="text-accent hover:underline">{t("toolbar.regenerate")}</button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_250px]">
                <div>
                  <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {t("positioning.label")}
                  </p>
                  {isEditing ? (
                    <div className="space-y-3">
                      <EditableText
                        label={t("positioning.headline")}
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
                        label={t("positioning.summary")}
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
                      <h2 className="max-w-4xl text-2xl font-semibold leading-8 tracking-[-0.025em] text-foreground">
                        {workspace.landingPage.headline}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/80">
                        {workspace.summary}
                      </p>
                    </>
                  )}
                </div>
                <aside className="border-t border-card pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {t("launchCta.label")}
                  </p>
                  {isEditing ? (
                    <EditableText
                      label={t("launchCta.title")}
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
                  <div className="mt-4 flex items-center text-sm font-medium text-accent">
                    {t("launchCta.nextAction")}
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </div>
                </aside>
              </div>

              {exportText && (
                <div
                  role="status"
                  className="mx-5 mb-5 rounded-md border border-card bg-input p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <FileText className="size-4" aria-hidden="true" />
                      {t("export.heading")}
                      <span className="rounded bg-signal-supports px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase text-signal-supports">
                        {exportFormat === "json" ? t("export.badgeJson") : t("export.badgeMarkdown")}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => { setExportText(""); setExportFormat(""); }}
                      aria-label={t("export.dismissAria")}
                      className="text-muted transition hover:text-foreground"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  {exportText && (
                    <textarea
                      readOnly
                      aria-label={t("export.textareaAria", { format: exportFormat === "json" ? t("export.badgeJson") : t("export.badgeMarkdown") })}
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
                      {t("export.copySelection")}
                    </button>
                    <button
                      type="button"
                      onClick={downloadExport}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      {t("export.downloadFile")}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <ErrorBoundary label={t("validation.boardLabel")}>
              <section
                id="workspace-main"
                tabIndex={-1}
                aria-label={t("validation.sectionAria")}
                className="scroll-mt-28 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-accent">
                      {t("validation.label")}
                    </p>
                    <h2 className="text-base font-semibold text-foreground">
                      {t("validation.title")}
                    </h2>
                  </div>
                  <p className="font-mono text-xs font-semibold tabular-nums text-muted">
                    {t("validation.counter", { evidence: executionProgress.evidenceCount, decided: executionProgress.decided })}
                  </p>
                </div>
                <ValidationBoard
                  execution={execution}
                  tasks={workspace.tasks}
                  onChange={setExecution}
                />
              </section>
            </ErrorBoundary>

            <div id="decision-copilot-section" className="scroll-mt-28">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-accent">
                    {t("decision.label")}
                  </p>
                  <h2 className="text-base font-semibold text-foreground">
                    {t("decision.title")}
                  </h2>
                </div>
                <p className="text-xs font-semibold text-muted">
                  {t("decision.hint")}
                </p>
              </div>
              <ErrorBoundary label={t("decision.copilotLabel")}>
                <DecisionCopilot
                  execution={execution}
                  onChange={setExecution}
                />
              </ErrorBoundary>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title={t("section.targetUsers")} icon={UsersRound} collapsible sectionId="target-users" collapsed={collapsedSections.has("target-users")} onToggle={() => toggleSection("target-users")}>
                {isEditing ? (
                  <EditableLines
                    label={t("section.targetUsers")}
                    items={workspace.targetUsers}
                    onCommit={(items) => updateList("targetUsers", items)}
                  />
                ) : (
                  <BulletList items={workspace.targetUsers} />
                )}
              </Section>

              <Section title={t("section.painMap")} icon={Target} collapsible sectionId="pain-map" collapsed={collapsedSections.has("pain-map")} onToggle={() => toggleSection("pain-map")}>
                {isEditing ? (
                  <EditableLines
                    label={t("section.painMap")}
                    items={workspace.pains}
                    onCommit={(items) => updateList("pains", items)}
                  />
                ) : (
                  <BulletList items={workspace.pains} />
                )}
              </Section>

              <Section title={t("section.mvpScope")} icon={ClipboardList} collapsible sectionId="mvp-scope" collapsed={collapsedSections.has("mvp-scope")} onToggle={() => toggleSection("mvp-scope")}>
                {isEditing ? (
                  <EditableLines
                    label={t("section.mvpScope")}
                    items={workspace.mvpScope}
                    onCommit={(items) => updateList("mvpScope", items)}
                  />
                ) : (
                  <BulletList items={workspace.mvpScope} />
                )}
              </Section>

              <Section title={t("section.landingCopy")} icon={Megaphone} collapsible sectionId="landing-page-copy" collapsed={collapsedSections.has("landing-page-copy")} onToggle={() => toggleSection("landing-page-copy")}>
                {isEditing ? (
                  <div className="space-y-3">
                    <EditableText
                      label={t("section.landingSubheadline")}
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
                      label={t("section.landingProofBullets")}
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

            <Section title={t("section.featureBacklog")} icon={ClipboardCheck} collapsible sectionId="feature-backlog" collapsed={collapsedSections.has("feature-backlog")} onToggle={() => toggleSection("feature-backlog")}>
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
              <Section title={t("section.pricingHypothesis")} icon={CircleDollarSign} collapsible sectionId="pricing-hypothesis" collapsed={collapsedSections.has("pricing-hypothesis")} onToggle={() => toggleSection("pricing-hypothesis")}>
                {isEditing ? (
                  <div className="space-y-3">
                    <EditableText
                      label={t("section.pricingHypothesis")}
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
                      label={t("section.pricingTiers")}
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

              <Section title={t("section.launchPlan")} icon={Rocket} collapsible sectionId="launch-plan" collapsed={collapsedSections.has("launch-plan")} onToggle={() => toggleSection("launch-plan")}>
                {isEditing ? (
                  <EditableLines
                    label={t("section.launchPlan")}
                    items={workspace.launchPlan}
                    onCommit={(items) => updateList("launchPlan", items)}
                  />
                ) : (
                  <BulletList items={workspace.launchPlan} />
                )}
              </Section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title={t("section.assumptions")} icon={AlertTriangle} collapsible sectionId="assumptions-to-validate" collapsed={collapsedSections.has("assumptions-to-validate")} onToggle={() => toggleSection("assumptions-to-validate")}>
                {isEditing ? (
                  <div className="space-y-3">
                    <EditableLines
                      label={t("section.assumptions")}
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

              <Section title={t("section.pricingRisks")} icon={AlertTriangle} collapsible sectionId="pricing-risks" collapsed={collapsedSections.has("pricing-risks")} onToggle={() => toggleSection("pricing-risks")}>
                {isEditing ? (
                  <EditableLines
                    label={t("section.pricingRisks")}
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
              <Section title={t("section.contentCalendar")} icon={CalendarDays} collapsible sectionId="content-calendar" collapsed={collapsedSections.has("content-calendar")} onToggle={() => toggleSection("content-calendar")}>
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
                    <span>{t("section.executionTasks")}</span>
                    <span className="text-xs font-normal text-muted">
                      {t("section.executionCount", { completed: workspace.tasks.filter((task) => task.completed).length, total: workspace.tasks.length })}
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
                            className={`flex size-6 shrink-0 items-center justify-center rounded transition ${
                              task.completed
                                ? "bg-accent text-primary-text"
                                : "border-2 border-muted text-transparent hover:border-accent"
                            }`}
                            aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                          >
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          </button>
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
                            className={`flex-1 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-semibold ${task.completed ? "text-foreground/50 line-through" : "text-foreground"} outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]`}
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
                            { title: "", owner: "", due: "Week 1", outcome: "", completed: false },
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
                                ? "bg-accent text-primary-text"
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
        {pendingBriefImport && (
            <div
              role="alertdialog"
              aria-modal="false"
              aria-labelledby="workspace-outdated-title"
              data-testid="workspace-outdated-overlay"
              className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[1480px] px-4 pb-4 sm:px-6 sm:pb-5 lg:px-8 lg:pb-6"
            >
              <div className="mx-auto flex flex-col gap-3 rounded-xl border border-accent/40 bg-card/95 p-5 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:gap-5">
                <div className="flex-1">
                  <h3
                    id="workspace-outdated-title"
                    className="text-base font-semibold text-foreground"
                  >
                    {t("workspace.outdated.title")}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-foreground/80">
                    {t("workspace.outdated.body")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => void generate()}
                    disabled={!canGenerate}
                    data-testid="workspace-outdated-generate"
                    className="flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-primary-text transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Rocket className="size-4" aria-hidden="true" />
                    {t("workspace.outdated.generate")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInput(pendingBriefImport.previousInput);
                      setBriefSource(
                        pendingBriefImport.previousSourceBrief,
                      );
                      setPendingBriefImport(null);
                      setError("");
                      setFallbackNotice("");
                    }}
                    data-testid="workspace-outdated-discard"
                    className="flex h-10 items-center justify-center rounded-md border border-input bg-card px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {t("workspace.outdated.discard")}
                  </button>
                </div>
              </div>
            </div>
          )}
        {importPreview && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-12"
          >
            <button
              type="button"
              aria-label={t("importDialog.cancelAria")}
              onClick={cancelImport}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div
              className="relative w-full max-w-md overflow-hidden rounded-md border border-card bg-card shadow-2xl"
              style={{ animation: "fadeInDown 200ms ease-out both" }}
            >
              <div className="border-b border-input px-6 py-4">
                <h3 id="import-dialog-title" className="text-lg font-semibold text-foreground">
                  {t("importDialog.title")}
                </h3>
              </div>
              <div className="space-y-4 px-6 py-4">
                <p className="text-sm text-foreground/80">
                  {t("importDialog.body")}
                </p>
                <div className="rounded-md bg-muted p-3 text-xs text-muted">
                  <p className="font-medium text-foreground/70">{t("importDialog.summary")}</p>
                  <p className="mt-1 line-clamp-3">
                    {importPreview.workspace.summary}
                  </p>
                </div>
                {importPreview.execution && (
                  <p className="text-xs text-signal-supports">
                    {t("importDialog.includesValidation", { count: importPreview.execution.experiments.length })}
                  </p>
                )}
                {importPreview.warnings.length > 0 && (
                  <div className="rounded-md border border-signal-challenges bg-signal-challenges/5 p-3 text-xs text-signal-challenges">
                    <p className="font-semibold">
                      {importPreview.warnings.length === 1
                        ? t("importDialog.warningOne", { count: importPreview.warnings.length })
                        : t("importDialog.warningMany", { count: importPreview.warnings.length })}
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
                  {t("importDialog.cancel")}
                </button>
                <button
                  type="button"
                  onClick={applyImport}
                  className="flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-semibold text-primary-text transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  {t("importDialog.import")}
                </button>
              </div>
            </div>
          </div>
        )}

        {briefPasteOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brief-paste-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-12"
          >
            <button
              type="button"
              aria-label={t("briefDialog.cancelAria")}
              onClick={cancelBriefPaste}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div
              className="relative w-full max-w-lg overflow-hidden rounded-md border border-card bg-card shadow-2xl"
              style={{ animation: "fadeInDown 200ms ease-out both" }}
            >
              <div className="border-b border-input px-6 py-4">
                <h3 id="brief-paste-dialog-title" className="text-lg font-semibold text-foreground">
                  {t("briefDialog.pasteTitle")}
                </h3>
              </div>
              <div className="space-y-3 px-6 py-4">
                <p className="text-sm text-foreground/80">
                  {t("briefDialog.pasteBody")}
                </p>
                <textarea
                  value={briefPasteText}
                  onChange={(e) => setBriefPasteText(e.target.value)}
                  placeholder={t("briefDialog.pastePlaceholder")}
                  rows={10}
                  className="w-full resize-y rounded-md border border-input bg-input px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                  autoFocus
                  spellCheck={false}
                />
              </div>
              <div className="flex gap-2 border-t border-input px-6 py-4 sm:justify-end">
                <button
                  type="button"
                  onClick={cancelBriefPaste}
                  className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  {t("briefDialog.cancel")}
                </button>
                <button
                  type="button"
                  onClick={applyBriefPaste}
                  disabled={!briefPasteText.trim()}
                  className="flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-semibold text-primary-text transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50"
                >
                  <ClipboardPaste className="size-3.5" aria-hidden="true" />
                  {t("briefDialog.pasteLoad")}
                </button>
              </div>
            </div>
          </div>
        )}

        {briefImportPreview && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brief-import-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-12"
          >
            <button
              type="button"
              aria-label={t("briefDialog.cancelAria")}
              onClick={cancelBriefImport}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div
              className="relative w-full max-w-lg overflow-hidden rounded-md border border-card bg-card shadow-2xl"
              style={{ animation: "fadeInDown 200ms ease-out both" }}
            >
              <div className="border-b border-input px-6 py-4">
                <h3 id="brief-import-dialog-title" className="text-lg font-semibold text-foreground">
                  {briefImportPreview.source === "research-studio"
                    ? t("briefDialog.titleResearchStudio")
                    : t("briefDialog.titleFile")}
                </h3>
              </div>
              <div className="space-y-4 px-6 py-4">
                <p className="text-sm text-foreground/80">
                  {t("briefDialog.body")}
                </p>
                <dl className="space-y-2 rounded-md bg-muted p-3 text-xs">
                  <div>
                    <dt className="font-medium text-foreground/70">{t("briefDialog.idea")}</dt>
                    <dd className="mt-0.5 line-clamp-2 text-foreground/80">
                      {briefImportPreview.input.idea || t("briefDialog.empty")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground/70">{t("briefDialog.audience")}</dt>
                    <dd className="mt-0.5 line-clamp-2 text-foreground/80">
                      {briefImportPreview.input.audience || t("briefDialog.empty")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground/70">{t("briefDialog.market")}</dt>
                    <dd className="mt-0.5 line-clamp-2 text-foreground/80">
                      {briefImportPreview.input.market || t("briefDialog.empty")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground/70">{t("briefDialog.tone")}</dt>
                    <dd className="mt-0.5 text-foreground/80">
                      {briefImportPreview.input.tone || t("briefDialog.empty")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground/70">{t("briefDialog.constraints")}</dt>
                    <dd className="mt-0.5 line-clamp-2 text-foreground/80">
                      {briefImportPreview.input.constraints || t("briefDialog.empty")}
                    </dd>
                  </div>
                </dl>
                {briefImportPreview.warnings.length > 0 && (
                  <div className="rounded-md border border-signal-challenges bg-signal-challenges/5 p-3 text-xs text-signal-challenges">
                    <p className="font-semibold">
                      {briefImportPreview.warnings.length === 1
                        ? t("briefDialog.warningOne", { count: briefImportPreview.warnings.length })
                        : t("briefDialog.warningMany", { count: briefImportPreview.warnings.length })}
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {briefImportPreview.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t border-input px-6 py-4 sm:justify-end">
                <button
                  type="button"
                  onClick={cancelBriefImport}
                  className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  {t("briefDialog.cancel")}
                </button>
                <button
                  type="button"
                  onClick={applyBriefImport}
                  className="flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-semibold text-primary-text transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  <FlaskConical className="size-3.5" aria-hidden="true" />
                  {t("briefDialog.load")}
                </button>
              </div>
            </div>
          </div>
        )}

        <ShortcutsHelp />
        {pendingEncrypted && (
          <EncryptedImportDialog
            fileName={pendingEncrypted.fileName}
            error={decryptError}
            busy={decrypting}
            onSubmit={submitEncryptedImport}
            onCancel={cancelEncryptedImport}
          />
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


