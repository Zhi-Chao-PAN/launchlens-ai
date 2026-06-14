import {
  generateRequestId,
  allowWorkspaceMutation,
  MAX_ACCEPT_BODY_BYTES,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  readLimitedJson,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import { acceptWorkspaceInvite } from "@/lib/launchlens/workspace-store";
import { isRecord } from "@/lib/launchlens/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  if (!(await allowWorkspaceMutation(request))) {
    return rateLimitResponse(requestId);
  }

  let body: unknown;

  try {
    body = await readLimitedJson(request, MAX_ACCEPT_BODY_BYTES);
  } catch (error) {
    return workspaceApiError(error, requestId);
  }

  if (!isRecord(body) || typeof body.token !== "string" || body.token.length < 32) {
    return noStoreJson(
      { code: "invalid_invite_token", error: "Invite token is invalid." },
      { status: 400 },
    );
  }

  try {
    const result = await acceptWorkspaceInvite(
      ownerTokenFromRequest(request),
      body.token,
    );

    if (!result) {
      return noStoreJson(
        { code: "invite_unavailable", error: "Invite is expired, already used, or unknown." },
        { status: 410 },
      );
    }

    return noStoreJson({ workspaceId: result.workspaceId, role: result.role });
  } catch (error) {
    return workspaceApiError(error, requestId);
  }
}
