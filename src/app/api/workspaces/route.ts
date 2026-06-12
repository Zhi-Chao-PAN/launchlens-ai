import {
  cloudStorageConfigured,
  createWorkspace,
  listWorkspaces,
} from "@/lib/launchlens/workspace-store";
import {
  allowWorkspaceMutation,
  MAX_WORKSPACE_BODY_BYTES,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  readLimitedJson,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import { parseWorkspaceSnapshot } from "@/lib/launchlens/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!cloudStorageConfigured()) {
    return noStoreJson({ configured: false, workspaces: [] });
  }

  try {
    const workspaces = await listWorkspaces(ownerTokenFromRequest(request));
    return noStoreJson({ configured: true, workspaces });
  } catch (error) {
    return workspaceApiError(error);
  }
}

export async function POST(request: Request) {
  if (!allowWorkspaceMutation(request)) {
    return rateLimitResponse();
  }

  let body: unknown;

  try {
    body = await readLimitedJson(request, MAX_WORKSPACE_BODY_BYTES);
  } catch (error) {
    return workspaceApiError(error);
  }

  const payload = parseWorkspaceSnapshot(body);

  if (!payload) {
    return noStoreJson(
      {
        code: "invalid_workspace",
        error: "Workspace snapshot does not match the required schema.",
      },
      { status: 400 },
    );
  }

  try {
    const workspace = await createWorkspace(
      ownerTokenFromRequest(request),
      payload,
    );
    return noStoreJson({ workspace }, { status: 201 });
  } catch (error) {
    return workspaceApiError(error);
  }
}
