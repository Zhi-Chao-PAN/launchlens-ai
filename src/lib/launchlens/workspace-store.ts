import "server-only";

import {
  ERROR_CLOUD_UNAVAILABLE,
} from "./error-codes";

import { createHash, randomBytes, randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";

import {
  MAX_CLOUD_WORKSPACES,
  MAX_TOTAL_CLOUD_WORKSPACES,
  type CloudWorkspaceRecord,
  type CloudWorkspaceSummary,
  type SharedCloudWorkspaceRecord,
} from "./cloud-workspace";
import type { WorkspaceSnapshotPayload } from "./workspace-validation";
import {
  normalizeExecutionState,
  normalizeSharedExecutionState,
} from "./execution";
import {
  isLaunchLensInput,
  isLaunchLensWorkspace,
} from "./workspace-validation";
import { pickEnvConnection } from "./env-clean";
import {
  isWorkspaceRole,
  type WorkspaceRole,
} from "./workspace-rbac";

const OWNER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GLOBAL_QUOTA_LOCK = 4_912_826_168;
const INVITE_LOCK = 1_847_392_164;
const MAX_MEMBERS_PER_WORKSPACE = 10;

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
};

type SharedWorkspaceRow = Omit<WorkspaceRow, "input" | "execution"> & {
  execution_summary: unknown;
};

let sqlClient: ReturnType<typeof neon> | null = null;

export class WorkspaceStoreError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceStoreError";
  }
}

function connectionString() {
  return pickEnvConnection(["DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL"]);
}

export function cloudStorageConfigured() {
  return Boolean(connectionString());
}

export async function pingCloudStorage(): Promise<boolean> {
  const url = connectionString();
  if (!url) return false;

  try {
    const sql = neon(url);
    const result = await sql`SELECT 1 as health_check`;
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false;
  }
}
function getSql() {
  const url = connectionString();

  if (!url) {
    throw new WorkspaceStoreError(
      ERROR_CLOUD_UNAVAILABLE,
      503,
      "Cloud workspace storage is not configured.",
    );
  }

  sqlClient ??= neon(url);
  return sqlClient;
}

export function validateOwnerToken(token: string) {
  return OWNER_TOKEN_PATTERN.test(token);
}

export function hashOwnerToken(token: string) {
  if (!validateOwnerToken(token)) {
    throw new WorkspaceStoreError(
      "invalid_owner_token",
      401,
      "The workspace owner token is invalid.",
    );
  }

  return createHash("sha256").update(token, "utf8").digest("hex");
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function toIso(value: string | Date) {
  return new Date(value).toISOString();
}

function toSummary(row: WorkspaceRow | SharedWorkspaceRow): CloudWorkspaceSummary {
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
    throw new WorkspaceStoreError(
      "invalid_workspace_data",
      500,
      "The stored workspace is invalid.",
    );
  }

  const execution = normalizeExecutionState(row.execution, row.workspace);

  if (!execution) {
    throw new WorkspaceStoreError(
      "invalid_workspace_data",
      500,
      "The stored execution state is invalid.",
    );
  }

  return {
    ...toSummary(row),
    input: row.input,
    workspace: row.workspace,
    execution,
  };
}

function toSharedRecord(row: SharedWorkspaceRow): SharedCloudWorkspaceRecord {
  if (!isLaunchLensWorkspace(row.workspace)) {
    throw new WorkspaceStoreError(
      "invalid_workspace_data",
      500,
      "The stored workspace is invalid.",
    );
  }

  const execution = normalizeSharedExecutionState(
    row.execution_summary,
    row.workspace,
  );

  if (!execution) {
    throw new WorkspaceStoreError(
      "invalid_workspace_data",
      500,
      "The stored execution state is invalid.",
    );
  }

  return {
    ...toSummary(row),
    workspace: row.workspace,
    execution,
  };
}

function firstRow<T>(rows: unknown) {
  return (rows as T[])[0];
}

export async function listWorkspacesForMember(ownerToken: string) {
  const memberHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const rows = (await sql`
    SELECT id, title, is_public, created_at, updated_at
    FROM launchlens_workspaces
    WHERE id IN (
      SELECT workspace_id FROM launchlens_workspace_members WHERE member_hash = ${memberHash}
    )
    ORDER BY updated_at DESC
    LIMIT ${MAX_CLOUD_WORKSPACES}
  `) as unknown as WorkspaceRow[];

  return rows.map(toSummary);
}

