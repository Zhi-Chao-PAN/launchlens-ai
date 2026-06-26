function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1 font-mono text-foreground">
      {children}
    </kbd>
  );
}

export function ValidationBoardFooter() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted">
      <span>
        Tip: press <KeyCap>/</KeyCap> to search, <KeyCap>Shift</KeyCap>+
        <KeyCap>S</KeyCap> to multi-select, hold <KeyCap>Shift</KeyCap>+click a
        checkbox for range select, <KeyCap>-tag</KeyCap> or{" "}
        <KeyCap>&quot;phrase&quot;</KeyCap> in search.
      </span>
      <span>
        Shortcuts: <KeyCap>Ctrl/Cmd</KeyCap>+<KeyCap>K</KeyCap> command palette{" "}
        <span aria-hidden="true">|</span> <KeyCap>Shift+?</KeyCap> help
      </span>
    </div>
  );
}
