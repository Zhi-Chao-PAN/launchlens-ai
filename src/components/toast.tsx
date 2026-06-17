"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X, Undo2 } from "lucide-react";
import { hasOpenOverlay } from "@/lib/launchlens/overlays";

export type ToastType = "success" | "error" | "info";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
  leaving?: boolean;
  action?: ToastAction;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, durationMs?: number, action?: ToastAction) => void;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;
const TOAST_EXIT_MS = 220;

type TimerState = {
  handle: number;
  startedAt: number;
  waitMs: number;
  totalMs: number;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, TimerState>>(new Map());
  const toastsRef = useRef<Toast[]>([]);

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const dismissToast = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing) {
      window.clearTimeout(existing.handle);
      timersRef.current.delete(id);
    }
    window.dispatchEvent(new CustomEvent("launchlens:toast-dismissing", { detail: id }));
    setToasts((current) => {
      const target = current.find((t) => t.id === id);
      if (!target || target.leaving) return current;
      window.setTimeout(() => {
        setToasts((c) => c.filter((t) => t.id !== id));
      }, TOAST_EXIT_MS);
      return current.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    });
  }, []);

  const startTimer = useCallback((id: string, waitMs: number, totalMs: number) => {
    const existing = timersRef.current.get(id);
    if (existing) window.clearTimeout(existing.handle);
    const handle = window.setTimeout(() => dismissToast(id), waitMs);
    timersRef.current.set(id, { handle, startedAt: performance.now(), waitMs, totalMs });
  }, [dismissToast]);

  const dismissAllToasts = useCallback(() => {
    const snapshot = [...toastsRef.current];
    for (const t of snapshot) {
      if (!t.leaving) dismissToast(t.id);
    }
  }, [dismissToast]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", durationMs = 4000, action?: ToastAction) => {
      const id = `toast-${++toastIdCounter}`;
      setToasts((current) => [...current, { id, type, message, durationMs, leaving: false, action }]);
      if (durationMs && durationMs > 0) {
        startTimer(id, durationMs, durationMs);
      }
    },
    [startTimer],
  );

  // Track Shift so Shift+Escape can dismiss all toasts.
  const shiftHeldRef = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Shift") shiftHeldRef.current = true; };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === "Shift") shiftHeldRef.current = false; };
    const onBlur = () => { shiftHeldRef.current = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    function handleEscape() {
      // Let modals/wizards/dropdowns handle Escape first — do not dismiss toasts
      // when any overlay is open.
      if (hasOpenOverlay()) return;
      if (shiftHeldRef.current) {
        const snapshot = [...toastsRef.current];
        for (const t of snapshot) {
          if (!t.leaving) dismissToast(t.id);
        }
        return;
      }
      const current = toastsRef.current;
      for (let i = current.length - 1; i >= 0; i--) {
        if (!current[i].leaving) {
          dismissToast(current[i].id);
          return;
        }
      }
    }
    window.addEventListener("launchlens:escape", handleEscape);
    return () => window.removeEventListener("launchlens:escape", handleEscape);
  }, [dismissToast]);

  useEffect(() => {
    function onPause(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      const state = timersRef.current.get(id);
      if (!state) return;
      const elapsed = performance.now() - state.startedAt;
      const remainingMs = Math.max(0, state.waitMs - elapsed);
      window.clearTimeout(state.handle);
      timersRef.current.set(id, { ...state, handle: 0, waitMs: remainingMs, startedAt: 0 });
      window.dispatchEvent(
        new CustomEvent("launchlens:toast-paused", {
          detail: { id, remainingMs, totalMs: state.totalMs },
        }),
      );
    }
    function onResume(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      const state = timersRef.current.get(id);
      if (!state) return;
      const toast = toastsRef.current.find((t) => t.id === id);
      if (!toast || toast.leaving) return;
      if (state.waitMs <= 0) {
        dismissToast(id);
        return;
      }
      startTimer(id, state.waitMs, state.totalMs);
      window.dispatchEvent(
        new CustomEvent("launchlens:toast-resumed", {
          detail: { id, remainingMs: state.waitMs, totalMs: state.totalMs },
        }),
      );
    }
    window.addEventListener("launchlens:toast-pause", onPause);
    window.addEventListener("launchlens:toast-resume", onResume);
    return () => {
      window.removeEventListener("launchlens:toast-pause", onPause);
      window.removeEventListener("launchlens:toast-resume", onResume);
    };
  }, [dismissToast, startTimer]);

  // When the tab is backgrounded browsers throttle setTimeout, so toast timers
  // drift. Pause all running toasts on `visibilitychange` to hidden and resume
  // them on visible — onPause captures the DOM-computed remaining width so
  // progress reflects wall-clock time accurately.
  useEffect(() => {
    function onVisibility() {
      if (typeof document === "undefined") return;
      const snapshot = [...toastsRef.current];
      for (const t of snapshot) {
        if (t.leaving) continue;
        if (document.visibilityState === "hidden") {
          window.dispatchEvent(new CustomEvent("launchlens:toast-pause", { detail: t.id }));
        } else {
          window.dispatchEvent(new CustomEvent("launchlens:toast-resume", { detail: t.id }));
        }
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((s) => window.clearTimeout(s.handle));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, dismissAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer() {
  const { toasts, dismissToast, dismissAllToasts } = useToast();
  const activeCount = toasts.filter((t) => !t.leaving).length;

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 z-[100] flex max-w-sm flex-col items-end gap-2" style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
      {activeCount >= 2 && (
        <button
          type="button"
          onClick={dismissAllToasts}
          className="mr-1 rounded-md border border-input bg-card/95 px-2 py-0.5 text-[11px] font-medium text-muted shadow-sm backdrop-blur transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          aria-label="Dismiss all notifications"
        >
          Dismiss all
        </button>
      )}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}


﻿function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [entered, setEntered] = useState(false);
  /** Width percentage of the progress bar fill (100 = full time left, 0 = done). */
  const [widthPct, setWidthPct] = useState(100);
  /** Transition duration in ms for the current shrink phase; 0 means no transition (snap). */
  const [transitionMs, setTransitionMs] = useState(0);
  const barInnerRef = useRef<HTMLDivElement | null>(null);
  const shrinkRafRef = useRef<number | null>(null);

  const visible = entered && !toast.leaving;
  const totalMs = toast.durationMs ?? 4000;

  /** Begin shrinking from currentWidth% to 0% over durationMs using a CSS transition. */
  const beginShrink = useCallback((fromPct: number, durationMs: number) => {
    if (shrinkRafRef.current != null) {
      window.cancelAnimationFrame(shrinkRafRef.current);
      shrinkRafRef.current = null;
    }
    // Snap without transition first, then enable transition and shrink to 0.
    setTransitionMs(0);
    setWidthPct(fromPct);
    shrinkRafRef.current = window.requestAnimationFrame(() => {
      shrinkRafRef.current = window.requestAnimationFrame(() => {
        setTransitionMs(Math.max(1, durationMs));
        setWidthPct(0);
        shrinkRafRef.current = null;
      });
    });
  }, []);

  // Animate toast slide-in and kick off the progress bar shrink.
  useEffect(() => {
    // First rAF flips `entered` for the slide-in; second rAF starts the progress shrink.
    const f1 = window.requestAnimationFrame(() => {
      setEntered(true);
      if (totalMs > 0) {
        const f2 = window.requestAnimationFrame(() => {
          beginShrink(100, totalMs);
        });
        shrinkRafRef.current = f2;
      }
    });
    return () => {
      window.cancelAnimationFrame(f1);
      if (shrinkRafRef.current != null) window.cancelAnimationFrame(shrinkRafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePause = useCallback(() => {
    // Freeze at current computed width by disabling the transition and setting width to current value.
    const inner = barInnerRef.current;
    if (inner && inner.parentElement && inner.parentElement.clientWidth > 0) {
      const currentPct = (inner.clientWidth / inner.parentElement.clientWidth) * 100;
      setTransitionMs(0);
      setWidthPct(currentPct);
    }
    window.dispatchEvent(new CustomEvent("launchlens:toast-pause", { detail: toast.id }));
  }, [toast.id]);

  const handleResume = useCallback(() => {
    window.dispatchEvent(new CustomEvent("launchlens:toast-resume", { detail: toast.id }));
  }, [toast.id]);

  useEffect(() => {
    function onPaused() {
      // Pause was already applied via handlePause reading DOM; nothing else needed here.
    }
    function onResumed(e: Event) {
      const d = (e as CustomEvent<{ id: string; remainingMs: number; totalMs: number }>).detail;
      if (d.id !== toast.id) return;
      // Resume shrinking from current width over remainingMs.
      const inner = barInnerRef.current;
      let currentPct = widthPct;
      if (inner && inner.parentElement && inner.parentElement.clientWidth > 0) {
        currentPct = (inner.clientWidth / inner.parentElement.clientWidth) * 100;
      }
      beginShrink(currentPct, d.remainingMs);
    }
    function onDismissing(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (id !== toast.id) return;
      // Fast-snap to 0 for a clean exit.
      if (shrinkRafRef.current != null) window.cancelAnimationFrame(shrinkRafRef.current);
      setTransitionMs(120);
      setWidthPct(0);
    }
    window.addEventListener("launchlens:toast-paused", onPaused);
    window.addEventListener("launchlens:toast-resumed", onResumed);
    window.addEventListener("launchlens:toast-dismissing", onDismissing);
    return () => {
      window.removeEventListener("launchlens:toast-paused", onPaused);
      window.removeEventListener("launchlens:toast-resumed", onResumed);
      window.removeEventListener("launchlens:toast-dismissing", onDismissing);
    };
  }, [toast.id, widthPct, beginShrink]);

  const icons = {
    success: <CheckCircle2 className="size-5 shrink-0 text-accent" aria-hidden="true" />,
    error: <AlertTriangle className="size-5 shrink-0 text-signal-challenges" aria-hidden="true" />,
    info: <Info className="size-5 shrink-0 text-info" aria-hidden="true" />,
  };

  const borders = {
    success: "border-l-[#138a72]",
    error: "border-l-[#d85b3f]",
    info: "border-l-[#4f7fb8]",
  };

  const progressColors = {
    success: "bg-primary",
    error: "bg-signal-challenges",
    info: "bg-info",
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      className={[
        "relative flex items-start gap-3 overflow-hidden rounded-md border border-card border-l-4 bg-card px-4 py-3 shadow-lg",
        borders[toast.type],
        visible
          ? "opacity-100 translate-x-0"
          : "pointer-events-none opacity-0 translate-x-3",
        "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out",
      ].join(" ")}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm leading-5 text-foreground">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="shrink-0 flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        >
          <Undo2 className="size-3.5" aria-hidden="true" />
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 rounded text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(widthPct)}
        aria-label="Time remaining"
      >
        <div
          ref={barInnerRef}
          className={["h-full", progressColors[toast.type]].join(" ")}
          style={{
            width: `${widthPct}%`,
            transition: transitionMs > 0 ? `width ${transitionMs}ms linear` : "none",
          }}
        />
      </div>
    </div>
  );
}
