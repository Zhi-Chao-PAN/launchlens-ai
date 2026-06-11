import type { LaunchLensWorkspace } from "./types";

export function workspaceToJson(workspace: LaunchLensWorkspace) {
  return `${JSON.stringify(workspace, null, 2)}\n`;
}
