import { createHash } from "node:crypto";

import { commercialBillingApiError } from "@/lib/launchlens/commercial-billing-api";
import { applyCommercialSubscriptionEvent } from "@/lib/launchlens/commercial-subscription-store";
import { stripeBillingReadiness } from "@/lib/launchlens/stripe-billing";
import {
  commercialSubscriptionEventFromStripe,
  constructStripeWebhookEvent,
  StripeBillingError,
} from "@/lib/launchlens/stripe-server";
import {
  generateRequestId,
  MAX_STRIPE_WEBHOOK_BODY_BYTES,
  noStoreJson,
} from "@/lib/launchlens/workspace-api";
import {
  ERROR_BILLING_NOT_CONFIGURED,
  ERROR_BILLING_SIGNATURE_INVALID,
  ERROR_BODY_TOO_LARGE,
} from "@/lib/launchlens/error-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_STRIPE_WEBHOOK_BODY_BYTES
  ) {
    return noStoreJson(
      { code: ERROR_BODY_TOO_LARGE, error: "Webhook payload is too large." },
      { status: 413 },
      requestId,
    );
  }

  const signature = request.headers.get("stripe-signature")?.trim();
  if (!signature) {
    return noStoreJson(
      {
        code: ERROR_BILLING_SIGNATURE_INVALID,
        error: "Stripe signature is required.",
      },
      { status: 400 },
      requestId,
    );
  }

  if (!stripeBillingReadiness(process.env).webhookEnabled) {
    return commercialBillingApiError(
      new StripeBillingError(
        ERROR_BILLING_NOT_CONFIGURED,
        503,
        "Stripe webhooks are not configured on this deployment.",
      ),
      requestId,
    );
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_STRIPE_WEBHOOK_BODY_BYTES) {
      return noStoreJson(
        { code: ERROR_BODY_TOO_LARGE, error: "Webhook payload is too large." },
        { status: 413 },
        requestId,
      );
    }

    let stripeEvent;
    try {
      stripeEvent = constructStripeWebhookEvent(rawBody, signature);
    } catch {
      throw new StripeBillingError(
        ERROR_BILLING_SIGNATURE_INVALID,
        400,
        "Stripe signature verification failed.",
      );
    }

    const payloadDigest = createHash("sha256")
      .update(rawBody, "utf8")
      .digest("hex");
    const subscriptionEvent = commercialSubscriptionEventFromStripe(
      stripeEvent,
      payloadDigest,
    );
    if (!subscriptionEvent) {
      return noStoreJson(
        { received: true, handled: false },
        undefined,
        requestId,
      );
    }

    const result = await applyCommercialSubscriptionEvent(subscriptionEvent);
    return noStoreJson(
      {
        received: true,
        handled: true,
        duplicate: result.duplicate,
        disposition: result.disposition,
      },
      undefined,
      requestId,
    );
  } catch (error) {
    return commercialBillingApiError(error, requestId);
  }
}
