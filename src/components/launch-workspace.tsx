"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Copy,
  Eye,
  FileText,
  Loader2,
  Megaphone,
  PencilLine,
  RotateCcw,
  Rocket,
  Save,
  Sparkles,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { workspaceToMarkdown } from "@/lib/launchlens/markdown-export";
import type { ExampleWorkspace } from "@/lib/launchlens/example-workspaces";
import type {
  GenerationResult,
  LaunchLensInput,
  LaunchLensWorkspace,
} from "@/lib/launchlens/types";

type LaunchWorkspaceProps = {
  initialInput: LaunchLensInput;
  initialWorkspace: LaunchLensWorkspace;
  exampleWorkspaces: ExampleWorkspace[];
};

type SectionProps = {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
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
const loadingSteps = [
  "Reading founder brief",
  "Structuring GTM workspace",
  "Checking launch tasks",
];

type LocalWorkspaceSnapshot = {
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
  savedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLaunchLensInput(value: unknown): value is LaunchLensInput {
  if (!isRecord(value)) {
    return false;
  }

  return ["idea", "audience", "market", "tone", "constraints"].every(
    (key) => typeof value[key] === "string",
  );
}

function isLaunchLensWorkspace(value: unknown): value is LaunchLensWorkspace {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.provider === "mock" ||
      value.provider === "openai" ||
      value.provider === "minimax") &&
    typeof value.generatedAt === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.targetUsers) &&
    Array.isArray(value.pains) &&
    Array.isArray(value.mvpScope) &&
    Array.isArray(value.backlog) &&
    isRecord(value.landingPage) &&
    isRecord(value.pricing) &&
    Array.isArray(value.launchPlan) &&
    Array.isArray(value.contentCalendar) &&
    Array.isArray(value.tasks) &&
    Array.isArray(value.assumptions)
  );
}

