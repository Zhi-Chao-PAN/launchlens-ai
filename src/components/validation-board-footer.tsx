import { useLocale } from "@/lib/i18n/LocaleProvider";

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1 font-mono text-foreground">
      {children}
    </kbd>
  );
}

export function ValidationBoardFooter() {
  const { t } = useLocale();
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted">
      <span>
        {t("vFooter.tipPrefix")}<KeyCap>/</KeyCap>{t("vFooter.tipSearchTo")}<KeyCap>Shift</KeyCap>+
        <KeyCap>S</KeyCap>{t("vFooter.tipMultiTo")}<KeyCap>Shift</KeyCap>{t("vFooter.tipHoldFor")}
        <KeyCap>-tag</KeyCap>{t("vFooter.tipOr")}{" "}
        <KeyCap>&quot;phrase&quot;</KeyCap>{t("vFooter.tipInSearch")}
      </span>
      <span>
        {t("vFooter.shortcutsPrefix")}<KeyCap>Ctrl/Cmd</KeyCap>+<KeyCap>K</KeyCap>{t("vFooter.shortcutsPalette")}{" "}
        <span aria-hidden="true">|</span> <KeyCap>Shift+?</KeyCap>{t("vFooter.shortcutsHelp")}
      </span>
    </div>
  );
}
