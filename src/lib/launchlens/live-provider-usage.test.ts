import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCommercialPlan } from "./commercial-entitlements";

const usageMocks = vi.hoisted(() => ({
  neon: vi.fn(),
  resolveCommercialEntitlementForOwnerHash: vi.fn(),
}));

vi.mock("@neondatabase/serverless", () => ({
  neon: usageMocks.neon,
}));

vi.mock("./commercial-subscription-store", () => ({
  resolveCommercialEntitlementForOwnerHash:
    usageMocks.resolveCommercialEntitlementForOwnerHash,
}));

import {
  LiveProviderUsageError,
  consumeLiveProviderUsageSlot,
  getLiveProviderUsageSummaryForOwnerHash,
  liveProviderMonthlyPeriodStart,
  resetLiveProviderUsageForTests,
} from "./live-provider-usage";

const ownerHash = "a".repeat(64);

function entitlement(planId: "free" | "solo" | "team" = "team") {
  const plan = getCommercialPlan(planId);
  return {
    planId: plan.id,
    plan,
    entitlement: {},
    source: "subscription",
    access: "full",
    subscriptionStatus: "active",
    graceUntil: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

function makeSqlMock(options: {
  summaryUsed?: number;
  transactionUsed?: number;
  consumed?: boolean;
}) {
  type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => unknown;
  const sql = vi.fn(() => [{ used: options.summaryUsed ?? 0 }]);
  const transaction = vi.fn(async (callback: (tag: SqlTag) => unknown[]) => {
    let call = 0;
    const tag: SqlTag = vi.fn(() => {
      call += 1;
      return call === 1
        ? [{ locked: true }]
        : [
            {
              used: options.transactionUsed ?? 0,
              consumed: options.consumed ?? true,
            },
          ];
    });

    return callback(tag);
  });
  Object.assign(sql, { transaction });
  usageMocks.neon.mockReturnValue(sql);

  return { sql, transaction };
}

describe("live provider usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://usage-meter.test/db";
    usageMocks.resolveCommercialEntitlementForOwnerHash.mockResolvedValue(
      entitlement("team"),
    );
    resetLiveProviderUsageForTests();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
    resetLiveProviderUsageForTests();
  });

  it("uses a stable UTC month bucket", () => {
    expect(
      liveProviderMonthlyPeriodStart(
        new Date("2026-06-27T23:59:59.000Z"),
      ),
    ).toBe("2026-06-01");
  });

  it("summarizes current monthly usage against the resolved plan", async () => {
    makeSqlMock({ summaryUsed: 7 });

    await expect(
      getLiveProviderUsageSummaryForOwnerHash(
        ownerHash,
        new Date("2026-06-27T12:00:00.000Z"),
      ),
    ).resolves.toMatchObject({
      periodStart: "2026-06-01",
      planId: "team",
      limit: 500,
      used: 7,
      remaining: 493,
    });
  });

  it("atomically consumes a monthly slot before a live provider request", async () => {
    const { transaction } = makeSqlMock({ transactionUsed: 99 });

    await expect(
      consumeLiveProviderUsageSlot({
        ownerHash,
        feature: "workspace_generation",
        now: new Date("2026-06-27T12:00:00.000Z"),
      }),
    ).resolves.toMatchObject({
      feature: "workspace_generation",
      periodStart: "2026-06-01",
      limit: 500,
      used: 100,
      remaining: 400,
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects plans with no live-provider allowance before writing usage", async () => {
    const { transaction } = makeSqlMock({ transactionUsed: 0 });
    usageMocks.resolveCommercialEntitlementForOwnerHash.mockResolvedValue(
      entitlement("free"),
    );

    await expect(
      consumeLiveProviderUsageSlot({
        ownerHash,
        feature: "decision_brief",
        now: new Date("2026-06-27T12:00:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "commercial_plan_limit_reached",
      status: 409,
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects a full monthly bucket without consuming another slot", async () => {
    makeSqlMock({ transactionUsed: 500, consumed: false });

    await expect(
      consumeLiveProviderUsageSlot({
        ownerHash,
        feature: "decision_brief",
        now: new Date("2026-06-27T12:00:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "commercial_plan_limit_reached",
      status: 409,
    });
  });

  it("requires cloud storage before live provider metering can run", async () => {
    delete process.env.DATABASE_URL;
    makeSqlMock({ transactionUsed: 0 });

    await expect(
      consumeLiveProviderUsageSlot({
        ownerHash,
        feature: "workspace_generation",
      }),
    ).rejects.toBeInstanceOf(LiveProviderUsageError);
    await expect(
      consumeLiveProviderUsageSlot({
        ownerHash,
        feature: "workspace_generation",
      }),
    ).rejects.toMatchObject({
      code: "usage_meter_unavailable",
      status: 503,
    });
    expect(
      usageMocks.resolveCommercialEntitlementForOwnerHash,
    ).not.toHaveBeenCalled();
  });
});
