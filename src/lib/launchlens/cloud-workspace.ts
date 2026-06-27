import type { LaunchLensInput, LaunchLensWorkspace } from "./types";
import type { WorkspaceExecutionState } from "./execution";
import type { SharedExecutionState } from "./execution";
import { getDefaultCommercialPlan } from "./commercial-entitlements";

export const MAX_CLOUD_WORKSPACES =
  getDefaultCommercialPlan().limits.cloudSnapshots;
export const MAX_TOTAL_CLOUD_WORKSPACES = 5_000;

export type CloudWorkspaceSummary = {
  id: string;
  title: string;
  isPublic: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CloudWorkspaceRecord = CloudWorkspaceSummary & {
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
  execution: WorkspaceExecutionState;
};

export type SharedCloudWorkspaceRecord = CloudWorkspaceSummary & {
  workspace: LaunchLensWorkspace;
  execution: SharedExecutionState;
};

export type CloudWorkspaceListResponse = {
  configured: boolean;
  workspaces: CloudWorkspaceSummary[];
};

export type CloudWorkspaceResponse = {
  workspace: CloudWorkspaceRecord;
};

export type CloudWorkspaceErrorResponse = {
  code: string;
  error: string;
};
