import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({
  setWorkspaceSharingForMember: vi.fn(),
}));

vi.mock("@/lib/launchlens/workspace-store", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/launchlens/workspace-store")
  >()),
  setWorkspaceSharingForMember: storeMocks.setWorkspaceSharingForMember,
}));

import { exampleWorkspaces } from "@/lib/launchlens/example-workspaces";
import {
  MAX_SHARE_BODY_BYTES,
  resetWorkspaceRateLimitsForTests,
} from "@/lib/launchlens/workspace-api";

import { POST } from "./route";

const ownerToken = "b".repeat(43);
const workspaceId = "4b5cf786-923d-4dd9-9f05-c10fe7fbe212";
const example = exampleWorkspaces[0];

describe("/api/workspaces/[id]/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWorkspaceRateLimitsForTests();
  });

  it("requires an explicit boolean share state", async () => {
    const response = await POST(
      new Request(`http://localhost/api/workspaces/${workspaceId}/share`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ enabled: "yes" }),
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_share_state",
    });
  });

  it("enables sharing through the member-scoped store operation", async () => {
    const sharedRecord = {
      id: workspaceId,
      title: "Activation workspace",
      input: example.input,
      workspace: example.workspace,
      execution: example.execution,
      isPublic: true,
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:01:00.000Z",
    };
    storeMocks.setWorkspaceSharingForMember.mockResolvedValue(sharedRecord);

    const response = await POST(
      new Request(`http://localhost/api/workspaces/${workspaceId}/share`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ enabled: true }),
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );

    expect(response.status).toBe(200);
    expect(storeMocks.setWorkspaceSharingForMember).toHaveBeenCalledWith(
      ownerToken,
      workspaceId,
      true,
    );
    await expect(response.json()).resolves.toEqual({
      workspace: sharedRecord,
    });
  });

  it("returns 403 when the caller is not an editor or owner", async () => {
    storeMocks.setWorkspaceSharingForMember.mockResolvedValue(null);
    const response = await POST(
      new Request(`http://localhost/api/workspaces/${workspaceId}/share`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ enabled: true }),
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "workspace_forbidden",
    });
  });

  it("rejects an oversized stream before parsing", async () => {
    const request = new Request(
      `http://localhost/api/workspaces/${workspaceId}/share`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ padding: "x".repeat(MAX_SHARE_BODY_BYTES) }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: workspaceId }),
    });

    expect(response.status).toBe(413);
    expect(storeMocks.setWorkspaceSharingForMember).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      code: "workspace_too_large",
    });
  });
});
