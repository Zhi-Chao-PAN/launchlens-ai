import {
  generateRequestId,
  allowWorkspaceMutation,
  MAX_WORKSPACE_BODY_BYTES,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  readLimitedJson,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import {
  ERROR_INVALID_WORKSPACE,
  ERROR_TENANT_NOT_FOUND,
} from "@/lib/launchlens/error-codes";
import {
  createWorkspaceInTenant,
  listWorkspacesInTenant,
  TenantStoreError,
} from "@/lib/launchlens/tenant-store";
import { parseWorkspaceSnapshot } from "@/lib/launchlens/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const requestId = generateRequestId();
  try {
    const workspaces = await listWorkspacesInTenant(
      ownerTokenFromRequest(request),
      id,
    );
    if (workspaces === null) {
      return noStoreJson(
        { code: ERROR_TENANT_NOT_FOUND, error: "Tenant was not found." },
        { status: 404 },
      );
    }
    return noStoreJson({ workspaces });
  } catch (error) {
    return workspaceApiError(error, requestId);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = generateRequestId();
  if (!(await allowWorkspaceMutation(request))) {
    return rateLimitResponse(requestId);
  }

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await readLimitedJson(request, MAX_WORKSPACE_BODY_BYTES);
  } catch (error) {
    return workspaceApiError(error, requestId);
  }

  const payload = parseWorkspaceSnapshot(body);

  if (!payload) {
    return noStoreJson(
      {
        code: ERROR_INVALID_WORKSPACE,
        error: "Workspace snapshot does not match the required schema.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await createWorkspaceInTenant(
      ownerTokenFromRequest(request),
      id,
      payload,
    );
    if ("kind" in result && result.kind === "tenant_missing") {
      return noStoreJson(
        { code: ERROR_TENANT_NOT_FOUND, error: "Tenant was not found." },
        { status: 404 },
      );
    }
    return noStoreJson({ workspace: result }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantStoreError) {
      return noStoreJson(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }
    return workspaceApiError(error, requestId);
  }
}
