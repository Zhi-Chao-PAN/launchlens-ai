import {
  allowWorkspaceMutation,
  MAX_SHARE_BODY_BYTES,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  readLimitedJson,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import { setWorkspaceSharing } from "@/lib/launchlens/workspace-store";
import { isRecord, isUuid } from "@/lib/launchlens/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!(await allowWorkspaceMutation(request))) {
    return rateLimitResponse();
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return noStoreJson(
      { code: "invalid_workspace_id", error: "Workspace ID is invalid." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await readLimitedJson(request, MAX_SHARE_BODY_BYTES);
  } catch (error) {
    return workspaceApiError(error);
  }

  if (!isRecord(body) || typeof body.enabled !== "boolean") {
    return noStoreJson(
      { code: "invalid_share_state", error: "Share state is invalid." },
      { status: 400 },
    );
  }

  try {
    const workspace = await setWorkspaceSharing(
      ownerTokenFromRequest(request),
      id,
      body.enabled,
    );

    if (!workspace) {
      return noStoreJson(
        { code: "workspace_not_found", error: "Workspace was not found." },
        { status: 404 },
      );
    }

    return noStoreJson({ workspace });
  } catch (error) {
    return workspaceApiError(error);
  }
}
