export const WORKSPACE_ROLES = ["owner", "editor", "viewer"] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const WORKSPACE_ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 30,
  editor: 20,
  viewer: 10,
};

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return (
    typeof value === "string" &&
    (WORKSPACE_ROLES as readonly string[]).includes(value)
  );
}

export function workspaceRoleAtLeast(
  candidate: WorkspaceRole,
  minimum: WorkspaceRole,
): boolean {
  return WORKSPACE_ROLE_RANK[candidate] >= WORKSPACE_ROLE_RANK[minimum];
}

export function describeWorkspaceRole(role: WorkspaceRole) {
  switch (role) {
    case "owner":
      return "Full control of the workspace, including invites and deletion.";
    case "editor":
      return "Can save snapshots, edit the workspace, and toggle the public share link.";
    case "viewer":
      return "Can read the workspace and its decision briefs but cannot mutate it.";
  }
}