export async function getWorkspaceForMember(
  ownerToken: string,
  id: string,
): Promise<{ role: WorkspaceRole; record: CloudWorkspaceRecord } | null> {
  const memberHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const memberRows = (await sql`
    SELECT role
    FROM launchlens_workspace_members
    WHERE workspace_id = ${id} AND member_hash = ${memberHash}
    LIMIT 1
  `) as unknown as Array<{ role: string }>;
  const memberRow = memberRows[0];

  if (!memberRow || !isWorkspaceRole(memberRow.role)) {
    return null;
  }

  const rows = (await sql`
    SELECT id, title, input, workspace, execution, is_public, created_at, updated_at
    FROM launchlens_workspaces
    WHERE id = ${id}
    LIMIT 1
  `) as unknown as WorkspaceRow[];

  const row = rows[0];

  if (!row) {
    return null;
  }

  return { role: memberRow.role, record: toRecord(row) };
}

export async function createWorkspace(
  ownerToken: string,
  payload: WorkspaceSnapshotPayload,
) {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const id = randomUUID();
  const title = payload.title.slice(0, 120);
  const results = await sql.transaction((transaction) => [
    transaction`
      SELECT pg_advisory_xact_lock(${GLOBAL_QUOTA_LOCK}),
             pg_advisory_xact_lock(hashtextextended(${ownerHash}, 0))
    `,
    transaction`
      INSERT INTO launchlens_tenants (id, name, owner_hash)
      SELECT gen_random_uuid(), 'Default', ${ownerHash}
      WHERE NOT EXISTS (SELECT 1 FROM launchlens_tenants WHERE owner_hash = ${ownerHash})
    `,
    transaction`
      SELECT id FROM launchlens_tenants WHERE owner_hash = ${ownerHash} ORDER BY created_at ASC LIMIT 1
    `,
    transaction`
      INSERT INTO launchlens_workspaces (
        id, owner_hash, title, input, workspace, execution, tenant_id
      )
      SELECT
        ${id},
        ${ownerHash},
        ${title},
        ${JSON.stringify(payload.input)}::jsonb,
        ${JSON.stringify(payload.workspace)}::jsonb,
        ${JSON.stringify(payload.execution)}::jsonb,
        (SELECT id FROM launchlens_tenants WHERE owner_hash = ${ownerHash} ORDER BY created_at ASC LIMIT 1)
      WHERE
        (SELECT COUNT(*) FROM launchlens_workspaces) < ${MAX_TOTAL_CLOUD_WORKSPACES}
        AND (
          SELECT COUNT(*)
          FROM launchlens_workspaces
          WHERE owner_hash = ${ownerHash}
        ) < ${MAX_CLOUD_WORKSPACES}
      RETURNING id, title, input, workspace, execution, is_public, share_expires_at, created_at, updated_at
    `,
    transaction`
      INSERT INTO launchlens_workspace_members (workspace_id, member_hash, role)
      VALUES (${id}, ${ownerHash}, 'owner')
      ON CONFLICT (workspace_id, member_hash) DO NOTHING
    `,
  ]);
  const row = firstRow<WorkspaceRow>(results[3]); // index 3 = workspace INSERT result

  if (!row) {
    throw new WorkspaceStoreError(
      "workspace_limit_reached",
      409,
      "Cloud workspace capacity has been reached.",
    );
  }

  return toRecord(row);
}

export async function deleteWorkspaceForMember(
  ownerToken: string,
  id: string,
) {
  const memberHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const roleRows = (await sql`
    SELECT role
    FROM launchlens_workspace_members
    WHERE workspace_id = ${id} AND member_hash = ${memberHash}
    LIMIT 1
  `) as unknown as Array<{ role: string }>;

  if (roleRows[0]?.role !== "owner") {
    return false;
  }

  const rows = (await sql`
    DELETE FROM launchlens_workspaces
    WHERE id = ${id}
    RETURNING id
  `) as unknown as Array<{ id: string }>;

  return Boolean(rows[0]);
}

