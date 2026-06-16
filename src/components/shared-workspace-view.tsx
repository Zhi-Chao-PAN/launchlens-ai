"use client";

﻿import Link from "next/link";
import { CopyLinkButton } from "@/components/copy-link-button";
import { CopyMarkdownButton } from "@/components/copy-markdown-button";
import { DownloadJsonButton } from "@/components/download-json-button";
import { DownloadMarkdownButton } from "@/components/download-markdown-button";
import {
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

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { SharedCloudWorkspaceRecord } from "@/lib/launchlens/cloud-workspace";
import { formatGeneratedTime } from "@/lib/launchlens/generated-time";
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
    <section className="rounded-lg border border-card bg-card shadow-sm overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="w-full flex items-center gap-2 p-4 sm:p-5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-inset"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-[#e5f4ef] text-[#0f766e] sm:size-8">
            <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
          </span>
          <h2 className="flex-1 text-sm sm:text-base font-semibold text-foreground">{title}</h2>
          <ChevronDown
            className={`size-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex items-center gap-2 p-4 pb-0 sm:p-5 sm:pb-0">
          <span className="flex size-7 items-center justify-center rounded-md bg-[#e5f4ef] text-[#0f766e] sm:size-8">
            <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm sm:text-base font-semibold text-foreground">{title}</h2>
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
          key={`${item}-${index}`}
          className="flex gap-3 text-sm leading-6 text-foreground/80"
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

export function SharedWorkspaceView({
  record,
}: {
  record: SharedCloudWorkspaceRecord;
}) {
  const { workspace } = record;

  return (
    <main id="main-content" className="min-h-screen animate-[fadeInDown_280ms_ease-out_both] bg-muted px-4 py-4 pb-20 pt-safe text-foreground motion-reduce:animate-none sm:px-6 sm:py-6 sm:pb-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-4 flex flex-col gap-3 border-b border-card pb-4 sm:mb-6 sm:gap-4 sm:pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#17201d] text-white sm:size-11">
              <Compass className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-[#d85b3f]">
                LaunchLens AI
              </p>
              <h1 className="text-xl font-semibold">Shared GTM workspace</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-fit rounded-md border border-card bg-card px-3 py-2 text-sm text-foreground/80">
              Read-only snapshot
            </span>
            <CopyMarkdownButton workspace={workspace} />
            <DownloadMarkdownButton workspace={workspace} />
            <DownloadJsonButton workspace={workspace} />
            <CopyLinkButton />
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#138a72] px-3 text-sm font-semibold text-white transition hover:bg-[#0f7665] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cbe8df] focus-visible:ring-offset-2"
            >
              Open the demo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-lg border border-card bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-md bg-[#e5f4ef] px-2 py-1 font-medium text-[#0f766e]">
              {workspace.provider} provider
            </span>
            <span>Generated {formatGeneratedTime(workspace.generatedAt)}</span>
            <span>Shared {formatGeneratedTime(record.updatedAt)}</span>
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
                  key={`${item.feature}-${index}`}
                  className="rounded-md border border-card bg-[#fbfcfa] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{item.feature}</h3>
                    <span className="rounded-md bg-[#f6df8f] px-2 py-1 text-xs font-semibold text-[#493b08]">
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
                  key={`${task.title}-${index}`}
                  className="rounded-md border border-card bg-[#fbfcfa] p-4"
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
            <div className="divide-y divide-[#dfe5dd]">
              {record.execution.experiments.map((experiment, index) => {
                const linkedTask = workspace.tasks.find(
                  (task, taskIndex) =>
                    taskIdentity(task, taskIndex) === experiment.linkedTaskId,
                );

                return (
                  <article key={experiment.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-[#d85b3f]">
                        H{index + 1}
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 font-semibold capitalize text-foreground/80">
                        {experiment.status}
                      </span>
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
            </div>
          </ReadOnlySection>
        </div>
      </div>
    </main>
  );
}

