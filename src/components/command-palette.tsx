"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Command, ArrowRight } from "lucide-react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { pushOverlay } from "@/lib/launchlens/overlays";

export type CommandPaletteAction = {
  id: string;
  label: string;
  description?: string;
  category: string;
  icon?: "navigate" | "action" | "search";
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
};

type CommandPaletteProps = {
  actions: CommandPaletteAction[];
  /** Called when user selects a navigation target (e.g. section id). */
  openLabel?: string;
};

export function CommandPalette({
  actions,
  openLabel = "Search or jump to...",
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen && mounted, { restoreFocus: false });
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const overlayPopRef = useRef<(() => void) | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return actions.slice(0, 10);
    }
    const q = query.toLowerCase();
    const scored = actions.map((action) => {
      let score = 0;
      if (action.label.toLowerCase().includes(q)) score += 10;
      if (action.label.toLowerCase().startsWith(q)) score += 15;
      if (action.description?.toLowerCase().includes(q)) score += 5;
      if (action.category.toLowerCase().includes(q)) score += 3;
      if (action.keywords?.some((k) => k.toLowerCase().includes(q))) score += 5;
      return { action, score };
    });
    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.action)
      .slice(0, 12);
  }, [actions, query]);

  const open = useCallback(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    overlayPopRef.current = pushOverlay();
    setIsOpen(true);
    setQuery("");
    setSelectedIndex(0);
    window.requestAnimationFrame(() => {
      setMounted(true);
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    });
  }, []);

  const close = useCallback(() => {
    setMounted(false);
    const previously = previouslyFocusedRef.current;
    const pop = overlayPopRef.current;
    window.setTimeout(() => {
      setIsOpen(false);
      setQuery("");
      if (previously && typeof previously.focus === "function" && document.contains(previously)) {
        previously.focus();
      }
      previouslyFocusedRef.current = null;
      pop?.();
      overlayPopRef.current = null;
    }, 180);
  }, []);

  const selectItem = useCallback(
    (index: number) => {
      const item = filtered[index];
      if (!item) return;
      item.onSelect();
      close();
    },
    [filtered, close],
  );

  // Register Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    // We rely on the global keyboard listener; Cmd+K should open the palette
    const handler = (event: KeyboardEvent) => {
      const isCmdK =
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey;
      if (isCmdK) {
        event.preventDefault();
        if (isOpen) close();
        else open();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, open, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = () => close();
    window.addEventListener("launchlens:escape", onEscape);
    return () => window.removeEventListener("launchlens:escape", onEscape);
  }, [isOpen, close]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectItem(selectedIndex);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close command palette"
        onClick={close}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none"
        style={{ opacity: mounted ? 1 : 0 }}
        tabIndex={-1}
      />

      {/* Panel */}
      <div
        ref={trapRef}
        className={`relative w-full max-w-lg overflow-hidden rounded-xl border border-card bg-card shadow-2xl transition-all duration-200 ease-out motion-reduce:transition-none ${
          mounted ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-input px-4 py-3">
          <Search className="size-4 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder={openLabel}
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={
              filtered[selectedIndex] ? `cmd-${filtered[selectedIndex].id}` : undefined
            }
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
          />
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:inline">
            ESC
          </kbd>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded p-1 text-muted transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Results */}
        <ul
          id="command-list"
          role="listbox"
          className="max-h-80 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted">
              No commands found for &ldquo;{query}&rdquo;
            </li>
          ) : (
            filtered.map((action, index) => (
              <li key={action.id} id={`cmd-${action.id}`} role="option" aria-selected={index === selectedIndex}>
                <button
                  type="button"
                  onClick={() => selectItem(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                    index === selectedIndex
                      ? "bg-muted text-foreground"
                      : "text-foreground/80 hover:bg-muted/60"
                  }`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-md ${
                      action.icon === "navigate"
                        ? "bg-signal-supports text-signal-supports"
                        : action.icon === "action"
                          ? "bg-signal-neutral text-signal-neutral"
                          : "bg-muted text-muted"
                    }`}
                    aria-hidden="true"
                  >
                    {action.icon === "navigate" ? (
                      <ArrowRight className="size-3.5" />
                    ) : action.icon === "action" ? (
                      <Command className="size-3.5" />
                    ) : (
                      <Search className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{action.label}</div>
                    {action.description && (
                      <div className="truncate text-xs text-muted">{action.description}</div>
                    )}
                  </div>
                  {action.shortcut && (
                    <kbd className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-input px-4 py-2 text-[10px] text-muted">
          <span>
            <kbd className="rounded bg-muted px-1 py-0.5 font-mono">¡ü¡ý</kbd> navigate
          </span>
          <span>
            <kbd className="rounded bg-muted px-1 py-0.5 font-mono">?</kbd> select
          </span>
          <span>
            <kbd className="rounded bg-muted px-1 py-0.5 font-mono">?K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
