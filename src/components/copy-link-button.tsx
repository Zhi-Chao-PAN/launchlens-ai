"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Link as LinkIcon } from "lucide-react";

/**
 * Small client-side "Copy link" button used by the shared read-only view.
 * Renders a subtle bordered button that copies window.location.href to the
 * clipboard on click; shows a checkmark for 1.8s on success (mirroring the
 * existing export-copy feedback pattern in launch-workspace).
 */
export function CopyLinkButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        // Legacy fallback for non-secure contexts / older browsers:
        // create a temporary input, select, execCommand.
        const input = document.createElement("input");
        input.value = window.location.href;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Silently ignore — the button is a convenience, not a critical path.
    }
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
          : "border-[#cfd8d1] bg-white text-[#17201d] hover:border-[#138a72] hover:text-[#138a72] focus-visible:ring-[#cbe8df]",
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
