"use client";

import { useEffect, useState } from "react";

import {
  formatShortcut,
  getShortcutList,
  registerShortcut,
} from "@/hooks/use-keyboard-shortcuts";

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const shortcuts = getShortcutList();

  useEffect(() => {
    const unregister = registerShortcut(
      "toggleShortcuts",
      () => setIsOpen((v) => !v),
      true,
    );
    return unregister;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Show keyboard shortcuts"
        className="fixed bottom-4 right-4 z-40 flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white/80 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
      >
        ?
      </button>
    );
  }

  // Group shortcuts by category
  const grouped = shortcuts.reduce((acc, sc) => {
    if (!acc[sc.category]) {
      acc[sc.category] = [];
    }
    acc[sc.category].push(sc);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2
            id="shortcuts-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close shortcuts"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-5 last:mb-0">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700 dark:text-slate-300">
                      {sc.description}
                    </span>
                    <kbd className="inline-flex items-center rounded border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs font-medium text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {formatShortcut(sc)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {shortcuts.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No shortcuts registered yet.
            </p>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Press{" "}
          <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-800">
            ?
          </kbd>{" "}
          to show this panel. Press{" "}
          <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-800">
            Esc
          </kbd>{" "}
          to close.
        </div>
      </div>
    </div>
  );
}

