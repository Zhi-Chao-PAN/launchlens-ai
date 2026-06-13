import { neon } from "@neondatabase/serverless";

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  const quote = trimmed[0];

  return trimmed.length >= 2 &&
    (quote === "\"" || quote === "'") &&
    trimmed.endsWith(quote)
    ? trimmed.slice(1, -1)
    : trimmed;
}

function migrationConnectionString() {
  return (
    cleanEnvValue(process.env.DATABASE_MIGRATION_URL) ||
    cleanEnvValue(process.env.DATABASE_URL)
  );
}

function sanitizedErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "LaunchLens cloud database migration failed.";
  const blockedValues = [
    cleanEnvValue(process.env.DATABASE_MIGRATION_URL),
    cleanEnvValue(process.env.DATABASE_URL),
  ].filter((value) => value.length >= 12);

  return blockedValues.reduce(
    (safeMessage, value) => safeMessage.split(value).join("[redacted]"),
    message,
  );
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

  console.log("LaunchLens cloud database migration completed.");
}

main().catch((error: unknown) => {
  console.error(sanitizedErrorMessage(error));
  process.exitCode = 1;
});
