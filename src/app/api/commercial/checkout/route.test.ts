import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkoutMocks = vi.hoisted(() => ({
  createStripeCheckout: vi.fn(),
  ensureBillingTenantForOwnerHash: vi.fn(),
  getCommercialSubscriptionByOwnerHash: vi.fn(),
  allowWorkspaceMutation: vi.fn(),
}));

vi.mock("@/lib/launchlens/stripe-server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/launchlens/stripe-server")>(
    "@/lib/launchlens/stripe-server",
  );
  return {
    ...actual,
    createStripeCheckout: checkoutMocks.createStripeCheckout,
  };
});

vi.mock("@/lib/launchlens/commercial-subscription-store", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/launchlens/commercial-subscription-store")
  >("@/lib/launchlens/commercial-subscription-store");
  return {
    ...actual,
    ensureBillingTenantForOwnerHash:
      checkoutMocks.ensureBillingTenantForOwnerHash,
    getCommercialSubscriptionByOwnerHash:
      checkoutMocks.getCommercialSubscriptionByOwnerHash,
  };
});

vi.mock("@/lib/launchlens/workspace-api", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/launchlens/workspace-api")
  >("@/lib/launchlens/workspace-api");
  return {
    ...actual,
    allowWorkspaceMutation: checkoutMocks.allowWorkspaceMutation,
  };
});

import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";

import { POST } from "./route";

const ownerToken = "e".repeat(43);

function makeCheckoutRequest(body: string, contentLength?: number) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-launchlens-owner": ownerToken,
  };
  if (typeof contentLength === "number") {
    headers["content-length"] = String(contentLength);
  }
  return new Request("http://localhost/api/commercial/checkout", {
    method: "POST",
    headers,
    body,
  });
}

