import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const subscriptionStoreMocks = vi.hoisted(() => ({
  getCommercialSubscriptionByOwnerHash: vi.fn(),
  resolveCommercialEntitlementForOwnerHash: vi.fn(),
  resolvePreviewCommercialEntitlement: vi.fn(),
}));

vi.mock("@/lib/launchlens/commercial-subscription-store", async () => ({
  getCommercialSubscriptionByOwnerHash:
    subscriptionStoreMocks.getCommercialSubscriptionByOwnerHash,
  resolveCommercialEntitlementForOwnerHash:
    subscriptionStoreMocks.resolveCommercialEntitlementForOwnerHash,
  resolvePreviewCommercialEntitlement:
    subscriptionStoreMocks.resolvePreviewCommercialEntitlement,
}));

import { GET } from "./route";

const ownerToken = "d".repeat(43);

function previewEntitlement() {
  return {
    planId: "team" as const,
    plan: {
      id: "team" as const,
      name: "Team preview",
      audience: "Small product teams.",
      billingStatus: "preview" as const,
      checkoutStatus: "manual-intake" as const,
      summary: "Team preview entitlement.",
      limits: {
        cloudSnapshots: 20,
        tenantsPerOwner: 5,
        membersPerWorkspace: 10,
        publicShareLinks: 50,
        liveProviderRunsPerMonth: 500,
        decisionHistoryDays: 90,
      },
      capabilities: ["Tenant isolation"],
      enforcementNotes: ["Preview only"],
    },
    entitlement: {
      activePlanId: "team" as const,
      activePlanName: "Team preview",
      billingStatus: "preview" as const,
      checkoutStatus: "manual-intake" as const,
      limits: {
        cloudSnapshots: 20,
        tenantsPerOwner: 5,
        membersPerWorkspace: 10,
        publicShareLinks: 50,
        liveProviderRunsPerMonth: 500,
        decisionHistoryDays: 90,
      },
      capabilities: ["Tenant isolation"],
      enforcementNotes: ["Preview only"],
    },
    source: "preview" as const,
    access: "preview" as const,
    subscriptionStatus: "preview" as const,
    graceUntil: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

describe("/api/commercial/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
    delete process.env.LAUNCHLENS_COMMERCIAL_PLAN;
    delete process.env.NEXT_PUBLIC_LAUNCHLENS_COMMERCIAL_PLAN;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_SOLO;
    delete process.env.STRIPE_PRICE_TEAM;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
    delete process.env.LAUNCHLENS_COMMERCIAL_PLAN;
    delete process.env.NEXT_PUBLIC_LAUNCHLENS_COMMERCIAL_PLAN;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_SOLO;
    delete process.env.STRIPE_PRICE_TEAM;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("returns 200 with the preview entitlement and a safe billing summary when no database is configured", async () => {
    subscriptionStoreMocks.resolvePreviewCommercialEntitlement.mockReturnValue(
      previewEntitlement(),
    );

    const response = await GET(
      new Request("http://localhost/api/commercial/subscription", {
        headers: { "x-launchlens-owner": ownerToken },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(
      subscriptionStoreMocks.resolvePreviewCommercialEntitlement,
    ).toHaveBeenCalledTimes(1);
    expect(
      subscriptionStoreMocks.resolveCommercialEntitlementForOwnerHash,
    ).not.toHaveBeenCalled();
    expect(
      subscriptionStoreMocks.getCommercialSubscriptionByOwnerHash,
    ).not.toHaveBeenCalled();

    const body = await response.json();
    expect(body).toMatchObject({
      billing: {
        provider: "stripe",
        configured: false,
        checkoutEnabled: false,
        portalEnabled: false,
        webhookEnabled: false,
        billablePlans: [],
      },
      entitlement: {
        activePlanId: "team",
        activePlanName: "Team preview",
        source: "preview",
        access: "preview",
        subscriptionStatus: "preview",
      },
      subscription: null,
    });
    expect(body).not.toHaveProperty("ownerHash");
    expect(body).not.toHaveProperty("providerCustomerId");
    expect(body).not.toHaveProperty("providerSubscriptionId");
    expect(body).not.toHaveProperty("STRIPE_SECRET_KEY");
    expect(body).not.toHaveProperty("missingSecrets");
    expect(JSON.stringify(body)).not.toMatch(/sk_/);
  });

  it("never echoes owner hash, customer id, or subscription id in the preview branch", async () => {
    subscriptionStoreMocks.resolvePreviewCommercialEntitlement.mockReturnValue(
      previewEntitlement(),
    );

    const response = await GET(
      new Request("http://localhost/api/commercial/subscription", {
        headers: { "x-launchlens-owner": ownerToken },
      }),
    );

    const text = await response.text();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(text).not.toContain(ownerToken);
    expect(text).not.toMatch(/[a-f0-9]{64}/);
    expect(text).not.toMatch(/cus_/);
    expect(text).not.toMatch(/sub_/);
    expect(text).not.toMatch(/whsec_/);
    expect(text).not.toMatch(/sk_/);
  });

  it("preserves a non-store cache-control header and never leaks the configured plan env into the body", async () => {
    process.env.LAUNCHLENS_COMMERCIAL_PLAN = "solo";
    subscriptionStoreMocks.resolvePreviewCommercialEntitlement.mockReturnValue({
      ...previewEntitlement(),
      planId: "solo",
      entitlement: {
        ...previewEntitlement().entitlement,
        activePlanId: "solo",
        activePlanName: "Solo",
      },
    });

    const response = await GET(
      new Request("http://localhost/api/commercial/subscription", {
        headers: { "x-launchlens-owner": ownerToken },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body).not.toHaveProperty("env");
    expect(body).not.toHaveProperty("LAUNCHLENS_COMMERCIAL_PLAN");
    expect(JSON.stringify(body)).not.toMatch(/LAUNCHLENS_COMMERCIAL_PLAN/);
  });
});