import { describe, expect, it } from "vitest";

import {
  COMMERCIAL_PLAN_IDS,
  DEFAULT_COMMERCIAL_PLAN_ID,
  commercialPlanCatalog,
  commercialPlanIdFromEnv,
  evaluateCommercialLimit,
  getCommercialPlan,
  resolveCommercialPlanId,
  summarizeCommercialEntitlement,
} from "./commercial-entitlements";

describe("commercial entitlements", () => {
  it("keeps the public preview on the Team entitlement by default", () => {
    expect(DEFAULT_COMMERCIAL_PLAN_ID).toBe("team");
    expect(getCommercialPlan().limits.cloudSnapshots).toBe(20);
    expect(getCommercialPlan().limits.tenantsPerOwner).toBe(5);
    expect(getCommercialPlan().limits.membersPerWorkspace).toBe(10);
  });

  it("defines a complete catalog for every commercial plan id", () => {
    expect(Object.keys(commercialPlanCatalog).sort()).toEqual(
      [...COMMERCIAL_PLAN_IDS].sort(),
    );

    for (const plan of Object.values(commercialPlanCatalog)) {
      expect(plan.name.length).toBeGreaterThan(0);
      expect(plan.capabilities.length).toBeGreaterThan(0);
      expect(plan.enforcementNotes.length).toBeGreaterThan(0);
      expect(plan.limits.cloudSnapshots).toBeGreaterThanOrEqual(0);
      expect(plan.limits.membersPerWorkspace).toBeGreaterThanOrEqual(1);
    }
  });

  it("resolves unknown plan ids to the safe default", () => {
    expect(resolveCommercialPlanId("solo")).toBe("solo");
    expect(resolveCommercialPlanId("enterprise")).toBe("team");
    expect(resolveCommercialPlanId(undefined, "free")).toBe("free");
  });

  it("reads the server plan env before the public plan env", () => {
    expect(
      commercialPlanIdFromEnv({
        LAUNCHLENS_COMMERCIAL_PLAN: "solo",
        NEXT_PUBLIC_LAUNCHLENS_COMMERCIAL_PLAN: "free",
      }),
    ).toBe("solo");
    expect(
      commercialPlanIdFromEnv({
        NEXT_PUBLIC_LAUNCHLENS_COMMERCIAL_PLAN: "free",
      }),
    ).toBe("free");
  });

  it("returns a reviewer-safe entitlement summary", () => {
    expect(summarizeCommercialEntitlement(getCommercialPlan("solo"))).toEqual({
      activePlanId: "solo",
      activePlanName: "Solo",
      billingStatus: "paid-ready",
      checkoutStatus: "stripe-ready",
      limits: commercialPlanCatalog.solo.limits,
      capabilities: commercialPlanCatalog.solo.capabilities,
      enforcementNotes: commercialPlanCatalog.solo.enforcementNotes,
    });
  });

  it("allows usage within a plan limit", () => {
    expect(
      evaluateCommercialLimit(
        getCommercialPlan("solo"),
        "cloudSnapshots",
        19,
      ),
    ).toMatchObject({
      allowed: true,
      planId: "solo",
      limit: 20,
    });
  });

  it("returns a stable code when a plan limit would be exceeded", () => {
    expect(
      evaluateCommercialLimit(
        getCommercialPlan("free"),
        "cloudSnapshots",
        0,
      ),
    ).toMatchObject({
      allowed: false,
      code: "commercial_plan_limit_reached",
      limit: 0,
      planId: "free",
    });
  });
});
