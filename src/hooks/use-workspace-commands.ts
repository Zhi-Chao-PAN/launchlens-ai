"use client";

import { useMemo } from "react";
import type { CommandPaletteAction } from "@/components/command-palette";
import { formatShortcut, getShortcutList } from "@/hooks/use-keyboard-shortcuts";
import type { LaunchLensWorkspace } from "@/lib/launchlens/types";

const SECTION_IDS = [
  { id: "target-users", label: "Target users", category: "Navigate" },
  { id: "pains", label: "Pains", category: "Navigate" },
  { id: "mvp-scope", label: "MVP scope", category: "Navigate" },
  { id: "backlog", label: "Backlog", category: "Navigate" },
  { id: "tasks", label: "Launch tasks", category: "Navigate" },
  { id: "validation", label: "Validation board", category: "Navigate" },
  { id: "decision-copilot", label: "Decision copilot", category: "Navigate" },
  { id: "pricing", label: "Pricing", category: "Navigate" },
  { id: "landing-page", label: "Landing page", category: "Navigate" },
  { id: "content-calendar", label: "Content calendar", category: "Navigate" },
  { id: "export", label: "Export & share", category: "Navigate" },
] as const;

export function useWorkspaceCommands(options: {
  workspace?: LaunchLensWorkspace;
  execution?: { experiments: Array<{ assumption: string; status: string }> };
  onNavigate?: (sectionId: string) => void;
  onToggleEdit?: () => void;
  onGenerate?: () => void;
  onSave?: () => void;
  onReset?: () => void;
  onCopyMarkdown?: () => void;
}): CommandPaletteAction[] {
  const {
    workspace,
    execution,
    onNavigate,
    onToggleEdit,
    onGenerate,
    onSave,
    onReset,
    onCopyMarkdown,
  } = options;

  const shortcuts = useMemo(() => getShortcutList(), []);
  const shortcutMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of shortcuts) {
      map[s.id] = formatShortcut(s);
    }
    return map;
  }, [shortcuts]);

  return useMemo(() => {
    const actions: CommandPaletteAction[] = [];

    // Navigation commands
    for (const section of SECTION_IDS) {
      actions.push({
        id: `nav:${section.id}`,
        label: `Go to ${section.label.toLowerCase()}`,
        description: section.label,
        category: "Navigate",
        icon: "navigate",
        keywords: [section.label, section.id],
        onSelect: () => onNavigate?.(section.id),
      });
    }

    // Action commands
    if (onToggleEdit) {
      actions.push({
        id: "action:edit",
        label: "Toggle edit mode",
        description: "Switch between edit and preview",
        category: "Actions",
        icon: "action",
        shortcut: shortcutMap.edit,
        keywords: ["edit", "preview", "toggle"],
        onSelect: onToggleEdit,
      });
    }
    if (onGenerate) {
      actions.push({
        id: "action:generate",
        label: "Generate workspace",
        description: "Generate GTM plan from brief",
        category: "Actions",
        icon: "action",
        shortcut: shortcutMap.generate,
        keywords: ["generate", "create", "new"],
        onSelect: onGenerate,
      });
    }
    if (onSave) {
      actions.push({
        id: "action:save",
        label: "Save to cloud",
        description: "Save workspace to cloud storage",
        category: "Actions",
        icon: "action",
        shortcut: shortcutMap.save,
        keywords: ["save", "cloud", "store"],
        onSelect: onSave,
      });
    }
    if (onCopyMarkdown) {
      actions.push({
        id: "action:copy-markdown",
        label: "Copy as Markdown",
        description: "Copy entire workspace as Markdown",
        category: "Actions",
        icon: "action",
        shortcut: shortcutMap.copyMarkdown,
        keywords: ["copy", "markdown", "export", "share"],
        onSelect: onCopyMarkdown,
      });
    }
    if (onReset) {
      actions.push({
        id: "action:reset",
        label: "Reset workspace",
        description: "Reset to initial example",
        category: "Actions",
        icon: "action",
        shortcut: shortcutMap.reset,
        keywords: ["reset", "clear", "start over"],
        onSelect: onReset,
      });
    }

    // Board power-user commands (dispatch custom events ValidationBoard listens to)
    actions.push({
      id: "action:new-hypothesis",
      label: "New hypothesis",
      description: "Open the add-hypothesis input and focus it",
      category: "Actions",
      icon: "action",
      keywords: ["new", "add", "create", "hypothesis", "assumption", "experiment"],
      onSelect: () => window.dispatchEvent(new Event("launchlens:new-experiment")),
    });
    actions.push({
      id: "action:focus-search",
      label: "Focus board search",
      description: "Jump to the validation board search input",
      category: "Actions",
      icon: "search",
      shortcut: shortcutMap.focusSearch,
      keywords: ["search", "find", "filter", "hypothesis", "board"],
      onSelect: () => window.dispatchEvent(new CustomEvent("launchlens:focus-search")),
    });
    actions.push({
      id: "action:clear-filters",
      label: "Clear board filters",
      description: "Reset search, status filter, tag filter, and sort",
      category: "Actions",
      icon: "action",
      keywords: ["clear", "reset", "filter", "search", "sort", "tag"],
      onSelect: () => window.dispatchEvent(new CustomEvent("launchlens:clear-filters")),
    });
    actions.push({
      id: "action:collapse-all",
      label: "Collapse all hypothesis cards",
      description: "Close every expanded card on the board",
      category: "Actions",
      icon: "action",
      keywords: ["collapse", "close", "cards", "fold", "expand"],
      onSelect: () => window.dispatchEvent(new CustomEvent("launchlens:collapse-all")),
    });
    actions.push({
      id: "nav:export",
      label: "Go to export & share",
      description: "Jump to the Export & Share section",
      category: "Navigate",
      icon: "navigate",
      keywords: ["export", "share", "download", "copy", "publish"],
      onSelect: () => onNavigate?.("export"),
    });    actions.push({
      id: "action:toggle-select-mode",
      label: "Toggle multi-select",
      description: "Enter or exit bulk selection mode on the validation board",
      category: "Actions",
      icon: "action",
      shortcut: shortcutMap.toggleSelectMode,
      keywords: ["select", "multi", "bulk", "batch"],
      onSelect: () => window.dispatchEvent(new CustomEvent("launchlens:toggle-select-mode")),
    });

    // Search in workspace content (if workspace is available)
    if (workspace) {
      // Add target users as searchable items
      workspace.targetUsers.forEach((user, i) => {
        actions.push({
          id: `user:${i}`,
          label: user,
          description: "Target user segment",
          category: "Workspace content",
          icon: "search",
          keywords: ["user", "target", "audience"],
          onSelect: () => onNavigate?.("target-users"),
        });
      });

      // Add pains
      workspace.pains.forEach((pain, i) => {
        actions.push({
          id: `pain:${i}`,
          label: pain,
          description: "Pain point",
          category: "Workspace content",
          icon: "search",
          keywords: ["pain", "problem"],
          onSelect: () => onNavigate?.("pains"),
        });
      });

      // Add backlog items
      workspace.backlog.forEach((item, i) => {
        actions.push({
          id: `backlog:${i}`,
          label: item.feature,
          description: `${item.priority} backlog item`,
          category: "Workspace content",
          icon: "search",
          keywords: ["backlog", item.priority, item.why],
          onSelect: () => onNavigate?.("backlog"),
        });
      });

      // Add launch tasks
      workspace.tasks.forEach((task, i) => {
        actions.push({
          id: `task:${i}`,
          label: task.title,
          description: `Due ${task.due}`,
          category: "Workspace content",
          icon: "search",
          keywords: ["task", "launch", "todo", task.owner],
          onSelect: () => onNavigate?.("tasks"),
        });
      });
      // Add content calendar items
      workspace.contentCalendar.forEach((item, i) => {
        actions.push({
          id: `content:${i}`,
          label: item.angle,
          description: `${item.channel} ? ${item.cadence}`,
          category: "Workspace content",
          icon: "search",
          keywords: ["content", "calendar", item.channel, item.cadence],
          onSelect: () => onNavigate?.("content-calendar"),
        });
      });

      // Add validation experiments
      if (execution) {
        execution.experiments.forEach((exp, i) => {
          actions.push({
            id: `experiment:${i}`,
            label: exp.assumption,
            description: `${exp.status} experiment`,
            category: "Workspace content",
            icon: "search",
            keywords: ["experiment", "validation", "hypothesis", exp.status],
            onSelect: () => onNavigate?.("validation"),
          });
        });
      }
    }

    return actions;
  }, [workspace, execution, onNavigate, onToggleEdit, onGenerate, onSave, onReset, onCopyMarkdown, shortcutMap]);
}
