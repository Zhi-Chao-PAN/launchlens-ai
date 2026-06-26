import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";

import { GET, POST } from "./route";

const ownerToken = "b".repeat(43);

describe("/api/tenants", () => {
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

  function getTenants() {
    return GET(
      new Request("http://localhost/api/tenants", {
        headers: { "x-launchlens-owner": ownerToken },
      }),
    );
  }

  function postTenant(body: unknown) {
    return POST(
      new Request("http://localhost/api/tenants", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify(body),
      }),
    );
  }

  it("returns cloud_request_failed when no database is configured", async () => {
    const response = await getTenants();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "cloud_request_failed",
    });
  });

  it("rejects tenant creation without a name", async () => {
    const response = await postTenant({});
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_tenant_payload",
    });
  });

  it("rejects tenant creation with a non-string name", async () => {
    const response = await postTenant({ name: 42 });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_tenant_payload",
    });
  });

  it("returns cloud_request_failed on a valid tenant payload when no database is configured", async () => {
    const response = await postTenant({ name: "Smoke tenant A" });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "cloud_request_failed",
    });
  });
});
