import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "./route";

describe("/api/status", () => {
  beforeEach(() => {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
    delete process.env.NEXT_PUBLIC_APP_VERSION;
  });

  afterEach(() => {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
    delete process.env.NEXT_PUBLIC_APP_VERSION;
  });

  it("returns ok status with mock provider and no database", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.provider).toBe("mock");
    expect(body.providerConfigured).toBe(false);
    expect(body.dbConfigured).toBe(false);
    expect(body.dbHealthy).toBe(false);
    expect(body.dbLatencyMs).toBeNull();
    expect(body.version).toBe("0.1.0");
    expect(typeof body.uptimeSec).toBe("number");
    expect(body.vercelEnv).toBe("development");
  });

  it("returns version from NEXT_PUBLIC_APP_VERSION when set", async () => {
    process.env.NEXT_PUBLIC_APP_VERSION = "1.2.3";
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.version).toBe("1.2.3");
  });

  it("reflects a configured real provider when MINIMAX_API_KEY is set", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.providerConfigured).toBe(true);
    expect(body.provider).toBe("minimax");
  });

  it("reflects db configured when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.dbConfigured).toBe(true);
  });

  it("includes gitSha and buildTime fields", async () => {
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.gitSha).toBeDefined();
    expect(body.buildTime).toBeDefined();
  });
});
