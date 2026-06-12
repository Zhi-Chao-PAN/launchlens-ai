import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { exampleWorkspaces } from "@/lib/launchlens/example-workspaces";
import {
  MAX_WORKSPACE_BODY_BYTES,
  resetWorkspaceRateLimitsForTests,
} from "@/lib/launchlens/workspace-api";

import { GET, POST } from "./route";

const ownerToken = "a".repeat(43);

describe("/api/workspaces", () => {
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

  it("reports explicit local-only capability when no database is configured", async () => {
    const response = await GET(
      new Request("http://localhost/api/workspaces", {
        headers: { "x-launchlens-owner": ownerToken },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      configured: false,
      workspaces: [],
    });
  });

  it("rejects malformed workspace payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({ title: "Incomplete" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_workspace",
    });
  });

  it("keeps a valid snapshot schema separate from database availability", async () => {
    const example = exampleWorkspaces[0];
    const response = await POST(
      new Request("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({
          title: "Activation workspace",
          input: example.input,
          workspace: example.workspace,
        }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "cloud_unavailable",
    });
  });

  it("rejects an oversized stream before JSON parsing without Content-Length", async () => {
    const request = new Request("http://localhost/api/workspaces", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-launchlens-owner": ownerToken,
      },
      body: JSON.stringify({ padding: "x".repeat(MAX_WORKSPACE_BODY_BYTES) }),
    });

    expect(request.headers.get("content-length")).toBeNull();
    const response = await POST(request);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      code: "workspace_too_large",
    });
  });
});
