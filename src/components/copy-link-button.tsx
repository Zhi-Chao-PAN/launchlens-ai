"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Link as LinkIcon } from "lucide-react";

import { copyTextToClipboard } from "@/lib/launchlens/clipboard";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Small client-side "Copy link" button used by the shared read-only view.
 * Uses the shared copyTextToClipboard helper (Clipboard API with
 * execCommand fallback); shows a checkmark for 1.8s on success.
 */
export function CopyLinkButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();

  const handleCopy = useCallback(() => {
    copyTextToClipboard(window.location.href).then((ok) => {
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    });
  }, []);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      aria-label={copied ? t("copyLink.copiedAria") : t("copyLink.copyAria")}
      className={[
        "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        copied
          ? "border-accent bg-signal-supports text-signal-supports focus-visible:ring-[var(--ring-color)]"
          : "border-input bg-card text-foreground hover:border-accent hover:text-accent focus-visible:ring-[var(--ring-color)]",
        className,
      ].join(" ")}
    >
      {copied ? (
        <>
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {t("copyLink.copied")}
        </>
      ) : (
        <>
          <LinkIcon className="size-4" aria-hidden="true" />
          {t("copyLink.copy")}
        </>
      )}
    </button>
  );
}
