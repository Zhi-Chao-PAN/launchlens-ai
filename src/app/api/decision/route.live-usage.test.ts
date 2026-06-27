import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exampleWorkspaces } from "@/lib/launchlens/example-workspaces";

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
    generateDecisionBrief: vi.fn(),
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

vi.mock("@/lib/launchlens/decision-provider", () => ({
  generateDecisionBrief: routeMocks.generateDecisionBrief,
}));

import { POST, resetDecisionRateLimitsForTests } from "./route";

const ownerToken = "e".repeat(43);
const sample = exampleWorkspaces[0].execution.experiments[0];

function postExperiment(headers: HeadersInit = {}) {
  return POST(
    new Request("http://localhost/api/decision", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({
        experiment: { ...sample, experimentId: sample.id },
      }),
    }),
  );
}

describe("/api/decision live provider usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDecisionRateLimitsForTests();
    process.env.DECISION_COPILOT_LIVE_ENABLED = "true";
    routeMocks.configuredRealProvider.mockReturnValue("minimax");
    routeMocks.consumeLiveProviderUsageSlot.mockResolvedValue({
      feature: "decision_brief",
      periodStart: "2026-06-01",
      planId: "team",
      planName: "Team",
      limit: 500,
      used: 42,
      remaining: 458,
    });
    routeMocks.generateDecisionBrief.mockResolvedValue({
      brief: { headline: "Keep testing this assumption." },
      mode: "real",
      usedFallback: false,
    });
  });

  afterEach(() => {
    delete process.env.DECISION_COPILOT_LIVE_ENABLED;
    resetDecisionRateLimitsForTests();
  });

  it("consumes a monthly live-provider slot before a real decision brief", async () => {
    const response = await postExperiment({ "x-launchlens-owner": ownerToken });

    expect(response.status).toBe(200);
    expect(routeMocks.consumeLiveProviderUsageSlot).toHaveBeenCalledWith({
      ownerHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      feature: "decision_brief",
    });
    expect(routeMocks.generateDecisionBrief).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toMatchObject({
      mode: "real",
      usage: {
        feature: "decision_brief",
        periodStart: "2026-06-01",
        used: 42,
        remaining: 458,
      },
    });
  });

  it("rejects live decision briefs without a capability owner token", async () => {
    const response = await postExperiment();

    expect(response.status).toBe(401);
    expect(routeMocks.consumeLiveProviderUsageSlot).not.toHaveBeenCalled();
    expect(routeMocks.generateDecisionBrief).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_owner_token",
    });
  });

  it("does not consume usage when decision live mode is disabled", async () => {
    delete process.env.DECISION_COPILOT_LIVE_ENABLED;

    const response = await postExperiment();

    expect(response.status).toBe(200);
    expect(routeMocks.consumeLiveProviderUsageSlot).not.toHaveBeenCalled();
    expect(routeMocks.generateDecisionBrief).toHaveBeenCalledTimes(1);
  });
});
