import { Check, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Disclosure, DisclosureGroup } from "@/components/disclosure";
import {
  commercialPlanRows,
  getDefaultCommercialPlan,
  summarizePreviewCommercialEntitlement,
} from "@/lib/launchlens/commercial-entitlements";

export const metadata: Metadata = {
  title: "Pricing - LaunchLens AI",
  description:
    "Transparent pricing for solo founders and small teams. The portfolio release shows the planned tiers, the no-secrets default, and the per-account quota envelope.",
};

const tiers = [
  {
    name: "Free demo",
    price: "$0",
    cadence: "Always",
    highlight: false,
    summary: "Try the full product workflow without an account or API keys.",
    features: [
      "Mock provider by default, no API key required",
      "Three example workspaces and the public demo",
      "Unlimited local drafts and Markdown / JSON export",
      "Decision-brief eval and provider eval run in CI",
    ],
    cta: "Open the demo",
    href: "/",
  },
  {
    name: "Solo",
    price: "$19",
    cadence: "per month",
    highlight: true,
    summary:
      "Cloud history, recovery key, and the real provider for one founder.",
    features: [
      "20 saved cloud snapshots per account, behind a capability account",
      "Handle + recovery-key restoration on a new browser",
      "Optional MiniMax or OpenAI-compatible live provider",
      "Privacy-safe read-only share links with explicit consent",
    ],
    cta: "Open billing",
    href: "/billing",
  },
  {
    name: "Team",
    price: "$79",
    cadence: "per month, per workspace",
    highlight: false,
    summary:
      "Shared workspaces with role-based access for small product teams.",
    features: [
      "Owner, editor, and viewer roles per workspace",
      "Shared evidence trail and audit log of decisions",
      "Priority access to new provider eval scenarios",
      "Onboarding help and a private Slack channel for the team",
    ],
    cta: "Open billing",
    href: "/billing",
  },
];

const entitlementRows = commercialPlanRows();
const defaultEntitlement = getDefaultCommercialPlan();
const defaultEntitlementSummary =
  summarizePreviewCommercialEntitlement(defaultEntitlement);

const frequentlyAsked = [
  {
    question: "Is the hosted demo actually free?",
    answer:
      "Yes. The public demo runs the mock provider and the local-only mode, so reviewers can run the full product workflow without providing a key. The free demo is the portfolio release you are reading right now.",
  },
  {
    question: "How does the capability account work without registration?",
    answer:
      "Your browser generates a 256-bit owner token and stores it in local storage. A recovery key plus a handle derives the same account on another browser. The recovery key never leaves the client; only its SHA-256 hash is stored server-side.",
  },
  {
    question: "What is included in the per-account quota?",
    answer:
      "Each account can hold up to 20 cloud snapshots, and the public deployment enforces a global snapshot ceiling to keep storage predictable. Quotas are checked inside a database transaction with advisory locks, so concurrent writes cannot exceed the limit.",
  },
  {
    question: "Can the hosted pricing page be exercised right now?",
    answer:
      "Yes. The Billing page reads the current subscription contract and can start Stripe Checkout when the deployment has a complete Stripe configuration. The public portfolio deployment stays in preview mode until those server-side settings are present.",
  },
];

