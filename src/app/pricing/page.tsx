import { Check, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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
    cta: "Start Solo",
    href: "mailto:zhi-chao.pan@example.com?subject=LaunchLens%20AI%20Solo%20plan",
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
    cta: "Talk to us",
    href: "mailto:zhi-chao.pan@example.com?subject=LaunchLens%20AI%20Team%20plan",
  },
];

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
      "This page is a portfolio artifact. The Solo and Team tiers use mailto links by design, so a real Stripe checkout is not wired up in the public deployment. The code path for billing lives in the deliberate-non-blocking roadmap and is documented in PROJECT_MATURITY.md.",
  },
];

export default function PricingPage() {
  return (
    <main id="main-content" className="min-h-screen animate-[launchlens-fade-in_280ms_ease-out_both] bg-[#f6f8f4] text-[#17201d] motion-reduce:animate-none">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-md bg-[#f6df8f] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#493b08]">
            <Sparkles className="size-3" aria-hidden="true" />
            Portfolio pricing page
          </span>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Transparent tiers for the LaunchLens AI portfolio release
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[#40504a] sm:text-base">
            This page documents the pricing tiers that the public demo, the
            Solo plan, and the Team plan would offer. The portfolio release
            ships the Free demo, the Solo capability account, and the
            privacy-safe share path. Stripe checkout is not wired up in the
            public deployment; the Solo and Team buttons open a mailto so a
            real billing flow is never pretended to be live.
          </p>
          <Link
            href="/"
            className="mt-1 rounded text-sm font-semibold text-[#138a72] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
          >
            Back to the product workspace
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
                  ? "flex flex-col gap-4 rounded-lg border-2 border-[#138a72] bg-white p-6 shadow-sm"
                  : "flex flex-col gap-4 rounded-lg border border-[#d8ded4] bg-white p-6 shadow-sm"
              }
            >
              <header className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-[#17201d]">
                  {tier.name}
                </h2>
                <p className="text-sm text-[#607069]">{tier.summary}</p>
              </header>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-[#17201d]">
                  {tier.price}
                </span>
                <span className="text-sm text-[#607069]">{tier.cadence}</span>
              </div>
              <ul className="flex flex-col gap-2 text-sm leading-6 text-[#40504a]">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[#138a72]"
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
                    ? "mt-auto inline-flex h-10 items-center justify-center rounded-md bg-[#17201d] px-4 text-sm font-semibold text-white transition hover:bg-[#24312d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-2"
                    : "mt-auto inline-flex h-10 items-center justify-center rounded-md border border-[#cfd8d1] bg-white px-4 text-sm font-semibold text-[#17201d] transition hover:border-[#138a72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-2"
                }
              >
                {tier.cta}
              </a>
            </article>
          ))}
        </section>

        <section aria-label="Frequently asked questions" className="grid gap-3">
          <h2 className="text-lg font-semibold text-[#17201d]">
            Pricing questions, answered honestly
          </h2>
          {frequentlyAsked.map((item) => (
            <details
              key={item.question}
              className="rounded-md border border-[#d8ded4] bg-white px-4 py-3 text-sm"
            >
              <summary className="cursor-pointer rounded font-semibold text-[#17201d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1">
                {item.question}
              </summary>
              <p className="mt-2 leading-6 text-[#40504a]">{item.answer}</p>
            </details>
          ))}
        </section>

        <footer className="rounded-md border border-dashed border-[#cfd8d1] bg-[#fbfcfa] p-4 text-sm leading-6 text-[#40504a]">
          <p>
            The Solo and Team tiers on this page are placeholders. They use
            mailto links because the portfolio release does not collect payment
            data, and there is no production Stripe account wired into the
            public deployment. Reviewers can read this page as evidence that
            the team is thinking about pricing honestly, not as evidence that
            a paid product exists. The re-entry cost to wire real billing is
            documented in <code>PROJECT_MATURITY.md</code>.
          </p>
        </footer>
      </div>
    </main>
  );
}

