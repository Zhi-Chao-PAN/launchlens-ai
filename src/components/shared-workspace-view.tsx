import Link from "next/link";
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

import type { SharedCloudWorkspaceRecord } from "@/lib/launchlens/cloud-workspace";
import { formatGeneratedTime } from "@/lib/launchlens/generated-time";
import { taskIdentity } from "@/lib/launchlens/execution";

type ReadOnlySectionProps = {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
};

function ReadOnlySection({
  title,
  icon: Icon,
  children,
}: ReadOnlySectionProps) {
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

function Bullets({ items }: { items: string[] }) {
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

export function SharedWorkspaceView({
  record,
}: {
  record: SharedCloudWorkspaceRecord;
}) {
  const { workspace } = record;

  return (
    <main id="main-content" className="min-h-screen animate-[fadeInDown_280ms_ease-out_both] bg-[#f6f8f4] px-4 py-6 pb-20 text-[#17201d] motion-reduce:animate-none sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#d8ded4] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-[#17201d] text-white">
              <Compass className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-[#d85b3f]">
                LaunchLens AI
              </p>
              <h1 className="text-xl font-semibold">Shared GTM workspace</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-fit rounded-md border border-[#d8ded4] bg-white px-3 py-2 text-sm text-[#40504a]">
              Read-only snapshot
            </span>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#17201d] px-3 text-sm font-semibold text-white transition hover:bg-[#24312d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-2"
            >
              Open the demo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-lg border border-[#d8ded4] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#607069]">
            <span className="rounded-md bg-[#e5f4ef] px-2 py-1 font-medium text-[#0f766e]">
              {workspace.provider} provider
            </span>
            <span>Generated {formatGeneratedTime(workspace.generatedAt)}</span>
            <span>Shared {formatGeneratedTime(record.updatedAt)}</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold leading-8">
            {workspace.landingPage.headline}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[#40504a]">
            {workspace.summary}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <ReadOnlySection title="Target users" icon={UsersRound}>
            <Bullets items={workspace.targetUsers} />
          </ReadOnlySection>
          <ReadOnlySection title="Pain map" icon={Target}>
            <Bullets items={workspace.pains} />
          </ReadOnlySection>
          <ReadOnlySection title="MVP scope" icon={ClipboardList}>
            <Bullets items={workspace.mvpScope} />
          </ReadOnlySection>
          <ReadOnlySection title="Landing page copy" icon={Megaphone}>
            <p className="mb-4 text-sm font-semibold leading-6">
              {workspace.landingPage.subheadline}
            </p>
            <Bullets items={workspace.landingPage.proofBullets} />
          </ReadOnlySection>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ReadOnlySection title="Feature backlog" icon={ClipboardCheck}>
            <div className="space-y-3">
              {workspace.backlog.map((item, index) => (
                <article
                  key={`${item.feature}-${index}`}
                  className="rounded-md border border-[#d8ded4] bg-[#fbfcfa] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{item.feature}</h3>
                    <span className="rounded-md bg-[#f6df8f] px-2 py-1 text-xs font-semibold text-[#493b08]">
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#40504a]">
                    {item.why}
                  </p>
                </article>
              ))}
            </div>
          </ReadOnlySection>
          <ReadOnlySection title="Pricing hypothesis" icon={CircleDollarSign}>
            <p className="mb-4 text-sm leading-6 text-[#40504a]">
              {workspace.pricing.hypothesis}
            </p>
            <Bullets items={workspace.pricing.tiers} />
          </ReadOnlySection>
          <ReadOnlySection title="Launch plan" icon={CalendarDays}>
            <Bullets items={workspace.launchPlan} />
          </ReadOnlySection>
          <ReadOnlySection title="Execution tasks" icon={CheckCircle2}>
            <div className="space-y-3">
              {workspace.tasks.map((task, index) => (
                <article
                  key={`${task.title}-${index}`}
                  className="rounded-md border border-[#d8ded4] bg-[#fbfcfa] p-4"
                >
                  <h3 className="text-sm font-semibold">{task.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#40504a]">
                    {task.owner} owns {task.outcome}. Due {task.due}.
                  </p>
                </article>
              ))}
            </div>
          </ReadOnlySection>
        </div>

        <div className="mt-6">
          <ReadOnlySection title="Validation decisions" icon={FlaskConical}>
            <p className="mb-4 text-sm leading-6 text-[#607069]">
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
                      <span className="rounded-md bg-[#eef0ed] px-2 py-1 font-semibold capitalize text-[#40504a]">
                        {experiment.status}
                      </span>
                      <span className="text-[#607069]">
                        {experiment.evidenceCount} evidence item
                        {experiment.evidenceCount === 1 ? "" : "s"}
                      </span>
                      <span className="text-[#607069]">
                        {experiment.confidence} confidence
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold leading-6">
                      {experiment.assumption}
                    </h3>
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="font-semibold text-[#17201d]">Decision</dt>
                        <dd className="mt-1 leading-6 text-[#40504a]">
                          {experiment.decision || "Pending"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[#17201d]">
                          Next action
                        </dt>
                        <dd className="mt-1 leading-6 text-[#40504a]">
                          {experiment.nextAction || "Pending"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[#17201d]">
                          Linked task
                        </dt>
                        <dd className="mt-1 leading-6 text-[#40504a]">
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

