import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Database,
  FileCheck2,
  GitBranch,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  Target,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Study - LaunchLens AI",
  description:
    "A reviewer-facing case study for LaunchLens AI: product problem, AI workflow, cloud architecture, release evidence, and next-stage plan.",
  openGraph: {
    title: "LaunchLens AI case study",
    description:
      "From founder brief to evidence-grounded GTM decisions, with cloud persistence and production verification.",
    images: [
      {
        url: "/og.png",
        width: 1280,
        height: 640,
        alt: "LaunchLens AI portfolio cover",
      },
    ],
  },
};

const workflowStages = [
  {
    title: "Founder brief",
    body: "A raw product idea starts the flow, with deterministic examples for B2B SaaS activation, clinic operations, and creator commerce.",
  },
  {
    title: "Structured GTM workspace",
    body: "The provider returns target users, pains, MVP scope, backlog, launch content, pricing, risks, assumptions, and execution tasks.",
  },
  {
    title: "Validation evidence",
    body: "Each assumption becomes a stable experiment so evidence, confidence, decisions, and next actions do not drift when the plan changes.",
  },
  {
    title: "Cited decision brief",
    body: "The decision copilot can only cite recorded evidence IDs and rejects stale or invented citations before the UI accepts a brief.",
  },
  {
    title: "Cloud recovery and sharing",
    body: "Private snapshots, recovery keys, tenant isolation, RBAC, and public-share projections prove the workflow can leave local storage safely.",
  },
];

const evidenceRows = [
  {
    label: "Local quality gate",
    command: "npm run quality",
    result: "lint, tests, typecheck, evals, build, audit",
  },
  {
    label: "Portfolio package",
    command: "npm run verify:portfolio",
    result: "case study, demo script, README, runbook, and production packet stay linked",
  },
  {
    label: "Production demo",
    command: "npm run verify:production-demo",
    result: "public status plus browser e2e against the live URL",
  },
  {
    label: "Cloud release",
    command: "npm run release:cloud",
    result: "migration, schema verifier, workspace smoke, tenant smoke, and RBAC smoke",
  },
  {
    label: "Release evidence",
    command: "npm run evidence:release",
    result: "ignored Markdown and JSON proof packet for the current production SHA",
  },
];

const engineeringSignals = [
  {
    icon: BrainCircuit,
    title: "Provider boundaries",
    body: "Mock mode is deterministic. Live MiniMax and OpenAI-compatible providers are server-side opt-ins with host allowlists, timeouts, body caps, and schema checks.",
  },
  {
    icon: ShieldCheck,
    title: "Evidence discipline",
    body: "AI-generated plans are editable, but validation evidence is human state. Decision briefs must cite exact evidence IDs.",
  },
  {
    icon: Database,
    title: "Cloud persistence",
    body: "Neon-backed snapshots, recovery migration, quotas, and idempotent migrations give the project a real data layer without breaking local-only mode.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy projection",
    body: "Public shares expose summary status and decision state while excluding founder input, evidence notes, sources, owner credentials, and private briefs.",
  },
  {
    icon: Workflow,
    title: "Release operations",
    body: "CI, hosted visual regression, post-promotion verification, cloud smoke, and release evidence turn the project into an inspectable artifact.",
  },
  {
    icon: Cloud,
    title: "Reviewer path",
    body: "The live demo, this case study, the written case study, and the demo script are now connected through an explicit portfolio verifier.",
  },
];

const nextMilestones = [
  "Shorten the reviewer path with a one-click evidence index and current workflow-run links.",
  "Use the Commercial readiness plan for onboarding, plan limits, and billing re-entry design.",
  "Extend eval history with latency and quality drift signals that are visible from the public case study.",
  "Turn the case-study page into a durable release-note surface once product analytics exist.",
];

