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
    delete process.env.LAUNCHLENS_PROVIDER_LIVE_ENABLED;
  });

  afterEach(() => {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
    delete process.env.NEXT_PUBLIC_APP_VERSION;
    delete process.env.LAUNCHLENS_PROVIDER_LIVE_ENABLED;
  });

  it("returns ok status with mock provider and no database", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.provider).toBe("mock");
    expect(body.providerConfigured).toBe(false);
    expect(body.workspaceProviderLiveEnabled).toBe(false);
    expect(body.workspaceProviderActive).toBe(false);
    expect(body.dbConfigured).toBe(false);
    expect(body.dbHealthy).toBe(false);
    expect(body.dbLatencyMs).toBeNull();
    expect(body.version).toBe("1.0.0");
    expect(typeof body.uptimeSec).toBe("number");
    expect(body.vercelEnv).toBe("development");
  });

  it("returns version from NEXT_PUBLIC_APP_VERSION when set", async () => {
    process.env.NEXT_PUBLIC_APP_VERSION = "1.2.3";
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.version).toBe("1.2.3");
  });

  it("reflects configured provider keys separately from active workspace live mode", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.providerConfigured).toBe(true);
    expect(body.workspaceProviderLiveEnabled).toBe(false);
    expect(body.workspaceProviderActive).toBe(false);
    expect(body.provider).toBe("mock");
  });

  it("reports the active provider when workspace live mode is enabled", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    process.env.LAUNCHLENS_PROVIDER_LIVE_ENABLED = "true";
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.providerConfigured).toBe(true);
    expect(body.workspaceProviderLiveEnabled).toBe(true);
    expect(body.workspaceProviderActive).toBe(true);
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
