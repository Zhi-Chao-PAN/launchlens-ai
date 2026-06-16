"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Copy, Download } from "lucide-react";

import type { LaunchLensWorkspace } from "@/lib/launchlens/types";
import { safeMarkdownFilename, workspaceToMarkdown } from "@/lib/launchlens/markdown-export";

type CopyStatus = "idle" | "copied" | "downloaded";

function triggerDownload(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on next tick so the browser has time to start the download
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}


/**
 * Copy a read-only workspace as Markdown to the clipboard. When clipboard
 * access is unavailable (insecure contexts, strict permissions, denial) we
 * fall back to a synthetic textarea + execCommand("copy"); if that also fails
 * we trigger a .md file download so the visitor still walks away with the
 * plan. Shift+click forces the download path directly — handy for power users
 * who want a file without going through the clipboard.
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
      const filename = safeMarkdownFilename(workspace);

      if (forceDownload) {
        triggerDownload(filename, md);
        setStatus("downloaded");
        window.setTimeout(() => setStatus("idle"), 2200);
        return;
      }

      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          // writeText is async; attach a microtask-side fallback via Promise
          // race against a short tick so we never hang the UI waiting on a
          // permission prompt that the user will dismiss.
          navigator.clipboard
            .writeText(md)
            .then(() => {
              setStatus("copied");
              window.setTimeout(() => setStatus("idle"), 1800);
            })
            .catch(() => {
              // fall through to execCommand
              tryExecCopy();
            });
          copied = true; // optimistic; real resolve happens above
        } else {
          tryExecCopy();
        }
      } catch {
        tryDownloadFallback();
      }

      function tryExecCopy() {
        try {
          const ta = document.createElement("textarea");
          ta.value = md;
          ta.setAttribute("readonly", "");
          ta.setAttribute("aria-hidden", "true");
          ta.style.position = "fixed";
          ta.style.top = "-1000px";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand("copy");
          document.body.removeChild(ta);
          if (ok) {
            setStatus("copied");
            window.setTimeout(() => setStatus("idle"), 1800);
          } else {
            tryDownloadFallback();
          }
        } catch {
          tryDownloadFallback();
        }
      }

      function tryDownloadFallback() {
        try {
          triggerDownload(filename, md);
          setStatus("downloaded");
          window.setTimeout(() => setStatus("idle"), 2200);
        } catch {
          // As a last resort surface a console message — this path is extremely
          // unlikely because Blob URLs are supported everywhere LaunchLens targets.
          console.warn("LaunchLens: unable to copy or download markdown");
        }
      }

      // If we kicked off an async clipboard write we already scheduled the
      // "copied" state from the .then() handler; do not overwrite it here.
      void copied;
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
          ? "border-[#138a72] bg-[#e5f4ef] text-[#0f766e] focus-visible:ring-[#cbe8df]"
          : status === "downloaded"
            ? "border-[#554a8b] bg-[#e9e7f7] text-[#554a8b] focus-visible:ring-[#cbe8df]"
            : "border-[#cfd8d1] bg-white text-[#17201d] hover:border-[#138a72] hover:text-[#138a72] focus-visible:ring-[#cbe8df]",
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