describe("/api/commercial/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWorkspaceRateLimitsForTests();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_SOLO;
    delete process.env.STRIPE_PRICE_TEAM;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetWorkspaceRateLimitsForTests();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_SOLO;
    delete process.env.STRIPE_PRICE_TEAM;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
  });

  it("returns 400 invalid_json when the request body cannot be parsed", async () => {
    const response = await POST(makeCheckoutRequest("{not-json"));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_json",
    });
    expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_billing_plan when the requested plan is free", async () => {
    const response = await POST(
      makeCheckoutRequest(JSON.stringify({ planId: "free" })),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_billing_plan",
    });
    expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_billing_plan for unknown plan ids", async () => {
    const response = await POST(
      makeCheckoutRequest(JSON.stringify({ planId: "enterprise" })),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_billing_plan",
    });
    expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_billing_plan when the plan id is missing", async () => {
    const response = await POST(makeCheckoutRequest(JSON.stringify({})));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "invalid_billing_plan",
    });
    expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
  });

  it("returns 503 billing_not_configured when Stripe configuration is missing", async () => {
    const response = await POST(
      makeCheckoutRequest(JSON.stringify({ planId: "solo" })),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "billing_not_configured",
    });
    expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
  });

  it("returns 503 billing_not_configured when only the price ids are missing", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_placeholder_value";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder_value";

    const response = await POST(
      makeCheckoutRequest(JSON.stringify({ planId: "team" })),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "billing_not_configured",
    });
    expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
  });

  it("does not invoke the Stripe SDK when configuration is missing", async () => {
    const response = await POST(
      makeCheckoutRequest(JSON.stringify({ planId: "team" })),
    );

    expect(response.status).toBe(503);
    expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
  });

  describe("success path", () => {
    beforeEach(() => {
      checkoutMocks.allowWorkspaceMutation.mockResolvedValue(true);
      checkoutMocks.ensureBillingTenantForOwnerHash.mockResolvedValue(
        "00000000-0000-4000-8000-000000000001",
      );
      checkoutMocks.getCommercialSubscriptionByOwnerHash.mockResolvedValue(
        null,
      );
    });

    function applySuccessEnv() {
      process.env.STRIPE_SECRET_KEY = "sk_test_placeholder_value";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder_value";
      process.env.STRIPE_PRICE_SOLO = "price_solo_placeholder";
      process.env.STRIPE_PRICE_TEAM = "price_team_placeholder";
      process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
    }

    it("returns 200 with the hosted Checkout URL for a fully configured Solo request", async () => {
      applySuccessEnv();
      const hostedUrl =
        "https://checkout.stripe.com/c/pay/cs_test_placeholder_value";
      checkoutMocks.createStripeCheckout.mockResolvedValue(hostedUrl);

      const response = await POST(
        makeCheckoutRequest(JSON.stringify({ planId: "solo" })),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toMatchObject({ url: hostedUrl });

      expect(checkoutMocks.createStripeCheckout).toHaveBeenCalledTimes(1);
      expect(checkoutMocks.createStripeCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerHash: expect.any(String),
          billingTenantId: "00000000-0000-4000-8000-000000000001",
          planId: "solo",
          appBaseUrl: "https://example.test",
          existingCustomerId: undefined,
        }),
      );
      expect(
        checkoutMocks.getCommercialSubscriptionByOwnerHash,
      ).toHaveBeenCalledTimes(1);
      expect(
        checkoutMocks.ensureBillingTenantForOwnerHash,
      ).toHaveBeenCalledTimes(1);
    });

    it("returns 409 billing_subscription_exists when an active subscription already exists and does not call Checkout", async () => {
      applySuccessEnv();
      checkoutMocks.getCommercialSubscriptionByOwnerHash.mockResolvedValue({
        ownerHash: "hashed-owner",
        billingTenantId: "00000000-0000-4000-8000-000000000001",
        planId: "solo",
        status: "active",
        providerCustomerId: "cus_existing_placeholder",
        providerSubscriptionId: "sub_existing_placeholder",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        graceUntil: null,
        latestEventId: "evt_existing_placeholder",
        latestEventCreatedAt: 1_700_000_000,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
      });

      const response = await POST(
        makeCheckoutRequest(JSON.stringify({ planId: "solo" })),
      );

      expect(response.status).toBe(409);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toMatchObject({
        code: "billing_subscription_exists",
      });
      expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
      expect(
        checkoutMocks.ensureBillingTenantForOwnerHash,
      ).not.toHaveBeenCalled();
    });

    it("starts a replacement checkout for a canceled subscription using the existing customer", async () => {
      applySuccessEnv();
      checkoutMocks.getCommercialSubscriptionByOwnerHash.mockResolvedValue({
        ownerHash: "hashed-owner",
        billingTenantId: "00000000-0000-4000-8000-000000000001",
        planId: "solo",
        status: "canceled",
        providerCustomerId: "cus_existing_placeholder",
        providerSubscriptionId: "sub_canceled_placeholder",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        graceUntil: null,
        latestEventId: "evt_canceled_placeholder",
        latestEventCreatedAt: 1_700_000_000,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
      });
      checkoutMocks.createStripeCheckout.mockResolvedValue(
        "https://checkout.stripe.com/c/pay/cs_test_replacement",
      );

      const response = await POST(
        makeCheckoutRequest(JSON.stringify({ planId: "team" })),
      );

      expect(response.status).toBe(200);
      expect(checkoutMocks.createStripeCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: "team",
          existingCustomerId: "cus_existing_placeholder",
        }),
      );
    });

    it("returns 409 billing_subscription_exists when a trialing subscription already exists and does not call Checkout", async () => {
      applySuccessEnv();
      checkoutMocks.getCommercialSubscriptionByOwnerHash.mockResolvedValue({
        ownerHash: "hashed-owner",
        billingTenantId: "00000000-0000-4000-8000-000000000001",
        planId: "team",
        status: "trialing",
        providerCustomerId: "cus_existing_placeholder",
        providerSubscriptionId: "sub_existing_placeholder",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        graceUntil: null,
        latestEventId: "evt_existing_placeholder",
        latestEventCreatedAt: 1_700_000_000,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
      });

      const response = await POST(
        makeCheckoutRequest(JSON.stringify({ planId: "team" })),
      );

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        code: "billing_subscription_exists",
      });
      expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
    });

    it("returns 409 billing_subscription_exists when a past_due subscription already exists and does not call Checkout", async () => {
      applySuccessEnv();
      checkoutMocks.getCommercialSubscriptionByOwnerHash.mockResolvedValue({
        ownerHash: "hashed-owner",
        billingTenantId: "00000000-0000-4000-8000-000000000001",
        planId: "solo",
        status: "past_due",
        providerCustomerId: "cus_existing_placeholder",
        providerSubscriptionId: "sub_existing_placeholder",
        currentPeriodEnd: "2026-07-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
        graceUntil: "2026-06-22T00:00:00.000Z",
        latestEventId: "evt_existing_placeholder",
        latestEventCreatedAt: 1_700_000_000,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
      });

      const response = await POST(
        makeCheckoutRequest(JSON.stringify({ planId: "solo" })),
      );

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        code: "billing_subscription_exists",
      });
      expect(checkoutMocks.createStripeCheckout).not.toHaveBeenCalled();
    });
  });
});
