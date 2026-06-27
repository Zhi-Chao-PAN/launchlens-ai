import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const webhookMocks = vi.hoisted(() => ({
  applyCommercialSubscriptionEvent: vi.fn(),
  commercialSubscriptionEventFromStripe: vi.fn(),
  constructStripeWebhookEvent: vi.fn(),
}));

vi.mock("@/lib/launchlens/stripe-server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/launchlens/stripe-server")>(
    "@/lib/launchlens/stripe-server",
  );
  return {
    ...actual,
    commercialSubscriptionEventFromStripe:
      webhookMocks.commercialSubscriptionEventFromStripe,
    constructStripeWebhookEvent: webhookMocks.constructStripeWebhookEvent,
  };
});

vi.mock("@/lib/launchlens/commercial-subscription-store", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/launchlens/commercial-subscription-store")
  >("@/lib/launchlens/commercial-subscription-store");
  return {
    ...actual,
    applyCommercialSubscriptionEvent:
      webhookMocks.applyCommercialSubscriptionEvent,
  };
});

import { MAX_STRIPE_WEBHOOK_BODY_BYTES } from "@/lib/launchlens/workspace-api";

import { POST } from "./route";

function makeWebhookRequest(options: {
  body?: string;
  contentLength?: number;
  signature?: string;
}) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (typeof options.contentLength === "number") {
    headers["content-length"] = String(options.contentLength);
  }
  if (typeof options.signature === "string") {
    headers["stripe-signature"] = options.signature;
  }
  const init: RequestInit = {
    method: "POST",
    headers,
  };
  if (options.body !== undefined) {
    init.body = options.body;
  }
  return new Request("http://localhost/api/webhooks/stripe", init);
}