export async function setWorkspaceSharingForMember(
  ownerToken: string,
  id: string,
  enabled: boolean,
  opts?: { expiresInDays?: number | null },
) {
  const memberHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const roleRows = (await sql`
    SELECT role
    FROM launchlens_workspace_members
    WHERE workspace_id = ${id} AND member_hash = ${memberHash}
    LIMIT 1
  `) as unknown as Array<{ role: string }>;
  const role = roleRows[0]?.role;

  if (role !== "owner" && role !== "editor") {
    return null;
  }

  const rows = await sql`
    UPDATE launchlens_workspaces
    SET is_public = ${enabled},
        share_expires_at = ${enabled && opts?.expiresInDays && Number.isFinite(opts.expiresInDays) && opts.expiresInDays > 0 ? new Date(Date.now() + opts.expiresInDays * 86400000) : null},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, title, input, workspace, execution, is_public, share_expires_at, created_at, updated_at
  `;
  const row = firstRow<WorkspaceRow>(rows);

  return row ? toRecord(row) : null;
}

export async function migrateWorkspaceOwner(
  currentOwnerToken: string,
  recoveryOwnerToken: string,
) {
  const currentOwnerHash = hashOwnerToken(currentOwnerToken);
  const recoveryOwnerHash = hashOwnerToken(recoveryOwnerToken);

  if (currentOwnerHash === recoveryOwnerHash) {
    return { migrated: 0 };
  }

  const sql = getSql();
  const [firstHash, secondHash] = [currentOwnerHash, recoveryOwnerHash].sort();
  const [, countRows, migratedRows] = await sql.transaction((transaction) => [
    transaction`
      SELECT pg_advisory_xact_lock(hashtextextended(${firstHash}, 0)),
             pg_advisory_xact_lock(hashtextextended(${secondHash}, 0))
    `,
    transaction`
      SELECT
        (SELECT COUNT(*)::int FROM launchlens_workspaces WHERE owner_hash = ${currentOwnerHash}) AS current_count,
        (SELECT COUNT(*)::int FROM launchlens_workspaces WHERE owner_hash = ${recoveryOwnerHash}) AS recovery_count
    `,
    transaction`
      UPDATE launchlens_workspaces
      SET owner_hash = ${recoveryOwnerHash}, updated_at = NOW()
      WHERE owner_hash = ${currentOwnerHash}
        AND (
          SELECT COUNT(*)
          FROM launchlens_workspaces
          WHERE owner_hash IN (${currentOwnerHash}, ${recoveryOwnerHash})
        ) <= ${MAX_CLOUD_WORKSPACES}
      RETURNING id
    `,
    transaction`
      INSERT INTO launchlens_workspace_members (workspace_id, member_hash, role)
      SELECT id, ${recoveryOwnerHash}, 'owner'
      FROM launchlens_workspaces
      WHERE owner_hash = ${recoveryOwnerHash}
      ON CONFLICT (workspace_id, member_hash) DO NOTHING
    `,
    transaction`
      DELETE FROM launchlens_workspace_members
      WHERE member_hash = ${currentOwnerHash} AND role = 'owner'
    `,
  ]);
  const counts = firstRow<{
    current_count: number;
    recovery_count: number;
  }>(countRows);

  if (
    counts &&
    Number(counts.current_count) + Number(counts.recovery_count) >
      MAX_CLOUD_WORKSPACES
  ) {
    throw new WorkspaceStoreError(
      "workspace_limit_reached",
      409,
      "Cloud history is too full to link these recovery credentials.",
    );
  }

  const rows = migratedRows as unknown as Array<{ id: string }>;

  return { migrated: rows.length };
}

export async function consumeWorkspaceMutationSlot(
  bucketKey: string,
  limit: number,
  windowMs: number,
) {
  const sql = getSql();
  const [, rows] = await sql.transaction((transaction) => [
    transaction`
      DELETE FROM launchlens_rate_limits
      WHERE window_started_at < NOW() - INTERVAL '1 day'
    `,
    transaction`
      INSERT INTO launchlens_rate_limits (
        bucket_key, window_started_at, request_count
      )
      VALUES (${bucketKey}, NOW(), 1)
      ON CONFLICT (bucket_key) DO UPDATE
      SET
        request_count = CASE
          WHEN launchlens_rate_limits.window_started_at
            <= NOW() - (${windowMs} * INTERVAL '1 millisecond')
          THEN 1
          ELSE launchlens_rate_limits.request_count + 1
        END,
        window_started_at = CASE
          WHEN launchlens_rate_limits.window_started_at
            <= NOW() - (${windowMs} * INTERVAL '1 millisecond')
          THEN NOW()
          ELSE launchlens_rate_limits.window_started_at
        END
      RETURNING request_count
    `,
  ]);
  const row = firstRow<{ request_count: number }>(rows);

  return Boolean(row && Number(row.request_count) <= limit);
}

