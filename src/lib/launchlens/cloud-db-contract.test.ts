import { describe, expect, it } from "vitest";

import {
  cloudDbColumnRequirements,
  cloudDbIndexRequirements,
  evaluateCloudDbSchema,
  type CloudDbSchemaSnapshot,
} from "./cloud-db-contract";

function completeSnapshot(): CloudDbSchemaSnapshot {
  return {
    columns: cloudDbColumnRequirements.map((requirement) => ({
      tableName: requirement.tableName,
      columnName: requirement.columnName,
      nullable: requirement.nullable,
      dataType: requirement.dataTypes[0],
    })),
    indexes: cloudDbIndexRequirements.map((requirement) => ({
      tableName: requirement.tableName,
      indexName: requirement.indexName,
    })),
  };
}

describe("cloud DB contract", () => {
  it("accepts the current required schema shape", () => {
    expect(evaluateCloudDbSchema(completeSnapshot())).toEqual([]);
  });

  it("catches the share expiration column missing from a deployed database", () => {
    const snapshot = completeSnapshot();
    snapshot.columns = snapshot.columns.filter(
      (column) =>
        column.tableName !== "launchlens_workspaces" ||
        column.columnName !== "share_expires_at",
    );

    expect(evaluateCloudDbSchema(snapshot)).toContainEqual(
      expect.objectContaining({
        kind: "missing_column",
        tableName: "launchlens_workspaces",
        columnName: "share_expires_at",
      }),
    );
  });

  it("requires tenant_id to be non-null after migration", () => {
    const snapshot = completeSnapshot();
    snapshot.columns = snapshot.columns.map((column) =>
      column.tableName === "launchlens_workspaces" &&
      column.columnName === "tenant_id"
        ? { ...column, nullable: true }
        : column,
    );

    expect(evaluateCloudDbSchema(snapshot)).toContainEqual(
      expect.objectContaining({
        kind: "nullable_mismatch",
        tableName: "launchlens_workspaces",
        columnName: "tenant_id",
      }),
    );
  });

  it("requires the tenant workspace lookup index", () => {
    const snapshot = completeSnapshot();
    snapshot.indexes = snapshot.indexes.filter(
      (index) => index.indexName !== "launchlens_workspaces_tenant_idx",
    );

    expect(evaluateCloudDbSchema(snapshot)).toContainEqual(
      expect.objectContaining({
        kind: "missing_index",
        tableName: "launchlens_workspaces",
        indexName: "launchlens_workspaces_tenant_idx",
      }),
    );
  });

  it("requires the durable subscription state used for entitlement precedence", () => {
    const snapshot = completeSnapshot();
    snapshot.columns = snapshot.columns.filter(
      (column) =>
        column.tableName !== "launchlens_commercial_subscriptions" ||
        column.columnName !== "latest_event_created_at",
    );

    expect(evaluateCloudDbSchema(snapshot)).toContainEqual(
      expect.objectContaining({
        kind: "missing_column",
        tableName: "launchlens_commercial_subscriptions",
        columnName: "latest_event_created_at",
      }),
    );
  });

  it("requires the billing event receipt index for webhook operations", () => {
    const snapshot = completeSnapshot();
    snapshot.indexes = snapshot.indexes.filter(
      (index) => index.indexName !== "launchlens_billing_events_received_idx",
    );

    expect(evaluateCloudDbSchema(snapshot)).toContainEqual(
      expect.objectContaining({
        kind: "missing_index",
        tableName: "launchlens_billing_events",
        indexName: "launchlens_billing_events_received_idx",
      }),
    );
  });
});
