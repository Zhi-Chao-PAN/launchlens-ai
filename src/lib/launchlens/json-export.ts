import type { LaunchLensWorkspace } from "./types";
import type { WorkspaceExecutionState } from "./execution";


export function safeJsonFilename(workspace: {
  projectName?: string | null;
  landingPage?: { headline?: string | null };
}) {
  const raw =
    workspace.projectName || workspace.landingPage?.headline || "launchlens-workspace";
  const base = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "launchlens-workspace"}.json`;
}
export function workspaceToJson(
  workspace: LaunchLensWorkspace,
  execution?: WorkspaceExecutionState,
) {
  return `${JSON.stringify(
    execution ? { workspace, execution } : workspace,
    null,
    2,
  )}\n`;
}
