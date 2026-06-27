import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { commercialSubscriptionEventFromStripe } from "./stripe-server";

// Minimal, fully-typed Stripe fixtures. No network access, no real
// credentials. UUIDs match the workspace-validation isUuid shape.

const ENV = {
  STRIPE_SECRET_KEY: "sk_test_placeholder_value",
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder_value",
  STRIPE_PRICE_SOLO: "price_solo_placeholder",
  STRIPE_PRICE_TEAM: "price_team_placeholder",
};

const TENANT_UUID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_TENANT_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

type EventShape = Stripe.Event & { data: { object: Stripe.Subscription } };

function buildSubscription(overrides: {
  metadata?: Record<string, string>;
  customer?: string | { id: string };
  status?: Stripe.Subscription.Status;
  priceId?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number;
}): Stripe.Subscription {
  const status = overrides.status ?? "active";
  const currentPeriodEnd = overrides.currentPeriodEnd ?? 1_700_000_000;
  const subscription = {
    id: "sub_test_placeholder",
    object: "subscription",
    customer: overrides.customer ?? "cus_test_placeholder",
    status,
    cancel_at_period_end: overrides.cancelAtPeriodEnd ?? false,
    metadata: overrides.metadata ?? {},
    items: {
      object: "list",
      data: [
        {
          id: "si_test_placeholder",
          object: "subscription_item",
          current_period_end: currentPeriodEnd,
          price: {
            id: overrides.priceId ?? ENV.STRIPE_PRICE_SOLO,
          },
        },
      ],
      has_more: false,
      url: "/v1/subscription_items?subscription=sub_test_placeholder",
    },
  } as unknown as Stripe.Subscription;

  return subscription;
}

function buildEvent(
  eventType: Stripe.Event.Type,
  subscription: Stripe.Subscription,
  overrides: { id?: string; created?: number } = {},
): Stripe.Event {
  const event = {
    id: overrides.id ?? "evt_test_placeholder",
    object: "event",
    type: eventType,
    api_version: "2024-06-20",
    created: overrides.created ?? 1_700_000_000,
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: subscription,
    },
  } as unknown as Stripe.Event;

  return event as EventShape;
}