export type WorkspaceMemberSummary = {
  memberHash: string;
  role: WorkspaceRole;
  createdAt: string;
};

export type WorkspaceInviteSummary = {
  token: string;
  workspaceId: string;
  invitedRole: "editor" | "viewer";
  expiresAt: string;
};

export async function listWorkspaceMembers(
  ownerToken: string,
  id: string,
): Promise<WorkspaceMemberSummary[] | null> {
  const memberHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const requester = (await sql`
    SELECT role
    FROM launchlens_workspace_members
    WHERE workspace_id = ${id} AND member_hash = ${memberHash}
    LIMIT 1
  `) as unknown as Array<{ role: string }>;

  if (!isWorkspaceRole(requester[0]?.role)) {
    return null;
  }

  const rows = (await sql`
    SELECT member_hash, role, created_at
    FROM launchlens_workspace_members
    WHERE workspace_id = ${id}
    ORDER BY created_at ASC
  `) as unknown as Array<{
    member_hash: string;
    role: string;
    created_at: string | Date;
  }>;

  const memberSummaries: WorkspaceMemberSummary[] = [];
  for (const row of rows) {
    if (!isWorkspaceRole(row.role)) {
      continue;
    }
    memberSummaries.push({
      memberHash: row.member_hash,
      role: row.role,
      createdAt: toIso(row.created_at),
    });
  }
  return memberSummaries;
}

export async function createWorkspaceInvite(
  ownerToken: string,
  id: string,
  invitedRole: "editor" | "viewer",
): Promise<WorkspaceInviteSummary | null> {
  const memberHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const requester = (await sql`
    SELECT role
    FROM launchlens_workspace_members
    WHERE workspace_id = ${id} AND member_hash = ${memberHash}
    LIMIT 1
  `) as unknown as Array<{ role: string }>;

  if (requester[0]?.role !== "owner") {
    return null;
  }

  const memberCountRows = (await sql`
    SELECT COUNT(*)::int AS count
    FROM launchlens_workspace_members
    WHERE workspace_id = ${id}
  `) as unknown as Array<{ count: number }>;

  if (Number(memberCountRows[0]?.count ?? 0) >= MAX_MEMBERS_PER_WORKSPACE) {
    throw new WorkspaceStoreError(
      "member_limit_reached",
      409,
      "The workspace is full. Remove an existing member before inviting more.",
    );
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);
  const [, rows] = await sql.transaction((transaction) => [
    transaction`
      SELECT pg_advisory_xact_lock(${INVITE_LOCK})
    `,
    transaction`
      INSERT INTO launchlens_workspace_invites (
        token_hash, workspace_id, invited_role, invited_by_hash, expires_at
      )
      VALUES (${tokenHash}, ${id}, ${invitedRole}, ${memberHash}, ${expiresAt.toISOString()}::timestamptz)
      ON CONFLICT (token_hash) DO UPDATE
      SET expires_at = EXCLUDED.expires_at,
          accepted_at = NULL,
          invited_role = EXCLUDED.invited_role
      RETURNING token_hash, workspace_id, invited_role, expires_at
    `,
  ]);
  const row = firstRow<{
    token_hash: string;
    workspace_id: string;
    invited_role: string;
    expires_at: string | Date;
  }>(rows);

  if (!row) {
    return null;
  }

  return {
    token,
    workspaceId: row.workspace_id,
    invitedRole,
    expiresAt: toIso(row.expires_at),
  };
}

