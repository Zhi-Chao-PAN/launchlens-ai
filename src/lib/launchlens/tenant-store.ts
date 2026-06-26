import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";

import { hashOwnerToken } from "./workspace-store";
import { MAX_CLOUD_WORKSPACES } from "./cloud-workspace";
import type { WorkspaceSnapshotPayload } from "./workspace-validation";
import { isLaunchLensInput, isLaunchLensWorkspace } from "./workspace-validation";
import { normalizeExecutionState } from "./execution";
import type { CloudWorkspaceRecord, CloudWorkspaceSummary } from "./cloud-workspace";
import { pickEnvConnection } from "./env-clean";

const MAX_TENANTS_PER_OWNER = 5;

type WorkspaceRow = {
  id: string;
  title: string;
  input: unknown;
  workspace: unknown;
  execution: unknown;
  is_public: boolean;
  share_expires_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  tenant_id: string;
};

type TenantRow = {
  id: string;
  name: string;
  owner_hash: string;
  created_at: string | Date;
};

function getSql() {
  const url = pickEnvConnection(["DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL"]);
  if (!url) {
    throw new Error("cloud_unavailable");
  }
  return neon(url);
}

function firstRow<T>(rows: unknown) {
  return (rows as T[])[0];
}

function toIso(value: string | Date) {
  return new Date(value).toISOString();
}

function toSummary(row: WorkspaceRow): CloudWorkspaceSummary {
  return {
    id: row.id,
    title: row.title,
    isPublic: row.is_public,
    expiresAt: row.share_expires_at ? toIso(row.share_expires_at) : null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toRecord(row: WorkspaceRow): CloudWorkspaceRecord {
  if (
    !isLaunchLensInput(row.input) ||
    !isLaunchLensWorkspace(row.workspace)
  ) {
    throw new Error("invalid_workspace_data");
  }
  const execution = normalizeExecutionState(row.execution, row.workspace);
  if (!execution) {
    throw new Error("invalid_workspace_data");
  }
  return {
    ...toSummary(row),
    input: row.input,
    workspace: row.workspace,
    execution,
  };
}

export type TenantSummary = {
  id: string;
  name: string;
  ownerHash: string;
  createdAt: string;
  workspaceCount: number;
};

export class TenantStoreError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TenantStoreError";
  }
}

export async function listTenantsForOwner(
  ownerToken: string,
): Promise<TenantSummary[]> {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const rows = (await sql`
    SELECT
      t.id,
      t.name,
      t.owner_hash,
      t.created_at,
      COUNT(ws.id)::int AS workspace_count
    FROM launchlens_tenants t
    LEFT JOIN launchlens_workspaces ws ON ws.tenant_id = t.id
    WHERE t.owner_hash = ${ownerHash}
    GROUP BY t.id, t.name, t.owner_hash, t.created_at
    ORDER BY t.created_at DESC
  `) as unknown as Array<{
    id: string;
    name: string;
    owner_hash: string;
    created_at: string | Date;
    workspace_count: number;
  }>;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    ownerHash: row.owner_hash,
    createdAt: toIso(row.created_at),
    workspaceCount: Number(row.workspace_count),
  }));
}

export async function getTenantForOwner(
  ownerToken: string,
  id: string,
): Promise<TenantSummary | null> {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const rows = (await sql`
    SELECT
      t.id,
      t.name,
      t.owner_hash,
      t.created_at,
      COUNT(ws.id)::int AS workspace_count
    FROM launchlens_tenants t
    LEFT JOIN launchlens_workspaces ws ON ws.tenant_id = t.id
    WHERE t.id = ${id} AND t.owner_hash = ${ownerHash}
    GROUP BY t.id, t.name, t.owner_hash, t.created_at
  `) as unknown as Array<{
    id: string;
    name: string;
    owner_hash: string;
    created_at: string | Date;
    workspace_count: number;
  }>;
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    ownerHash: row.owner_hash,
    createdAt: toIso(row.created_at),
    workspaceCount: Number(row.workspace_count),
  };
}

