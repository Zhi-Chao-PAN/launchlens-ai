import { randomBytes } from "node:crypto";

import { exampleWorkspaces } from "../src/lib/launchlens/example-workspaces";

const baseUrl = (
  process.env.LAUNCHLENS_BASE_URL ?? "http://127.0.0.1:3000"
).replace(/\/$/, "");
let ownerToken = `owner_${randomBytes(48).toString("base64url")}`;
const recoveryOwnerToken = `acct_${randomBytes(48).toString("base64url")}`;

type JsonRecord = Record<string, unknown>;

async function readJson(response: Response) {
  const text = await response.text();

  try {
    return text ? (JSON.parse(text) as JsonRecord) : {};
  } catch {
    throw new Error(`Expected JSON response, received HTTP ${response.status}.`);
  }
}

async function requestJson(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-launchlens-owner": ownerToken,
      ...init.headers,
    },
  });
  const body = await readJson(response);

  return { response, body };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function workspaceId(value: unknown) {
  const id =
    value &&
    typeof value === "object" &&
    "workspace" in value &&
    value.workspace &&
    typeof value.workspace === "object" &&
    "id" in value.workspace &&
    typeof value.workspace.id === "string"
      ? value.workspace.id
      : "";

  assert(id, "Workspace response did not include an id.");
  return id;
}

function responseWorkspaces(value: unknown) {
  return value &&
    typeof value === "object" &&
    "workspaces" in value &&
    Array.isArray(value.workspaces)
    ? (value.workspaces as Array<{ id?: unknown; expiresAt?: unknown }>)
    : [];
}

function responseTenants(value: unknown) {
  return value &&
    typeof value === "object" &&
    "tenants" in value &&
    Array.isArray(value.tenants)
    ? (value.tenants as Array<{ id?: unknown }>)
    : [];
}

async function findTenantWorkspace(workspaceIdToFind: string) {
  const tenants = await requestJson("/api/tenants");
  assert(tenants.response.status === 200, "Recovered owner could not list tenants.");

  for (const tenant of responseTenants(tenants.body)) {
    if (typeof tenant.id !== "string") {
      continue;
    }

    const workspaces = await requestJson(`/api/tenants/${tenant.id}/workspaces`);
    assert(
      workspaces.response.status === 200,
      `Recovered owner could not list workspaces for tenant ${tenant.id}.`,
    );

    const match = responseWorkspaces(workspaces.body).find(
      (workspace) => workspace.id === workspaceIdToFind,
    );

    if (match) {
      return match;
    }
  }

  return null;
}