function isLocalWorkspaceSnapshot(
  value: unknown,
): value is LocalWorkspaceSnapshot {
  return (
    isRecord(value) &&
    isLaunchLensInput(value.input) &&
    isLaunchLensWorkspace(value.workspace) &&
    typeof value.savedAt === "string"
  );
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function timeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <section className="rounded-lg border border-[#d8ded4] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-[#e5f4ef] text-[#0f766e]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-[#17201d]">{title}</h2>
      </div>
      {children}
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
      className="w-full resize-y rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 py-3 text-sm leading-6 text-[#17201d] outline-none transition focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
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
          className="flex gap-3 text-sm leading-6 text-[#40504a]"
        >
          <CheckCircle2
            className="mt-1 size-4 shrink-0 text-[#138a72]"
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
  exampleWorkspaces,
}: LaunchWorkspaceProps) {
  const [input, setInput] = useState(initialInput);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [exportText, setExportText] = useState("");
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [persistenceNotice, setPersistenceNotice] = useState("");
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

  const saveLabel = isStorageReady ? "Saved locally" : "Preparing save";

  const generationModeLabel =
    generationMeta.mode === "real" && !generationMeta.usedFallback
      ? "Real provider"
      : "Demo mode";

  useEffect(() => {
    let cancelled = false;

    window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      try {
        const rawSnapshot = localStorage.getItem(LOCAL_WORKSPACE_KEY);

        if (rawSnapshot) {
          const snapshot = JSON.parse(rawSnapshot) as unknown;

          if (isLocalWorkspaceSnapshot(snapshot)) {
            setInput(snapshot.input);
            setWorkspace(snapshot.workspace);
            setGenerationMeta({
              mode: snapshot.workspace.provider === "mock" ? "demo" : "real",
              provider: snapshot.workspace.provider,
              generatedAt: snapshot.workspace.generatedAt,
              usedFallback: false,
            });
            setPersistenceNotice("Restored local workspace.");
          }
        }
      } catch {
        setPersistenceNotice("Local save unavailable.");
      } finally {
        setIsStorageReady(true);
      }
    }, 0);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    try {
      const nextSavedAt = new Date().toISOString();
      const snapshot: LocalWorkspaceSnapshot = {
        input,
        workspace,
        savedAt: nextSavedAt,
      };

      localStorage.setItem(LOCAL_WORKSPACE_KEY, JSON.stringify(snapshot));
    } catch {
      window.setTimeout(() => {
        setPersistenceNotice("Local save unavailable.");
      }, 0);
    }
  }, [input, isStorageReady, workspace]);

  function updateList(key: WorkspaceListKey, items: string[]) {
    setWorkspace((current) => ({
      ...current,
      [key]: items,
    }));
  }

  function applyExample(example: ExampleWorkspace) {
    setInput(example.input);
    setWorkspace(example.workspace);
    setGenerationMeta({
      mode: "demo",
      provider: example.workspace.provider,
      generatedAt: example.workspace.generatedAt,
      usedFallback: false,
    });
    setError("");
    setFallbackNotice("");
    setCopyNotice("");
    setExportText("");
    setIsEditing(false);
    setPersistenceNotice("Example workspace loaded and saved locally.");
  }

  function resetLocalWorkspace() {
    setInput(initialInput);
    setWorkspace(initialWorkspace);
    setGenerationMeta({
      mode: "demo",
      provider: initialWorkspace.provider,
      generatedAt: initialWorkspace.generatedAt,
      usedFallback: false,
    });
    setError("");
    setFallbackNotice("");
    setCopyNotice("");
    setExportText("");
    setIsEditing(false);
    setPersistenceNotice("Reset to starter workspace.");
  }

  async function generate() {
    setIsGenerating(true);
    setError("");
    setFallbackNotice("");
    setCopyNotice("");
    setExportText("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await response.json()) as Partial<GenerationResult> & {
        error?: string;
      };

      if (!response.ok || data.error || !data.workspace) {
        throw new Error(data.error ?? "Generation failed.");
      }

      setWorkspace(data.workspace);
      setGenerationMeta({
        mode: data.mode ?? "demo",
        provider: data.workspace.provider,
        generatedAt: data.workspace.generatedAt,
        usedFallback: Boolean(data.usedFallback),
        fallbackReason: data.fallbackReason,
      });
      setPersistenceNotice("Generated workspace saved locally.");
      setFallbackNotice(
        data.usedFallback
          ? "Real provider failed, so LaunchLens returned the mock workspace."
          : "",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong during generation.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyMarkdown() {
    const markdown = workspaceToMarkdown(workspace);
    setExportText(markdown);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is unavailable.");
      }

      await navigator.clipboard.writeText(markdown);
      setCopyNotice("Markdown copied.");
    } catch {
      setCopyNotice("Markdown is ready below.");
    }
  }

  return (
    <main
      aria-busy={isGenerating}
      className="min-h-screen bg-[#f6f8f4] text-[#17201d]"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#d8ded4] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-[#17201d] text-white">
              <Compass className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-[#d85b3f]">LaunchLens AI</p>
              <h1 className="text-2xl font-semibold text-[#17201d]">
                Go-to-market workspace
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-2 rounded-md border border-[#d8ded4] bg-white px-3 py-2 text-[#40504a]">
              <Save className="size-4 text-[#138a72]" aria-hidden="true" />
              {saveLabel}
            </span>
            <button
              type="button"
              onClick={resetLocalWorkspace}
              title="Reset local draft"
              aria-label="Reset local draft"
              className="flex size-10 items-center justify-center rounded-md border border-[#d8ded4] bg-white text-[#40504a] transition hover:border-[#138a72] hover:text-[#17201d]"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
            <span className="rounded-md border border-[#d8ded4] bg-white px-3 py-2 text-[#40504a]">
              {providerLabel}
            </span>
            <span className="rounded-md bg-[#f6df8f] px-3 py-2 font-medium text-[#493b08]">
              Early-stage portfolio build
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[370px_1fr]">
          <aside className="rounded-lg border border-[#d8ded4] bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="size-5 text-[#d85b3f]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Founder brief</h2>
            </div>

            <div className="mb-5 grid gap-2">
              {exampleWorkspaces.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => applyExample(example)}
                  className="flex items-center justify-between rounded-md border border-[#d8ded4] bg-[#fbfcfa] px-3 py-2 text-left text-sm font-medium text-[#40504a] transition hover:border-[#138a72] hover:text-[#17201d]"
                >
                  {example.label}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#40504a]">
                  Product idea
                </span>
                <textarea
                  value={input.idea}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      idea: event.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full resize-none rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 py-3 text-sm leading-6 outline-none transition focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#40504a]">
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
                  className="w-full resize-none rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 py-3 text-sm leading-6 outline-none transition focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#40504a]">
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
                  className="w-full rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 py-3 text-sm outline-none transition focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#40504a]">
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
                  className="w-full rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 py-3 text-sm outline-none transition focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                >
                  {tones.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#40504a]">
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
                  className="w-full resize-none rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 py-3 text-sm leading-6 outline-none transition focus:border-[#138a72] focus:ring-2 focus:ring-[#cbe8df]"
                />
              </label>

              <button
                type="button"
                onClick={generate}
                disabled={isGenerating}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#17201d] px-4 text-sm font-semibold text-white transition hover:bg-[#24312d] disabled:cursor-not-allowed disabled:bg-[#7c8781]"
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Rocket className="size-4" aria-hidden="true" />
                )}
                {isGenerating ? "Generating..." : "Generate workspace"}
              </button>
            </div>

            {isGenerating && (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 rounded-md border border-[#d8ded4] bg-[#fbfcfa] p-3"
              >
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#17201d]">
                  <Loader2
                    className="size-4 animate-spin text-[#138a72]"
                    aria-hidden="true"
                  />
                  Generating workspace
                </div>
                <div className="space-y-2">
                  {loadingSteps.map((step) => (
                    <div key={step} className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-[#138a72]" />
                      <span className="text-sm text-[#40504a]">{step}</span>
                      <span className="ml-auto h-2 w-12 animate-pulse rounded-full bg-[#d8ded4]" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(error || fallbackNotice) && (
              <div
                role={error ? "alert" : "status"}
                className="mt-4 rounded-md border border-[#e7c9bd] bg-[#fff6f1] p-3 text-sm leading-6 text-[#8b3d28]"
              >
                {error || fallbackNotice}
              </div>
            )}

            {persistenceNotice && (
              <div
                role="status"
                className="mt-4 rounded-md border border-[#d8ded4] bg-[#fbfcfa] p-3 text-sm leading-6 text-[#40504a]"
              >
                {persistenceNotice}
              </div>
            )}
          </aside>

          <div className="space-y-6">
            <section className="rounded-lg border border-[#d8ded4] bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 border-b border-[#edf0ea] pb-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#40504a]">
                  <span className="rounded-md bg-[#e5f4ef] px-3 py-2 font-medium text-[#0f766e]">
                    {workspace.backlog.length} backlog items
                  </span>
                  <span className="rounded-md bg-[#eef0ed] px-3 py-2">
                    {workspace.tasks.length} launch tasks
                  </span>
                  <span className="rounded-md bg-[#eef0ed] px-3 py-2">
                    {workspace.assumptions.length} assumptions
                  </span>
                  <span className="rounded-md bg-[#eef0ed] px-3 py-2">
                    {generationModeLabel}
                  </span>
                  <span className="rounded-md bg-[#eef0ed] px-3 py-2">
                    Generated {timeLabel(generationMeta.generatedAt)}
                  </span>
                  {generationMeta.usedFallback && generationMeta.fallbackReason && (
                    <span className="rounded-md bg-[#fff6f1] px-3 py-2 font-medium text-[#8b3d28]">
                      Fallback: {generationMeta.fallbackReason}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing((current) => !current)}
                    className="flex h-10 items-center gap-2 rounded-md border border-[#cfd8d1] bg-[#fbfcfa] px-3 text-sm font-semibold text-[#17201d] transition hover:border-[#138a72]"
                  >
                    {isEditing ? (
                      <Eye className="size-4" aria-hidden="true" />
                    ) : (
                      <PencilLine className="size-4" aria-hidden="true" />
                    )}
                    {isEditing ? "Preview" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={copyMarkdown}
                    className="flex h-10 items-center gap-2 rounded-md bg-[#17201d] px-3 text-sm font-semibold text-white transition hover:bg-[#24312d]"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    Copy Markdown
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#d85b3f]">
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
                      <h2 className="text-2xl font-semibold leading-8 text-[#17201d]">
                        {workspace.landingPage.headline}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#40504a]">
                        {workspace.summary}
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-lg bg-[#e5f4ef] p-4">
                  <p className="text-sm font-medium text-[#0f766e]">
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
                    <p className="mt-2 text-lg font-semibold text-[#17201d]">
                      {workspace.landingPage.cta}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-sm font-medium text-[#0f766e]">
                    Next action
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {(copyNotice || exportText) && (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-[#d8ded4] bg-[#fbfcfa] p-4"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#17201d]">
                    <FileText className="size-4" aria-hidden="true" />
                    {copyNotice || "Markdown export"}
                  </div>
                  {exportText && (
                    <textarea
                      readOnly
                      value={exportText}
                      rows={8}
                      className="w-full resize-y rounded-md border border-[#cfd8d1] bg-white px-3 py-3 font-mono text-xs leading-5 text-[#40504a]"
                    />
                  )}
                </div>
              )}
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title="Target users" icon={UsersRound}>
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

              <Section title="Pain map" icon={Target}>
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

              <Section title="MVP scope" icon={ClipboardList}>
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

              <Section title="Landing page copy" icon={Megaphone}>
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
                  <div className="space-y-3 text-sm leading-6 text-[#40504a]">
                    <p className="font-semibold text-[#17201d]">
                      {workspace.landingPage.subheadline}
                    </p>
                    <BulletList items={workspace.landingPage.proofBullets} />
                  </div>
                )}
              </Section>
            </div>

            <Section title="Feature backlog" icon={ClipboardCheck}>
              <div className="grid gap-3 lg:grid-cols-2">
                {workspace.backlog.map((item, index) => (
                  <article
                    key={`${item.feature}-${index}`}
                    className="rounded-md border border-[#d8ded4] bg-[#fbfcfa] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[#17201d]">
                        {item.feature}
                      </h3>
                      <span className="rounded-md bg-[#f6df8f] px-2 py-1 text-xs font-semibold text-[#493b08]">
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-[#40504a]">
                      {item.why}
                    </p>
                  </article>
                ))}
              </div>
            </Section>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title="Pricing hypothesis" icon={CircleDollarSign}>
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
                    <p className="mb-4 text-sm leading-6 text-[#40504a]">
                      {workspace.pricing.hypothesis}
                    </p>
                    <BulletList items={workspace.pricing.tiers} />
                  </>
                )}
              </Section>

              <Section title="Launch plan" icon={Rocket}>
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
              <Section title="Assumptions to validate" icon={AlertTriangle}>
                {isEditing ? (
                  <EditableLines
                    label="Assumptions to validate"
                    items={workspace.assumptions}
                    onCommit={(items) => updateList("assumptions", items)}
                  />
                ) : (
                  <BulletList items={workspace.assumptions} />
                )}
              </Section>

              <Section title="Pricing risks" icon={AlertTriangle}>
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
              <Section title="Content calendar" icon={CalendarDays}>
                <div className="space-y-3">
                  {workspace.contentCalendar.map((item, index) => (
                    <article
                      key={`${item.channel}-${item.angle}-${index}`}
                      className="rounded-md border border-[#d8ded4] bg-[#fbfcfa] p-4"
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-[#17201d]">
                          {item.channel}
                        </h3>
                        <span className="text-xs font-medium text-[#d85b3f]">
                          {item.cadence}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-[#40504a]">
                        {item.angle}
                      </p>
                    </article>
                  ))}
                </div>
              </Section>

              <Section title="Execution tasks" icon={CheckCircle2}>
                <div className="space-y-3">
                  {workspace.tasks.map((task, index) => (
                    <article
                      key={`${task.title}-${task.due}-${index}`}
                      className="rounded-md border border-[#d8ded4] bg-[#fbfcfa] p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#17201d]">
                          {task.title}
                        </h3>
                        <span className="rounded-md bg-[#e5f4ef] px-2 py-1 text-xs font-medium text-[#0f766e]">
                          {task.due}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-[#40504a]">
                        {task.owner} owns {task.outcome}.
                      </p>
                    </article>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
