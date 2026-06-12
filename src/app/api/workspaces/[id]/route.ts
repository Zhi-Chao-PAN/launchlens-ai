import {
  deleteWorkspace,
  getOwnedWorkspace,
} from "@/lib/launchlens/workspace-store";
import {
  allowWorkspaceMutation,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import { isUuid } from "@/lib/launchlens/workspace-validation";

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
    const workspace = await getOwnedWorkspace(
      ownerTokenFromRequest(request),
      id,
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

export async function DELETE(request: Request, context: RouteContext) {
  if (!allowWorkspaceMutation(request)) {
    return rateLimitResponse();
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return noStoreJson(
      { code: "invalid_workspace_id", error: "Workspace ID is invalid." },
      { status: 400 },
    );
  }

  try {
    const deleted = await deleteWorkspace(
      ownerTokenFromRequest(request),
      id,
    );

    if (!deleted) {
      return noStoreJson(
        { code: "workspace_not_found", error: "Workspace was not found." },
        { status: 404 },
      );
    }

    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return workspaceApiError(error);
  }
}
