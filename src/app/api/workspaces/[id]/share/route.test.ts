import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({
  setWorkspaceSharingForMember: vi.fn(),
  recordProductEvent: vi.fn(),
}));

vi.mock("@/lib/launchlens/workspace-store", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/launchlens/workspace-store")
  >()),
  setWorkspaceSharingForMember: storeMocks.setWorkspaceSharingForMember,
}));

vi.mock("@/lib/launchlens/product-events", () => ({
  recordProductEvent: storeMocks.recordProductEvent,
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
    storeMocks.recordProductEvent.mockResolvedValue(true);
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
      expiresAt: null,
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
      { expiresInDays: null },
    );
    expect(storeMocks.recordProductEvent).toHaveBeenCalledWith({
      ownerToken,
      eventName: "public_share_enabled",
      subjectKey: workspaceId,
    });
    await expect(response.json()).resolves.toEqual({
      workspace: sharedRecord,
    });
  });

  it("carries Stage 2 context into the public-share handoff event", async () => {
    const sharedRecord = {
      id: workspaceId,
      title: "Activation workspace",
      input: example.input,
      workspace: example.workspace,
      execution: example.execution,
      isPublic: true,
      expiresAt: null,
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
          "x-launchlens-stage2-participant": "P01",
          "x-launchlens-stage2-batch": "pilot-1",
        },
        body: JSON.stringify({ enabled: true }),
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );

    expect(response.status).toBe(200);
    expect(storeMocks.recordProductEvent).toHaveBeenCalledWith({
      ownerToken,
      eventName: "public_share_enabled",
      subjectKey: workspaceId,
      stage2: {
        stage2Participant: "P01",
        stage2Batch: "pilot-1",
      },
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

  it("forwards a supported expiresInDays to the store", async () => {
    storeMocks.setWorkspaceSharingForMember.mockResolvedValue({
      id: workspaceId,
      title: "Activation workspace",
      input: example.input,
      workspace: example.workspace,
      execution: example.execution,
      isPublic: true,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:01:00.000Z",
    });

    const response = await POST(
      new Request(`http://localhost/api/workspaces/${workspaceId}/share`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ enabled: true, expiresInDays: 7 }),
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );

    expect(response.status).toBe(200);
    expect(storeMocks.setWorkspaceSharingForMember).toHaveBeenCalledWith(
      ownerToken,
      workspaceId,
      true,
      { expiresInDays: 7 },
    );
  });

  it("rejects unsupported expiresInDays values", async () => {
    for (const bad of [1, 14, 365, 0, -7, "seven"]) {
      vi.clearAllMocks();
      resetWorkspaceRateLimitsForTests();
      const response = await POST(
        new Request(`http://localhost/api/workspaces/${workspaceId}/share`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-launchlens-owner": ownerToken,
          },
          body: JSON.stringify({ enabled: true, expiresInDays: bad }),
        }),
        { params: Promise.resolve({ id: workspaceId }) },
      );
      expect(response.status).toBe(400);
      expect(storeMocks.setWorkspaceSharingForMember).not.toHaveBeenCalled();
    }
  });

  it("drops expiresInDays when disabling sharing", async () => {
    storeMocks.setWorkspaceSharingForMember.mockResolvedValue({
      id: workspaceId,
      title: "Activation workspace",
      input: example.input,
      workspace: example.workspace,
      execution: example.execution,
      isPublic: false,
      expiresAt: null,
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:01:00.000Z",
    });

    const response = await POST(
      new Request(`http://localhost/api/workspaces/${workspaceId}/share`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ enabled: false, expiresInDays: 30 }),
      }),
      { params: Promise.resolve({ id: workspaceId }) },
    );

    expect(response.status).toBe(200);
    expect(storeMocks.setWorkspaceSharingForMember).toHaveBeenCalledWith(
      ownerToken,
      workspaceId,
      false,
      { expiresInDays: null },
    );
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
