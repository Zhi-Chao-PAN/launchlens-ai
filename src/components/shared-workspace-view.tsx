"use client";

import Link from "next/link";
import { CopyLinkButton } from "@/components/copy-link-button";
import { CopyMarkdownButton } from "@/components/copy-markdown-button";
import { DownloadJsonButton } from "@/components/download-json-button";
import { DownloadMarkdownButton } from "@/components/download-markdown-button";
import {
  Archive,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Compass,
  FlaskConical,
  Megaphone,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import type { SharedCloudWorkspaceRecord } from "@/lib/launchlens/cloud-workspace";
import { formatGeneratedTime, formatRelativeTime } from "@/lib/launchlens/generated-time";
import { formatExpiryBadge } from "@/lib/launchlens/expiry-format";
import { formatProviderLabel } from "@/lib/launchlens/provider-label";
import { taskIdentity } from "@/lib/launchlens/execution";

type ReadOnlySectionProps = {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  collapsible?: boolean;
  sectionId?: string;
};

function ReadOnlySection({
  title,
  icon: Icon,
  children,
  collapsible = false,
  sectionId,
}: ReadOnlySectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = sectionId ? `${sectionId}-content` : undefined;

  const toggle = () => {
    if (collapsible) setIsOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!collapsible) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <section id={sectionId} aria-labelledby={sectionId ? `${sectionId}-heading` : undefined} tabIndex={sectionId === "validation-decisions" ? -1 : undefined} className="rounded-lg border border-card bg-card shadow-sm overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset">
      {collapsible ? (
        <button
          type="button"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="w-full flex items-center gap-2 p-4 sm:p-5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-signal-supports text-signal-supports sm:size-8">
            <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
          </span>
          <h2 id={sectionId ? `${sectionId}-heading` : undefined} className="flex-1 text-sm sm:text-base font-semibold text-foreground">{title}</h2>
          <ChevronDown
            className={`size-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex items-center gap-2 p-4 pb-0 sm:p-5 sm:pb-0">
          <span className="flex size-7 items-center justify-center rounded-md bg-signal-supports text-signal-supports sm:size-8">
            <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
          </span>
          <h2 id={sectionId ? `${sectionId}-heading` : undefined} className="text-sm sm:text-base font-semibold text-foreground">{title}</h2>
        </div>
      )}
      <div
        id={contentId}
        className={`transition-all ${
          collapsible && !isOpen ? "max-h-0 opacity-0 overflow-hidden" : "max-h-none opacity-100"
        }`}
      >
        <div className={collapsible ? "px-4 pb-4 pt-0 sm:px-5 sm:pb-5" : "p-4 pt-3 sm:p-5 sm:pt-4"}>
          {children}
        </div>
      </div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          // Use the position only — two identical pain points are intentionally
          // rendered as two list items, and the previous key (`${item}-${index}`)
          // would still collide if the same text appeared at the same index
          // after a re-render that mutated the source array. Index keys are
          // correct here because the list is not reorderable in the share view.
          key={index}
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

function ExpiryBadge({
  expiresAt,
  mounted,
  nowTick,
}: {
  expiresAt: string | null;
  mounted: boolean;
  /** Reference to subscribe this component to the 30s refresh interval. */
  nowTick: number;
}) {
  // Defer rendering until after mount so Date.now() doesn't cause a
  // server/client hydration mismatch. Before mount, render nothing
  // (the surrounding toolbar already shows a 'Read-only snapshot' pill
  // so the visual layout is preserved).
  if (!mounted) return null;
  // nowTick is referenced in the second arg so React re-renders the
  // badge on every tick; otherwise the label would freeze on first mount.
  const badge = formatExpiryBadge(expiresAt, Date.now() + nowTick);
  if (!badge) return null;
  const className =
    badge.variant === "neutral"
      ? "w-fit rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800"
      : "w-fit rounded-md bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800";
  return (
    <span className={className} title={badge.title}>
      {badge.label}
    </span>
  );
}

export function SharedWorkspaceView({
  record,
}: {
  record: SharedCloudWorkspaceRecord;
}) {
  const { workspace } = record;
  const experiments = record.execution.experiments;
  const [focusedExperimentId, setFocusedExperimentId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  // Avoid hydration mismatch: `formatRelativeTime` uses Date.now(), which
  // differs between server and client. Render an absolute UTC string until
  // the component has mounted on the client, then swap in the relative form.
  // `nowTick` is bumped every 30s so the relative timestamps and the
  // 'Expires in X' badge stay fresh while the tab is open. The initial
  // tick (mount) sets nowTick to 1 to flag that we're client-side.
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    setNowTick(1);
    const id = window.setInterval(() => setNowTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const mounted = nowTick > 0;
  const activeExperiments = experiments.filter((e) => !e.archived);
  const archivedExperiments = experiments.filter((e) => e.archived);
  const visibleExperiments = showArchived ? experiments : activeExperiments;
  // formatRelativeTime uses Date.now() internally and re-runs on every
  // render, so the 30s refresh interval (via nowTick) keeps it fresh.
  const sharedAtLabel = mounted
    ? formatRelativeTime(record.updatedAt)
    : formatGeneratedTime(record.updatedAt);

  function moveExperimentFocus(delta: number | "home" | "end") {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-shared-experiment]"));
    if (nodes.length === 0) return;
    const currentIndex = nodes.findIndex((n) => n === document.activeElement);
    let nextIndex = 0;
    if (delta === "home") nextIndex = 0;
    else if (delta === "end") nextIndex = nodes.length - 1;
    else nextIndex = Math.max(0, Math.min(nodes.length - 1, (currentIndex < 0 ? 0 : currentIndex) + delta));
    nodes[nextIndex].focus();
  }

  return (
    <main id="main-content" className="min-h-screen animate-[fadeInDown_280ms_ease-out_both] bg-muted px-4 py-4 pb-20 pt-safe text-foreground motion-reduce:animate-none sm:px-6 sm:py-6 sm:pb-6 lg:px-8">
      <a
        href="#validation-decisions"
        onClick={(e) => {
          const target = document.getElementById("validation-decisions");
          if (target) {
            e.preventDefault();
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: false });
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            history.replaceState(null, "", "#validation-decisions");
          }
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to validation decisions
      </a>
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-4 flex flex-col gap-3 border-b border-card pb-4 sm:mb-6 sm:gap-4 sm:pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-foreground text-white sm:size-11">
              <Compass className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-signal-challenges">
                LaunchLens AI
              </p>
              <h1 className="text-xl font-semibold">
                {workspace.landingPage?.headline || "Shared GTM workspace"}
              </h1>
              <p className="mt-1 text-xs text-muted">
                Read-only shared snapshot
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-fit rounded-md border border-card bg-card px-3 py-2 text-sm text-foreground/80" title="This shared snapshot is read-only. You can view, copy, or export the workspace, but edits are disabled." aria-label="Read-only: view and export only">Read-only snapshot</span>
            <ExpiryBadge
              expiresAt={record.expiresAt}
              mounted={mounted}
              nowTick={nowTick}
            />
            <CopyMarkdownButton workspace={workspace} />
            <DownloadMarkdownButton workspace={workspace} />
            <DownloadJsonButton workspace={workspace} />
            <CopyLinkButton />
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
            >
              Open the demo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-lg border border-card bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-md bg-signal-supports px-2 py-1 font-medium text-signal-supports">
              {formatProviderLabel(workspace.provider)}
            </span>
            <span title={`Generated at ${workspace.generatedAt}`}>
              Generated {formatGeneratedTime(workspace.generatedAt)}
            </span>
            <span title={`Shared at ${record.updatedAt}`}>
              Shared {sharedAtLabel}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold leading-8">
            {workspace.landingPage.headline}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-foreground/80">
            {workspace.summary}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <ReadOnlySection title="Target users" icon={UsersRound} collapsible sectionId="target-users">
            <Bullets items={workspace.targetUsers} />
          </ReadOnlySection>
          <ReadOnlySection title="Pain map" icon={Target} collapsible sectionId="pain-map">
            <Bullets items={workspace.pains} />
          </ReadOnlySection>
          <ReadOnlySection title="MVP scope" icon={ClipboardList} collapsible sectionId="mvp-scope">
            <Bullets items={workspace.mvpScope} />
          </ReadOnlySection>
          <ReadOnlySection title="Landing page copy" icon={Megaphone} collapsible sectionId="landing-page-copy">
            <p className="mb-4 text-sm font-semibold leading-6">
              {workspace.landingPage.subheadline}
            </p>
            <Bullets items={workspace.landingPage.proofBullets} />
          </ReadOnlySection>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ReadOnlySection title="Feature backlog" icon={ClipboardCheck} collapsible sectionId="feature-backlog">
            <div className="space-y-3">
              {workspace.backlog.map((item, index) => (
                <article
                  // Use position key — backlog is not reorderable in the share
                  // view so index-based keys are stable and avoid duplicates
                  // when two backlog items share the same feature text.
                  key={index}
                  className="rounded-md border border-card bg-input p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{item.feature}</h3>
                    <span className="rounded-md bg-signal-neutral px-2 py-1 text-xs font-semibold text-signal-neutral">
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-foreground/80">
                    {item.why}
                  </p>
                </article>
              ))}
            </div>
          </ReadOnlySection>
          <ReadOnlySection title="Pricing hypothesis" icon={CircleDollarSign} collapsible sectionId="pricing-hypothesis">
            <p className="mb-4 text-sm leading-6 text-foreground/80">
              {workspace.pricing.hypothesis}
            </p>
            <Bullets items={workspace.pricing.tiers} />
          </ReadOnlySection>
          <ReadOnlySection title="Launch plan" icon={CalendarDays} collapsible sectionId="launch-plan">
            <Bullets items={workspace.launchPlan} />
          </ReadOnlySection>
          <ReadOnlySection title="Execution tasks" icon={CheckCircle2} collapsible sectionId="execution-tasks">
            <div className="space-y-3">
              {workspace.tasks.map((task, index) => (
                <article
                  // Position key — tasks are not reorderable in the share
                  // view and two tasks may legitimately share a title
                  // (e.g. "TBD" placeholders).
                  key={index}
                  className="rounded-md border border-card bg-input p-4"
                >
                  <h3 className="text-sm font-semibold">{task.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/80">
                    {task.owner} owns {task.outcome}. Due {task.due}.
                  </p>
                </article>
              ))}
            </div>
          </ReadOnlySection>
        </div>

        <div className="mt-6">
          <ReadOnlySection title="Validation decisions" icon={FlaskConical} collapsible sectionId="validation-decisions">
            <p className="mb-4 text-sm leading-6 text-muted">
              Evidence notes and sources remain private. This shared view shows
              decision state and evidence counts only.
            </p>
            {archivedExperiments.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>
                  Showing {visibleExperiments.length} of {experiments.length} hypotheses
                  {archivedExperiments.length > 0
                    ? ` (${archivedExperiments.length} archived)`
                    : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  aria-pressed={showArchived}
                  aria-label={showArchived ? "Hide archived hypotheses" : "Show archived hypotheses"}
                  className="inline-flex items-center gap-1 rounded-md border border-input bg-card px-2 py-1 text-xs font-medium text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  <Archive className="size-3" aria-hidden="true" />
                  {showArchived ? "Hide archived" : `Show archived (${archivedExperiments.length})`}
                </button>
              </div>
            )}
            <div className="divide-y divide-[#dfe5dd]">
              {visibleExperiments.map((experiment, index) => {
                const linkedTask = workspace.tasks.find(
                  (task, taskIndex) =>
                    taskIdentity(task, taskIndex) === experiment.linkedTaskId,
                );

                return (
                  <article
                    key={experiment.id}
                    data-shared-experiment
                    aria-label={`Hypothesis ${index + 1} of ${visibleExperiments.length}: ${experiment.assumption.slice(0, 80)}${experiment.archived ? " (archived)" : ""}`}
                    tabIndex={focusedExperimentId === null ? (index === 0 ? 0 : -1) : focusedExperimentId === experiment.id ? 0 : -1}
                    onFocus={() => setFocusedExperimentId(experiment.id)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") { event.preventDefault(); moveExperimentFocus(1); }
                      else if (event.key === "ArrowUp") { event.preventDefault(); moveExperimentFocus(-1); }
                      else if (event.key === "Home") { event.preventDefault(); moveExperimentFocus("home"); }
                      else if (event.key === "End") { event.preventDefault(); moveExperimentFocus("end"); }
                    }}
                    className={`py-4 first:pt-0 last:pb-0 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset focus-visible:rounded-md ${
                      experiment.archived ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-signal-challenges">
                        H{index + 1}
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 font-semibold capitalize text-foreground/80">
                        {experiment.status}
                      </span>
                      {experiment.archived && (
                        <span
                          className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-800"
                          title="This hypothesis has been archived by the owner."
                        >
                          <Archive className="size-3" aria-hidden="true" />
                          Archived
                        </span>
                      )}
                      <span className="text-muted">
                        {experiment.evidenceCount} evidence item
                        {experiment.evidenceCount === 1 ? "" : "s"}
                      </span>
                      <span className="text-muted">
                        {experiment.confidence} confidence
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold leading-6">
                      {experiment.assumption}
                    </h3>
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="font-semibold text-foreground">Decision</dt>
                        <dd className="mt-1 leading-6 text-foreground/80">
                          {experiment.decision || "Pending"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-foreground">
                          Next action
                        </dt>
                        <dd className="mt-1 leading-6 text-foreground/80">
                          {experiment.nextAction || "Pending"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-foreground">
                          Linked task
                        </dt>
                        <dd className="mt-1 leading-6 text-foreground/80">
                          {linkedTask?.title ?? "None"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
              {visibleExperiments.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">
                  No active hypotheses. Toggle "Show archived" above to view archived ones.
                </p>
              )}
            </div>
          </ReadOnlySection>
        </div>
      </div>
    </main>
  );
}

