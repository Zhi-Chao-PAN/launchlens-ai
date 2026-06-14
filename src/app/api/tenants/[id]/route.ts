import {
  generateRequestId,
  noStoreJson,
  ownerTokenFromRequest,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import {
  ERROR_INVALID_TENANT_ID,
  ERROR_TENANT_NOT_FOUND,
} from "@/lib/launchlens/error-codes";
import { getTenantForOwner } from "@/lib/launchlens/tenant-store";
import { isUuid } from "@/lib/launchlens/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const requestId = generateRequestId();
  if (!isUuid(id)) {
    return noStoreJson(
      { code: ERROR_INVALID_TENANT_ID, error: "Tenant ID is invalid." },
      { status: 400 },
    );
  }

  try {
    const tenant = await getTenantForOwner(ownerTokenFromRequest(request), id);
    if (!tenant) {
      return noStoreJson(
        { code: ERROR_TENANT_NOT_FOUND, error: "Tenant was not found." },
        { status: 404 },
      );
    }
    return noStoreJson({ tenant });
  } catch (error) {
    return workspaceApiError(error, requestId);
  }
}
