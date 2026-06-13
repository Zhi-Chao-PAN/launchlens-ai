import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";

import { POST } from "./route";

const ownerToken = "a".repeat(43);
const recoveryToken = "b".repeat(43);

vi.mock("@/lib/launchlens/workspace-store", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/launchlens/workspace-store")>();

  return {
    ...original,
    cloudStorageConfigured: vi.fn(() => true),
    consumeWorkspaceMutationSlot: vi.fn(async () => true),
    migrateWorkspaceOwner: vi.fn(async () => ({ migrated: 2 })),
  };
});

describe("/api/workspaces/recovery", () => {
  beforeEach(() => {
    resetWorkspaceRateLimitsForTests();
    vi.clearAllMocks();
  });

  it("migrates current browser snapshots to a recovery owner token", async () => {
    const response = await POST(
      new Request("http://localhost/api/workspaces/recovery", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ recoveryOwnerToken: recoveryToken }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ migrated: 2 });
  });

  it("rejects malformed recovery owner tokens", async () => {
    const response = await POST(
      new Request("http://localhost/api/workspaces/recovery", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ recoveryOwnerToken: "short" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_owner_token",
    });
  });
});
