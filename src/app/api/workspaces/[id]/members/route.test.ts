import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({
  createWorkspaceInvite: vi.fn(),
  listWorkspaceMembers: vi.fn(),
}));

vi.mock("@/lib/launchlens/workspace-store", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/launchlens/workspace-store")
  >()),
  createWorkspaceInvite: storeMocks.createWorkspaceInvite,
  listWorkspaceMembers: storeMocks.listWorkspaceMembers,
}));

import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";

import { GET, POST } from "./route";

const ownerToken = "c".repeat(43);
const workspaceId = "0c7c6f1e-5b6c-4f4b-8b8a-22b1f2c7d7e3";

describe("/api/workspaces/[id]/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWorkspaceRateLimitsForTests();
  });

  it("returns the member list when the caller is a member", async () => {
    storeMocks.listWorkspaceMembers.mockResolvedValue([
      { memberHash: "a".repeat(64), role: "owner", createdAt: "2026-06-13T00:00:00.000Z" },
      { memberHash: "b".repeat(64), role: "viewer", createdAt: "2026-06-13T00:01:00.000Z" },
    ]);
    const response = await GET(
      new Request(`http://localhost/api/workspaces/${workspaceId}/members`, {
        headers: { "x-launchlens-owner": ownerToken },
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      members: [
        { memberHash: "a".repeat(64), role: "owner", createdAt: "2026-06-13T00:00:00.000Z" },
        { memberHash: "b".repeat(64), role: "viewer", createdAt: "2026-06-13T00:01:00.000Z" },
      ],
    });
  });

  it("returns 403 when the caller is not a member", async () => {
    storeMocks.listWorkspaceMembers.mockResolvedValue(null);
    const response = await GET(
      new Request(`http://localhost/api/workspaces/${workspaceId}/members`, {
        headers: { "x-launchlens-owner": ownerToken },
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "workspace_forbidden",
    });
  });

  it("creates an invite when the caller is an owner and the role is allowed", async () => {
    storeMocks.createWorkspaceInvite.mockResolvedValue({
      token: "abcdefghijklmnopqrstuvwxyz123456",
      workspaceId,
      invitedRole: "editor",
      expiresAt: "2026-06-20T00:00:00.000Z",
    });
    const response = await POST(
      new Request(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ role: "editor" }),
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );
    expect(response.status).toBe(200);
    expect(storeMocks.createWorkspaceInvite).toHaveBeenCalledWith(
      ownerToken,
      workspaceId,
      "editor",
    );
  });

  it("rejects an owner role on invite because only the seed migration assigns it", async () => {
    const response = await POST(
      new Request(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ role: "owner" }),
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_member_role",
    });
  });
});
