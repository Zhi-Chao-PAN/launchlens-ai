"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";

import type { LaunchLensWorkspace } from "@/lib/launchlens/types";
import { workspaceToMarkdown } from "@/lib/launchlens/markdown-export";

/**
 * Copy a read-only workspace as Markdown to the clipboard. Used on the
 * shared-workspace view so visitors can take the plan with them without
 * needing to sign in or scrape the DOM.
 */
export function CopyMarkdownButton({
  workspace,
  className = "",
}: {
  workspace: LaunchLensWorkspace;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const md = workspaceToMarkdown(workspace);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(md);
      } else {
        const ta = document.createElement("textarea");
        ta.value = md;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // no-op: copy is a convenience, not a critical path
    }
  }, [workspace]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      aria-label={copied ? "Markdown copied" : "Copy workspace as Markdown"}
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
          <Copy className="size-4" aria-hidden="true" />
          Copy Markdown
        </>
      )}
    </button>
  );
}
