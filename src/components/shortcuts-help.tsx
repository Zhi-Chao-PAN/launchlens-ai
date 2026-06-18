"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { registerShortcut, getShortcutList, formatShortcut } from "@/hooks/use-keyboard-shortcuts";

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const off = registerShortcut("toggleShortcuts", (e) => {
      e.preventDefault();
      setOpen((v) => !v);
    });
    const onPalette = () => setOpen(false);
    window.addEventListener("launchlens:escape", close);
    window.addEventListener("launchlens:command-palette", onPalette);
    return () => { off?.(); window.removeEventListener("launchlens:escape", close); window.removeEventListener("launchlens:command-palette", onPalette); };
  }, [close]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  const shortcuts = getShortcutList();
  const grouped = shortcuts.reduce<Record<string, typeof shortcuts>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button type="button" aria-label="Close shortcuts" onClick={close} className="absolute inset-0 bg-black/50 backdrop-blur-sm" tabIndex={-1} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-card bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Keyboard shortcuts</h2>
          <button type="button" onClick={close} aria-label="Close" className="rounded p-1 hover:bg-muted">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4 text-sm">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{cat}</h3>
              <ul className="divide-y divide-border/50">
                {items.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 py-1.5">
                    <span className="text-foreground/90">{s.description}</span>
                    <kbd className="inline-flex shrink-0 items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground" dangerouslySetInnerHTML={{ __html: formatShortcut(s).replace("Ctrl+", "<span class=\"text-muted-foreground\">Ctrl</span>+").replace("⌘", "<span class=\"text-muted-foreground\">⌘</span>").replaceAll("+", " + ") }} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-border/50 pt-3">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Quick gestures</h3>
          <ul className="divide-y divide-border/50 text-[12px]">
            <li className="flex items-center justify-between gap-4 py-1.5"><span className="text-foreground/90">Toggle hypothesis select mode for bulk actions</span><span className="shrink-0 text-muted">Select pill (top bar)</span></li>
            <li className="flex items-center justify-between gap-4 py-1.5"><span className="text-foreground/90">Toggle evidence select mode per hypothesis</span><span className="shrink-0 text-muted">Select pill (card header)</span></li>
            <li className="flex items-center justify-between gap-4 py-1.5"><span className="text-foreground/90">Filter timeline by event kind</span><span className="shrink-0 text-muted">Filter chips (timeline header)</span></li>
            <li className="flex items-center justify-between gap-4 py-1.5"><span className="text-foreground/90">Reorder hypotheses / evidence</span><span className="shrink-0 text-muted">Drag handle or up/down buttons</span></li>
            <li className="flex items-center justify-between gap-4 py-1.5"><span className="text-foreground/90">Bulk-add evidence from pasted text</span><span className="shrink-0 text-muted">Paste multi-line text into the note box</span></li>
          </ul>
        </div>
        <p className="mt-4 text-[11px] text-muted">Press <kbd className="rounded border border-border bg-muted px-1 font-mono">?</kbd> any time to toggle this panel. Key labels match your operating system.</p>
      </div>
    </div>
  );
}
