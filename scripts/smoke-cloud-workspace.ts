import { randomBytes } from "node:crypto";

import { exampleWorkspaces } from "../src/lib/launchlens/example-workspaces";

const baseUrl = (
  process.env.LAUNCHLENS_BASE_URL ?? "http://127.0.0.1:3000"
).replace(/\/$/, "");
const ownerToken = `owner_${randomBytes(48).toString("base64url")}`;

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

async function main() {
  const example = exampleWorkspaces[0];
  const title = `Cloud smoke ${new Date().toISOString()}`;
  const payload = {
    title,
    input: example.input,
    workspace: example.workspace,
    execution: example.execution,
  };

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

  const id = workspaceId(create.body);
  const restored = await requestJson(`/api/workspaces/${id}`);

  assert(restored.response.status === 200, "Workspace restore failed.");
  assert(
    JSON.stringify(restored.body).includes("decisionBrief"),
    "Restored workspace did not include private decision brief state.",
  );

  const shareOn = await requestJson(`/api/workspaces/${id}/share`, {
    method: "POST",
    body: JSON.stringify({ enabled: true }),
  });

  assert(shareOn.response.status === 200, "Enable share failed.");

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

  assert(disabledShare.status === 404, "Disabled share page still rendered.");

  const deleted = await fetch(`${baseUrl}/api/workspaces/${id}`, {
    method: "DELETE",
    headers: { "x-launchlens-owner": ownerToken },
  });

  assert(deleted.status === 204, "Workspace delete did not return 204.");

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
        shared: true,
        privateShareBoundary: true,
        disabledShare: true,
        deleted: true,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Cloud workspace smoke failed.",
  );
  process.exitCode = 1;
});