export default function CaseStudyPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-background text-foreground"
    >
      <section className="border-b border-card bg-muted">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-signal-supports px-3 py-1 text-xs font-semibold uppercase text-signal-supports">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Portfolio case study
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                LaunchLens AI turns founder ideas into evidence-grounded GTM
                decisions.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-foreground/80">
                This is the reviewer-facing map for the project: what problem
                it solves, how the AI workflow is constrained, how cloud
                persistence works, and which gates prove the production demo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
              >
                Open product
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="https://github.com/Zhi-Chao-PAN/launchlens-ai/blob/main/docs/PORTFOLIO_CASE_STUDY.md"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-input bg-card px-5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
              >
                Read written case study
              </a>
              <Link
                href="/readiness"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-input bg-card px-5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
              >
                Commercial readiness
              </Link>
            </div>
          </div>
          <div className="min-w-0">
            <Image
              src="/screenshots/launchlens-desktop.png"
              alt="LaunchLens AI desktop workspace showing the go-to-market plan and validation board"
              width={1440}
              height={900}
              priority
              className="h-auto w-full rounded-lg border border-card bg-card shadow-sm"
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-card">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              Product loop
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              The model helps, but evidence controls the decision.
            </h2>
          </div>
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {workflowStages.map((stage, index) => (
              <li
                key={stage.title}
                className="rounded-lg border border-card bg-card p-4"
              >
                <span className="text-xs font-semibold text-accent">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-sm font-semibold">{stage.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground/75">
                  {stage.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-card bg-muted">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              Engineering signals
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              What a reviewer should inspect first
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {engineeringSignals.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-lg border border-card bg-card p-5"
                  >
                    <Icon className="size-5 text-accent" aria-hidden="true" />
                    <h3 className="mt-4 text-base font-semibold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-foreground/75">
                      {item.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
          <aside className="flex flex-col justify-between gap-5 rounded-lg border border-card bg-card p-5">
            <div>
              <Image
                src="/screenshots/launchlens-mobile.png"
                alt="LaunchLens AI mobile workspace"
                width={390}
                height={844}
                className="mx-auto h-auto max-h-[560px] w-auto rounded-lg border border-card"
                sizes="390px"
              />
            </div>
            <p className="text-sm leading-6 text-foreground/75">
              The mobile path is part of the portfolio signal: the product is
              not only a desktop mockup, and the release gate keeps mobile e2e
              coverage in the same production demo suite.
            </p>
          </aside>
        </div>
      </section>

      <section className="border-b border-card">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              Evidence map
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              The case study is backed by commands, not just prose.
            </h2>
            <p className="mt-3 text-sm leading-6 text-foreground/75">
              `verify:portfolio` keeps this public page, the written case
              study, README, demo script, runbook, and production packet wired
              together.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-card bg-card">
            <div className="grid grid-cols-[1fr_1fr_1.2fr] border-b border-card bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted">
              <span>Gate</span>
              <span>Command</span>
              <span>Proof</span>
            </div>
            {evidenceRows.map((row) => (
              <div
                key={row.command}
                className="grid gap-3 border-b border-card px-4 py-4 text-sm last:border-b-0 md:grid-cols-[1fr_1fr_1.2fr]"
              >
                <span className="font-semibold">{row.label}</span>
                <code className="break-words rounded-md bg-muted px-2 py-1 text-xs text-foreground/80">
                  {row.command}
                </code>
                <span className="leading-6 text-foreground/75">
                  {row.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-card bg-muted">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          <article className="rounded-lg border border-card bg-card p-5">
            <Target className="size-5 text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Problem</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/75">
              Founders can generate ideas quickly, but the hard part is tying
              positioning, launch scope, evidence, and decisions into one
              loop that survives handoff.
            </p>
          </article>
          <article className="rounded-lg border border-card bg-card p-5">
            <Rocket className="size-5 text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Product answer</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/75">
              LaunchLens creates a structured GTM workspace, lets humans add
              evidence, and then asks AI to synthesize only evidence-cited
              recommendations.
            </p>
          </article>
          <article className="rounded-lg border border-card bg-card p-5">
            <GitBranch className="size-5 text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Next stage</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/75">
              The next work is not more random features. It is reviewer
              evidence indexing, commercial-readiness planning, and visible
              eval drift signals.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              Next milestones
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              What comes after this portfolio release
            </h2>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {nextMilestones.map((milestone) => (
              <li
                key={milestone}
                className="flex gap-3 rounded-lg border border-card bg-card p-4 text-sm leading-6 text-foreground/80"
              >
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <span>{milestone}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-card bg-foreground text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold">LaunchLens AI</p>
            <p className="mt-1 text-sm text-white/70">
              Production demo, written case study, and release gates are now
              connected as one reviewer path.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
            >
              Open product
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="https://github.com/Zhi-Chao-PAN/launchlens-ai/actions"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-white/30 px-4 text-sm font-semibold text-white transition hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
            >
              View verification
              <FileCheck2 className="size-4" aria-hidden="true" />
            </a>
            <Link
              href="/readiness"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-white/30 px-4 text-sm font-semibold text-white transition hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
            >
              Commercial readiness
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
