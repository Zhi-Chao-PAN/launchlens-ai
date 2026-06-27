import {
  commercialPlanIdFromEnv,
  commercialPlanRows,
  getCommercialPlan,
  summarizeCommercialEntitlement,
} from "@/lib/launchlens/commercial-entitlements";
import { noStoreJson } from "@/lib/launchlens/workspace-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const activePlan = getCommercialPlan(commercialPlanIdFromEnv(process.env));

  return noStoreJson({
    entitlement: summarizeCommercialEntitlement(activePlan),
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