export async function createTenant(
  ownerToken: string,
  name: string,
): Promise<TenantSummary> {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const trimmed = name.trim().slice(0, 80);
  if (trimmed.length === 0) {
    throw new TenantStoreError(
      "invalid_tenant_name",
      400,
      "Tenant name is required.",
    );
  }
  // Keep the per-owner tenant cap race-free across serverless instances.
  // The advisory lock scopes the count + insert to this owner without
  // blocking unrelated capability accounts.
  const [, rows] = await sql.transaction((transaction) => [
    transaction`
      SELECT pg_advisory_xact_lock(hashtextextended(${ownerHash}, 1))
    `,
    transaction`
      INSERT INTO launchlens_tenants (id, name, owner_hash)
      SELECT ${randomUUID()}, ${trimmed}, ${ownerHash}
      WHERE (
        SELECT COUNT(*) FROM launchlens_tenants
        WHERE owner_hash = ${ownerHash}
      ) < ${MAX_TENANTS_PER_OWNER}
      RETURNING id, name, owner_hash, created_at
    `,
  ]);
  if (!rows || (Array.isArray(rows) && rows.length === 0)) {
    throw new TenantStoreError(
      "tenant_limit_reached",
      409,
      `Each capability account can own up to ${MAX_TENANTS_PER_OWNER} tenants.`,
    );
  }
  const row = firstRow<TenantRow>(rows);
  if (!row) {
    throw new TenantStoreError(
      "tenant_creation_failed",
      500,
      "Tenant creation failed.",
    );
  }
  return {
    id: row.id,
    name: row.name,
    ownerHash: row.owner_hash,
    createdAt: toIso(row.created_at),
    workspaceCount: 0,
  };
}

export async function listWorkspacesInTenant(
  ownerToken: string,
  tenantId: string,
): Promise<CloudWorkspaceSummary[] | null> {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const tenantRows = (await sql`
    SELECT id FROM launchlens_tenants WHERE id = ${tenantId} AND owner_hash = ${ownerHash}
  `) as unknown as Array<{ id: string }>;
  if (!tenantRows[0]) {
    return null;
  }
  const rows = (await sql`
    SELECT id, title, is_public, share_expires_at, created_at, updated_at, tenant_id
    FROM launchlens_workspaces
    WHERE tenant_id = ${tenantId}
    ORDER BY updated_at DESC
    LIMIT ${MAX_CLOUD_WORKSPACES}
  `) as unknown as WorkspaceRow[];
  return rows.map(toSummary);
}

export async function getWorkspaceInTenant(
  ownerToken: string,
  tenantId: string,
  workspaceId: string,
) {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const tenantRows = (await sql`
    SELECT id FROM launchlens_tenants WHERE id = ${tenantId} AND owner_hash = ${ownerHash}
  `) as unknown as Array<{ id: string }>;
  if (!tenantRows[0]) {
    return { kind: "not_found" as const };
  }
  const rows = (await sql`
    SELECT id, title, input, workspace, execution, is_public, share_expires_at, created_at, updated_at, tenant_id
    FROM launchlens_workspaces
    WHERE id = ${workspaceId} AND tenant_id = ${tenantId}
    LIMIT 1
  `) as unknown as WorkspaceRow[];
  const row = rows[0];
  if (!row) {
    return { kind: "not_found" as const };
  }
  return { kind: "found" as const, record: toRecord(row) };
}

export async function createWorkspaceInTenant(
  ownerToken: string,
  tenantId: string,
  payload: WorkspaceSnapshotPayload,
): Promise<CloudWorkspaceRecord | { kind: "tenant_missing" }> {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const id = randomUUID();
  const title = payload.title.slice(0, 120);
  const [countRows, rows] = await sql.transaction((transaction) => [
    transaction`
      SELECT COUNT(*)::int AS count
      FROM launchlens_workspaces
      WHERE tenant_id = ${tenantId}
    `,
    transaction`
      INSERT INTO launchlens_workspaces (id, owner_hash, title, input, workspace, execution, tenant_id)
      SELECT ${id}, ${ownerHash}, ${title},
             ${JSON.stringify(payload.input)}::jsonb,
             ${JSON.stringify(payload.workspace)}::jsonb,
             ${JSON.stringify(payload.execution)}::jsonb,
             ${tenantId}
      WHERE EXISTS (SELECT 1 FROM launchlens_tenants WHERE id = ${tenantId} AND owner_hash = ${ownerHash})
        AND (SELECT COUNT(*) FROM launchlens_workspaces WHERE tenant_id = ${tenantId}) < ${MAX_CLOUD_WORKSPACES}
      RETURNING id, title, input, workspace, execution, is_public, share_expires_at, created_at, updated_at, tenant_id
    `,
    transaction`
      INSERT INTO launchlens_workspace_members (workspace_id, member_hash, role)
      VALUES (${id}, ${ownerHash}, 'owner')
      ON CONFLICT (workspace_id, member_hash) DO NOTHING
    `,
  ]);
  void countRows;
  const row = firstRow<WorkspaceRow>(rows);
  if (!row) {
    return { kind: "tenant_missing" };
  }
  return toRecord(row);
}

export const __test_internals = { MAX_TENANTS_PER_OWNER };

void createHash;


export function normalizeTenantName(value: string): string {
  return value.trim().slice(0, 80);
}

export function isTenantNameValid(value: string): boolean {
  return normalizeTenantName(value).length > 0;
}
