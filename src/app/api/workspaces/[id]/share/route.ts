import {
  generateRequestId,
  allowWorkspaceMutation,
  MAX_SHARE_BODY_BYTES,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  readLimitedJson,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import {
  ERROR_INVALID_SHARE_STATE,
  ERROR_INVALID_WORKSPACE_ID,
  ERROR_WORKSPACE_FORBIDDEN,
} from "@/lib/launchlens/error-codes";
import { setWorkspaceSharingForMember } from "@/lib/launchlens/workspace-store";
import { isRecord, isUuid } from "@/lib/launchlens/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const requestId = generateRequestId();
  if (!(await allowWorkspaceMutation(request))) {
    return rateLimitResponse(requestId);
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return noStoreJson(
      { code: ERROR_INVALID_WORKSPACE_ID, error: "Workspace ID is invalid." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await readLimitedJson(request, MAX_SHARE_BODY_BYTES);
  } catch (error) {
    return workspaceApiError(error, requestId);
  }

  if (
    !isRecord(body)
    || typeof body.enabled !== "boolean"
    || (body.expiresInDays !== undefined
        && body.expiresInDays !== null
        && body.expiresInDays !== 7
        && body.expiresInDays !== 30)
  ) {
    return noStoreJson(
      { code: ERROR_INVALID_SHARE_STATE, error: "Share state is invalid." },
      { status: 400 },
    );
  }
  const expiresInDays = body.enabled && (body.expiresInDays === 7 || body.expiresInDays === 30)
    ? body.expiresInDays
    : null;

  try {
    const workspace = await setWorkspaceSharingForMember(
      ownerTokenFromRequest(request),
      id,
      body.enabled,
      { expiresInDays },
    );

    if (!workspace) {
      return noStoreJson(
        { code: ERROR_WORKSPACE_FORBIDDEN, error: "Sharing requires editor or owner access." },
        { status: 403 },
      );
    }

    return noStoreJson({ workspace });
  } catch (error) {
    return workspaceApiError(error, requestId);
  }
}
