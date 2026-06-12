import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Megaphone,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { SharedCloudWorkspaceRecord } from "@/lib/launchlens/cloud-workspace";
import { formatGeneratedTime } from "@/lib/launchlens/generated-time";

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
    <main className="min-h-screen bg-[#f6f8f4] px-4 py-6 text-[#17201d] sm:px-6 lg:px-8">
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
          <span className="w-fit rounded-md border border-[#d8ded4] bg-white px-3 py-2 text-sm text-[#40504a]">
            Read-only snapshot
          </span>
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
      </div>
    </main>
  );
}
