import {
  commercialPlanIdFromEnv,
  commercialPlanRows,
  getCommercialPlan,
  summarizePreviewCommercialEntitlement,
} from "@/lib/launchlens/commercial-entitlements";
import { stripeBillingReadiness } from "@/lib/launchlens/stripe-billing";
import { noStoreJson } from "@/lib/launchlens/workspace-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const activePlan = getCommercialPlan(commercialPlanIdFromEnv(process.env));
  const billing = stripeBillingReadiness(process.env);

  return noStoreJson({
    entitlement: summarizePreviewCommercialEntitlement(activePlan),
    billing: {
      provider: "stripe",
      configured: billing.enabled,
      checkoutEnabled: billing.checkoutEnabled,
      portalEnabled: billing.portalEnabled,
      webhookEnabled: billing.webhookEnabled,
      billablePlans: billing.billablePlans,
    },
    catalog: commercialPlanRows().map((plan) => ({
      id: plan.id,
      name: plan.name,
      audience: plan.audience,
      billingStatus: plan.billingStatus,
      checkoutStatus: plan.checkoutStatus,
      summary: plan.summary,
      limits: plan.limits,
      capabilities: plan.capabilities,
    })),
  });
}
