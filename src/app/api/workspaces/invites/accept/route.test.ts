import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({
  acceptWorkspaceInvite: vi.fn(),
}));

vi.mock("@/lib/launchlens/workspace-store", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/launchlens/workspace-store")
  >()),
  acceptWorkspaceInvite: storeMocks.acceptWorkspaceInvite,
}));

import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";

import { POST } from "./route";

const ownerToken = "d".repeat(43);

describe("/api/workspaces/invites/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWorkspaceRateLimitsForTests();
  });

  it("accepts a valid invite and returns the workspace role", async () => {
    storeMocks.acceptWorkspaceInvite.mockResolvedValue({
      workspaceId: "ab12cd34-1234-5678-9abc-def012345678",
      role: "viewer",
    });
    const response = await POST(
      new Request("http://localhost/api/workspaces/invites/accept", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ token: "a".repeat(64) }),
      }),
    );
    expect(response.status).toBe(200);
    expect(storeMocks.acceptWorkspaceInvite).toHaveBeenCalledWith(
      ownerToken,
      "a".repeat(64),
    );
    await expect(response.json()).resolves.toEqual({
      workspaceId: "ab12cd34-1234-5678-9abc-def012345678",
      role: "viewer",
    });
  });

  it("returns 410 when the invite is expired or already used", async () => {
    storeMocks.acceptWorkspaceInvite.mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost/api/workspaces/invites/accept", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ token: "b".repeat(64) }),
      }),
    );
    expect(response.status).toBe(410);
  });

  it("rejects a malformed invite token", async () => {
    const response = await POST(
      new Request("http://localhost/api/workspaces/invites/accept", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ token: "short" }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_invite_token",
    });
  });
});
