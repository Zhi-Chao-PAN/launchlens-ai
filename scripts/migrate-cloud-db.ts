import { neon } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";

import {
  cleanEnvValue,
  pickEnvConnection,
  sanitizedErrorMessage,
} from "../src/lib/launchlens/env-clean";

loadEnvConfig(process.cwd());

function migrationConnectionString() {
  return pickEnvConnection(["DATABASE_MIGRATION_URL", "DATABASE_URL"]);
}

async function main() {
  const connectionString = migrationConnectionString();

  if (!connectionString) {
    throw new Error(
      "DATABASE_MIGRATION_URL or DATABASE_URL is required for cloud migration.",
    );
  }

  const sql = neon(connectionString);

  await sql`
    CREATE TABLE IF NOT EXISTS launchlens_workspaces (
      id UUID PRIMARY KEY,
      owner_hash CHAR(64) NOT NULL,
      title VARCHAR(120) NOT NULL,
      input JSONB NOT NULL,
      workspace JSONB NOT NULL,
      execution JSONB NOT NULL DEFAULT '{"experiments":[],"updatedAt":"1970-01-01T00:00:00.000Z"}'::jsonb,
      is_public BOOLEAN NOT NULL DEFAULT FALSE,
      share_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE launchlens_workspaces
    ADD COLUMN IF NOT EXISTS execution JSONB NOT NULL
    DEFAULT '{"experiments":[],"updatedAt":"1970-01-01T00:00:00.000Z"}'::jsonb
  `;

  await sql`
    ALTER TABLE launchlens_workspaces
    ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS launchlens_workspaces_owner_updated_idx
    ON launchlens_workspaces (owner_hash, updated_at DESC)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS launchlens_rate_limits (
      bucket_key CHAR(64) PRIMARY KEY,
      window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      request_count INTEGER NOT NULL DEFAULT 1
        CHECK (request_count > 0)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS launchlens_rate_limits_window_idx
    ON launchlens_rate_limits (window_started_at)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS launchlens_workspace_members (
      workspace_id UUID NOT NULL REFERENCES launchlens_workspaces(id) ON DELETE CASCADE,
      member_hash CHAR(64) NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (workspace_id, member_hash)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS launchlens_workspace_members_member_idx
    ON launchlens_workspace_members (member_hash, role)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS launchlens_workspace_invites (
      token_hash CHAR(64) PRIMARY KEY,
      workspace_id UUID NOT NULL REFERENCES launchlens_workspaces(id) ON DELETE CASCADE,
      invited_role TEXT NOT NULL CHECK (invited_role IN ('editor', 'viewer')),
      invited_by_hash CHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      accepted_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS launchlens_workspace_invites_workspace_idx
    ON launchlens_workspace_invites (workspace_id, expires_at)
  `;

  await sql`
    INSERT INTO launchlens_workspace_members (workspace_id, member_hash, role)
    SELECT id, owner_hash, 'owner'
    FROM launchlens_workspaces
    ON CONFLICT (workspace_id, member_hash) DO NOTHING
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS launchlens_tenants (
      id UUID PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      owner_hash CHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE launchlens_workspaces
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES launchlens_tenants(id) ON DELETE CASCADE
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS launchlens_workspaces_tenant_idx
    ON launchlens_workspaces (tenant_id, updated_at DESC)
  `;

  await sql`
    INSERT INTO launchlens_tenants (id, name, owner_hash)
    SELECT gen_random_uuid(), 'Default tenant', owner_hash
    FROM (
      SELECT DISTINCT owner_hash FROM launchlens_workspaces
    ) AS distinct_owners
    WHERE NOT EXISTS (
      SELECT 1
      FROM launchlens_tenants
      WHERE launchlens_tenants.owner_hash = distinct_owners.owner_hash
    )
    ON CONFLICT DO NOTHING
  `;

  await sql`
    UPDATE launchlens_workspaces AS ws
    SET tenant_id = t.id
    FROM launchlens_tenants AS t
    WHERE ws.owner_hash = t.owner_hash AND ws.tenant_id IS NULL
  `;

  await sql`
    ALTER TABLE launchlens_workspaces
    ALTER COLUMN tenant_id SET NOT NULL
  `;

  console.log("LaunchLens cloud database migration completed.");
}

main().catch((error: unknown) => {
  console.error(sanitizedErrorMessage(error));
  process.exitCode = 1;
});
