"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

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

  // Listen to the shared launchlens:escape event so that Escape dismisses
  // the shortcuts modal consistently with toasts and other overlays.
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = () => setIsOpen(false);
    window.addEventListener("launchlens:escape", onEscape);
    return () => window.removeEventListener("launchlens:escape", onEscape);
  }, [isOpen]);

  // Group shortcuts by category
  const grouped = shortcuts.reduce((acc, sc) => {
    if (!acc[sc.category]) {
      acc[sc.category] = [];
    }
    acc[sc.category].push(sc);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <>
      {/* Floating help button — placed at bottom-left so it does not overlap
          with toasts which appear at bottom-right. */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Show keyboard shortcuts"
        className="fixed bottom-4 left-4 z-40 flex h-8 w-8 items-center justify-center rounded-md border border-[#cfd8d1] bg-white/90 text-xs font-medium text-[#607069] shadow-sm backdrop-blur transition hover:bg-white hover:text-[#17201d] focus:outline-none focus:ring-2 focus:ring-[#138a72] focus:ring-offset-1"
      >
        ?
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <div
            className="w-full max-w-md rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#d8ded4] px-6 py-4">
              <h2
                id="shortcuts-title"
                className="text-lg font-semibold text-[#17201d]"
              >
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close shortcuts"
                className="text-[#8e9c93] transition hover:text-[#17201d]"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-5 last:mb-0">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#607069]">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((sc) => (
                      <div
                        key={sc.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-[#17201d]">
                          {sc.description}
                        </span>
                        <kbd className="inline-flex items-center rounded border border-[#cfd8d1] bg-[#f6f8f4] px-2 py-0.5 font-mono text-xs font-medium text-[#17201d] shadow-sm">
                          {formatShortcut(sc)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {shortcuts.length === 0 && (
                <p className="text-sm text-[#607069]">
                  No shortcuts registered yet.
                </p>
              )}
            </div>

            <div className="border-t border-[#d8ded4] px-6 py-3 text-xs text-[#607069]">
              Press{" "}
              <kbd className="rounded border border-[#cfd8d1] bg-[#f6f8f4] px-1.5 py-0.5 font-mono text-[#17201d]">
                {formatShortcut({ key: "?", shift: true, description: "", category: "" })}
              </kbd>{" "}
              to open this panel. Press{" "}
              <kbd className="rounded border border-[#cfd8d1] bg-[#f6f8f4] px-1.5 py-0.5 font-mono text-[#17201d]">
                Esc
              </kbd>{" "}
              to close.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
