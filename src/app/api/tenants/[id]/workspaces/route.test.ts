import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { exampleWorkspaces } from "@/lib/launchlens/example-workspaces";
import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";

import { GET, POST } from "./route";

const ownerToken = "d".repeat(43);
const tenantId = "11111111-2222-4333-8444-555555555555";

describe("/api/tenants/[id]/workspaces", () => {
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

  function getWorkspaces() {
    return GET(
      new Request(`http://localhost/api/tenants/${tenantId}/workspaces`, {
        headers: { "x-launchlens-owner": ownerToken },
      }),
      { params: Promise.resolve({ id: tenantId }) },
    );
  }

  function postWorkspace(body: unknown) {
    return POST(
      new Request(`http://localhost/api/tenants/${tenantId}/workspaces`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: tenantId }) },
    );
  }

  it("returns cloud_request_failed 503 on GET when no database is configured", async () => {
    const response = await getWorkspaces();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "cloud_request_failed",
    });
  });

  it("rejects malformed workspace payloads with 400", async () => {
    const response = await postWorkspace({ title: "Incomplete" });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_workspace",
    });
  });

  it("returns cloud_request_failed 503 on a valid payload when no database is configured", async () => {
    const example = exampleWorkspaces[0];
    const response = await postWorkspace({
      title: "Activation workspace",
      input: example.input,
      workspace: example.workspace,
      execution: example.execution,
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "cloud_request_failed",
    });
  });
});
