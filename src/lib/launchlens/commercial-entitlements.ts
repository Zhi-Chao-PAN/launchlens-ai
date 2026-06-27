export const COMMERCIAL_PLAN_IDS = ["free", "solo", "team"] as const;

export type CommercialPlanId = (typeof COMMERCIAL_PLAN_IDS)[number];

export type CommercialPlanLimits = {
  cloudSnapshots: number;
  tenantsPerOwner: number;
  membersPerWorkspace: number;
  publicShareLinks: number;
  liveProviderRunsPerMonth: number;
  decisionHistoryDays: number;
};

export type CommercialPlanDefinition = {
  id: CommercialPlanId;
  name: string;
  audience: string;
  billingStatus: "demo" | "preview" | "paid-ready";
  checkoutStatus: "not-wired" | "manual-intake" | "stripe-ready";
  summary: string;
  limits: CommercialPlanLimits;
  capabilities: string[];
  enforcementNotes: string[];
};

export type CommercialEntitlementSummary = {
  activePlanId: CommercialPlanId;
  activePlanName: string;
  billingStatus: CommercialPlanDefinition["billingStatus"];
  checkoutStatus: CommercialPlanDefinition["checkoutStatus"];
  limits: CommercialPlanLimits;
  capabilities: string[];
  enforcementNotes: string[];
};

export type CommercialPlanEnv = Record<string, string | undefined>;

export const DEFAULT_COMMERCIAL_PLAN_ID: CommercialPlanId = "team";

export const commercialPlanCatalog: Record<
  CommercialPlanId,
  CommercialPlanDefinition
