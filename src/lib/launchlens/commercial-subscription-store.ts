import "server-only";

import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";

import {
  commercialPlanIdFromEnv,
  getCommercialPlan,
  type CommercialPlanId,
} from "./commercial-entitlements";
import {
  resolveCommercialSubscriptionEntitlement,
  type CommercialSubscriptionRecord,
  type ResolvedCommercialSubscriptionEntitlement,
  type StripeSubscriptionStatus,
} from "./commercial-subscription";
import { pickEnvConnection } from "./env-clean";
import {
  ERROR_BILLING_STORAGE_UNAVAILABLE,
  ERROR_BILLING_TENANT_UNAVAILABLE,
  ERROR_BILLING_EVENT_CONFLICT,
  ERROR_INVALID_BILLING_RECORD,
} from "./error-codes";

type SubscriptionRow = {
  owner_hash: string;
  billing_tenant_id: string;
  plan_id: string;
  status: string;
  provider_customer_id: string;
  provider_subscription_id: string;
  current_period_end: string | Date | null;
  cancel_at_period_end: boolean;
  grace_until: string | Date | null;
  latest_event_id: string;
  latest_event_created_at: number | string;
  created_at: string | Date;
  updated_at: string | Date;
};

export type CommercialSubscriptionEvent = {
  provider: "stripe";
  eventId: string;
  eventType: string;
  eventCreatedAt: number;
  payloadDigest: string;
  billingTenantId: string;
  planId: Exclude<CommercialPlanId, "free">;
  status: StripeSubscriptionStatus;
  providerCustomerId: string;
  providerSubscriptionId: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
};

export type CommercialSubscriptionEventResult = {
  duplicate: boolean;
  applied: boolean;
  disposition: "processed" | "stale" | "ignored" | "duplicate";
};

let sqlClient: ReturnType<typeof neon> | null = null;

function getSql() {
  const url = pickEnvConnection([
    "DATABASE_URL",
    "POSTGRES_URL",
    "NEON_DATABASE_URL",
  ]);

  if (!url) {
    throw new CommercialBillingStoreError(
      ERROR_BILLING_STORAGE_UNAVAILABLE,
      503,
      "Commercial billing storage is not configured.",
    );
  }

  sqlClient ??= neon(url);
  return sqlClient;
}

function toIso(value: string | Date) {
  return new Date(value).toISOString();
}

function nullableIso(value: string | Date | null) {
  return value === null ? null : toIso(value);
}

function firstRow<T>(rows: unknown) {
  return (rows as T[])[0];
}

function isStoredPlanId(value: string): value is Exclude<CommercialPlanId, "free"> {
  return value === "solo" || value === "team";
}

