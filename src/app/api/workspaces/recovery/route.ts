import {
  generateRequestId,
  allowWorkspaceMutation,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  readLimitedJson,
  WorkspaceRequestError,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import {
  ERROR_CLOUD_UNAVAILABLE,
  ERROR_INVALID_RECOVERY_TOKEN,
} from "@/lib/launchlens/error-codes";
import {
  cloudStorageConfigured,
  migrateWorkspaceOwner,
  validateOwnerToken,
} from "@/lib/launchlens/workspace-store";
import { isRecord } from "@/lib/launchlens/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RECOVERY_BODY_BYTES = 2_048;

export async function POST(request: Request) {
  const requestId = generateRequestId();
  if (!(await allowWorkspaceMutation(request))) {
    return rateLimitResponse(requestId);
  }

  if (!cloudStorageConfigured()) {
    return noStoreJson(
      {
        code: ERROR_CLOUD_UNAVAILABLE,
        error: "Cloud workspace storage is not configured.",
      },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await readLimitedJson(request, MAX_RECOVERY_BODY_BYTES);
  } catch (error) {
    return workspaceApiError(error, requestId);
  }

  if (!isRecord(body) || typeof body.recoveryOwnerToken !== "string") {
    return noStoreJson(
      {
        code: ERROR_INVALID_RECOVERY_TOKEN,
        error: "Recovery owner token is invalid.",
      },
      { status: 400 },
    );
  }

  const currentOwnerToken = ownerTokenFromRequest(request);
  const recoveryOwnerToken = body.recoveryOwnerToken.trim();

  if (
    !validateOwnerToken(currentOwnerToken) ||
    !validateOwnerToken(recoveryOwnerToken)
  ) {
    return workspaceApiError(
      new WorkspaceRequestError(
        "invalid_owner_token",
        401,
        "The workspace owner token is invalid.",
      ),
    );
  }

  try {
    return noStoreJson(
      await migrateWorkspaceOwner(currentOwnerToken, recoveryOwnerToken),
    );
  } catch (error) {
    return workspaceApiError(error, requestId);
  }
}