async function main() {
  const originalOwnerToken = ownerToken;
  const example = exampleWorkspaces[0];
  let id = "";
  let deletedDuringSmoke = false;
  const title = `Cloud smoke ${new Date().toISOString()}`;
  const payload = {
    title,
    input: example.input,
    workspace: example.workspace,
    execution: example.execution,
  };

  try {
    const initialList = await requestJson("/api/workspaces");

    assert(
      initialList.response.status === 200,
      `Workspace list failed with HTTP ${initialList.response.status}.`,
    );
    assert(
      initialList.body.configured === true,
      "Cloud workspace storage is not configured on the target deployment.",
    );

    const create = await requestJson("/api/workspaces", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    assert(create.response.status === 201, "Workspace create did not return 201.");

    id = workspaceId(create.body);
    const restored = await requestJson(`/api/workspaces/${id}`);

    assert(restored.response.status === 200, "Workspace restore failed.");
    assert(
      JSON.stringify(restored.body).includes("decisionBrief"),
      "Restored workspace did not include private decision brief state.",
    );

    const recovery = await requestJson("/api/workspaces/recovery", {
      method: "POST",
      body: JSON.stringify({ recoveryOwnerToken }),
    });

    assert(recovery.response.status === 200, "Recovery owner migration failed.");
    ownerToken = recoveryOwnerToken;

    const legacyOwnerList = await requestJson("/api/workspaces", {
      headers: { "x-launchlens-owner": originalOwnerToken },
    });

    assert(
      legacyOwnerList.response.status === 200 &&
        !JSON.stringify(legacyOwnerList.body).includes(id),
      "Original owner token retained access after recovery migration.",
    );

    const recoveredList = await requestJson("/api/workspaces");

    assert(
      recoveredList.response.status === 200 &&
        JSON.stringify(recoveredList.body).includes(id),
      "Recovered owner token could not list the migrated workspace.",
    );

    const recoveredTenantWorkspace = await findTenantWorkspace(id);
    assert(
      recoveredTenantWorkspace,
      "Recovered owner token could not find the migrated workspace through tenant-scoped APIs.",
    );

    const shareOn = await requestJson(`/api/workspaces/${id}/share`, {
      method: "POST",
      body: JSON.stringify({ enabled: true, expiresInDays: 7 }),
    });

    assert(shareOn.response.status === 200, "Enable share failed.");
    const shareExpiresAt =
      shareOn.body &&
      typeof shareOn.body === "object" &&
      "workspace" in shareOn.body &&
      shareOn.body.workspace &&
      typeof shareOn.body.workspace === "object" &&
      "expiresAt" in shareOn.body.workspace &&
      typeof shareOn.body.workspace.expiresAt === "string"
        ? shareOn.body.workspace.expiresAt
        : "";
    assert(shareExpiresAt, "Enable share did not return an expiration timestamp.");

    const restoredShared = await requestJson(`/api/workspaces/${id}`);
    const restoredExpiresAt =
      restoredShared.body &&
      typeof restoredShared.body === "object" &&
      "workspace" in restoredShared.body &&
      restoredShared.body.workspace &&
      typeof restoredShared.body.workspace === "object" &&
      "expiresAt" in restoredShared.body.workspace &&
      typeof restoredShared.body.workspace.expiresAt === "string"
        ? restoredShared.body.workspace.expiresAt
        : "";
    assert(
      restoredExpiresAt === shareExpiresAt,
      "Private workspace restore did not preserve the public share expiration timestamp.",
    );

    const tenantWorkspaceAfterShare = await findTenantWorkspace(id);
    assert(
      tenantWorkspaceAfterShare?.expiresAt === shareExpiresAt,
      "Tenant workspace list did not preserve the public share expiration timestamp.",
    );

    const publicShare = await fetch(`${baseUrl}/share/${id}`);
    const publicHtml = await publicShare.text();

    assert(publicShare.status === 200, "Public share page did not render.");
    assert(
      !publicHtml.includes("activation-interviews") &&
        !publicHtml.includes("5 founder interviews") &&
        !publicHtml.includes("decisionBrief"),
      "Public share leaked private evidence or decision brief details.",
    );

    const shareOff = await requestJson(`/api/workspaces/${id}/share`, {
      method: "POST",
      body: JSON.stringify({ enabled: false }),
    });

    assert(shareOff.response.status === 200, "Disable share failed.");

    const disabledShare = await fetch(`${baseUrl}/share/${id}`);
    const disabledShareHtml = await disabledShare.text();

    assert(
      disabledShare.status === 200 || disabledShare.status === 404,
      `Disabled share page returned unexpected HTTP ${disabledShare.status}.`,
    );
    assert(
      disabledShareHtml.includes("Link no longer available") ||
        disabledShareHtml.includes("could not be found"),
      "Disabled share page did not show a revoked/not-found state.",
    );
    assert(
      !disabledShareHtml.includes("activation-interviews") &&
        !disabledShareHtml.includes("5 founder interviews") &&
        !disabledShareHtml.includes("decisionBrief"),
      "Disabled share leaked private evidence or decision brief details.",
    );

    const deleted = await fetch(`${baseUrl}/api/workspaces/${id}`, {
      method: "DELETE",
      headers: { "x-launchlens-owner": ownerToken },
    });

    assert(deleted.status === 204, "Workspace delete did not return 204.");
    deletedDuringSmoke = true;

    const finalList = await requestJson("/api/workspaces");

    assert(
      finalList.response.status === 200 &&
        !JSON.stringify(finalList.body).includes(id),
      "Deleted workspace still appeared in owner list.",
    );

    console.log(
      JSON.stringify(
        {
          baseUrl,
          configured: true,
          created: true,
          restored: true,
          recovered: true,
          previousOwnerRevoked: true,
          recoveredTenantVisible: true,
          shared: true,
          shareExpiryRoundTrip: true,
          privateShareBoundary: true,
          disabledShare: true,
          deleted: true,
        },
        null,
        2,
      ),
    );
  } finally {
    if (id && !deletedDuringSmoke) {
      try {
        await fetch(`${baseUrl}/api/workspaces/${id}`, {
          method: "DELETE",
          headers: { "x-launchlens-owner": ownerToken },
        });
      } catch {
        // Best-effort cleanup only; keep the original smoke failure visible.
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Cloud workspace smoke failed.",
  );
  process.exitCode = 1;
});
