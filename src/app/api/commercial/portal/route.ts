import { commercialBillingApiError } from "@/lib/launchlens/commercial-billing-api";
import { getCommercialSubscriptionByOwnerHash } from "@/lib/launchlens/commercial-subscription-store";
import {
  stripeAppBaseUrl,
  stripeBillingReadiness,
} from "@/lib/launchlens/stripe-billing";
import {
  createStripePortal,
  StripeBillingError,
} from "@/lib/launchlens/stripe-server";
import { hashOwnerToken } from "@/lib/launchlens/workspace-store";
import {
  allowWorkspaceMutation,
  generateRequestId,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
} from "@/lib/launchlens/workspace-api";
import {
  ERROR_BILLING_NOT_CONFIGURED,
  ERROR_BILLING_RETURN_URL_INVALID,
  ERROR_BILLING_SUBSCRIPTION_MISSING,
} from "@/lib/launchlens/error-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    if (!stripeBillingReadiness(process.env).portalEnabled) {
      throw new StripeBillingError(
        ERROR_BILLING_NOT_CONFIGURED,
        503,
        "The Stripe billing portal is not configured on this deployment.",
      );
    }

    if (!(await allowWorkspaceMutation(request))) {
      return rateLimitResponse(requestId);
    }

    const ownerHash = hashOwnerToken(ownerTokenFromRequest(request));
    const subscription = await getCommercialSubscriptionByOwnerHash(ownerHash);
    if (!subscription) {
      throw new StripeBillingError(
        ERROR_BILLING_SUBSCRIPTION_MISSING,
        404,
        "This account does not have a managed subscription.",
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

    const url = await createStripePortal({
      customerId: subscription.providerCustomerId,
      appBaseUrl,
    });

    return noStoreJson({ url }, undefined, requestId);
  } catch (error) {
    return commercialBillingApiError(error, requestId);
  }
}
