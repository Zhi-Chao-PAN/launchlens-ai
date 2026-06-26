import { neon } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";

import {
  evaluateCloudDbSchema,
  requiredCloudDbTableNames,
  type CloudDbActualColumn,
  type CloudDbActualIndex,
} from "../src/lib/launchlens/cloud-db-contract";
import {
  pickEnvConnection,
  sanitizedErrorMessage,
} from "../src/lib/launchlens/env-clean";

loadEnvConfig(process.cwd());

function verificationConnectionString() {
  return pickEnvConnection([
    "DATABASE_MIGRATION_URL",
    "DATABASE_URL",
    "POSTGRES_URL",
    "NEON_DATABASE_URL",
  ]);
}

async function main() {
  const connectionString = verificationConnectionString();

  if (!connectionString) {
    throw new Error(
      "DATABASE_MIGRATION_URL, DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL is required for cloud schema verification.",
    );
  }

  const sql = neon(connectionString);
  const tableNames = requiredCloudDbTableNames();
  const columns: CloudDbActualColumn[] = [];
  const indexes: CloudDbActualIndex[] = [];

  for (const tableName of tableNames) {
    const columnRows = (await sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName}
      ORDER BY ordinal_position
    `) as unknown as Array<{
      column_name: string;
      is_nullable: "YES" | "NO";
      data_type: string;
    }>;

    columns.push(
      ...columnRows.map((row) => ({
        tableName,
        columnName: row.column_name,
        nullable: row.is_nullable === "YES",
        dataType: row.data_type,
      })),
    );

    const indexRows = (await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = ${tableName}
      ORDER BY indexname
    `) as unknown as Array<{ indexname: string }>;

    indexes.push(
      ...indexRows.map((row) => ({
        tableName,
        indexName: row.indexname,
      })),
    );
  }

  const issues = evaluateCloudDbSchema({ columns, indexes });
  const report = {
    configured: true,
    ok: issues.length === 0,
    checkedTables: tableNames.length,
    checkedColumns: columns.length,
    checkedIndexes: indexes.length,
    issues,
  };

  console.log(JSON.stringify(report, null, 2));

  if (issues.length > 0) {
    throw new Error("Cloud database schema verification failed.");
  }
}

main().catch((error: unknown) => {
  console.error(sanitizedErrorMessage(error));
  process.exitCode = 1;
});