function toSubscription(row: SubscriptionRow): CommercialSubscriptionRecord {
  if (!isStoredPlanId(row.plan_id)) {
    throw new CommercialBillingStoreError(
      ERROR_INVALID_BILLING_RECORD,
      500,
      "The stored commercial plan is invalid.",
    );
  }

  return {
    ownerHash: row.owner_hash,
    billingTenantId: row.billing_tenant_id,
    planId: row.plan_id,
    status: row.status as StripeSubscriptionStatus,
    providerCustomerId: row.provider_customer_id,
    providerSubscriptionId: row.provider_subscription_id,
    currentPeriodEnd: nullableIso(row.current_period_end),
    cancelAtPeriodEnd: row.cancel_at_period_end,
    graceUntil: nullableIso(row.grace_until),
    latestEventId: row.latest_event_id,
    latestEventCreatedAt: Number(row.latest_event_created_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export class CommercialBillingStoreError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CommercialBillingStoreError";
  }
}

export async function ensureBillingTenantForOwnerHash(
  ownerHash: string,
): Promise<string> {
  const sql = getSql();
  const [, , tenantRows] = await sql.transaction((transaction) => [
    transaction`
      SELECT pg_advisory_xact_lock(hashtextextended(${ownerHash}, 7))
    `,
    transaction`
      INSERT INTO launchlens_tenants (id, name, owner_hash)
      SELECT ${randomUUID()}, 'Default', ${ownerHash}
      WHERE NOT EXISTS (
        SELECT 1 FROM launchlens_tenants WHERE owner_hash = ${ownerHash}
      )
    `,
    transaction`
      SELECT id
      FROM launchlens_tenants
      WHERE owner_hash = ${ownerHash}
      ORDER BY created_at ASC
      LIMIT 1
    `,
  ]);
  const tenant = firstRow<{ id: string }>(tenantRows);

  if (!tenant) {
    throw new CommercialBillingStoreError(
      ERROR_BILLING_TENANT_UNAVAILABLE,
      409,
      "A billing tenant could not be created for this account.",
    );
  }

  return tenant.id;
}

export async function getCommercialSubscriptionByOwnerHash(
  ownerHash: string,
): Promise<CommercialSubscriptionRecord | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT
      owner_hash,
      billing_tenant_id,
      plan_id,
      status,
      provider_customer_id,
      provider_subscription_id,
      current_period_end,
      cancel_at_period_end,
      grace_until,
      latest_event_id,
      latest_event_created_at,
      created_at,
      updated_at
    FROM launchlens_commercial_subscriptions
    WHERE owner_hash = ${ownerHash}
    LIMIT 1
  `) as unknown as SubscriptionRow[];

  return rows[0] ? toSubscription(rows[0]) : null;
}

export async function resolveCommercialEntitlementForOwnerHash(
  ownerHash: string,
  now = new Date(),
): Promise<ResolvedCommercialSubscriptionEntitlement> {
  const subscription = await getCommercialSubscriptionByOwnerHash(ownerHash);
  const previewPlan = getCommercialPlan(
    commercialPlanIdFromEnv(process.env),
  );

  return resolveCommercialSubscriptionEntitlement({
    persistedSubscription: subscription ?? undefined,
    previewPlanId: previewPlan.id,
    now,
  });
}

export function resolvePreviewCommercialEntitlement(
  now = new Date(),
): ResolvedCommercialSubscriptionEntitlement {
  return resolveCommercialSubscriptionEntitlement({
    previewPlanId: commercialPlanIdFromEnv(process.env),
    now,
  });
}

export async function applyCommercialSubscriptionEvent(
  event: CommercialSubscriptionEvent,
): Promise<CommercialSubscriptionEventResult> {
  const sql = getSql();
  const results = await sql.transaction((transaction) => [
    transaction`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${event.providerSubscriptionId}, 11)
      )
    `,
    transaction`
      INSERT INTO launchlens_billing_events (
        provider,
        event_id,
        event_type,
        event_created_at,
        payload_digest
      )
      VALUES (
        ${event.provider},
        ${event.eventId},
        ${event.eventType},
        ${event.eventCreatedAt},
        ${event.payloadDigest}
      )
      ON CONFLICT (provider, event_id) DO NOTHING
      RETURNING event_id
    `,
    transaction`
      INSERT INTO launchlens_commercial_subscriptions (
        owner_hash,
        billing_tenant_id,
        plan_id,
        status,
        provider,
        provider_customer_id,
        provider_subscription_id,
        current_period_end,
        cancel_at_period_end,
        grace_until,
        latest_event_id,
        latest_event_created_at
      )
      SELECT
        tenant.owner_hash,
        tenant.id,
        ${event.planId},
        ${event.status},
        ${event.provider},
        ${event.providerCustomerId},
        ${event.providerSubscriptionId},
        ${event.currentPeriodEnd}::timestamptz,
        ${event.cancelAtPeriodEnd},
        ${event.graceUntil}::timestamptz,
        ${event.eventId},
        ${event.eventCreatedAt}
      FROM launchlens_tenants AS tenant
      INNER JOIN launchlens_billing_events AS billing_event
        ON billing_event.provider = ${event.provider}
        AND billing_event.event_id = ${event.eventId}
        AND billing_event.processing_status = 'received'
      WHERE tenant.id = ${event.billingTenantId}
      ON CONFLICT (owner_hash) DO UPDATE
      SET
        billing_tenant_id = EXCLUDED.billing_tenant_id,
        plan_id = EXCLUDED.plan_id,
        status = EXCLUDED.status,
        provider_customer_id = EXCLUDED.provider_customer_id,
        provider_subscription_id = EXCLUDED.provider_subscription_id,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        grace_until = CASE
          WHEN EXCLUDED.status = 'past_due'
            AND launchlens_commercial_subscriptions.status = 'past_due'
            AND launchlens_commercial_subscriptions.grace_until IS NOT NULL
          THEN launchlens_commercial_subscriptions.grace_until
          WHEN EXCLUDED.status = 'past_due' THEN EXCLUDED.grace_until
          ELSE NULL
        END,
        latest_event_id = EXCLUDED.latest_event_id,
        latest_event_created_at = EXCLUDED.latest_event_created_at,
        updated_at = NOW()
      WHERE
        EXCLUDED.latest_event_created_at
          > launchlens_commercial_subscriptions.latest_event_created_at
        OR (
          EXCLUDED.latest_event_created_at
            = launchlens_commercial_subscriptions.latest_event_created_at
          AND EXCLUDED.latest_event_id
            > launchlens_commercial_subscriptions.latest_event_id
        )
      RETURNING owner_hash
    `,
    transaction`
      UPDATE launchlens_billing_events
      SET
        processing_status = CASE
          WHEN NOT EXISTS (
            SELECT 1
            FROM launchlens_tenants
            WHERE id = ${event.billingTenantId}
          ) THEN 'ignored'
          WHEN EXISTS (
            SELECT 1
            FROM launchlens_commercial_subscriptions AS subscription
            INNER JOIN launchlens_tenants AS tenant
              ON tenant.owner_hash = subscription.owner_hash
            WHERE tenant.id = ${event.billingTenantId}
              AND subscription.latest_event_id = ${event.eventId}
          ) THEN 'processed'
          ELSE 'stale'
        END,
        owner_hash = (
          SELECT owner_hash
          FROM launchlens_tenants
          WHERE id = ${event.billingTenantId}
        ),
        processed_at = NOW()
      WHERE provider = ${event.provider}
        AND event_id = ${event.eventId}
        AND processing_status = 'received'
      RETURNING processing_status
    `,
    transaction`
      SELECT payload_digest, processing_status
      FROM launchlens_billing_events
      WHERE provider = ${event.provider} AND event_id = ${event.eventId}
      LIMIT 1
    `,
  ]);

  const claimed = Boolean(firstRow<{ event_id: string }>(results[1]));
  if (!claimed) {
    const existing = firstRow<{
      payload_digest: string;
      processing_status: string;
    }>(results[4]);
    if (existing && existing.payload_digest !== event.payloadDigest) {
      throw new CommercialBillingStoreError(
        ERROR_BILLING_EVENT_CONFLICT,
        409,
        "A billing event identifier was reused with different content.",
      );
    }

    return {
      duplicate: true,
      applied: false,
      disposition: "duplicate",
    };
  }

  const applied = Boolean(firstRow<{ owner_hash: string }>(results[2]));
  const statusRow = firstRow<{ processing_status: string }>(results[3]);
  const disposition =
    statusRow?.processing_status === "stale" ||
    statusRow?.processing_status === "ignored"
      ? statusRow.processing_status
      : "processed";

  return {
    duplicate: false,
    applied,
    disposition,
  };
}

export function resetCommercialBillingStoreForTests() {
  sqlClient = null;
}
