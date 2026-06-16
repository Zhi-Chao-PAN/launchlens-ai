"use client";

import { pushOverlay } from "@/lib/launchlens/overlays";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import {
  formatShortcut,
  getShortcutList,
  registerShortcut,
} from "@/hooks/use-keyboard-shortcuts";

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const shortcuts = getShortcutList();
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen, { restoreFocus: false });
  const isOpenRef = useRef(isOpen);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  function openModal() {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
    window.requestAnimationFrame(() => setMounted(true));
  }
  function closeModal() {
    setMounted(false);
    const previously = previouslyFocusedRef.current;
    window.setTimeout(() => {
      setIsOpen(false);
      if (previously && typeof previously.focus === "function" && document.contains(previously)) {
        previously.focus();
      }
      previouslyFocusedRef.current = null;
    }, 220);
  }

  useEffect(() => {
    const unregister = registerShortcut("toggleShortcuts", () => {
      if (isOpenRef.current) closeModal();
      else openModal();
    }, true);
    return unregister;
  }, []);

  // Listen to the shared launchlens:escape event so that Escape dismisses
  // the shortcuts modal consistently with toasts and other overlays.
  useEffect(() => {
    if (!isOpen) return;
    const pop = pushOverlay();
    const onEscape = (e: Event) => { e.stopImmediatePropagation?.(); closeModal(); };
    window.addEventListener("launchlens:escape", onEscape);
    return () => {
      window.removeEventListener("launchlens:escape", onEscape);
      pop();
    };
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
        onClick={openModal}
        aria-label="Show keyboard shortcuts"
        className="fixed bottom-4 left-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-[#cfd8d1] bg-white/90 text-sm font-semibold text-[#40504a] shadow-sm backdrop-blur transition hover:border-[#138a72] hover:text-[#138a72] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
      >
        ?
      </button>

      {isOpen && (
        <div
          className={[
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            mounted ? "bg-black/40 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none",
            "motion-safe:transition-[background-color,backdrop-filter] motion-safe:duration-200 motion-safe:ease-out",
          ].join(" ")}
          onClick={closeModal}
          ref={trapRef} role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <div
            className={[
              "w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-[#d8ded4] bg-white shadow-xl",
              mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2",
              "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out",
            ].join(" ")}
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
                onClick={closeModal}
                aria-label="Close shortcuts"
                className="rounded text-[#8e9c93] transition hover:text-[#17201d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
               autoFocus>
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

            <div className="border-t border-[#d8ded4] px-6 py-3 text-xs leading-5 text-[#607069]">
              Press{" "}
              <kbd className="rounded border border-[#cfd8d1] bg-[#f6f8f4] px-1.5 py-0.5 font-mono text-[#17201d]">?</kbd>,{" "}
              <kbd className="rounded border border-[#cfd8d1] bg-[#f6f8f4] px-1.5 py-0.5 font-mono text-[#17201d]">/</kbd>, or{" "}
              <kbd className="rounded border border-[#cfd8d1] bg-[#f6f8f4] px-1.5 py-0.5 font-mono text-[#17201d]">
                {formatShortcut({ key: "k", meta: true, ctrl: true, description: "", category: "" })}
              </kbd>{" "}
              to open this panel. Press{" "}
              <kbd className="rounded border border-[#cfd8d1] bg-[#f6f8f4] px-1.5 py-0.5 font-mono text-[#17201d]">Esc</kbd>{" "}
              to dismiss the newest toast or topmost overlay; hold{" "}
              <kbd className="rounded border border-[#cfd8d1] bg-[#f6f8f4] px-1.5 py-0.5 font-mono text-[#17201d]">Shift</kbd>{" "}
              with{" "}
              <kbd className="rounded border border-[#cfd8d1] bg-[#f6f8f4] px-1.5 py-0.5 font-mono text-[#17201d]">Esc</kbd>{" "}
              to clear all toasts.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
