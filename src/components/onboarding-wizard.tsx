"use client";

import { useEffect, useState } from "react";

import { Rocket, Sparkles, Target, UsersRound } from "lucide-react";

const STORAGE_KEY = "launchlens-onboarding-dismissed";

const steps = [
  {
    icon: Target,
    title: "Choose a founder brief",
    description:
      "Select one of the three sample briefs, or write your own product idea. The brief captures your audience, market, tone, and constraints.",
  },
  {
    icon: Sparkles,
    title: "Generate a workspace",
    description:
      "Click the Generate button. The mock provider builds a complete go-to-market plan: users, pains, MVP scope, pricing, launch plan, and tasks.",
  },
  {
    icon: UsersRound,
    title: "Validate assumptions",
    description:
      "Each assumption is a hypothesis. Add evidence, set confidence, record a decision, and link an execution task. The AI decision copilot cites only your evidence.",
  },
  {
    icon: Rocket,
    title: "Save, share, or export",
    description:
      "If a database is configured, save cloud snapshots and generate privacy-safe share links. Otherwise, export your workspace as Markdown or JSON.",
  },
];

export function OnboardingWizard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);

  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick start guide"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f121c]/60 px-4"
    >
      <div className="relative flex w-full max-w-lg flex-col gap-6 rounded-xl border border-[#d8ded4] bg-white p-6 shadow-xl">
        <h2 className="pr-6 text-lg font-semibold text-[#17201d]">
          Welcome to LaunchLens AI
        </h2>

        <ol className="flex flex-col gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#138a72]/10 text-sm font-bold text-[#138a72]">
                  {idx + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#17201d]">
                    <Icon className="size-4 text-[#138a72]" aria-hidden="true" />
                    {step.title}
                  </span>
                  <p className="text-sm leading-5 text-[#607069]">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between gap-3 border-t border-[#e6ece6] pt-4">
          <p className="max-w-64 text-xs leading-5 text-[#8e9c93]">
            You can reopen this guide later from the &quot;Help&quot; menu in the header.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#17201d] px-5 text-sm font-semibold text-white transition hover:bg-[#24312d]"
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  );
}

export function resetOnboarding() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
