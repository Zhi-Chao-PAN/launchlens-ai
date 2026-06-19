"use client";

import { Loader2 } from "lucide-react";

import { useEffect, useId, useRef, useState } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const [pending, setPending] = useState(false);
  const titleId = useId();
  const bodyId = useId();
  const busyFinal = Boolean(busy) || pending;

  useEffect(() => {
    if (!open) return;
    const node = cancelRef.current;
    node?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (!busyFinal && confirmRef.current && !confirmRef.current.disabled) confirmRef.current.click();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel, busyFinal]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="w-full max-w-sm rounded-lg bg-card p-5 shadow-xl ring-1 ring-black/5"
      >
        <h3 id={titleId} className="text-base font-semibold text-foreground">{title}</h3>
        <div id={bodyId} className="mt-2 text-sm leading-6 text-muted">{body}</div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busyFinal}
            aria-disabled={busyFinal || undefined}
            className="inline-flex h-9 items-center rounded-md border border-input bg-input px-3 text-sm font-medium text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={busyFinal}
            onClick={async () => {
              setPending(true);
              try { await onConfirm(); onCancel(); } catch { /* parent owns error UX */ } finally { setPending(false); }
            }}
            aria-busy={busyFinal || undefined}
            className={
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-60 " +
              (danger
                ? "bg-signal-challenges hover:opacity-90 focus-visible:ring-signal-challenges"
                : "bg-primary hover:bg-primary-hover focus-visible:ring-[var(--ring-color)]")
            }
          >
            {busyFinal ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}