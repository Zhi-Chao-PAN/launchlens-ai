import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL ?? "";

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
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE INDEX IF NOT EXISTS launchlens_workspaces_owner_updated_idx
  ON launchlens_workspaces (owner_hash, updated_at DESC)
`;

console.log("LaunchLens cloud database migration completed.");
