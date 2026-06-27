import "server-only";

import Stripe from "stripe";

import {
  graceUntilForPastDue,
  isStripeSubscriptionStatus,
} from "./commercial-subscription";
import type { CommercialSubscriptionEvent } from "./commercial-subscription-store";
import {
  commercialPlanIdForStripePrice,
  isBillableCommercialPlan,
  stripePriceIdForPlan,
  type StripeBillingEnv,
} from "./stripe-billing";
import {
  ERROR_BILLING_CHECKOUT_FAILED,
  ERROR_BILLING_NOT_CONFIGURED,
  ERROR_INVALID_BILLING_PLAN,
} from "./error-codes";
import { isUuid } from "./workspace-validation";

const BILLING_TENANT_METADATA = "launchlensTenantId";
const BILLING_PLAN_METADATA = "launchlensPlanId";
const SUPPORTED_SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

let stripeClient: Stripe | null = null;
let stripeClientKey = "";

export class StripeBillingError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "StripeBillingError";
  }
}

function requiredEnv(env: StripeBillingEnv, key: string) {
  const value = env[key]?.trim();
  if (!value) {
    throw new StripeBillingError(
      ERROR_BILLING_NOT_CONFIGURED,
      503,
      "Stripe billing is not configured on this deployment.",
    );
  }
  return value;
}

export function getStripeClient(env: StripeBillingEnv = process.env) {
  const secretKey = requiredEnv(env, "STRIPE_SECRET_KEY");

  if (!stripeClient || stripeClientKey !== secretKey) {
    stripeClient = new Stripe(secretKey, {
      appInfo: {
        name: "LaunchLens AI",
        version: "1.0.0",
      },
    });
    stripeClientKey = secretKey;
  }

  return stripeClient;
}

export async function createStripeCheckout(input: {
  ownerHash: string;
  billingTenantId: string;
  planId: "solo" | "team";
  appBaseUrl: string;
  existingCustomerId?: string;
  env?: StripeBillingEnv;
}) {
  const env = input.env ?? process.env;
  const priceId = stripePriceIdForPlan(input.planId, env);
  if (!priceId) {
    throw new StripeBillingError(
      ERROR_INVALID_BILLING_PLAN,
      400,
      "The selected commercial plan is not available for checkout.",
    );
  }

  const metadata = {
    [BILLING_TENANT_METADATA]: input.billingTenantId,
    [BILLING_PLAN_METADATA]: input.planId,
  };
  const idempotencyBucket = Math.floor(Date.now() / (10 * 60 * 1000));
  const session = await getStripeClient(env).checkout.sessions.create(
    {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${input.appBaseUrl}/billing?checkout=success`,
      cancel_url: `${input.appBaseUrl}/billing?checkout=canceled`,
      client_reference_id: input.billingTenantId,
      customer: input.existingCustomerId,
      allow_promotion_codes: true,
      metadata,
      subscription_data: { metadata },
    },
    {
      idempotencyKey: [
        "launchlens-checkout",
        input.ownerHash,
        input.planId,
        idempotencyBucket,
      ].join(":"),
    },
  );

  if (!session.url) {
    throw new StripeBillingError(
      ERROR_BILLING_CHECKOUT_FAILED,
      502,
      "Stripe did not return a checkout URL.",
    );
  }

  return session.url;
}

export async function createStripePortal(input: {
  customerId: string;
  appBaseUrl: string;
  env?: StripeBillingEnv;
}) {
  const session = await getStripeClient(
    input.env ?? process.env,
  ).billingPortal.sessions.create({
    customer: input.customerId,
    return_url: `${input.appBaseUrl}/billing`,
  });

  return session.url;
}

export function constructStripeWebhookEvent(
  rawBody: string,
  signature: string,
  env: StripeBillingEnv = process.env,
) {
  return getStripeClient(env).webhooks.constructEvent(
    rawBody,
    signature,
    requiredEnv(env, "STRIPE_WEBHOOK_SECRET"),
  );
}

function objectId(
  value: string | { id: string } | { deleted: true; id: string },
) {
  return typeof value === "string" ? value : value.id;
}

function subscriptionCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value) => Number.isFinite(value));

  return periodEnds.length > 0
    ? new Date(Math.max(...periodEnds) * 1000).toISOString()
    : null;
}

export function commercialSubscriptionEventFromStripe(
  event: Stripe.Event,
  payloadDigest: string,
  env: StripeBillingEnv = process.env,
): CommercialSubscriptionEvent | null {
  if (!SUPPORTED_SUBSCRIPTION_EVENTS.has(event.type)) {
    return null;
  }

  const subscription = event.data.object as Stripe.Subscription;
  if (
    subscription.object !== "subscription" ||
    !isStripeSubscriptionStatus(subscription.status)
  ) {
    return null;
  }

  const billingTenantId =
    subscription.metadata[BILLING_TENANT_METADATA]?.trim() ?? "";
  if (!isUuid(billingTenantId)) {
    return null;
  }

  const metadataPlanId =
    subscription.metadata[BILLING_PLAN_METADATA]?.trim() ?? "";
  const pricePlanId = subscription.items.data
    .map((item) => commercialPlanIdForStripePrice(item.price.id, env))
    .find(isBillableCommercialPlan);
  const planId = pricePlanId ??
    (isBillableCommercialPlan(metadataPlanId) ? metadataPlanId : null);
  if (!planId) {
    return null;
  }

  return {
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    eventCreatedAt: event.created,
    payloadDigest,
    billingTenantId,
    planId,
    status: subscription.status,
    providerCustomerId: objectId(subscription.customer),
    providerSubscriptionId: subscription.id,
    currentPeriodEnd: subscriptionCurrentPeriodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    graceUntil:
      subscription.status === "past_due"
        ? graceUntilForPastDue(event.created).toISOString()
        : null,
  };
}

export function resetStripeClientForTests() {
  stripeClient = null;
  stripeClientKey = "";
}
