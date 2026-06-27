import { commercialBillingApiError } from "@/lib/launchlens/commercial-billing-api";
import {
  ensureBillingTenantForOwnerHash,
  getCommercialSubscriptionByOwnerHash,
} from "@/lib/launchlens/commercial-subscription-store";
import { canStartCommercialCheckout } from "@/lib/launchlens/commercial-subscription";
import {
  isBillableCommercialPlan,
  stripeAppBaseUrl,
  stripeBillingReadiness,
} from "@/lib/launchlens/stripe-billing";
import {
  createStripeCheckout,
  StripeBillingError,
} from "@/lib/launchlens/stripe-server";
import { hashOwnerToken } from "@/lib/launchlens/workspace-store";
import {
  allowWorkspaceMutation,
  generateRequestId,
  MAX_BILLING_BODY_BYTES,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  readLimitedJson,
} from "@/lib/launchlens/workspace-api";
import {
  ERROR_BILLING_NOT_CONFIGURED,
  ERROR_BILLING_RETURN_URL_INVALID,
  ERROR_BILLING_SUBSCRIPTION_EXISTS,
  ERROR_INVALID_BILLING_PLAN,
} from "@/lib/launchlens/error-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    const payload = await readLimitedJson(request, MAX_BILLING_BODY_BYTES);
    const planId =
      typeof payload === "object" && payload !== null && "planId" in payload
        ? payload.planId
        : null;
    if (!isBillableCommercialPlan(planId)) {
      throw new StripeBillingError(
        ERROR_INVALID_BILLING_PLAN,
        400,
        "Select the Solo or Team commercial plan.",
      );
    }

    if (!stripeBillingReadiness(process.env).checkoutEnabled) {
      throw new StripeBillingError(
        ERROR_BILLING_NOT_CONFIGURED,
        503,
        "Stripe checkout is not configured on this deployment.",
      );
    }

    if (!(await allowWorkspaceMutation(request))) {
      return rateLimitResponse(requestId);
    }

    const ownerHash = hashOwnerToken(ownerTokenFromRequest(request));
    const existing = await getCommercialSubscriptionByOwnerHash(ownerHash);
    if (!canStartCommercialCheckout(existing?.status)) {
      throw new StripeBillingError(
        ERROR_BILLING_SUBSCRIPTION_EXISTS,
        409,
        "This account already has a subscription. Open the billing portal to manage it.",
      );
    }

    const appBaseUrl = stripeAppBaseUrl(request.url, process.env);
    if (!appBaseUrl) {
      throw new StripeBillingError(
        ERROR_BILLING_RETURN_URL_INVALID,
        503,
        "The billing return URL is not configured safely.",
      );
    }

    const billingTenantId = await ensureBillingTenantForOwnerHash(ownerHash);
    const url = await createStripeCheckout({
      ownerHash,
      billingTenantId,
      planId,
      appBaseUrl,
      existingCustomerId: existing?.providerCustomerId,
    });

    return noStoreJson({ url }, undefined, requestId);
  } catch (error) {
    return commercialBillingApiError(error, requestId);
  }
}
