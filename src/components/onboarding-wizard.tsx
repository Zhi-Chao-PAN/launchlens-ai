"use client";

import { useEffect, useRef, useState } from "react";
import { Rocket, Sparkles, Target, UsersRound, HelpCircle, X } from "lucide-react";
import { registerShortcut } from "@/hooks/use-keyboard-shortcuts";
import { pushOverlay } from "@/lib/launchlens/overlays";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const STORAGE_KEY = "launchlens-onboarding-dismissed";

const stepIcons = [Target, Sparkles, UsersRound, Rocket];

type Listener = { show: () => void };
const listeners = new Set<Listener>();
function emitShow() {
  listeners.forEach((l) => l.show());
}

export function OnboardingWizard() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const trapRef = useFocusTrap<HTMLDivElement>(visible, { restoreFocus: false });
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const { t } = useLocale();

  const steps = [
    { icon: stepIcons[0], title: t("onboarding.step1Title"), description: t("onboarding.step1Body") },
    { icon: stepIcons[1], title: t("onboarding.step2Title"), description: t("onboarding.step2Body") },
    { icon: stepIcons[2], title: t("onboarding.step3Title"), description: t("onboarding.step3Body") },
    { icon: stepIcons[3], title: t("onboarding.step4Title"), description: t("onboarding.step4Body") },
  ];

  useEffect(() => {
    const dismissed = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!dismissed) {
      const timer = window.setTimeout(() => {
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
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
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setVisible(true);
      window.requestAnimationFrame(() => setMounted(true));
    });
    return unregister;
  }, []);

  useEffect(() => {
    const listener: Listener = {
      show: () => {
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
        setVisible(true);
        window.requestAnimationFrame(() => setMounted(true));
      },
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Register this modal with the global overlay stack so lower-priority
  // Escape listeners (toasts, etc.) defer to it; also handle Enter-to-dismiss.
  useEffect(() => {
    if (!visible) return;
    const pop = pushOverlay();

    const onEscape = (e: Event) => {
      // Because pushOverlay() marked this as the topmost overlay, this handler
      // should only fire when no higher overlay (e.g. shortcuts modal) is open.
      // Stop propagation so other listeners on the same dispatch don't act.
      e.stopImmediatePropagation?.();
      dismiss();
    };

    // Enter dismisses the tour (unless focus is on a text field/textarea/contenteditable/link).
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "A" || t.isContentEditable) return;
      // Let buttons handle their own activation via native click; dismiss after.
      if (tag === "BUTTON" || t.getAttribute("role") === "button") {
        return;
      }
      e.preventDefault();
      dismiss();
    };

    window.addEventListener("launchlens:escape", onEscape);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("launchlens:escape", onEscape);
      window.removeEventListener("keydown", onKeyDown);
      pop();
    };
  }, [visible]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setMounted(false);
    const previously = previouslyFocusedRef.current;
    window.setTimeout(() => {
      setVisible(false);
      // Return focus to the element that opened the wizard (if it is still in the DOM).
      if (previously && typeof previously.focus === "function" && document.contains(previously)) {
        previously.focus();
      }
      previouslyFocusedRef.current = null;
    }, 220);
  }

  if (!visible) return null;

  return (
    <div
      ref={trapRef} role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.ariaLabel")}
      aria-describedby="onboarding-steps onboarding-hints"
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
          "relative flex w-full max-w-lg flex-col gap-6 rounded-md border border-card bg-card p-6 shadow-2xl",
          mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2",
          "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("onboarding.dismiss")}
          className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-md text-muted transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <h2 className="pr-6 text-lg font-semibold text-foreground">
          {t("onboarding.welcome")}
        </h2>

        <ol id="onboarding-steps" className="flex flex-col gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-input text-sm font-bold text-accent">
                  {idx + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="size-4 text-accent" aria-hidden="true" />
                    {step.title}
                  </span>
                  <p className="text-sm leading-5 text-muted">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div
          id="onboarding-hints"
          className="flex flex-col gap-3 border-t border-card pt-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs leading-5 text-muted">
            {t("onboarding.hint")}
          </p>
          <button
            type="button"
            onClick={dismiss}
            autoFocus
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
          >
            {t("onboarding.getStarted")}
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
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={() => showOnboarding()}
      aria-label={t("onboarding.replayAria")}
      className={[
        "inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground/80",
        "transition hover:border-accent hover:text-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
        className,
      ].join(" ")}
    >
      <HelpCircle className="size-3.5" aria-hidden="true" />
      {t("onboarding.tour")}
    </button>
  );
}

