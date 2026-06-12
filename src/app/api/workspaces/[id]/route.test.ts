import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({
  deleteWorkspace: vi.fn(),
  getOwnedWorkspace: vi.fn(),
}));

vi.mock("@/lib/launchlens/workspace-store", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/launchlens/workspace-store")
  >()),
  deleteWorkspace: storeMocks.deleteWorkspace,
  getOwnedWorkspace: storeMocks.getOwnedWorkspace,
}));

import { exampleWorkspaces } from "@/lib/launchlens/example-workspaces";
import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";

import { DELETE, GET } from "./route";

const ownerToken = "a".repeat(43);
const workspaceId = "a5ff00db-60da-4b20-9468-751ce404b289";
const example = exampleWorkspaces[0];
const record = {
  id: workspaceId,
  title: "Activation workspace",
  input: example.input,
  workspace: example.workspace,
  isPublic: false,
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
};

describe("/api/workspaces/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWorkspaceRateLimitsForTests();
  });

  it("returns an owner-scoped workspace record", async () => {
    storeMocks.getOwnedWorkspace.mockResolvedValue(record);
    const response = await GET(
      new Request(`http://localhost/api/workspaces/${workspaceId}`, {
        headers: { "x-launchlens-owner": ownerToken },
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );

    expect(response.status).toBe(200);
    expect(storeMocks.getOwnedWorkspace).toHaveBeenCalledWith(
      ownerToken,
      workspaceId,
    );
    await expect(response.json()).resolves.toEqual({ workspace: record });
  });

  it("does not reveal whether another owner's workspace exists", async () => {
    storeMocks.getOwnedWorkspace.mockResolvedValue(null);
    const response = await GET(
      new Request(`http://localhost/api/workspaces/${workspaceId}`, {
        headers: { "x-launchlens-owner": ownerToken },
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "workspace_not_found",
    });
  });

  it("deletes only through the owner-scoped store operation", async () => {
    storeMocks.deleteWorkspace.mockResolvedValue(true);
    const response = await DELETE(
      new Request(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: { "x-launchlens-owner": ownerToken },
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );

    expect(response.status).toBe(204);
    expect(storeMocks.deleteWorkspace).toHaveBeenCalledWith(
      ownerToken,
      workspaceId,
    );
  });
});
