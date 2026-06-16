"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Copy, Download } from "lucide-react";

import type { LaunchLensWorkspace } from "@/lib/launchlens/types";
import { copyTextToClipboard, downloadTextFile } from "@/lib/launchlens/clipboard";
import { safeMarkdownFilename, workspaceToMarkdown } from "@/lib/launchlens/markdown-export";

type CopyStatus = "idle" | "copied" | "downloaded";

/**
 * Copy a read-only workspace as Markdown to the clipboard. When clipboard
 * access is unavailable (insecure contexts, denied permission) we fall back
 * to a .md file download so the visitor still walks away with the plan.
 * Shift+click forces the download path directly.
 */
export function CopyMarkdownButton({
  workspace,
  className = "",
}: {
  workspace: LaunchLensWorkspace;
  className?: string;
}) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  const handleCopy = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const forceDownload = event.shiftKey;
      const md = workspaceToMarkdown(workspace);
      const filename = safeMarkdownFilename({
        landingPage: { headline: workspace.landingPage.headline },
      });

      const markCopied = () => {
        setStatus("copied");
        window.setTimeout(() => setStatus("idle"), 1800);
      };
      const markDownloaded = () => {
        setStatus("downloaded");
        window.setTimeout(() => setStatus("idle"), 2200);
      };

      if (forceDownload) {
        downloadTextFile(filename, md, "text/markdown;charset=utf-8");
        markDownloaded();
        return;
      }

      copyTextToClipboard(md).then((ok) => {
        if (ok) {
          markCopied();
        } else {
          downloadTextFile(filename, md, "text/markdown;charset=utf-8");
          markDownloaded();
        }
      });
    },
    [workspace],
  );

  const label =
    status === "copied"
      ? "Copied"
      : status === "downloaded"
        ? "Downloaded"
        : "Copy Markdown";
  const ariaLabel =
    status === "copied"
      ? "Markdown copied to clipboard"
      : status === "downloaded"
        ? "Markdown downloaded as a file"
        : "Copy workspace as Markdown (Shift+click to download as .md file)";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      aria-label={ariaLabel}
      title="Copy as Markdown (Shift+click to download .md)"
      className={[
        "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        status === "copied"
          ? "border-accent bg-signal-supports text-signal-supports focus-visible:ring-[#cbe8df]"
          : status === "downloaded"
            ? "border-[#554a8b] bg-[#e9e7f7] text-[#554a8b] focus-visible:ring-[#cbe8df]"
            : "border-input bg-card text-foreground hover:border-accent hover:text-accent focus-visible:ring-[#cbe8df]",
        className,
      ].join(" ")}
    >
      {status === "copied" ? (
        <>
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {label}
        </>
      ) : status === "downloaded" ? (
        <>
          <Download className="size-4" aria-hidden="true" />
          {label}
        </>
      ) : (
        <>
          <Copy className="size-4" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  );
}
