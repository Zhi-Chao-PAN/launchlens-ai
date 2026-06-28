import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

import { pickEnvConnection, sanitizedErrorMessage } from "./env-clean";

export const PRODUCT_EVENT_NAMES = [
  "workspace_generation_started",
  "workspace_generation_completed",
  "validation_evidence_recorded",
  "decision_brief_generated",
  "cloud_snapshot_saved",
  "public_share_enabled",
  "collaborator_invited",
  "collaborator_accepted",
  "workspace_exported",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];
export type ProductEventProvider = "mock" | "minimax" | "openai";
export type ProductEventMode = "demo" | "real" | "fallback";

export type ProductFunnelSummary = {
  configured: boolean;
  windowDays: number;
  started: number;
  completed: number;
  handoff: number;
  saved: number;
  shared: number;
  completionRate: number | null;
  handoffRate: number | null;
};

type FunnelRow = {
  started: number | string | null;
  completed: number | string | null;
  handoff: number | string | null;
  saved: number | string | null;
  shared: number | string | null;
};

const OWNER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const MAX_SUBJECT_KEY_CHARS = 200;
let sqlClient: ReturnType<typeof neon> | null = null;

function connectionString() {
  return pickEnvConnection([
    "DATABASE_URL",
    "POSTGRES_URL",
    "NEON_DATABASE_URL",
  ]);
}

function getSql() {
  const url = connectionString();
  if (!url) return null;
  sqlClient ??= neon(url);
  return sqlClient;
}

function journeyHash(ownerToken: string) {
  if (!OWNER_TOKEN_PATTERN.test(ownerToken)) return null;
  return createHash("sha256").update(ownerToken, "utf8").digest("hex");
}

function subjectHash(value: string | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_SUBJECT_KEY_CHARS) return null;
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export async function recordProductEvent(options: {
  ownerToken: string;
  eventName: ProductEventName;
  subjectKey?: string;
  provider?: ProductEventProvider;
  mode?: ProductEventMode;
  occurredAt?: Date;
}): Promise<boolean> {
  const sql = getSql();
  const hash = journeyHash(options.ownerToken);
  if (!sql || !hash) return false;

  try {
    await sql`
      INSERT INTO launchlens_product_events (
        id,
        journey_hash,
        event_name,
        subject_key,
        provider,
        mode,
        occurred_at
      )
      VALUES (
        ${randomUUID()}::uuid,
        ${hash},
        ${options.eventName},
        ${subjectHash(options.subjectKey)},
        ${options.provider ?? null},
        ${options.mode ?? null},
        ${(options.occurredAt ?? new Date()).toISOString()}::timestamptz
      )
    `;
    return true;
  } catch (error) {
    console.error(
      `[product-events] failed to record ${options.eventName}:`,
      sanitizedErrorMessage(error, [
        "DATABASE_URL",
        "POSTGRES_URL",
        "NEON_DATABASE_URL",
      ]),
    );
    return false;
  }
}

function count(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function rate(numerator: number, denominator: number) {
  return denominator > 0
    ? Number((numerator / denominator).toFixed(4))
    : null;
}

export async function summarizeProductFunnel(
  requestedWindowDays = 30,
): Promise<ProductFunnelSummary> {
  const windowDays = Math.min(
    90,
    Math.max(1, Math.trunc(requestedWindowDays) || 30),
  );
  const sql = getSql();
  if (!sql) {
    return {
      configured: false,
      windowDays,
      started: 0,
      completed: 0,
      handoff: 0,
      saved: 0,
      shared: 0,
      completionRate: null,
      handoffRate: null,
    };
  }

  const rows = (await sql`
    SELECT
      COUNT(DISTINCT journey_hash) FILTER (
        WHERE event_name = 'workspace_generation_started'
      )::int AS started,
      COUNT(DISTINCT journey_hash) FILTER (
        WHERE event_name = 'workspace_generation_completed'
      )::int AS completed,
      COUNT(DISTINCT journey_hash) FILTER (
        WHERE event_name IN (
          'cloud_snapshot_saved',
          'public_share_enabled',
          'workspace_exported'
        )
      )::int AS handoff,
      COUNT(DISTINCT journey_hash) FILTER (
        WHERE event_name = 'cloud_snapshot_saved'
      )::int AS saved,
      COUNT(DISTINCT journey_hash) FILTER (
        WHERE event_name = 'public_share_enabled'
      )::int AS shared
    FROM launchlens_product_events
    WHERE occurred_at >= NOW() - (${windowDays} * INTERVAL '1 day')
  `) as unknown as FunnelRow[];
  const row = rows[0];
  const started = count(row?.started);
  const completed = count(row?.completed);
  const handoff = count(row?.handoff);
  const saved = count(row?.saved);
  const shared = count(row?.shared);

  return {
    configured: true,
    windowDays,
    started,
    completed,
    handoff,
    saved,
    shared,
    completionRate: rate(completed, started),
    handoffRate: rate(handoff, completed),
  };
}

export function resetProductEventsForTests() {
  sqlClient = null;
}
