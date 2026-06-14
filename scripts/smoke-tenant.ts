import { randomBytes } from "node:crypto";

import { exampleWorkspaces } from "../src/lib/launchlens/example-workspaces";

const baseUrl = (
  process.env.LAUNCHLENS_BASE_URL ?? "http://127.0.0.1:3000"
).replace(/\/$/, "");
const ownerToken = `owner_${randomBytes(48).toString("base64url")}`;

type JsonRecord = Record<string, unknown>;

async function requestJson(
  path: string,
  init: RequestInit & { token?: string } = {},
) {
  const token = init.token ?? ownerToken;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-launchlens-owner": token,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const text = await response.text();
  let body: JsonRecord = {};
  try {
    body = text ? (JSON.parse(text) as JsonRecord) : {};
  } catch {
    body = {};
  }
  return { response, body };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const example = exampleWorkspaces[0];
  const payload = {
    title: `Tenant smoke ${new Date().toISOString()}`,
    input: example.input,
    workspace: example.workspace,
    execution: example.execution,
  };

  // 1. Initial tenants list for a brand new owner should be empty.
  const initial = await requestJson("/api/tenants");
  assert(
    initial.response.status === 200,
    `Initial tenants list failed with status ${initial.response.status}.`,
  );
  const initialTenants = (initial.body.tenants as Array<{ id: string; workspaceCount: number }>) ?? [];
  assert(
    initialTenants.length === 0,
    "A brand new capability account should not yet own any tenants.",
  );

  // 2. Create tenant A and B for the same owner.
  const tenantAResp = await requestJson("/api/tenants", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke tenant A" }),
  });
  assert(
    tenantAResp.response.status === 201,
    `Create tenant A failed: ${tenantAResp.response.status}`,
  );
  const tenantA = (tenantAResp.body.tenant as { id: string }).id;

  const tenantBResp = await requestJson("/api/tenants", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke tenant B" }),
  });
  assert(
    tenantBResp.response.status === 201,
    `Create tenant B failed: ${tenantBResp.response.status}`,
  );
  const tenantB = (tenantBResp.body.tenant as { id: string }).id;

  // 3. Create a workspace in tenant A.
  const createA = await requestJson(`/api/tenants/${tenantA}/workspaces`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  assert(
    createA.response.status === 201,
    `Create workspace in tenant A failed: ${createA.response.status}`,
  );
  const workspaceAId = (createA.body.workspace as { id: string }).id;

  // 4. Create a workspace in tenant B.
  const createB = await requestJson(`/api/tenants/${tenantB}/workspaces`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  assert(
    createB.response.status === 201,
    `Create workspace in tenant B failed: ${createB.response.status}`,
  );
  const workspaceBId = (createB.body.workspace as { id: string }).id;

  // 5. List tenant A workspaces; should include workspace A only.
  const listA = await requestJson(`/api/tenants/${tenantA}/workspaces`);
  assert(listA.response.status === 200, "List tenant A workspaces failed.");
  const tenantAWorkspaces = (listA.body.workspaces as Array<{ id: string }>) ?? [];
  assert(
    tenantAWorkspaces.some((item) => item.id === workspaceAId) &&
      !tenantAWorkspaces.some((item) => item.id === workspaceBId),
    "Tenant A should list workspace A and exclude workspace B.",
  );

  // 6. List tenant B workspaces; should include workspace B only.
  const listB = await requestJson(`/api/tenants/${tenantB}/workspaces`);
  assert(listB.response.status === 200, "List tenant B workspaces failed.");
  const tenantBWorkspaces = (listB.body.workspaces as Array<{ id: string }>) ?? [];
  assert(
    tenantBWorkspaces.some((item) => item.id === workspaceBId) &&
      !tenantBWorkspaces.some((item) => item.id === workspaceAId),
    "Tenant B should list workspace B and exclude workspace A.",
  );

  // 7. A different owner must not see either tenant.
  const otherToken = `other_${randomBytes(48).toString("base64url")}`;
  const otherTenants = await requestJson("/api/tenants", { token: otherToken });
  const otherList = (otherTenants.body.tenants as Array<{ id: string }>) ?? [];
  assert(
    !otherList.some((item) => item.id === tenantA || item.id === tenantB),
    "Cross-tenant isolation failed: another owner saw a tenant it does not own.",
  );

  // 8. The other owner must not be able to read tenant A directly.
  const otherRead = await requestJson(`/api/tenants/${tenantA}`, { token: otherToken });
  assert(
    otherRead.response.status === 404,
    `Cross-tenant isolation failed: another owner read tenant A with status ${otherRead.response.status}.`,
  );

  // 9. The other owner must not be able to list tenant A workspaces.
  const otherListA = await requestJson(`/api/tenants/${tenantA}/workspaces`, { token: otherToken });
  assert(
    otherListA.response.status === 404,
    `Cross-tenant isolation failed: another owner listed tenant A workspaces with status ${otherListA.response.status}.`,
  );

  // 10. The original owner can list both tenants.
  const ownerTenants = await requestJson("/api/tenants");
  const ownerList = (ownerTenants.body.tenants as Array<{ id: string }>) ?? [];
  assert(
    ownerList.some((item) => item.id === tenantA) &&
      ownerList.some((item) => item.id === tenantB),
    "The owner should see both of its tenants.",
  );

  console.log(
    JSON.stringify(
      {
        baseUrl,
        tenantA,
        tenantB,
        tenantAWorkspaceCount: tenantAWorkspaces.length,
        tenantBWorkspaceCount: tenantBWorkspaces.length,
        crossOwnerForbidden: true,
        perTenantIsolation: true,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Tenant smoke failed.",
  );
  process.exitCode = 1;
});
