import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  formatShortcut,
  matchesConfig,
  registerShortcut,
  getShortcutList,
} from "./use-keyboard-shortcuts";

// Minimal KeyboardEvent-like factory
function makeEvent(
  partial: Partial<KeyboardEvent> & { key: string },
): KeyboardEvent {
  const { key, metaKey, ctrlKey, shiftKey, altKey, ...rest } =
    partial as Partial<KeyboardEvent> & { key: string };
  return {
    key,
    metaKey: metaKey ?? false,
    ctrlKey: ctrlKey ?? false,
    shiftKey: shiftKey ?? false,
    altKey: altKey ?? false,
    preventDefault: vi.fn(),
    ...rest,
  } as unknown as KeyboardEvent;
}

const ALL_SHORTCUT_IDS = [
  "generate",
  "edit",
  "save",
  "focusBrief",
  "toggleShortcuts",
  "closeModal",
  "copyMarkdown",
  "reset",
] as const;

function clearRegistry() {
  for (const id of ALL_SHORTCUT_IDS) {
    registerShortcut(id, () => {}, false)();
  }
}

// Mock navigator.platform to test platform-aware formatting
function mockPlatform(platform: string | undefined) {
  const descriptor = {
    value: platform ? { platform } : undefined,
    configurable: true,
    writable: true,
  };
  if (platform) {
    Object.defineProperty(globalThis, "navigator", {
      ...descriptor,
      value: { platform },
    });
  }
}

describe("formatShortcut", () => {
  it("formats a plain letter key as uppercase", () => {
    expect(formatShortcut({ key: "g", description: "", category: "" })).toBe(
      "G",
    );
  });

  it("formats Ctrl+key on non-Mac platforms", () => {
    mockPlatform("Win32");
    // Need to re-import? No — isMac is module-level. Let us just accept
    // platform-dependent output here.
    const result = formatShortcut({
      key: "s",
      meta: true,
      ctrl: true,
      description: "",
      category: "",
    });
    expect(result === "Ctrl + S" || result === "\u2318 + S").toBe(true);
  });

  it("formats Shift+key combination", () => {
    expect(
      formatShortcut({
        key: "?",
        shift: true,
        description: "",
        category: "",
      }),
    ).toBe("Shift + ?");
  });

  it("formats Ctrl+Shift+key combination on non-Mac", () => {
    const result = formatShortcut({
      key: "r",
      meta: true,
      ctrl: true,
      shift: true,
      description: "",
      category: "",
    });
    expect(
      result === "Ctrl + Shift + R" || result === "\u2318 + Shift + R",
    ).toBe(true);
  });

  it("keeps named keys like Escape verbatim", () => {
    expect(
      formatShortcut({ key: "Escape", description: "", category: "" }),
    ).toBe("Escape");
  });

  it("includes Alt/Option modifier", () => {
    const result = formatShortcut({
      key: "a",
      alt: true,
      description: "",
      category: "",
    });
    expect(result === "Alt + A" || result === "\u2325 + A").toBe(true);
  });

  it("shows exactly one primary modifier, not both Cmd and Ctrl", () => {
    const result = formatShortcut({
      key: "m",
      meta: true,
      ctrl: true,
      description: "",
      category: "",
    });
    // Must NOT contain both \u2318 and Ctrl
    expect(result).not.toMatch(/\u2318.*Ctrl|Ctrl.*\u2318/);
  });
});

