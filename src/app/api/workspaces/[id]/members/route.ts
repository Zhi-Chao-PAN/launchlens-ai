import {
  allowWorkspaceMutation,
  MAX_MEMBER_BODY_BYTES,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  readLimitedJson,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import {
  createWorkspaceInvite,
  listWorkspaceMembers,
} from "@/lib/launchlens/workspace-store";
import { isRecord, isUuid } from "@/lib/launchlens/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isUuid(id)) {
    return noStoreJson(
      { code: "invalid_workspace_id", error: "Workspace ID is invalid." },
      { status: 400 },
    );
  }

  try {
    const members = await listWorkspaceMembers(
      ownerTokenFromRequest(request),
      id,
    );

    if (members === null) {
      return noStoreJson(
        { code: "workspace_forbidden", error: "Only members can view the member list." },
        { status: 403 },
      );
    }

    return noStoreJson({ members });
  } catch (error) {
    return workspaceApiError(error);
  }
}

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
    body = await readLimitedJson(request, MAX_MEMBER_BODY_BYTES);
  } catch (error) {
    return workspaceApiError(error);
  }

  if (
    !isRecord(body) ||
    (body.role !== "editor" && body.role !== "viewer")
  ) {
    return noStoreJson(
      { code: "invalid_member_role", error: "Member role must be editor or viewer." },
      { status: 400 },
    );
  }

  try {
    const invite = await createWorkspaceInvite(
      ownerTokenFromRequest(request),
      id,
      body.role,
    );

    if (!invite) {
      return noStoreJson(
        { code: "workspace_forbidden", error: "Only owners can invite members." },
        { status: 403 },
      );
    }

    return noStoreJson({ invite });
  } catch (error) {
    return workspaceApiError(error);
  }
}
