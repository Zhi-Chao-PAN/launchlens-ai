import { randomBytes } from "node:crypto";

import { exampleWorkspaces } from "../src/lib/launchlens/example-workspaces";

const baseUrl = (
  process.env.LAUNCHLENS_BASE_URL ?? "http://127.0.0.1:3000"
).replace(/\/$/, "");
const ownerToken = `owner_${randomBytes(48).toString("base64url")}`;
const viewerToken = `viewer_${randomBytes(48).toString("base64url")}`;

type JsonRecord = Record<string, unknown>;

async function readJson(response: Response) {
  const text = await response.text();

  try {
    return text ? (JSON.parse(text) as JsonRecord) : {};
  } catch {
    throw new Error(`Expected JSON response, received HTTP ${response.status}.`);
  }
}

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
  const body = await readJson(response);

  return { response, body };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function workspaceId(value: unknown) {
  const record = (value as { workspace?: { id?: string } } | null)
    ?.workspace;
  assert(record?.id, "Workspace response did not include an id.");
  return record.id;
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

  const invite = await requestJson(`/api/workspaces/${id}/members`, {
    method: "POST",
    body: JSON.stringify({ role: "viewer" }),
  });

  assert(invite.response.status === 200, "Create invite failed.");
  const inviteToken = String(
    (invite.body.invite as { token?: string } | undefined)?.token ?? "",
  );
  assert(inviteToken.length >= 32, "Invite token was not returned.");

  const membersBeforeAccept = await requestJson(`/api/workspaces/${id}/members`);
  assert(membersBeforeAccept.response.status === 200, "List members failed.");
  const memberList = (membersBeforeAccept.body.members as Array<{
    role: string;
  }>) ?? [];
  assert(
    memberList.filter((member) => member.role === "owner").length === 1,
    "Owner member entry was missing.",
  );

  const accept = await requestJson("/api/workspaces/invites/accept", {
    method: "POST",
    body: JSON.stringify({ token: inviteToken }),
    token: viewerToken,
  });

  assert(accept.response.status === 200, "Accept invite failed.");
  assert(
    String((accept.body as { role?: string }).role) === "viewer",
    "Accepted role was not viewer.",
  );

  const viewerRead = await requestJson(`/api/workspaces/${id}`, {
    token: viewerToken,
  });
  assert(viewerRead.response.status === 200, "Viewer could not read workspace.");
  assert(
    String((viewerRead.body as { role?: string }).role) === "viewer",
    "Viewer did not see a viewer role on read.",
  );

  const viewerShareAttempt = await requestJson(
    `/api/workspaces/${id}/share`,
    {
      method: "POST",
      body: JSON.stringify({ enabled: true }),
      token: viewerToken,
    },
  );
  assert(
    viewerShareAttempt.response.status === 403,
    `Viewer was allowed to toggle share (status ${viewerShareAttempt.response.status}).`,
  );

  const deleted = await fetch(`${baseUrl}/api/workspaces/${id}`, {
    method: "DELETE",
    headers: { "x-launchlens-owner": ownerToken },
  });
  assert(deleted.status === 204, "Workspace delete did not return 204.");

  console.log(
    JSON.stringify(
      {
        baseUrl,
        configured: true,
        created: true,
        memberInvited: true,
        memberAccepted: true,
        memberRead: true,
        viewerForbidden: true,
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
