"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";

import type { LaunchLensWorkspace } from "@/lib/launchlens/types";
import { downloadTextFile } from "@/lib/launchlens/clipboard";
import { safeMarkdownFilename, workspaceToMarkdown } from "@/lib/launchlens/markdown-export";

/**
 * One-click download of the shared workspace as a .md file. Uses the same
 * safe filename slugger as CopyMarkdownButton. 2.2s checkmark feedback so
 * visitors know the download started.
 */
export function DownloadMarkdownButton({
  workspace,
  className = "",
}: {
  workspace: LaunchLensWorkspace;
  className?: string;
}) {
  const [downloaded, setDownloaded] = useState(false);

  const handleClick = useCallback(() => {
    const md = workspaceToMarkdown(workspace);
    const filename = safeMarkdownFilename({
      landingPage: { headline: workspace.landingPage.headline },
    });
    const ok = downloadTextFile(filename, md, "text/markdown;charset=utf-8");
    if (ok) {
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 2200);
    }
  }, [workspace]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      aria-label={downloaded ? "Markdown file downloaded" : "Download workspace as Markdown file"}
      title="Download .md file"
      className={[
        "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        downloaded
          ? "border-[#554a8b] bg-[#e9e7f7] text-[#554a8b] focus-visible:ring-[#cbe8df]"
          : "border-input bg-card text-foreground hover:border-accent hover:text-accent focus-visible:ring-[#cbe8df]",
        className,
      ].join(" ")}
    >
      {downloaded ? (
        <>
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Downloaded
        </>
      ) : (
        <>
          <Download className="size-4" aria-hidden="true" />
          Download .md
        </>
      )}
    </button>
  );
}
