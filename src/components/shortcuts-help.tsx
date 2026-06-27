"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  formatShortcut,
  getShortcutList,
  registerShortcut,
} from "@/hooks/use-keyboard-shortcuts";

function ShortcutKeys({ value }: { value: string }) {
  return (
    <kbd className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
      {value.split(" + ").map((part, index) => (
        <span key={`${part}-${index}`} className="inline-flex items-center gap-1">
          {index > 0 ? <span className="text-muted">+</span> : null}
          <span>{part}</span>
        </span>
      ))}
    </kbd>
  );
}

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const off = registerShortcut("toggleShortcuts", (event) => {
      event.preventDefault();
      setOpen((value) => !value);
    });
    const onPalette = () => setOpen(false);
    window.addEventListener("launchlens:escape", close);
    window.addEventListener("launchlens:command-palette", onPalette);
    return () => {
      off?.();
      window.removeEventListener("launchlens:escape", close);
      window.removeEventListener("launchlens:command-palette", onPalette);
    };
  }, [close]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const shortcuts = getShortcutList();
  const grouped = shortcuts.reduce<Record<string, typeof shortcuts>>(
    (accumulator, shortcut) => {
      (accumulator[shortcut.category] ||= []).push(shortcut);
      return accumulator;
    },
    {},
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="Close shortcuts"
        onClick={close}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-md border border-card bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-md p-1 transition hover:bg-muted"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4 text-sm">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {category}
              </h3>
              <ul className="divide-y divide-border/50">
                {items.map((shortcut) => (
                  <li
                    key={shortcut.id}
                    className="flex items-center justify-between gap-4 py-1.5"
                  >
                    <span className="text-foreground/90">
                      {shortcut.description}
                    </span>
                    <ShortcutKeys value={formatShortcut(shortcut)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-border/50 pt-3">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Quick gestures
          </h3>
          <ul className="divide-y divide-border/50 text-[12px]">
            <li className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-foreground/90">
                Toggle hypothesis select mode for bulk actions
              </span>
              <span className="shrink-0 text-muted">Select pill</span>
            </li>
            <li className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-foreground/90">
                Filter timeline by event kind
              </span>
              <span className="shrink-0 text-muted">Filter chips</span>
            </li>
            <li className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-foreground/90">
                Reorder hypotheses and evidence
              </span>
              <span className="shrink-0 text-muted">Drag handle</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
