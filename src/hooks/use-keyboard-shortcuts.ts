"use client";

import { useEffect } from "react";

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
    description: "Toggle edit/preview mode",
    category: "Actions",
  },
  save: {
    key: "s",
    meta: true,
    ctrl: true,
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
  copyMarkdown: {
    key: "m",
    meta: true,
    ctrl: true,
    description: "Copy workspace as Markdown",
    category: "Actions",
  },
  reset: {
    key: "r",
    meta: true,
    ctrl: true,
    shift: true,
    description: "Reset workspace to initial example",
    category: "Actions",
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

export function matchesConfig(event: KeyboardEvent, config: ShortcutConfig) {
  if (event.key.toLowerCase() !== config.key.toLowerCase()) {
    return false;
  }

  const metaRequired = config.meta;
  const ctrlRequired = config.ctrl;
  const shiftRequired = config.shift;
  const altRequired = config.alt;

  const metaPressed = event.metaKey || event.ctrlKey;

  if (metaRequired && !metaPressed) {
    return false;
  }
  if (ctrlRequired && !event.ctrlKey && !event.metaKey) {
    return false;
  }
  if (shiftRequired && !event.shiftKey) {
    return false;
  }
  if (altRequired && !event.altKey) {
    return false;
  }

  // If no meta/ctrl modifier is required, do NOT trigger when modifiers are pressed
  // (to avoid conflicting with browser shortcuts like Cmd+T)
  const letterKey = /^[a-z?\]]$/i.test(config.key);
  if (letterKey && !metaRequired && !ctrlRequired) {
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
        // Still allow Escape shortcut from inputs
        if (event.key !== "Escape") {
          return;
        }
      }
    }

    // Let Escape dispatch a custom event for toasts/modals to listen to
    if (event.key === "Escape") {
      window.dispatchEvent(new CustomEvent("launchlens:escape"));
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
) {
  useEffect(() => {
    initGlobalListener();
    const unregisters: Array<() => void> = [];

    for (const id of Object.keys(shortcuts) as ShortcutId[]) {
      const handler = shortcuts[id];
      if (handler) {
        unregisters.push(registerShortcut(id, handler, true));
      }
    }

    return () => {
      unregisters.forEach((fn) => fn());
    };
  }, [shortcuts]);
}
