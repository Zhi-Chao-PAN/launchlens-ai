"use client";

import { useCallback, useEffect, useRef } from "react";

type ShortcutHandler = (event: KeyboardEvent) => void;

type ShortcutConfig = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: string;
};

type ShortcutEntry = ShortcutConfig & {
  handler: ShortcutHandler;
};

const SHORTCUTS: Record<string, ShortcutConfig> = {
  generate: {
    key: "g",
    description: "Generate workspace from brief",
    category: "Actions",
  },
  edit: {
    key: "e",
    description: "Edit the current workspace",
    category: "Actions",
  },
  save: {
    key: "s",
    meta: true,
    description: "Save workspace to cloud",
    category: "Actions",
  },
  focusBrief: {
    key: "b",
    description: "Focus founder brief input",
    category: "Navigation",
  },
  toggleShortcuts: {
    key: "?",
    shift: true,
    description: "Show keyboard shortcuts",
    category: "Help",
  },
  closeModal: {
    key: "Escape",
    description: "Close any open modal or dialog",
    category: "Navigation",
  },
  nextTab: {
    key: "]",
    meta: true,
    description: "Next workspace section",
    category: "Navigation",
  },
  prevTab: {
    key: "[",
    meta: true,
    description: "Previous workspace section",
    category: "Navigation",
  },
};

export type ShortcutId = keyof typeof SHORTCUTS;

// Global registry so the help modal can list all shortcuts
const registry = new Map<string, ShortcutEntry>();

export function registerShortcut(
  id: ShortcutId,
  handler: ShortcutHandler,
  enabled = true,
) {
  const config = SHORTCUTS[id];
  if (!config) {
    console.warn(`[shortcuts] Unknown shortcut: ${id}`);
    return () => {};
  }

  const entry: ShortcutEntry = { ...config, handler };
  if (enabled) {
    registry.set(id, entry);
  }

  return () => {
    registry.delete(id);
  };
}

export function getShortcutList() {
  return Array.from(registry.entries())
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.key.localeCompare(b.key));
}

function matchesConfig(event: KeyboardEvent, config: ShortcutConfig) {
  if (event.key.toLowerCase() !== config.key.toLowerCase()) {
    return false;
  }

  if (config.meta && !event.metaKey && !event.ctrlKey) {
    return false;
  }
  if (config.ctrl && !event.ctrlKey) {
    return false;
  }
  if (config.shift && !event.shiftKey) {
    return false;
  }
  if (config.alt && !event.altKey) {
    return false;
  }

  // If meta/ctrl is not set but the key is a letter, we should NOT trigger when modifiers are pressed
  // (to avoid conflicting with browser shortcuts like Cmd+T)
  const letterKey = /^[a-z?\]]$/i.test(config.key);
  if (letterKey && !config.meta && !config.ctrl) {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return false;
    }
  }

  return true;
}

export function formatShortcut(config: ShortcutConfig) {
  const parts: string[] = [];
  if (config.meta) parts.push("⌘");
  if (config.ctrl) parts.push("Ctrl");
  if (config.shift) parts.push("Shift");
  if (config.alt) parts.push("Alt");
  parts.push(config.key.length === 1 ? config.key.toUpperCase() : config.key);
  return parts.join(" + ");
}

// Single global keydown listener
let initialized = false;

function initGlobalListener() {
  if (initialized) return;
  initialized = true;

  if (typeof window === "undefined") return;

  window.addEventListener("keydown", (event) => {
    // Skip if typing in an input, textarea, or contenteditable
    const target = event.target as HTMLElement | null;
    if (target) {
      const tag = target.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        target.isContentEditable
      ) {
        // Still allow Escape and ? shortcut from inputs
        if (event.key !== "Escape" && event.key !== "?") {
          return;
        }
      }
    }

    for (const [, entry] of registry) {
      if (matchesConfig(event, entry)) {
        event.preventDefault();
        entry.handler(event);
        break;
      }
    }
  });
}

export function useKeyboardShortcuts(
  shortcuts: Partial<Record<ShortcutId, ShortcutHandler>>,
  deps: unknown[] = [],
) {
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const handleKey = useCallback(
    (event: KeyboardEvent, id: ShortcutId) => {
      const handler = shortcuts[id];
      if (handler) {
        handler(event);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, shortcuts],
  );

  useEffect(() => {
    initGlobalListener();
    const unregisters: Array<() => void> = [];

    for (const id of Object.keys(shortcuts) as ShortcutId[]) {
      const handler = (event: KeyboardEvent) => handleKey(event, id);
      unregisters.push(registerShortcut(id, handler, true));
    }

    return () => {
      unregisters.forEach((fn) => fn());
    };
  }, [shortcuts, handleKey]);
}
