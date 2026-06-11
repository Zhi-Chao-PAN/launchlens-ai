"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Compass,
  Loader2,
  Megaphone,
  Rocket,
  Sparkles,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
  GenerationResult,
  LaunchLensInput,
  LaunchLensWorkspace,
} from "@/lib/launchlens/types";

type LaunchWorkspaceProps = {
  initialInput: LaunchLensInput;
  initialWorkspace: LaunchLensWorkspace;
};

type SectionProps = {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
};

const tones = [
  "Practical, crisp, and founder-friendly",
  "Analytical and investor-ready",
  "Warm and community-led",
  "Technical and product-led",
];

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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-[#40504a]">
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
}: LaunchWorkspaceProps) {
  const [input, setInput] = useState(initialInput);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState("");

  const providerLabel = useMemo(() => {
    return workspace.provider === "openai"
      ? "OpenAI-compatible provider"
      : "Demo mock provider";
  }, [workspace.provider]);

  async function generate() {
    setIsGenerating(true);
    setError("");
    setFallbackNotice("");

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

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#17201d]">
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
                Generate workspace
              </button>
            </div>

            {(error || fallbackNotice) && (
              <div className="mt-4 rounded-md border border-[#e7c9bd] bg-[#fff6f1] p-3 text-sm leading-6 text-[#8b3d28]">
                {error || fallbackNotice}
              </div>
            )}
          </aside>

          <div className="space-y-6">
            <section className="rounded-lg border border-[#d8ded4] bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#d85b3f]">
                    Workspace summary
                  </p>
                  <h2 className="text-2xl font-semibold leading-8 text-[#17201d]">
                    {workspace.landingPage.headline}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[#40504a]">
                    {workspace.summary}
                  </p>
                </div>
                <div className="rounded-lg bg-[#e5f4ef] p-4">
                  <p className="text-sm font-medium text-[#0f766e]">
                    Launch CTA
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#17201d]">
                    {workspace.landingPage.cta}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-[#0f766e]">
                    Next action
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title="Target users" icon={UsersRound}>
                <BulletList items={workspace.targetUsers} />
              </Section>

              <Section title="Pain map" icon={Target}>
                <BulletList items={workspace.pains} />
              </Section>

              <Section title="MVP scope" icon={ClipboardList}>
                <BulletList items={workspace.mvpScope} />
              </Section>

              <Section title="Landing page copy" icon={Megaphone}>
                <div className="space-y-3 text-sm leading-6 text-[#40504a]">
                  <p className="font-semibold text-[#17201d]">
                    {workspace.landingPage.subheadline}
                  </p>
                  <BulletList items={workspace.landingPage.proofBullets} />
                </div>
              </Section>
            </div>

            <Section title="Feature backlog" icon={ClipboardList}>
              <div className="grid gap-3 lg:grid-cols-2">
                {workspace.backlog.map((item) => (
                  <article
                    key={item.feature}
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
                <p className="mb-4 text-sm leading-6 text-[#40504a]">
                  {workspace.pricing.hypothesis}
                </p>
                <BulletList items={workspace.pricing.tiers} />
              </Section>

              <Section title="Launch plan" icon={Rocket}>
                <BulletList items={workspace.launchPlan} />
              </Section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title="Content calendar" icon={CalendarDays}>
                <div className="space-y-3">
                  {workspace.contentCalendar.map((item) => (
                    <article
                      key={`${item.channel}-${item.angle}`}
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
                  {workspace.tasks.map((task) => (
                    <article
                      key={`${task.title}-${task.due}`}
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