describe("/api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_SOLO;
    delete process.env.STRIPE_PRICE_TEAM;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_SOLO;
    delete process.env.STRIPE_PRICE_TEAM;
  });

  it("returns 400 billing_signature_invalid when no stripe-signature header is provided", async () => {
    const response = await POST(
      makeWebhookRequest({ body: JSON.stringify({ type: "ping" }) }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "billing_signature_invalid",
    });
    expect(webhookMocks.constructStripeWebhookEvent).not.toHaveBeenCalled();
    expect(webhookMocks.applyCommercialSubscriptionEvent).not.toHaveBeenCalled();
  });

  it("treats whitespace-only stripe-signature headers as missing", async () => {
    const response = await POST(
      makeWebhookRequest({
        body: JSON.stringify({ type: "ping" }),
        signature: "   ",
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "billing_signature_invalid",
    });
    expect(webhookMocks.constructStripeWebhookEvent).not.toHaveBeenCalled();
  });

  it("returns 413 body_too_large when the content-length header exceeds the limit", async () => {
    const response = await POST(
      makeWebhookRequest({
        body: JSON.stringify({ type: "ping" }),
        contentLength: MAX_STRIPE_WEBHOOK_BODY_BYTES + 1,
        signature: "t=1,v1=placeholder",
      }),
    );

    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "body_too_large",
    });
    expect(webhookMocks.constructStripeWebhookEvent).not.toHaveBeenCalled();
    expect(webhookMocks.applyCommercialSubscriptionEvent).not.toHaveBeenCalled();
  });

  it("returns 503 billing_not_configured when webhook configuration is missing", async () => {
    const response = await POST(
      makeWebhookRequest({
        body: JSON.stringify({ type: "ping" }),
        signature: "t=1,v1=placeholder",
      }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "billing_not_configured",
    });
    expect(webhookMocks.constructStripeWebhookEvent).not.toHaveBeenCalled();
    expect(webhookMocks.applyCommercialSubscriptionEvent).not.toHaveBeenCalled();
  });

  it("returns 503 billing_not_configured when the webhook secret is blank", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "   ";
    process.env.STRIPE_SECRET_KEY = "sk_test_placeholder_value";

    const response = await POST(
      makeWebhookRequest({
        body: JSON.stringify({ type: "ping" }),
        signature: "t=1,v1=placeholder",
      }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "billing_not_configured",
    });
    expect(webhookMocks.constructStripeWebhookEvent).not.toHaveBeenCalled();
  });

  describe("success path", () => {
    beforeEach(() => {
      process.env.STRIPE_SECRET_KEY = "sk_test_placeholder_value";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder_value";
    });

    it("calls applyCommercialSubscriptionEvent for a valid supported event and returns handled=true", async () => {
      const body = JSON.stringify({ id: "evt_supported_placeholder" });
      const fakeEvent = { id: "evt_supported_placeholder" };
      const fakeSubscriptionEvent = {
        provider: "stripe",
        eventId: "evt_supported_placeholder",
        eventType: "customer.subscription.updated",
      };
      webhookMocks.constructStripeWebhookEvent.mockReturnValue(fakeEvent);
      webhookMocks.commercialSubscriptionEventFromStripe.mockReturnValue(
        fakeSubscriptionEvent,
      );
      webhookMocks.applyCommercialSubscriptionEvent.mockResolvedValue({
        duplicate: false,
        applied: true,
        disposition: "processed",
      });

      const response = await POST(
        makeWebhookRequest({
          body,
          signature: "t=1,v1=placeholder",
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toMatchObject({
        received: true,
        handled: true,
        duplicate: false,
        disposition: "processed",
      });
      expect(webhookMocks.constructStripeWebhookEvent).toHaveBeenCalledTimes(1);
      expect(
        webhookMocks.commercialSubscriptionEventFromStripe,
      ).toHaveBeenCalledTimes(1);
      expect(
        webhookMocks.applyCommercialSubscriptionEvent,
      ).toHaveBeenCalledTimes(1);
      expect(
        webhookMocks.applyCommercialSubscriptionEvent,
      ).toHaveBeenCalledWith(fakeSubscriptionEvent);
    });

    it("acknowledges a duplicate result with duplicate=true and disposition=duplicate", async () => {
      const body = JSON.stringify({ id: "evt_duplicate_placeholder" });
      const fakeEvent = { id: "evt_duplicate_placeholder" };
      const fakeSubscriptionEvent = {
        provider: "stripe",
        eventId: "evt_duplicate_placeholder",
      };
      webhookMocks.constructStripeWebhookEvent.mockReturnValue(fakeEvent);
      webhookMocks.commercialSubscriptionEventFromStripe.mockReturnValue(
        fakeSubscriptionEvent,
      );
      webhookMocks.applyCommercialSubscriptionEvent.mockResolvedValue({
        duplicate: true,
        applied: false,
        disposition: "duplicate",
      });

      const response = await POST(
        makeWebhookRequest({
          body,
          signature: "t=1,v1=placeholder",
        }),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        received: true,
        handled: true,
        duplicate: true,
        disposition: "duplicate",
      });
      expect(
        webhookMocks.applyCommercialSubscriptionEvent,
      ).toHaveBeenCalledTimes(1);
    });

    it("returns handled=false for an unsupported signed event and does not call the store", async () => {
      const body = JSON.stringify({ id: "evt_unsupported_placeholder" });
      const fakeEvent = { id: "evt_unsupported_placeholder" };
      webhookMocks.constructStripeWebhookEvent.mockReturnValue(fakeEvent);
      webhookMocks.commercialSubscriptionEventFromStripe.mockReturnValue(null);

      const response = await POST(
        makeWebhookRequest({
          body,
          signature: "t=1,v1=placeholder",
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toMatchObject({
        received: true,
        handled: false,
      });
      expect(webhookMocks.constructStripeWebhookEvent).toHaveBeenCalledTimes(1);
      expect(
        webhookMocks.commercialSubscriptionEventFromStripe,
      ).toHaveBeenCalledTimes(1);
      expect(
        webhookMocks.applyCommercialSubscriptionEvent,
      ).not.toHaveBeenCalled();
    });

    it("returns 400 billing_signature_invalid when signature verification fails", async () => {
      webhookMocks.constructStripeWebhookEvent.mockImplementation(() => {
        throw new Error("signature mismatch");
      });

      const response = await POST(
        makeWebhookRequest({
          body: JSON.stringify({ id: "evt_bad_sig" }),
          signature: "t=1,v1=bad",
        }),
      );

      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toMatchObject({
        code: "billing_signature_invalid",
      });
      expect(
        webhookMocks.applyCommercialSubscriptionEvent,
      ).not.toHaveBeenCalled();
    });
  });
});