import "server-only";

import { neon } from "@neondatabase/serverless";

import {
  evaluateCommercialLimit,
  type CommercialPlanDefinition,
  type CommercialPlanLimits,
} from "./commercial-entitlements";
import { resolveCommercialEntitlementForOwnerHash } from "./commercial-subscription-store";
import { pickEnvConnection } from "./env-clean";
import {
  ERROR_COMMERCIAL_PLAN_LIMIT,
  ERROR_USAGE_METER_UNAVAILABLE,
} from "./error-codes";

export const LIVE_PROVIDER_USAGE_FEATURES = [
  "workspace_generation",
  "decision_brief",
] as const;

export type LiveProviderUsageFeature =
  (typeof LIVE_PROVIDER_USAGE_FEATURES)[number];

export type LiveProviderUsageSummary = {
  feature?: LiveProviderUsageFeature;
  periodStart: string;
  planId: CommercialPlanDefinition["id"];
  planName: string;
  limit: number;
  used: number;
  remaining: number;
};

type UsageRow = {
  used: number | string | null;
};

type ConsumeRow = UsageRow & {
  consumed: boolean;
};

let sqlClient: ReturnType<typeof neon> | null = null;

function connectionString() {
  return pickEnvConnection(["DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL"]);
}

function getSql() {
  const url = connectionString();

  if (!url) {
    throw new LiveProviderUsageError(
      ERROR_USAGE_METER_UNAVAILABLE,
      503,
      "Live-provider usage metering requires cloud storage.",
    );
  }

  sqlClient ??= neon(url);
  return sqlClient;
}

function firstRow<T>(rows: unknown) {
  return (rows as T[])[0];
}

function usedCount(row: UsageRow | null | undefined) {
  return Number(row?.used ?? 0);
}

function remainingCount(limit: number, used: number) {
  return Math.max(0, limit - used);
}

export class LiveProviderUsageError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "LiveProviderUsageError";
  }
}

export function liveProviderUsageStorageConfigured() {
  return Boolean(connectionString());
}

export function liveProviderMonthlyPeriodStart(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-01`;
}

export function assertLiveProviderUsageFeature(
  value: string,
): asserts value is LiveProviderUsageFeature {
  if (
    !LIVE_PROVIDER_USAGE_FEATURES.includes(
      value as LiveProviderUsageFeature,
    )
  ) {
    throw new LiveProviderUsageError(
      "invalid_live_provider_usage_feature",
      500,
      "The live-provider usage feature is invalid.",
    );
  }
}

function assertUsageAllowed(
  plan: CommercialPlanDefinition,
  current: number,
  increment = 1,
) {
  const check = evaluateCommercialLimit(
    plan,
    "liveProviderRunsPerMonth" satisfies keyof CommercialPlanLimits,
    current,
    increment,
  );

  if (!check.allowed) {
    throw new LiveProviderUsageError(
      ERROR_COMMERCIAL_PLAN_LIMIT,
      409,
      check.message ?? "The current commercial plan live-provider limit has been reached.",
    );
  }
}

export async function getLiveProviderUsageSummaryForOwnerHash(
  ownerHash: string,
  now = new Date(),
): Promise<LiveProviderUsageSummary> {
  const periodStart = liveProviderMonthlyPeriodStart(now);
  const sql = getSql();
  const entitlement = await resolveCommercialEntitlementForOwnerHash(ownerHash, now);
  const limit = entitlement.plan.limits.liveProviderRunsPerMonth;
  const rows = (await sql`
    SELECT COALESCE(SUM(request_count), 0)::int AS used
    FROM launchlens_live_provider_usage
    WHERE owner_hash = ${ownerHash}
      AND period_start = ${periodStart}::date
  `) as unknown as UsageRow[];
  const used = usedCount(firstRow(rows));

  return {
    periodStart,
    planId: entitlement.plan.id,
    planName: entitlement.plan.name,
    limit,
    used,
    remaining: remainingCount(limit, used),
  };
}

export async function consumeLiveProviderUsageSlot(options: {
  ownerHash: string;
  feature: LiveProviderUsageFeature;
  now?: Date;
}): Promise<LiveProviderUsageSummary> {
  const now = options.now ?? new Date();
  const periodStart = liveProviderMonthlyPeriodStart(now);
  const sql = getSql();
  const entitlement = await resolveCommercialEntitlementForOwnerHash(
    options.ownerHash,
    now,
  );
  const limit = entitlement.plan.limits.liveProviderRunsPerMonth;

  assertUsageAllowed(entitlement.plan, 0);
  const lockKey = `${options.ownerHash}:${periodStart}:live-provider`;
  const [, rows] = await sql.transaction((transaction) => [
    transaction`
      SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 19))
    `,
    transaction`
      WITH current_usage AS (
        SELECT COALESCE(SUM(request_count), 0)::int AS used
        FROM launchlens_live_provider_usage
        WHERE owner_hash = ${options.ownerHash}
          AND period_start = ${periodStart}::date
      ),
      consumed_usage AS (
        INSERT INTO launchlens_live_provider_usage (
          owner_hash,
          period_start,
          feature,
          request_count
        )
        SELECT
          ${options.ownerHash},
          ${periodStart}::date,
          ${options.feature},
          1
        FROM current_usage
        WHERE used < ${limit}
        ON CONFLICT (owner_hash, period_start, feature) DO UPDATE
        SET request_count = launchlens_live_provider_usage.request_count + 1,
            updated_at = NOW()
        RETURNING request_count
      )
      SELECT
        (SELECT used FROM current_usage) AS used,
        EXISTS (SELECT 1 FROM consumed_usage) AS consumed
    `,
  ]);
  const row = firstRow<ConsumeRow>(rows);
  const previouslyUsed = usedCount(row);

  if (!row?.consumed) {
    assertUsageAllowed(entitlement.plan, previouslyUsed);
  }

  const used = previouslyUsed + 1;
  return {
    feature: options.feature,
    periodStart,
    planId: entitlement.plan.id,
    planName: entitlement.plan.name,
    limit,
    used,
    remaining: remainingCount(limit, used),
  };
}

export function resetLiveProviderUsageForTests() {
  sqlClient = null;
}
