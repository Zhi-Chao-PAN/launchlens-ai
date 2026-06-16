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
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
  /** True while the toast is playing its exit animation (kept in DOM). */
  leaving?: boolean;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;
/** Milliseconds for the CSS exit animation before removal from DOM. */
const TOAST_EXIT_MS = 220;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Per-toast auto-dismiss timers, keyed by toast id ? new toasts never reset old timers.
  const timersRef = useRef<Map<string, number>>(new Map());
  const toastsRef = useRef<Toast[]>([]);

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const dismissToast = useCallback((id: string) => {
    // Clear the auto-dismiss timer for this toast.
    const existing = timersRef.current.get(id);
    if (existing) {
      window.clearTimeout(existing);
      timersRef.current.delete(id);
    }
    setToasts((current) => {
      const target = current.find((t) => t.id === id);
      if (!target || target.leaving) return current;
      // Play exit animation, then remove.
      window.setTimeout(() => {
        setToasts((c) => c.filter((t) => t.id !== id));
      }, TOAST_EXIT_MS);
      return current.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    });
  }, []);

  const scheduleDismiss = useCallback((id: string, durationMs: number) => {
    const handle = window.setTimeout(() => {
      dismissToast(id);
    }, durationMs);
    timersRef.current.set(id, handle);
  }, [dismissToast]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", durationMs = 4000) => {
      const id = `toast-${++toastIdCounter}`;
      setToasts((current) => [...current, { id, type, message, durationMs, leaving: false }]);
      if (durationMs && durationMs > 0) {
        scheduleDismiss(id, durationMs);
      }
    },
    [scheduleDismiss],
  );

  // Dismiss latest non-leaving toast on Escape key
  useEffect(() => {
    function handleEscape() {
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

  // Pause / resume auto-dismiss on hover or focus (per-toast events dispatched from ToastItem).
  useEffect(() => {
    function onPause(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      const handle = timersRef.current.get(id);
      if (handle) {
        window.clearTimeout(handle);
        timersRef.current.delete(id);
      }
    }
    function onResume(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      // Only reschedule if toast still exists in state and isn't already leaving.
      const toast = toastsRef.current.find((t) => t.id === id);
      if (!toast || toast.leaving) return;
      const duration = toast.durationMs ?? 4000;
      const handle = window.setTimeout(() => dismissToast(id), duration);
      timersRef.current.set(id, handle);
    }
    window.addEventListener("launchlens:toast-pause", onPause);
    window.addEventListener("launchlens:toast-resume", onResume);
    return () => {
      window.removeEventListener("launchlens:toast-pause", onPause);
      window.removeEventListener("launchlens:toast-resume", onResume);
    };
  }, [dismissToast]);

  // Cleanup all timers on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((h) => window.clearTimeout(h));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
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
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  // Animate in on mount (respects prefers-reduced-motion via motion-safe:).
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const visible = entered && !toast.leaving;
  // Pause auto-dismiss while the user hovers or focuses the toast.
  const handlePause = () => window.dispatchEvent(new CustomEvent("launchlens:toast-pause", { detail: toast.id }));
  const handleResume = () => window.dispatchEvent(new CustomEvent("launchlens:toast-resume", { detail: toast.id }));

  const icons = {
    success: <CheckCircle2 className="size-5 shrink-0 text-[#138a72]" aria-hidden="true" />,
    error: <AlertTriangle className="size-5 shrink-0 text-[#d85b3f]" aria-hidden="true" />,
    info: <Info className="size-5 shrink-0 text-[#4f7fb8]" aria-hidden="true" />,
  };

  const borders = {
    success: "border-l-[#138a72]",
    error: "border-l-[#d85b3f]",
    info: "border-l-[#4f7fb8]",
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      className={[
        "flex items-start gap-3 rounded-md border border-[#d8ded4] border-l-4 bg-white px-4 py-3 shadow-lg",
        borders[toast.type],
        visible
          ? "opacity-100 translate-x-0"
          : "pointer-events-none opacity-0 translate-x-3",
        "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out",
      ].join(" ")}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm leading-5 text-[#17201d]">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 rounded text-[#8e9c93] transition hover:text-[#17201d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
