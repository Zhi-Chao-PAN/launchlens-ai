"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/dictionaries";

/**
 * Cycles through SUPPORTED_LOCALES on click. With only two locales (en/zh-CN)
 * this is a clean toggle; adding a third locale later still works because we
 * index into the SUPPORTED_LOCALES array rather than hardcoding a flip.
 *
 * The component reads the locale from context, so it only shows the *current*
 * selection after hydration (the SSR pass renders the default-locale label).
 * To avoid a hydration mismatch we render a non-interactive placeholder during
 * the first paint, mirroring the ThemeToggle pattern.
 */
export function LanguageSwitcher({ mounted }: { mounted: boolean }) {
  const { locale, setLocale, t } = useLocale();

  if (!mounted) {
    // SSR placeholder - same size to avoid layout shift.
    return (
      <button
        type="button"
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-card text-foreground/80 opacity-0 sm:h-8 sm:w-8"
        tabIndex={-1}
      >
        <Languages className="size-4" aria-hidden="true" />
      </button>
    );
  }

  const idx = SUPPORTED_LOCALES.indexOf(locale);
  const next = SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length] as Locale;
  // Short badge shown on the button face (e.g. "EN" / "中").
  const badge = locale === "zh-CN" ? "中" : "EN";
  const label = t("language.label") + " — " + (locale === "zh-CN" ? "中文" : "English");

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center gap-1 rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 print:hidden sm:h-8 sm:w-8"
    >
      <span className="text-xs font-semibold tracking-wide">{badge}</span>
      <Languages className="size-3.5 sr-only" aria-hidden="true" />
    </button>
  );
}
