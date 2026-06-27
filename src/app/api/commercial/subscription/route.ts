import { commercialBillingApiError } from "@/lib/launchlens/commercial-billing-api";
import {
  getCommercialSubscriptionByOwnerHash,
  resolveCommercialEntitlementForOwnerHash,
  resolvePreviewCommercialEntitlement,
} from "@/lib/launchlens/commercial-subscription-store";
import { getLiveProviderUsageSummaryForOwnerHash } from "@/lib/launchlens/live-provider-usage";
import { stripeBillingReadiness } from "@/lib/launchlens/stripe-billing";
import {
  cloudStorageConfigured,
  hashOwnerToken,
} from "@/lib/launchlens/workspace-store";
import {
  generateRequestId,
  noStoreJson,
  ownerTokenFromRequest,
} from "@/lib/launchlens/workspace-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeReadiness() {
  const readiness = stripeBillingReadiness(process.env);
  return {
    provider: "stripe",
    configured: readiness.enabled,
    checkoutEnabled: readiness.checkoutEnabled,
    portalEnabled: readiness.portalEnabled,
    webhookEnabled: readiness.webhookEnabled,
    billablePlans: readiness.billablePlans,
  };
}

function safeSubscription(
  subscription: Awaited<
    ReturnType<typeof getCommercialSubscriptionByOwnerHash>
  >,
) {
  if (!subscription) {
    return null;
  }

  return {
    planId: subscription.planId,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    graceUntil: subscription.graceUntil,
    updatedAt: subscription.updatedAt,
  };
}

export async function GET(request: Request) {
  const requestId = generateRequestId();

  try {
    if (!cloudStorageConfigured()) {
      const resolved = resolvePreviewCommercialEntitlement();
      return noStoreJson({
        billing: safeReadiness(),
        entitlement: {
          ...resolved.entitlement,
          source: resolved.source,
          access: resolved.access,
          subscriptionStatus: resolved.subscriptionStatus,
          graceUntil: resolved.graceUntil,
          currentPeriodEnd: resolved.currentPeriodEnd,
          cancelAtPeriodEnd: resolved.cancelAtPeriodEnd,
        },
        subscription: null,
        usage: null,
      });
    }

    const ownerHash = hashOwnerToken(ownerTokenFromRequest(request));
    const [resolved, subscription, usage] = await Promise.all([
      resolveCommercialEntitlementForOwnerHash(ownerHash),
      getCommercialSubscriptionByOwnerHash(ownerHash),
      getLiveProviderUsageSummaryForOwnerHash(ownerHash),
    ]);

    return noStoreJson({
      billing: safeReadiness(),
      entitlement: {
        ...resolved.entitlement,
        source: resolved.source,
        access: resolved.access,
        subscriptionStatus: resolved.subscriptionStatus,
        graceUntil: resolved.graceUntil,
        currentPeriodEnd: resolved.currentPeriodEnd,
        cancelAtPeriodEnd: resolved.cancelAtPeriodEnd,
      },
      subscription: safeSubscription(subscription),
      usage,
    });
  } catch (error) {
    return commercialBillingApiError(error, requestId);
  }
}
