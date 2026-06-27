import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const portalMocks = vi.hoisted(() => ({
  createStripePortal: vi.fn(),
}));

vi.mock("@/lib/launchlens/stripe-server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/launchlens/stripe-server")>(
    "@/lib/launchlens/stripe-server",
  );
  return {
    ...actual,
    createStripePortal: portalMocks.createStripePortal,
  };
});

import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";

import { POST } from "./route";

const ownerToken = "f".repeat(43);

function makePortalRequest() {
  return new Request("http://localhost/api/commercial/portal", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-launchlens-owner": ownerToken,
    },
    body: JSON.stringify({}),
  });
}

describe("/api/commercial/portal", () => {
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

  it("returns 503 billing_not_configured when the Stripe secret key is missing", async () => {
    const response = await POST(makePortalRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "billing_not_configured",
    });
    expect(portalMocks.createStripePortal).not.toHaveBeenCalled();
  });

  it("returns 503 billing_not_configured when only blank Stripe env values are present", async () => {
    process.env.STRIPE_SECRET_KEY = "   ";

    const response = await POST(makePortalRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "billing_not_configured",
    });
    expect(portalMocks.createStripePortal).not.toHaveBeenCalled();
  });

  it("does not invoke the Stripe SDK when configuration is missing", async () => {
    const response = await POST(makePortalRequest());

    expect(response.status).toBe(503);
    expect(portalMocks.createStripePortal).not.toHaveBeenCalled();
  });
});