> = {
  free: {
    id: "free",
    name: "Free demo",
    audience: "Reviewer or early founder trying the workflow without billing.",
    billingStatus: "demo",
    checkoutStatus: "not-wired",
    summary:
      "Local drafts, mock provider, export, and the full validation loop without paid cloud assumptions.",
    limits: {
      cloudSnapshots: 0,
      tenantsPerOwner: 0,
      membersPerWorkspace: 1,
      publicShareLinks: 0,
      liveProviderRunsPerMonth: 0,
      decisionHistoryDays: 0,
    },
    capabilities: [
      "Mock generation and decision briefs",
      "Browser-local drafts",
      "Markdown and JSON export",
    ],
    enforcementNotes: [
      "Cloud persistence should stay disabled unless a higher plan is resolved.",
      "Live-provider usage must remain off for the free public demo.",
    ],
  },
  solo: {
    id: "solo",
    name: "Solo",
    audience: "One founder validating a product idea with durable cloud history.",
    billingStatus: "paid-ready",
    checkoutStatus: "stripe-ready",
    summary:
      "Capability account, recovery key, cloud history, public shares, and live-provider allowance for one founder.",
    limits: {
      cloudSnapshots: 20,
      tenantsPerOwner: 1,
      membersPerWorkspace: 1,
      publicShareLinks: 20,
      liveProviderRunsPerMonth: 100,
      decisionHistoryDays: 30,
    },
    capabilities: [
      "Cloud snapshots and recovery",
      "Privacy-safe public share links",
      "Optional live provider when server keys are configured",
    ],
    enforcementNotes: [
      "Tenant creation should stay single-owner for Solo accounts.",
      "Collaborator invites should upgrade to Team before being enabled.",
      "Checkout activates only when all required Stripe settings are present.",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    audience:
      "Small product teams and portfolio reviewers exercising tenant/RBAC flows.",
    billingStatus: "paid-ready",
    checkoutStatus: "stripe-ready",
    summary:
      "Tenant workspaces, RBAC invites, recovery, cloud history, share links, and ops evidence for team evaluation.",
    limits: {
      cloudSnapshots: 20,
      tenantsPerOwner: 5,
      membersPerWorkspace: 10,
      publicShareLinks: 50,
      liveProviderRunsPerMonth: 500,
      decisionHistoryDays: 90,
    },
    capabilities: [
      "Tenant isolation",
      "Owner/editor/viewer roles",
      "Invite acceptance flow",
      "Shared evidence trail",
      "Commercial readiness evidence surface",
    ],
    enforcementNotes: [
      "The public deployment can use this plan envelope as a preview so reviewer smoke tests can exercise Team behavior.",
      "Persisted Stripe subscription state takes precedence over the preview envelope.",
    ],
  },
};

const commercialLimitLabels: Record<keyof CommercialPlanLimits, string> = {
  cloudSnapshots: "cloud snapshots",
  tenantsPerOwner: "tenants",
  membersPerWorkspace: "members per workspace",
  publicShareLinks: "public share links",
  liveProviderRunsPerMonth: "live-provider runs per month",
  decisionHistoryDays: "days of decision history",
};

export function isCommercialPlanId(value: unknown): value is CommercialPlanId {
  return (
    typeof value === "string" &&
    (COMMERCIAL_PLAN_IDS as readonly string[]).includes(value)
  );
}

export function resolveCommercialPlanId(
  value: unknown,
  fallback: CommercialPlanId = DEFAULT_COMMERCIAL_PLAN_ID,
): CommercialPlanId {
  return isCommercialPlanId(value) ? value : fallback;
}

export function commercialPlanIdFromEnv(
  env: CommercialPlanEnv,
  fallback: CommercialPlanId = DEFAULT_COMMERCIAL_PLAN_ID,
): CommercialPlanId {
  return resolveCommercialPlanId(
    env.LAUNCHLENS_COMMERCIAL_PLAN ??
      env.NEXT_PUBLIC_LAUNCHLENS_COMMERCIAL_PLAN,
    fallback,
  );
}

export function getCommercialPlan(
  value: unknown = DEFAULT_COMMERCIAL_PLAN_ID,
): CommercialPlanDefinition {
  return commercialPlanCatalog[resolveCommercialPlanId(value)];
}

export function getDefaultCommercialPlan(): CommercialPlanDefinition {
  return commercialPlanCatalog[DEFAULT_COMMERCIAL_PLAN_ID];
}

export function summarizeCommercialEntitlement(
  plan: CommercialPlanDefinition = getDefaultCommercialPlan(),
): CommercialEntitlementSummary {
  return {
    activePlanId: plan.id,
    activePlanName: plan.name,
    billingStatus: plan.billingStatus,
    checkoutStatus: plan.checkoutStatus,
    limits: plan.limits,
    capabilities: plan.capabilities,
    enforcementNotes: plan.enforcementNotes,
  };
}

export function summarizePreviewCommercialEntitlement(
  plan: CommercialPlanDefinition = getDefaultCommercialPlan(),
): CommercialEntitlementSummary {
  const summary = summarizeCommercialEntitlement(plan);

  if (plan.id === "free") {
    return summary;
  }

  return {
    ...summary,
    activePlanName: `${plan.name} preview`,
    billingStatus: "preview",
  };
}

export type CommercialLimitCheck = {
  allowed: boolean;
  planId: CommercialPlanId;
  limitName: keyof CommercialPlanLimits;
  current: number;
  increment: number;
  limit: number;
  code?: "commercial_plan_limit_reached";
  message?: string;
};

export function evaluateCommercialLimit(
  plan: CommercialPlanDefinition,
  limitName: keyof CommercialPlanLimits,
  current: number,
  increment = 1,
): CommercialLimitCheck {
  const limit = plan.limits[limitName];
  const allowed = current + increment <= limit;

  if (allowed) {
    return {
      allowed,
      planId: plan.id,
      limitName,
      current,
      increment,
      limit,
    };
  }

  return {
    allowed,
    planId: plan.id,
    limitName,
    current,
    increment,
    limit,
    code: "commercial_plan_limit_reached",
    message: `${plan.name} allows ${limit} ${commercialLimitLabels[limitName]}. Upgrade or remove usage before continuing.`,
  };
}

export function commercialPlanRows() {
  return COMMERCIAL_PLAN_IDS.map((id) => commercialPlanCatalog[id]);
}
