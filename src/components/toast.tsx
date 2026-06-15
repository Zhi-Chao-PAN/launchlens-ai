"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info", durationMs = 4000) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts((current) => [...current, { id, type, message, durationMs }]);
  }, []);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts
      .filter((t) => t.durationMs && t.durationMs > 0)
      .map((t) => window.setTimeout(() => dismissToast(t.id), t.durationMs));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, dismissToast]);

  // Dismiss latest toast on Escape key
  useEffect(() => {
    function handleEscape() {
      setToasts((current) => current.slice(0, -1));
    }
    window.addEventListener("launchlens:escape", handleEscape);
    return () => window.removeEventListener("launchlens:escape", handleEscape);
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
      className={`flex items-start gap-3 rounded-md border border-[#d8ded4] border-l-4 bg-white px-4 py-3 shadow-lg ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm leading-5 text-[#17201d]">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-[#8e9c93] transition hover:text-[#17201d]"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
