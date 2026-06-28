import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => {
  class MockLiveProviderUsageError extends Error {
    constructor(
      public readonly code: string,
      public readonly status: number,
      message: string,
    ) {
      super(message);
      this.name = "LiveProviderUsageError";
    }
  }

  return {
    configuredRealProvider: vi.fn(),
    consumeLiveProviderUsageSlot: vi.fn(),
    recordProductEvent: vi.fn(),
    generateLaunchWorkspace: vi.fn(),
    launchWorkspaceLiveProviderEnabled: vi.fn(),
    LiveProviderUsageError: MockLiveProviderUsageError,
  };
});

vi.mock("@/lib/launchlens/provider-runtime", () => ({
  configuredRealProvider: routeMocks.configuredRealProvider,
}));

vi.mock("@/lib/launchlens/live-provider-usage", () => ({
  LiveProviderUsageError: routeMocks.LiveProviderUsageError,
  consumeLiveProviderUsageSlot: routeMocks.consumeLiveProviderUsageSlot,
}));

vi.mock("@/lib/launchlens/product-events", () => ({
  recordProductEvent: routeMocks.recordProductEvent,
}));

vi.mock("@/lib/launchlens/provider", () => ({
  generateLaunchWorkspace: routeMocks.generateLaunchWorkspace,
  launchWorkspaceLiveProviderEnabled:
    routeMocks.launchWorkspaceLiveProviderEnabled,
}));

import { POST, resetGenerateRateLimitsForTests } from "./route";

const ownerToken = "d".repeat(43);
const validInput = {
  idea: "A weekly activation-fix digest for solo founders.",
  audience: "indie founders",
  market: "B2B SaaS",
  tone: "calm",
  constraints: "no marketing budget",
};

function postJson(headers: HeadersInit = {}) {
  return POST(
    new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(validInput),
    }),
  );
}

describe("/api/generate live provider usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGenerateRateLimitsForTests();
    routeMocks.launchWorkspaceLiveProviderEnabled.mockReturnValue(true);
    routeMocks.configuredRealProvider.mockReturnValue("minimax");
    routeMocks.consumeLiveProviderUsageSlot.mockResolvedValue({
      feature: "workspace_generation",
      periodStart: "2026-06-01",
      planId: "team",
      planName: "Team",
      limit: 500,
      used: 41,
      remaining: 459,
    });
    routeMocks.recordProductEvent.mockResolvedValue(true);
    routeMocks.generateLaunchWorkspace.mockResolvedValue({
      workspace: { provider: "minimax", generatedAt: "2026-06-27T00:00:00.000Z" },
      mode: "real",
      usedFallback: false,
    });
  });

  afterEach(() => {
    resetGenerateRateLimitsForTests();
  });

  it("consumes a monthly live-provider slot before generation", async () => {
    const response = await postJson({ "x-launchlens-owner": ownerToken });

    expect(response.status).toBe(200);
    expect(routeMocks.consumeLiveProviderUsageSlot).toHaveBeenCalledWith({
      ownerHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      feature: "workspace_generation",
    });
    expect(routeMocks.generateLaunchWorkspace).toHaveBeenCalledWith(validInput);
    expect(routeMocks.recordProductEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        ownerToken,
        eventName: "workspace_generation_started",
      }),
    );
    expect(routeMocks.recordProductEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        ownerToken,
        eventName: "workspace_generation_completed",
        provider: "minimax",
        mode: "real",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      mode: "real",
      usage: {
        feature: "workspace_generation",
        periodStart: "2026-06-01",
        used: 41,
        remaining: 459,
      },
    });
  });

  it("carries Stage 2 context into generation milestones", async () => {
    const response = await postJson({
      "x-launchlens-owner": ownerToken,
      "x-launchlens-stage2-participant": "P01",
      "x-launchlens-stage2-batch": "pilot-1",
    });

    expect(response.status).toBe(200);
    expect(routeMocks.recordProductEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        ownerToken,
        eventName: "workspace_generation_started",
        stage2: {
          stage2Participant: "P01",
          stage2Batch: "pilot-1",
        },
      }),
    );
    expect(routeMocks.recordProductEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        ownerToken,
        eventName: "workspace_generation_completed",
        stage2: {
          stage2Participant: "P01",
          stage2Batch: "pilot-1",
        },
      }),
    );
  });

  it("rejects live provider generation without a capability owner token", async () => {
    const response = await postJson();

    expect(response.status).toBe(401);
    expect(routeMocks.consumeLiveProviderUsageSlot).not.toHaveBeenCalled();
    expect(routeMocks.generateLaunchWorkspace).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_owner_token",
    });
  });

  it("does not consume usage when workspace live provider mode is disabled", async () => {
    routeMocks.launchWorkspaceLiveProviderEnabled.mockReturnValue(false);

    const response = await postJson();

    expect(response.status).toBe(200);
    expect(routeMocks.consumeLiveProviderUsageSlot).not.toHaveBeenCalled();
    expect(routeMocks.generateLaunchWorkspace).toHaveBeenCalledTimes(1);
  });
});
