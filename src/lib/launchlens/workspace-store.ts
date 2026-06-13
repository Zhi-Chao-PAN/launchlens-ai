import "server-only";

import { createHash, randomUUID } from "node:crypto";

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

const OWNER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const GLOBAL_QUOTA_LOCK = 4_912_826_168;

type WorkspaceRow = {
  id: string;
  title: string;
  input: unknown;
  workspace: unknown;
  execution: unknown;
  is_public: boolean;
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

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  const quote = trimmed[0];

  return trimmed.length >= 2 &&
    (quote === "\"" || quote === "'") &&
    trimmed.endsWith(quote)
    ? trimmed.slice(1, -1)
    : trimmed;
}

function connectionString() {
  return (
    cleanEnvValue(process.env.DATABASE_URL) ||
    cleanEnvValue(process.env.POSTGRES_URL) ||
    cleanEnvValue(process.env.NEON_DATABASE_URL) ||
    ""
  );
}

export function cloudStorageConfigured() {
  return Boolean(connectionString());
}

function getSql() {
  const url = connectionString();

  if (!url) {
    throw new WorkspaceStoreError(
      "cloud_unavailable",
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

function toIso(value: string | Date) {
  return new Date(value).toISOString();
}

function toSummary(row: WorkspaceRow | SharedWorkspaceRow): CloudWorkspaceSummary {
  return {
    id: row.id,
    title: row.title,
    isPublic: row.is_public,
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

export async function listWorkspaces(ownerToken: string) {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const rows = (await sql`
    SELECT id, title, is_public, created_at, updated_at
    FROM launchlens_workspaces
    WHERE owner_hash = ${ownerHash}
    ORDER BY updated_at DESC
    LIMIT ${MAX_CLOUD_WORKSPACES}
  `) as unknown as WorkspaceRow[];

  return rows.map(toSummary);
}

export async function createWorkspace(
  ownerToken: string,
  payload: WorkspaceSnapshotPayload,
) {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const id = randomUUID();
  const title = payload.title.slice(0, 120);
  const [, rows] = await sql.transaction((transaction) => [
    transaction`
      SELECT pg_advisory_xact_lock(${GLOBAL_QUOTA_LOCK}),
             pg_advisory_xact_lock(hashtextextended(${ownerHash}, 0))
    `,
    transaction`
      INSERT INTO launchlens_workspaces (
        id, owner_hash, title, input, workspace, execution
      )
      SELECT
        ${id},
        ${ownerHash},
        ${title},
        ${JSON.stringify(payload.input)}::jsonb,
        ${JSON.stringify(payload.workspace)}::jsonb,
        ${JSON.stringify(payload.execution)}::jsonb
      WHERE
        (SELECT COUNT(*) FROM launchlens_workspaces) < ${MAX_TOTAL_CLOUD_WORKSPACES}
        AND
        (
          SELECT COUNT(*)
          FROM launchlens_workspaces
          WHERE owner_hash = ${ownerHash}
        ) < ${MAX_CLOUD_WORKSPACES}
      RETURNING id, title, input, workspace, execution, is_public, created_at, updated_at
    `,
  ]);
  const row = firstRow<WorkspaceRow>(rows);

  if (!row) {
    throw new WorkspaceStoreError(
      "workspace_limit_reached",
      409,
      "Cloud workspace capacity has been reached.",
    );
  }

  return toRecord(row);
}

export async function getOwnedWorkspace(ownerToken: string, id: string) {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const rows = await sql`
    SELECT id, title, input, workspace, execution, is_public, created_at, updated_at
    FROM launchlens_workspaces
    WHERE id = ${id} AND owner_hash = ${ownerHash}
    LIMIT 1
  `;
  const row = firstRow<WorkspaceRow>(rows);

  return row ? toRecord(row) : null;
}

export async function deleteWorkspace(ownerToken: string, id: string) {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const rows = (await sql`
    DELETE FROM launchlens_workspaces
    WHERE id = ${id} AND owner_hash = ${ownerHash}
    RETURNING id
  `) as unknown as Array<{ id: string }>;

  return Boolean(rows[0]);
}

export async function setWorkspaceSharing(
  ownerToken: string,
  id: string,
  enabled: boolean,
) {
  const ownerHash = hashOwnerToken(ownerToken);
  const sql = getSql();
  const rows = await sql`
    UPDATE launchlens_workspaces
    SET is_public = ${enabled}, updated_at = NOW()
    WHERE id = ${id} AND owner_hash = ${ownerHash}
    RETURNING id, title, input, workspace, execution, is_public, created_at, updated_at
  `;
  const row = firstRow<WorkspaceRow>(rows);

  return row ? toRecord(row) : null;
}

export async function getSharedWorkspace(id: string) {
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
      created_at,
      updated_at
    FROM launchlens_workspaces
    WHERE id = ${id} AND is_public = TRUE
    LIMIT 1
  `;
  const row = firstRow<SharedWorkspaceRow>(rows);

  return row ? toSharedRecord(row) : null;
}

export function resetWorkspaceStoreForTests() {
  sqlClient = null;
}