export async function acceptWorkspaceInvite(
  ownerToken: string,
  rawToken: string,
) {
  const memberHash = hashOwnerToken(ownerToken);
  const tokenHash = hashInviteToken(rawToken);
  const sql = getSql();

  const result = await sql.transaction((transaction) => [
    transaction`
      SELECT pg_advisory_xact_lock(${INVITE_LOCK})
    `,
    transaction`
      UPDATE launchlens_workspace_invites
      SET accepted_at = NOW()
      WHERE token_hash = ${tokenHash}
        AND accepted_at IS NULL
        AND expires_at > NOW()
      RETURNING workspace_id, invited_role
    `,
    transaction`
      INSERT INTO launchlens_workspace_members (workspace_id, member_hash, role)
      SELECT workspace_id, ${memberHash}, invited_role
      FROM launchlens_workspace_invites
      WHERE token_hash = ${tokenHash}
      ON CONFLICT (workspace_id, member_hash) DO NOTHING
    `,
  ]);

  const accepted = firstRow<{ workspace_id: string; invited_role: string }>(
    result[1],
  );

  if (!accepted || !isWorkspaceRole(accepted.invited_role)) {
    return null;
  }

  return { workspaceId: accepted.workspace_id, role: accepted.invited_role };
}

export async function removeWorkspaceMember(
  ownerToken: string,
  id: string,
  targetHash: string,
) {
  const memberHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const requester = (await sql`
    SELECT role
    FROM launchlens_workspace_members
    WHERE workspace_id = ${id} AND member_hash = ${memberHash}
    LIMIT 1
  `) as unknown as Array<{ role: string }>;

  if (requester[0]?.role !== "owner") {
    return false;
  }

  const rows = (await sql`
    DELETE FROM launchlens_workspace_members
    WHERE workspace_id = ${id} AND member_hash = ${targetHash} AND role <> 'owner'
    RETURNING member_hash
  `) as unknown as Array<{ member_hash: string }>;

  return Boolean(rows[0]);
}

export type SharedWorkspaceResult =
  | { status: "ok"; record: ReturnType<typeof toSharedRecord> }
  | { status: "revoked" }
  | { status: "expired" }
  | { status: "not_found" };

export async function getSharedWorkspace(id: string): Promise<SharedWorkspaceResult> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id,
      title,
      workspace,
      jsonb_build_object(
        'updatedAt', execution -> 'updatedAt',
        'experiments',
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', experiment -> 'id',
                'assumption', experiment -> 'assumption',
                'status', experiment -> 'status',
                'confidence', experiment -> 'confidence',
                'decision', experiment -> 'decision',
                'nextAction', experiment -> 'nextAction',
                'linkedTaskId', experiment -> 'linkedTaskId',
                'evidenceCount',
                jsonb_array_length(
                  COALESCE(experiment -> 'evidence', '[]'::jsonb)
                )
              )
            )
            FROM jsonb_array_elements(
              COALESCE(execution -> 'experiments', '[]'::jsonb)
            ) AS items(experiment)
          ),
          '[]'::jsonb
        )
      ) AS execution_summary,
      is_public,
      share_expires_at,
      created_at,
      updated_at
    FROM launchlens_workspaces
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = firstRow<SharedWorkspaceRow>(rows);

  if (!row) return { status: "not_found" };
  const status = sharedWorkspaceStatus(row, new Date());
  if (status.status === "ok") return { status: "ok", record: toSharedRecord(row) };
  return status;
}

export type SharedStatusInput = {
  is_public: boolean;
  share_expires_at: string | Date | null;
};

/**
 * Pure derivation: map a fetched shared-workspace row to its
 * `SharedWorkspaceResult`. Extracted so the not-found / not-public /
 * expired branches can be unit-tested without a database.
 *
 * Returns:
 * - "not_found" if the row is missing
 * - "revoked"   if the share link was turned off (`is_public=false`)
 * - "revoked"   if a `share_expires_at` timestamp is set and in the
 *               past
 * - "ok"        otherwise (the caller attaches the parsed record)
 *
 * `now` defaults to `Date.now()` so the test suite can pass a
 * deterministic value.
 */
export function sharedWorkspaceStatus(
  row: SharedStatusInput | null | undefined,
  now: Date | number = new Date(),
):
  | { status: "not_found" }
  | { status: "revoked" }
  | { status: "expired" }
  | { status: "ok" } {
  if (!row) return { status: "not_found" };
  if (!row.is_public) return { status: "revoked" };
  const nowMs = typeof now === "number" ? now : now.getTime();
  if (row.share_expires_at) {
    const expiresMs = new Date(row.share_expires_at).getTime();
    if (!Number.isNaN(expiresMs) && expiresMs <= nowMs) return { status: "expired" };
  }
  return { status: "ok" };
}

export function resetWorkspaceStoreForTests() {
  sqlClient = null;
}





