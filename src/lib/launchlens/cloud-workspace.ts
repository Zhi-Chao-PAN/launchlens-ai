import type { LaunchLensInput, LaunchLensWorkspace } from "./types";

export const MAX_CLOUD_WORKSPACES = 20;
export const MAX_TOTAL_CLOUD_WORKSPACES = 5_000;

export type CloudWorkspaceSummary = {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CloudWorkspaceRecord = CloudWorkspaceSummary & {
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
};

export type SharedCloudWorkspaceRecord = CloudWorkspaceSummary & {
  workspace: LaunchLensWorkspace;
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
