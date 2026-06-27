import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  KeyRound,
  Landmark,
  Rocket,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  commercialPlanRows,
  getDefaultCommercialPlan,
  summarizePreviewCommercialEntitlement,
} from "@/lib/launchlens/commercial-entitlements";

export const metadata: Metadata = {
  title: "Commercial Readiness - LaunchLens AI",
  description:
    "The LaunchLens AI commercial and productization readiness plan: evidence index, identity, billing, onboarding, eval operations, and acceptance gates.",
  openGraph: {
    title: "LaunchLens AI commercial readiness",
    description:
      "A public map for turning the portfolio product into a credible productization plan.",
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

const readinessTracks = [
  {
    icon: ClipboardCheck,
    title: "Reviewer Evidence Index",
    status: "Started",
    body: "Connect the live product, case study, pricing page, production gates, CI, release evidence, and commercial verifier into one public review path.",
  },
  {
    icon: KeyRound,
    title: "Identity and tenant model",
    status: "Design next",
    body: "Define how the existing capability-account model graduates into conventional accounts, passkeys, tenant ownership, and supportable recovery.",
  },
  {
    icon: Landmark,
    title: "Billing and plan limits",
    status: "Implemented",
    body: "Plan limits, subscription precedence, hosted Checkout, Portal, signed webhooks, event idempotency, fixed grace periods, and live AI usage metering now live in code.",
  },
  {
    icon: Rocket,
    title: "Onboarding and activation",
    status: "Design next",
    body: "Turn the strong demo into a measurable first-session path without logging founder briefs, evidence notes, sources, or provider payloads.",
  },
  {
    icon: BarChart3,
    title: "Eval and ops visibility",
    status: "Design next",
    body: "Expose decision-history quality, visual regression, cloud smoke, release evidence, and latency-risk decisions as operator-facing proof.",
  },
  {
    icon: ShieldCheck,
    title: "Security and compliance re-entry",
    status: "Design next",
    body: "Update the threat model for checkout, account linking, support access, audit logs, public shares, retention, and deletion.",
  },
];

const entitlementRows = commercialPlanRows();
const defaultEntitlement = getDefaultCommercialPlan();
const defaultEntitlementSummary =
  summarizePreviewCommercialEntitlement(defaultEntitlement);

const verificationRows = [
  {
    label: "Commercial readiness package",
    command: "npm run verify:commercial-readiness",
    proof: "Checks this public stage, the detailed plan, README, case study, maturity note, roadmap, and task list stay linked.",
  },
  {
    label: "Entitlement contract",
    command: "npx vitest run src/lib/launchlens/commercial-entitlements.test.ts src/app/api/commercial/entitlements/route.test.ts",
    proof: "Proves Free, Solo, and Team plan limits resolve to reviewer-safe API output and stable plan-limit codes.",
  },
  {
    label: "Subscription billing",
    command: "npx vitest run src/lib/launchlens/commercial-subscription.test.ts src/lib/launchlens/stripe-server.test.ts src/app/api/webhooks/stripe/route.test.ts",
    proof: "Proves billing-state precedence, fixed grace periods, signed event projection, and duplicate delivery handling.",
  },
  {
    label: "Live-provider metering",
    command: "npx vitest run src/lib/launchlens/live-provider-usage.test.ts src/app/api/generate/route.live-usage.test.ts src/app/api/decision/route.live-usage.test.ts",
    proof: "Proves monthly live AI allowance is consumed before real provider calls and skipped for demo mode.",
  },
  {
    label: "Portfolio package",
    command: "npm run verify:portfolio",
    proof: "Keeps the reviewer-facing story, public pages, demo script, and release handoff connected.",
  },
  {
    label: "Production browser demo",
    command: "npm run verify:production-demo",
    proof: "Runs the public status check and Playwright e2e suite against the deployed production URL.",
  },
  {
    label: "Cloud release gate",
    command: "npm run release:cloud",
    proof: "Verifies migration, schema, cloud save/recovery/share privacy, tenant isolation, and RBAC smoke.",
  },
  {
    label: "Decision drift gate",
    command: "npm run decision:history -- --window --size 5 --drift-threshold 5",
    proof: "Keeps cited decision quality from drifting silently across recent eval runs.",
  },
];

const currentVsNext = [
  {
    area: "Account model",
    current: "Registration-free capability account with recovery key.",
    next: "Decide how anonymous trials, passkeys, OAuth, tenant ownership, and account deletion coexist.",
  },
  {
    area: "Pricing",
    current: "Operational Billing page with Stripe-ready Checkout, Portal, subscription state, idempotent webhooks, quota precedence, and live AI usage metering.",
    next: "Run an account-owned Stripe sandbox acceptance flow, provision production prices, and archive activation evidence.",
  },
  {
    area: "Activation",
    current: "Quick-start guide plus deterministic sample briefs.",
    next: "Specify first-session events and re-entry prompts without collecting private founder content.",
  },
  {
    area: "Operations",
    current: "CI, visual regression, CodeQL, cloud smoke, provider eval, and decision eval.",
    next: "Expose release evidence, drift thresholds, latency risk, and owner response paths as a readable ops surface.",
  },
];

export default function ReadinessPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <section className="border-b border-card bg-muted">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <span className="inline-flex w-fit items-center gap-2 rounded-md bg-signal-supports px-3 py-1 text-xs font-semibold uppercase text-signal-supports">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Commercial readiness
          </span>
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1fr] lg:items-end">
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                Commercial/Productization readiness connects proof to real
                product gates.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-foreground/80">
                This page marks the next stage after the portfolio release:
                make the productization path visible, scoped, and verifiable
                while identity, billing, analytics, and support mature in
                explicit stages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href="https://github.com/Zhi-Chao-PAN/launchlens-ai/blob/main/docs/COMMERCIAL_READINESS.md"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
              >
                Read detailed plan
                <FileText className="size-4" aria-hidden="true" />
              </a>
              <Link
                href="/case-study"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-input bg-card px-5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
              >
                View case study
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-card">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              Commercial Readiness Tracks
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              The next phase is a staged productization plan.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {readinessTracks.map((track) => {
              const Icon = track.icon;
              return (
                <article
                  key={track.title}
                  className="rounded-lg border border-card bg-card p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="size-5 text-accent" aria-hidden="true" />
                    <span className="rounded-md bg-signal-neutral px-2 py-1 text-xs font-semibold text-signal-neutral">
                      {track.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">
                    {track.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/75">
                    {track.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-card bg-muted">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              Entitlement Contract
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Plan limits are now executable, not only written down.
            </h2>
            <p className="mt-3 text-sm leading-6 text-foreground/75">
              The public deployment defaults to{" "}
              {defaultEntitlementSummary.activePlanName} so tenant and RBAC
              smoke tests stay exercisable. Persisted subscription state takes
              precedence without rewriting workspace code.
            </p>
            <a
              href="/api/commercial/entitlements"
              className="mt-4 inline-flex rounded text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            >
              /api/commercial/entitlements
            </a>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="/billing"
                className="rounded text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Open Billing
              </Link>
              <a
                href="/api/commercial/subscription"
                className="rounded text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                /api/commercial/subscription
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-card bg-card">
            <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_0.9fr] border-b border-card bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted md:grid">
              <span>Plan</span>
              <span>Snapshots</span>
              <span>Tenants</span>
              <span>Members</span>
            </div>
            {entitlementRows.map((plan) => (
              <div
                key={plan.id}
                className="grid gap-3 border-b border-card px-4 py-4 text-sm last:border-b-0 md:grid-cols-[1fr_0.8fr_0.8fr_0.9fr]"
              >
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {plan.checkoutStatus}
                  </p>
                </div>
                <span>
                  <span className="font-semibold md:hidden">Snapshots: </span>
                  {plan.limits.cloudSnapshots}
                </span>
                <span>
                  <span className="font-semibold md:hidden">Tenants: </span>
                  {plan.limits.tenantsPerOwner}
                </span>
                <span>
                  <span className="font-semibold md:hidden">Members: </span>
                  {plan.limits.membersPerWorkspace}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-card bg-muted">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              Reviewer Evidence Index
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              What proves this phase is not just roadmap prose
            </h2>
            <p className="mt-3 text-sm leading-6 text-foreground/75">
              The readiness package is checked by scripts before release gates
              and production verification run.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-card bg-card">
            <div className="grid grid-cols-[1fr_1.1fr_1.3fr] border-b border-card bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted">
              <span>Gate</span>
              <span>Command</span>
              <span>Proof</span>
            </div>
            {verificationRows.map((row) => (
              <div
                key={row.command}
                className="grid gap-3 border-b border-card px-4 py-4 text-sm last:border-b-0 md:grid-cols-[1fr_1.1fr_1.3fr]"
              >
                <span className="font-semibold">{row.label}</span>
                <code className="break-words rounded-md bg-muted px-2 py-1 text-xs text-foreground/80">
                  {row.command}
                </code>
                <span className="leading-6 text-foreground/75">
                  {row.proof}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-card">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              Current to next
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Keep the portfolio proof, then add commercial surfaces carefully.
            </h2>
          </div>
          <div className="grid gap-3">
            {currentVsNext.map((item) => (
              <article
                key={item.area}
                className="grid gap-3 rounded-lg border border-card bg-card p-4 md:grid-cols-[180px_1fr_1fr]"
              >
                <h3 className="text-sm font-semibold">{item.area}</h3>
                <p className="text-sm leading-6 text-foreground/75">
                  {item.current}
                </p>
                <p className="text-sm leading-6 text-foreground/75">
                  {item.next}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          <article className="rounded-lg border border-card bg-card p-5">
            <Gauge className="size-5 text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Acceptance gate</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/75">
              The stage is accepted only when the readiness verifier, portfolio
              verifier, release readiness verifier, production demo, and cloud
              gate all pass after deployment.
            </p>
          </article>
          <article className="rounded-lg border border-card bg-card p-5">
            <UsersRound className="size-5 text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Non-goal</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/75">
              This phase does not pretend to ship Stripe, OAuth, a support
              merchant activation, OAuth, a support console, or an analytics
              warehouse. Stripe integration code is present; external account
              activation remains a separate acceptance step.
            </p>
          </article>
          <article className="rounded-lg border border-card bg-card p-5">
            <CheckCircle2 className="size-5 text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Next implementation</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/75">
              Complete the identity and tenant migration design, then add
              activation events, provider usage metering, and operator
              visibility around the implemented billing core.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
