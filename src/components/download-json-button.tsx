"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";

import type { LaunchLensWorkspace } from "@/lib/launchlens/types";
import { downloadTextFile } from "@/lib/launchlens/clipboard";
import { safeJsonFilename } from "@/lib/launchlens/json-export";
import { workspaceToJson } from "@/lib/launchlens/json-export";

/**
 * One-click download of a shared workspace as a .json file. Mirrors
 * DownloadMarkdownButton so visitors who prefer machine-readable exports
 * do not need to use the in-app Copy JSON path. 2.2s checkmark feedback.
 */
export function DownloadJsonButton({
  workspace,
  className = "",
}: {
  workspace: LaunchLensWorkspace;
  className?: string;
}) {
  const [downloaded, setDownloaded] = useState(false);

  const handleClick = useCallback(() => {
    const json = workspaceToJson(workspace);
    const filename = safeJsonFilename({
      landingPage: { headline: workspace.landingPage.headline },
    });
    const ok = downloadTextFile(filename, json, "application/json;charset=utf-8");
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
      aria-label={downloaded ? "JSON file downloaded" : "Download workspace as JSON file"}
      title="Download .json file"
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
          Download .json
        </>
      )}
    </button>
  );
}
