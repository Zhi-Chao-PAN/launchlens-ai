export type CloudDbColumnRequirement = {
  tableName: string;
  columnName: string;
  nullable: boolean;
  dataTypes: string[];
};

export type CloudDbIndexRequirement = {
  tableName: string;
  indexName: string;
};

export type CloudDbActualColumn = {
  tableName: string;
  columnName: string;
  nullable: boolean;
  dataType: string;
};

export type CloudDbActualIndex = {
  tableName: string;
  indexName: string;
};

export type CloudDbSchemaSnapshot = {
  columns: CloudDbActualColumn[];
  indexes: CloudDbActualIndex[];
};

export type CloudDbSchemaIssue = {
  kind: "missing_table" | "missing_column" | "nullable_mismatch" | "type_mismatch" | "missing_index";
  tableName: string;
  columnName?: string;
  indexName?: string;
  message: string;
};

export const cloudDbColumnRequirements: CloudDbColumnRequirement[] = [
  { tableName: "launchlens_workspaces", columnName: "id", nullable: false, dataTypes: ["uuid"] },
  { tableName: "launchlens_workspaces", columnName: "owner_hash", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_workspaces", columnName: "title", nullable: false, dataTypes: ["character varying"] },
  { tableName: "launchlens_workspaces", columnName: "input", nullable: false, dataTypes: ["jsonb"] },
  { tableName: "launchlens_workspaces", columnName: "workspace", nullable: false, dataTypes: ["jsonb"] },
  { tableName: "launchlens_workspaces", columnName: "execution", nullable: false, dataTypes: ["jsonb"] },
  { tableName: "launchlens_workspaces", columnName: "is_public", nullable: false, dataTypes: ["boolean"] },
  { tableName: "launchlens_workspaces", columnName: "share_expires_at", nullable: true, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_workspaces", columnName: "tenant_id", nullable: false, dataTypes: ["uuid"] },
  { tableName: "launchlens_workspaces", columnName: "created_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_workspaces", columnName: "updated_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_rate_limits", columnName: "bucket_key", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_rate_limits", columnName: "window_started_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_rate_limits", columnName: "request_count", nullable: false, dataTypes: ["integer"] },
  { tableName: "launchlens_workspace_members", columnName: "workspace_id", nullable: false, dataTypes: ["uuid"] },
  { tableName: "launchlens_workspace_members", columnName: "member_hash", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_workspace_members", columnName: "role", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_workspace_members", columnName: "created_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_workspace_invites", columnName: "token_hash", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_workspace_invites", columnName: "workspace_id", nullable: false, dataTypes: ["uuid"] },
  { tableName: "launchlens_workspace_invites", columnName: "invited_role", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_workspace_invites", columnName: "invited_by_hash", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_workspace_invites", columnName: "created_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_workspace_invites", columnName: "expires_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_workspace_invites", columnName: "accepted_at", nullable: true, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_tenants", columnName: "id", nullable: false, dataTypes: ["uuid"] },
  { tableName: "launchlens_tenants", columnName: "name", nullable: false, dataTypes: ["character varying"] },
  { tableName: "launchlens_tenants", columnName: "owner_hash", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_tenants", columnName: "created_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "owner_hash", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "billing_tenant_id", nullable: false, dataTypes: ["uuid"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "plan_id", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "status", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "provider", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "provider_customer_id", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "provider_subscription_id", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "current_period_end", nullable: true, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "cancel_at_period_end", nullable: false, dataTypes: ["boolean"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "grace_until", nullable: true, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "latest_event_id", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "latest_event_created_at", nullable: false, dataTypes: ["bigint"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "created_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_commercial_subscriptions", columnName: "updated_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_billing_events", columnName: "provider", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_billing_events", columnName: "event_id", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_billing_events", columnName: "event_type", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_billing_events", columnName: "event_created_at", nullable: false, dataTypes: ["bigint"] },
  { tableName: "launchlens_billing_events", columnName: "payload_digest", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_billing_events", columnName: "processing_status", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_billing_events", columnName: "owner_hash", nullable: true, dataTypes: ["character"] },
  { tableName: "launchlens_billing_events", columnName: "received_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_billing_events", columnName: "processed_at", nullable: true, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_live_provider_usage", columnName: "owner_hash", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_live_provider_usage", columnName: "period_start", nullable: false, dataTypes: ["date"] },
  { tableName: "launchlens_live_provider_usage", columnName: "feature", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_live_provider_usage", columnName: "request_count", nullable: false, dataTypes: ["integer"] },
  { tableName: "launchlens_live_provider_usage", columnName: "created_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_live_provider_usage", columnName: "updated_at", nullable: false, dataTypes: ["timestamp with time zone"] },
  { tableName: "launchlens_product_events", columnName: "id", nullable: false, dataTypes: ["uuid"] },
  { tableName: "launchlens_product_events", columnName: "journey_hash", nullable: false, dataTypes: ["character"] },
  { tableName: "launchlens_product_events", columnName: "event_name", nullable: false, dataTypes: ["text"] },
  { tableName: "launchlens_product_events", columnName: "subject_key", nullable: true, dataTypes: ["character"] },
  { tableName: "launchlens_product_events", columnName: "provider", nullable: true, dataTypes: ["text"] },
  { tableName: "launchlens_product_events", columnName: "mode", nullable: true, dataTypes: ["text"] },
  { tableName: "launchlens_product_events", columnName: "occurred_at", nullable: false, dataTypes: ["timestamp with time zone"] },
];

export const cloudDbIndexRequirements: CloudDbIndexRequirement[] = [
  { tableName: "launchlens_workspaces", indexName: "launchlens_workspaces_owner_updated_idx" },
  { tableName: "launchlens_workspaces", indexName: "launchlens_workspaces_tenant_idx" },
  { tableName: "launchlens_rate_limits", indexName: "launchlens_rate_limits_window_idx" },
  { tableName: "launchlens_workspace_members", indexName: "launchlens_workspace_members_member_idx" },
  { tableName: "launchlens_workspace_invites", indexName: "launchlens_workspace_invites_workspace_idx" },
  { tableName: "launchlens_commercial_subscriptions", indexName: "launchlens_commercial_subscriptions_tenant_idx" },
  { tableName: "launchlens_billing_events", indexName: "launchlens_billing_events_received_idx" },
  { tableName: "launchlens_live_provider_usage", indexName: "launchlens_live_provider_usage_owner_period_idx" },
  { tableName: "launchlens_product_events", indexName: "launchlens_product_events_occurred_idx" },
  { tableName: "launchlens_product_events", indexName: "launchlens_product_events_journey_idx" },
];

export function requiredCloudDbTableNames() {
  return Array.from(
    new Set(cloudDbColumnRequirements.map((requirement) => requirement.tableName)),
  );
}

export function evaluateCloudDbSchema(
  snapshot: CloudDbSchemaSnapshot,
): CloudDbSchemaIssue[] {
  const issues: CloudDbSchemaIssue[] = [];
  const actualColumns = new Map(
    snapshot.columns.map((column) => [
      `${column.tableName}.${column.columnName}`,
      column,
    ]),
  );
  const actualTables = new Set(snapshot.columns.map((column) => column.tableName));
  const actualIndexes = new Set(
    snapshot.indexes.map((index) => `${index.tableName}.${index.indexName}`),
  );

  for (const tableName of requiredCloudDbTableNames()) {
    if (!actualTables.has(tableName)) {
      issues.push({
        kind: "missing_table",
        tableName,
        message: `Required table ${tableName} is missing.`,
      });
    }
  }

  for (const requirement of cloudDbColumnRequirements) {
    const actual = actualColumns.get(
      `${requirement.tableName}.${requirement.columnName}`,
    );

    if (!actual) {
      issues.push({
        kind: "missing_column",
        tableName: requirement.tableName,
        columnName: requirement.columnName,
        message: `Required column ${requirement.tableName}.${requirement.columnName} is missing.`,
      });
      continue;
    }

    if (actual.nullable !== requirement.nullable) {
      issues.push({
        kind: "nullable_mismatch",
        tableName: requirement.tableName,
        columnName: requirement.columnName,
        message: `${requirement.tableName}.${requirement.columnName} nullable=${actual.nullable}, expected ${requirement.nullable}.`,
      });
    }

    if (!requirement.dataTypes.includes(actual.dataType)) {
      issues.push({
        kind: "type_mismatch",
        tableName: requirement.tableName,
        columnName: requirement.columnName,
        message: `${requirement.tableName}.${requirement.columnName} type=${actual.dataType}, expected one of ${requirement.dataTypes.join(", ")}.`,
      });
    }
  }

  for (const requirement of cloudDbIndexRequirements) {
    if (!actualIndexes.has(`${requirement.tableName}.${requirement.indexName}`)) {
      issues.push({
        kind: "missing_index",
        tableName: requirement.tableName,
        indexName: requirement.indexName,
        message: `Required index ${requirement.indexName} on ${requirement.tableName} is missing.`,
      });
    }
  }

  return issues;
}