describe("commercialSubscriptionEventFromStripe", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = ENV.STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = ENV.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_PRICE_SOLO = ENV.STRIPE_PRICE_SOLO;
    process.env.STRIPE_PRICE_TEAM = ENV.STRIPE_PRICE_TEAM;
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_SOLO;
    delete process.env.STRIPE_PRICE_TEAM;
  });

  it("maps a supported subscription event with tenant/plan metadata, customer id, status, cancel_at_period_end, and item current_period_end", () => {
    const event = buildEvent(
      "customer.subscription.updated",
      buildSubscription({
        metadata: {
          launchlensTenantId: TENANT_UUID,
          launchlensPlanId: "solo",
        },
        customer: "cus_test_placeholder",
        status: "active",
        priceId: ENV.STRIPE_PRICE_SOLO,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: 1_700_086_400,
      }),
      { id: "evt_subscription_updated", created: 1_700_000_000 },
    );

    const result = commercialSubscriptionEventFromStripe(
      event,
      "digest-abc",
    );

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      provider: "stripe",
      eventId: "evt_subscription_updated",
      eventType: "customer.subscription.updated",
      eventCreatedAt: 1_700_000_000,
      payloadDigest: "digest-abc",
      billingTenantId: TENANT_UUID,
      planId: "solo",
      status: "active",
      providerCustomerId: "cus_test_placeholder",
      providerSubscriptionId: "sub_test_placeholder",
      cancelAtPeriodEnd: true,
      graceUntil: null,
    });
    expect(result?.currentPeriodEnd).toBe(
      new Date(1_700_086_400 * 1000).toISOString(),
    );
  });

  it("uses customer object id form when the customer field is an expanded object", () => {
    const event = buildEvent(
      "customer.subscription.created",
      buildSubscription({
        metadata: {
          launchlensTenantId: TENANT_UUID,
          launchlensPlanId: "team",
        },
        customer: { id: "cus_expanded_placeholder" },
        status: "trialing",
        priceId: ENV.STRIPE_PRICE_TEAM,
      }),
    );

    const result = commercialSubscriptionEventFromStripe(event, "digest-xyz");

    expect(result?.providerCustomerId).toBe("cus_expanded_placeholder");
    expect(result?.planId).toBe("team");
    expect(result?.status).toBe("trialing");
  });

  it("lets the price-id mapping take precedence over stale plan metadata", () => {
    const event = buildEvent(
      "customer.subscription.updated",
      buildSubscription({
        metadata: {
          launchlensTenantId: TENANT_UUID,
          launchlensPlanId: "solo",
        },
        status: "active",
        // Price resolves to Team even though metadata claims Solo.
        priceId: ENV.STRIPE_PRICE_TEAM,
      }),
    );

    const result = commercialSubscriptionEventFromStripe(event, "digest-stale");

    expect(result?.planId).toBe("team");
  });

  it("returns a seven-day grace deadline for past_due based on event.created", () => {
    const eventCreated = 1_700_000_000;
    const event = buildEvent(
      "customer.subscription.updated",
      buildSubscription({
        metadata: {
          launchlensTenantId: TENANT_UUID,
          launchlensPlanId: "solo",
        },
        status: "past_due",
        priceId: ENV.STRIPE_PRICE_SOLO,
      }),
      { created: eventCreated },
    );

    const result = commercialSubscriptionEventFromStripe(event, "digest-grace");

    expect(result?.status).toBe("past_due");
    expect(result?.graceUntil).toBe(
      new Date((eventCreated + 7 * 24 * 60 * 60) * 1000).toISOString(),
    );
  });

  it("returns null when the event type is unsupported", () => {
    const event = buildEvent(
      "invoice.payment_succeeded" as Stripe.Event.Type,
      buildSubscription({
        metadata: {
          launchlensTenantId: TENANT_UUID,
          launchlensPlanId: "solo",
        },
        priceId: ENV.STRIPE_PRICE_SOLO,
      }),
    );

    expect(
      commercialSubscriptionEventFromStripe(event, "digest-unsupported"),
    ).toBeNull();
  });

  it("returns null when tenant metadata is missing", () => {
    const event = buildEvent(
      "customer.subscription.created",
      buildSubscription({
        metadata: { launchlensPlanId: "solo" },
        priceId: ENV.STRIPE_PRICE_SOLO,
      }),
    );

    expect(
      commercialSubscriptionEventFromStripe(event, "digest-no-tenant"),
    ).toBeNull();
  });

  it("returns null when tenant metadata is not a valid UUID", () => {
    const event = buildEvent(
      "customer.subscription.created",
      buildSubscription({
        metadata: {
          launchlensTenantId: "not-a-uuid",
          launchlensPlanId: "solo",
        },
        priceId: ENV.STRIPE_PRICE_SOLO,
      }),
    );

    expect(
      commercialSubscriptionEventFromStripe(event, "digest-bad-uuid"),
    ).toBeNull();
  });

  it("returns null when no plan metadata and no price mapping exists", () => {
    process.env.STRIPE_PRICE_SOLO = "price_solo_placeholder_unmapped";
    process.env.STRIPE_PRICE_TEAM = "price_team_placeholder_unmapped";

    const event = buildEvent(
      "customer.subscription.updated",
      buildSubscription({
        metadata: {
          launchlensTenantId: OTHER_TENANT_UUID,
          launchlensPlanId: "free",
        },
        status: "active",
        priceId: "price_unknown_placeholder",
      }),
    );

    expect(
      commercialSubscriptionEventFromStripe(event, "digest-unmapped"),
    ).toBeNull();
  });
});