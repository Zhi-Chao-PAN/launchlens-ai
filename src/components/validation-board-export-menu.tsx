"use client";

import { Download } from "lucide-react";

export type ValidationBoardExportMenuProps = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onCopyMarkdown: () => void | Promise<void>;
  onDownloadMarkdown: () => void;
  onDownloadJson: () => void;
};

const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-foreground/80 transition hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none";

export function ValidationBoardExportMenu({
  open,
  onToggle,
  onClose,
  onCopyMarkdown,
  onDownloadMarkdown,
  onDownloadJson,
}: ValidationBoardExportMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Export validation board"
        title="Export all hypotheses"
        className="flex items-center gap-1 rounded-md border border-input bg-card px-2 py-1 text-xs font-medium text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        <Download className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Export</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-input bg-card py-1 text-sm shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={onCopyMarkdown}
              className={menuItemClass}
            >
              Copy Markdown
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={onDownloadMarkdown}
              className={menuItemClass}
            >
              Download Markdown
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={onDownloadJson}
              className={menuItemClass}
            >
              Download JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
