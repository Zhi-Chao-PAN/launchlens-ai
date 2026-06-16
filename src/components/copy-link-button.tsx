"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Link as LinkIcon } from "lucide-react";

import { copyTextToClipboard } from "@/lib/launchlens/clipboard";

/**
 * Small client-side "Copy link" button used by the shared read-only view.
 * Uses the shared copyTextToClipboard helper (Clipboard API with
 * execCommand fallback); shows a checkmark for 1.8s on success.
 */
export function CopyLinkButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

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
      aria-label={copied ? "Link copied" : "Copy share link"}
      className={[
        "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        copied
          ? "border-[#138a72] bg-[#e5f4ef] text-[#0f766e] focus-visible:ring-[#cbe8df]"
          : "border-input bg-card text-foreground hover:border-[#138a72] hover:text-[#138a72] focus-visible:ring-[#cbe8df]",
        className,
      ].join(" ")}
    >
      {copied ? (
        <>
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <LinkIcon className="size-4" aria-hidden="true" />
          Copy link
        </>
      )}
    </button>
  );
}