export default function PricingPage() {
  return (
    <main id="main-content" className="min-h-screen animate-[fadeInDown_280ms_ease-out_both] bg-background text-foreground motion-reduce:animate-none">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-12 pb-24 sm:px-6 sm:pb-12 lg:px-8">
        <header className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-input bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            <Sparkles className="size-3" aria-hidden="true" />
            Portfolio pricing page
          </span>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Transparent tiers for the LaunchLens AI portfolio release
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-foreground/80 sm:text-base">
            This page documents the pricing tiers that the public demo, the
            Solo plan, and the Team plan would offer. The portfolio release
            ships the Free demo, the Solo capability account, and the
            Team-preview tenant/RBAC path. The Solo and Team buttons now open
            the billing surface; Stripe Checkout activates only when the
            deployment has complete server-side billing configuration. The
            executable entitlement contract lives in{" "}
            <code>src/lib/launchlens/commercial-entitlements.ts</code>.
          </p>
          <Link
            href="/"
            className="mt-1 rounded text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            Back to the product workspace
          </Link>
          <Link
            href="/readiness"
            className="w-fit rounded text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            Read the commercial readiness plan
          </Link>
          <a
            href="/api/commercial/entitlements"
            className="w-fit rounded text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            View the entitlement API
          </a>
          <Link
            href="/billing"
            className="w-fit rounded text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            Open subscription billing
          </Link>
        </header>

        <section
          aria-label="Pricing tiers"
          className="grid gap-4 lg:grid-cols-3"
        >
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={
                tier.highlight
                  ? "flex flex-col gap-4 rounded-md border border-accent bg-card p-6 shadow-[0_24px_80px_-68px_rgba(17,19,18,0.55)]"
                  : "flex flex-col gap-4 rounded-md border border-card bg-card p-6 shadow-[0_24px_80px_-72px_rgba(17,19,18,0.45)]"
              }
            >
              <header className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {tier.name}
                </h2>
                <p className="text-sm text-muted">{tier.summary}</p>
              </header>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-foreground">
                  {tier.price}
                </span>
                <span className="text-sm text-muted">{tier.cadence}</span>
              </div>
              <ul className="flex flex-col gap-2 text-sm leading-6 text-foreground/80">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href={tier.href}
                className={
                  tier.highlight
                    ? "mt-auto inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
                    : "mt-auto inline-flex h-10 items-center justify-center rounded-md border border-input bg-card px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
                }
              >
                {tier.cta}
              </a>
            </article>
          ))}
        </section>

        <section
          aria-label="Executable entitlement contract"
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase text-accent">
              Executable entitlement contract
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              Current public deployment resolves to{" "}
              {defaultEntitlementSummary.activePlanName}.
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-foreground/75">
              These limits are consumed by the workspace, tenant, and member
              flows before checkout is added. The public preview keeps Team
              behavior enabled so reviewer smoke tests can exercise tenant
              isolation and RBAC without billing.
            </p>
          </div>
          <div className="overflow-hidden rounded-md border border-card bg-card">
            <div className="hidden grid-cols-[1fr_0.7fr_0.7fr_0.9fr] border-b border-card bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted md:grid">
              <span>Plan</span>
              <span>Snapshots</span>
              <span>Tenants</span>
              <span>Members</span>
            </div>
            {entitlementRows.map((plan) => (
              <div
                key={plan.id}
                className="grid gap-3 border-b border-card px-4 py-4 text-sm last:border-b-0 md:grid-cols-[1fr_0.7fr_0.7fr_0.9fr]"
              >
                <div>
                  <p className="font-semibold text-foreground">{plan.name}</p>
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
        </section>

        <section aria-label="Frequently asked questions" className="grid gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Pricing questions, answered honestly
          </h2>
          <DisclosureGroup className="grid gap-3">
            {frequentlyAsked.map((item) => (
              <Disclosure key={item.question} title={item.question}>
                <p>{item.answer}</p>
              </Disclosure>
            ))}
          </DisclosureGroup>
        </section>

        <footer className="rounded-md border border-dashed border-input bg-input p-4 text-sm leading-6 text-foreground/80">
          <p>
            The billing implementation uses hosted Stripe Checkout and the
            Stripe customer portal, so LaunchLens never receives card details.
            The public deployment remains a preview whenever Stripe settings
            are absent; a visible Billing page is not presented as proof that a
            live merchant account is enabled. Operational setup remains
            documented in <code>PROJECT_MATURITY.md</code> and{" "}
            <code>docs/COMMERCIAL_READINESS.md</code>.
          </p>
        </footer>
      </div>
    </main>
  );
}
