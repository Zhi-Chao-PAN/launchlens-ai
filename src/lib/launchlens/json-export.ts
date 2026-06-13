import type { LaunchLensWorkspace } from "./types";
import type { WorkspaceExecutionState } from "./execution";

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