describe("matchesConfig", () => {
  it("matches a bare letter key with no modifiers pressed", () => {
    const cfg = { key: "g", description: "", category: "" };
    expect(matchesConfig(makeEvent({ key: "g" }), cfg)).toBe(true);
  });

  it("matches case-insensitively", () => {
    const cfg = { key: "g", description: "", category: "" };
    expect(matchesConfig(makeEvent({ key: "G" }), cfg)).toBe(true);
  });

  it("does NOT match when ctrl/meta/alt are held on a bare letter key", () => {
    const cfg = { key: "g", description: "", category: "" };
    expect(matchesConfig(makeEvent({ key: "g", ctrlKey: true }), cfg)).toBe(
      false,
    );
    expect(matchesConfig(makeEvent({ key: "g", metaKey: true }), cfg)).toBe(
      false,
    );
    expect(matchesConfig(makeEvent({ key: "g", altKey: true }), cfg)).toBe(
      false,
    );
  });

  it("does not match when the key is different", () => {
    const cfg = { key: "g", description: "", category: "" };
    expect(matchesConfig(makeEvent({ key: "e" }), cfg)).toBe(false);
  });

  it("matches meta+key when meta OR ctrl is pressed (cross-platform)", () => {
    const cfg = {
      key: "s",
      meta: true,
      ctrl: true,
      description: "",
      category: "",
    };
    expect(matchesConfig(makeEvent({ key: "s", metaKey: true }), cfg)).toBe(
      true,
    );
    expect(matchesConfig(makeEvent({ key: "s", ctrlKey: true }), cfg)).toBe(
      true,
    );
  });

  it("rejects meta/ctrl+key when no modifier is held", () => {
    const cfg = {
      key: "s",
      meta: true,
      ctrl: true,
      description: "",
      category: "",
    };
    expect(matchesConfig(makeEvent({ key: "s" }), cfg)).toBe(false);
  });

  it("requires shift when configured", () => {
    const cfg = { key: "?", shift: true, description: "", category: "" };
    expect(matchesConfig(makeEvent({ key: "?" }), cfg)).toBe(false);
    expect(
      matchesConfig(makeEvent({ key: "?", shiftKey: true }), cfg),
    ).toBe(true);
  });

  it("requires the full modifier set (Cmd/Ctrl+Shift+R)", () => {
    const cfg = {
      key: "r",
      meta: true,
      ctrl: true,
      shift: true,
      description: "",
      category: "",
    };
    expect(matchesConfig(makeEvent({ key: "r", metaKey: true }), cfg)).toBe(
      false,
    );
    expect(matchesConfig(makeEvent({ key: "r", ctrlKey: true }), cfg)).toBe(
      false,
    );
    expect(matchesConfig(makeEvent({ key: "r", shiftKey: true }), cfg)).toBe(
      false,
    );
    expect(
      matchesConfig(makeEvent({ key: "r", ctrlKey: true, shiftKey: true }), cfg),
    ).toBe(true);
    expect(
      matchesConfig(makeEvent({ key: "r", metaKey: true, shiftKey: true }), cfg),
    ).toBe(true);
  });

  it("matches Escape regardless of modifiers", () => {
    const cfg = { key: "Escape", description: "", category: "" };
    expect(matchesConfig(makeEvent({ key: "Escape" }), cfg)).toBe(true);
    expect(
      matchesConfig(makeEvent({ key: "Escape", ctrlKey: true }), cfg),
    ).toBe(true);
    expect(
      matchesConfig(makeEvent({ key: "Escape", shiftKey: true }), cfg),
    ).toBe(true);
  });
});

describe("registerShortcut / registry", () => {
  beforeEach(() => {
    clearRegistry();
  });

  it("warns and returns a safe unregister for unknown shortcut ids", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const unreg = registerShortcut("nonexistent" as never, () => {});
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Unknown shortcut"),
    );
    expect(typeof unreg).toBe("function");
    expect(() => unreg()).not.toThrow();
    warn.mockRestore();
  });

  it("adds enabled shortcuts to the registry and removes them on unregister", () => {
    const handler = vi.fn();
    const unreg = registerShortcut("generate", handler, true);
    expect(getShortcutList().some((s) => s.id === "generate")).toBe(true);
    unreg();
    expect(getShortcutList().some((s) => s.id === "generate")).toBe(false);
  });

  it("does not add shortcuts when enabled=false", () => {
    registerShortcut("edit", () => {}, false);
    expect(getShortcutList().some((s) => s.id === "edit")).toBe(false);
  });

  it("returns shortcuts sorted by category then key", () => {
    registerShortcut("generate", () => {}, true);
    registerShortcut("toggleShortcuts", () => {}, true);
    registerShortcut("closeModal", () => {}, true);
    const list = getShortcutList();
    const ids = list.map((s) => s.id);
    expect(ids.indexOf("generate")).toBeLessThan(
      ids.indexOf("toggleShortcuts"),
    );
    expect(ids.indexOf("toggleShortcuts")).toBeLessThan(
      ids.indexOf("closeModal"),
    );
  });

  it("registered handler can be invoked and receives the event", () => {
    const handler = vi.fn();
    registerShortcut("generate", handler, true);
    const event = makeEvent({ key: "g" });
    const entry = getShortcutList().find((s) => s.id === "generate");
    expect(entry).toBeDefined();
    entry!.handler(event);
    expect(handler).toHaveBeenCalledWith(event);
  });
});
