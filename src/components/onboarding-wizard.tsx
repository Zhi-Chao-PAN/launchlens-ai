"use client";

import { useEffect, useState } from "react";
import { Rocket, Sparkles, Target, UsersRound, HelpCircle, X } from "lucide-react";
import { registerShortcut } from "@/hooks/use-keyboard-shortcuts";

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

type Listener = { show: () => void };
const listeners = new Set<Listener>();
function emitShow() {
  listeners.forEach((l) => l.show());
}

export function OnboardingWizard() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!dismissed) {
      const timer = window.setTimeout(() => {
        setVisible(true);
        window.requestAnimationFrame(() => setMounted(true));
      }, 400);
      return () => window.clearTimeout(timer);
    }
  }, []);

  // Keyboard shortcut: Ctrl/Cmd+H re-shows the tour from anywhere.
  useEffect(() => {
    const unregister = registerShortcut("showTour", () => {
      localStorage.removeItem(STORAGE_KEY);
      setVisible(true);
      window.requestAnimationFrame(() => setMounted(true));
    });
    return unregister;
  }, []);

  useEffect(() => {
    const listener: Listener = {
      show: () => {
        setVisible(true);
        window.requestAnimationFrame(() => setMounted(true));
      },
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onEscape = () => dismiss();
    window.addEventListener("launchlens:escape", onEscape);
    return () => window.removeEventListener("launchlens:escape", onEscape);
  }, [visible]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setMounted(false);
    window.setTimeout(() => setVisible(false), 220);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick start guide"
      className={[
        "fixed inset-0 z-50 flex items-center justify-center px-4",
        mounted ? "bg-black/40 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none",
        "motion-safe:transition-[background-color,backdrop-filter] motion-safe:duration-200 motion-safe:ease-out",
      ].join(" ")}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={[
          "relative flex w-full max-w-lg flex-col gap-6 rounded-xl border border-[#d8ded4] bg-white p-6 shadow-xl",
          mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2",
          "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss quick start guide"
          className="absolute right-4 top-4 rounded text-[#8e9c93] transition hover:text-[#17201d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <h2 className="pr-6 text-lg font-semibold text-[#17201d]">
          Welcome to LaunchLens AI
        </h2>

        <ol className="flex flex-col gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5f4ef] text-sm font-bold text-[#138a72]">
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

        <div className="flex items-center justify-between gap-3 border-t border-[#d8ded4] pt-4">
          <p className="max-w-64 text-xs leading-5 text-[#8e9c93]">
            Press <kbd className="rounded border border-[#cfd8d1] bg-[#f6f8f4] px-1 font-mono">?</kbd> any time to see all keyboard shortcuts.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#17201d] px-5 text-sm font-semibold text-white transition hover:bg-[#24312d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-2"
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

export function showOnboarding() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    emitShow();
  }
}

export function ReplayTourButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => showOnboarding()}
      aria-label="Replay quick start tour"
      className={[
        "inline-flex items-center gap-1.5 rounded-md border border-[#cfd8d1] bg-white px-3 py-1.5 text-xs font-medium text-[#40504a]",
        "transition hover:border-[#138a72] hover:text-[#138a72]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1",
        className,
      ].join(" ")}
    >
      <HelpCircle className="size-3.5" aria-hidden="true" />
      Tour
    </button>
  );
}
