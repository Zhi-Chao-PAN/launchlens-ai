import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  allowWorkspaceMutation,
  resetWorkspaceRateLimitsForTests,
  workspaceApiError,
} from "./workspace-api";

describe("workspace API safeguards", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
    resetWorkspaceRateLimitsForTests();
  });

  it("keeps a bounded in-process mutation limit in local-only mode", async () => {
    const request = () =>
      new Request("http://localhost/api/workspaces", {
        headers: { "x-forwarded-for": "203.0.113.10" },
      });

    for (let index = 0; index < 20; index += 1) {
      await expect(allowWorkspaceMutation(request())).resolves.toBe(true);
    }

    await expect(allowWorkspaceMutation(request())).resolves.toBe(false);
  });

  it("logs only a fixed event code when an unexpected error contains a token", () => {
    const ownerCapability = `owner_${"sensitive".repeat(8)}`;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = workspaceApiError(
      new Error(`database failed for ${ownerCapability}`),
    );

    expect(response.status).toBe(503);
    expect(errorSpy).toHaveBeenCalledWith(
      "[launchlens:workspace-store] request_failed",
      { requestId: undefined },
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(ownerCapability);
    errorSpy.mockRestore();
  });

});
