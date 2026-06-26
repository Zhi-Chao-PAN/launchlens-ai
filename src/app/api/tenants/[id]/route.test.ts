import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";

import { GET } from "./route";

const ownerToken = "c".repeat(43);

describe("/api/tenants/[id]", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
    resetWorkspaceRateLimitsForTests();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
  });

  function getTenant(id: string) {
    return GET(
      new Request(`http://localhost/api/tenants/${id}`, {
        headers: { "x-launchlens-owner": ownerToken },
      }),
      { params: Promise.resolve({ id }) },
    );
  }

  it("rejects malformed tenant ids with 400", async () => {
    const response = await getTenant("not-a-uuid");
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_tenant_id",
    });
  });

  it("returns a cloud_request_failed 503 when no database is configured for a valid uuid", async () => {
    const response = await getTenant("11111111-2222-4333-8444-555555555555");
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "cloud_request_failed",
    });
  });
});
