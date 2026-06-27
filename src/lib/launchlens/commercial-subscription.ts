import {
  getCommercialPlan,
  summarizeCommercialEntitlement,
  summarizePreviewCommercialEntitlement,
  type CommercialEntitlementSummary,
  type CommercialPlanDefinition,
  type CommercialPlanId,
} from "./commercial-entitlements";

export const STRIPE_SUBSCRIPTION_STATUSES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

export type StripeSubscriptionStatus =
  (typeof STRIPE_SUBSCRIPTION_STATUSES)[number];

export type CommercialSubscriptionRecord = {
  ownerHash: string;
  billingTenantId: string;
  planId: CommercialPlanId;
  status: StripeSubscriptionStatus;
  providerCustomerId: string;
  providerSubscriptionId: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
  latestEventId: string;
  latestEventCreatedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type CommercialSubscriptionAccess =
  | "preview"
  | "full"
  | "grace"
  | "restricted";

export type ResolvedCommercialSubscriptionEntitlement = {
  planId: CommercialPlanId;
  plan: CommercialPlanDefinition;
  entitlement: CommercialEntitlementSummary;
  source: "preview" | "subscription";
  access: CommercialSubscriptionAccess;
  subscriptionStatus: StripeSubscriptionStatus | "preview";
  graceUntil: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type ResolveCommercialSubscriptionEntitlementInput = {
  persistedSubscription?:
    | CommercialSubscriptionRecord
    | (Pick<CommercialSubscriptionRecord, "planId" | "status"> & {
        graceUntil?: Date | string | null;
        currentPeriodEnd?: Date | string | null;
        cancelAtPeriodEnd?: boolean;
      });
  previewPlanId: CommercialPlanId;
  now?: Date | string | number;
};

const FULL_ACCESS_STATUSES = new Set<StripeSubscriptionStatus>([
  "active",
  "trialing",
]);

const RESTARTABLE_SUBSCRIPTION_STATUSES =
  new Set<StripeSubscriptionStatus>([
    "canceled",
    "incomplete_expired",
  ]);

const DEFAULT_PAST_DUE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

function timestamp(value: Date | string | number): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value < 1_000_000_000_000 ? value * 1_000 : value;
  }

  return new Date(value).getTime();
}

function resultForPlan(
  plan: CommercialPlanDefinition,
  details: Omit<
    ResolvedCommercialSubscriptionEntitlement,
    "planId" | "plan" | "entitlement"
  >,
  preview = false,
): ResolvedCommercialSubscriptionEntitlement {
  return {
    planId: plan.id,
    plan,
    entitlement: preview
      ? summarizePreviewCommercialEntitlement(plan)
      : summarizeCommercialEntitlement(plan),
    ...details,
  };
}

export function isStripeSubscriptionStatus(
  value: unknown,
): value is StripeSubscriptionStatus {
  return (
    typeof value === "string" &&
    (STRIPE_SUBSCRIPTION_STATUSES as readonly string[]).includes(value)
  );
}

export function canStartCommercialCheckout(
  status?: StripeSubscriptionStatus | null,
) {
  return (
    status === null ||
    status === undefined ||
    RESTARTABLE_SUBSCRIPTION_STATUSES.has(status)
  );
}

export function graceUntilForPastDue(
  eventCreatedAt: Date | string | number,
  existingGraceUntil?: Date | string | number | null,
): Date {
  if (existingGraceUntil !== null && existingGraceUntil !== undefined) {
    const existingTimestamp = timestamp(existingGraceUntil);
    if (Number.isFinite(existingTimestamp)) {
      return new Date(existingTimestamp);
    }
  }

  const eventTimestamp = timestamp(eventCreatedAt);
  if (!Number.isFinite(eventTimestamp)) {
    throw new TypeError("eventCreatedAt must be a valid date.");
  }

  return new Date(eventTimestamp + DEFAULT_PAST_DUE_GRACE_MS);
}

export function resolveCommercialSubscriptionEntitlement({
  persistedSubscription,
  previewPlanId,
  now = new Date(),
}: ResolveCommercialSubscriptionEntitlementInput): ResolvedCommercialSubscriptionEntitlement {
  if (!persistedSubscription) {
    return resultForPlan(
      getCommercialPlan(previewPlanId),
      {
        source: "preview",
        access: "preview",
        subscriptionStatus: "preview",
        graceUntil: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
      true,
    );
  }

  const paidPlan = getCommercialPlan(persistedSubscription.planId);
  const common = {
    source: "subscription" as const,
    subscriptionStatus: persistedSubscription.status,
    graceUntil: persistedSubscription.graceUntil
      ? new Date(persistedSubscription.graceUntil).toISOString()
      : null,
    currentPeriodEnd: persistedSubscription.currentPeriodEnd
      ? new Date(persistedSubscription.currentPeriodEnd).toISOString()
      : null,
    cancelAtPeriodEnd: persistedSubscription.cancelAtPeriodEnd ?? false,
  };

  if (FULL_ACCESS_STATUSES.has(persistedSubscription.status)) {
    return resultForPlan(paidPlan, {
      ...common,
      access: "full",
    });
  }

  const nowTimestamp = timestamp(now);
  const graceTimestamp = persistedSubscription.graceUntil
    ? timestamp(persistedSubscription.graceUntil)
    : Number.NaN;

  if (
    persistedSubscription.status === "past_due" &&
    Number.isFinite(graceTimestamp) &&
    graceTimestamp > nowTimestamp
  ) {
    return resultForPlan(paidPlan, {
      ...common,
      access: "grace",
    });
  }

  return resultForPlan(getCommercialPlan("free"), {
    ...common,
    access: "restricted",
  });
}
