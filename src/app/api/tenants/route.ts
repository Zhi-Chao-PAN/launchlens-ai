import {
  allowWorkspaceMutation,
  MAX_TENANT_BODY_BYTES,
  noStoreJson,
  ownerTokenFromRequest,
  rateLimitResponse,
  readLimitedJson,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import {
  createTenant,
  listTenantsForOwner,
  TenantStoreError,
} from "@/lib/launchlens/tenant-store";
import { isRecord } from "@/lib/launchlens/workspace-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const tenants = await listTenantsForOwner(ownerTokenFromRequest(request));
    return noStoreJson({ tenants });
  } catch (error) {
    if (error instanceof TenantStoreError) {
      return noStoreJson(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }
    return workspaceApiError(error);
  }
}

export async function POST(request: Request) {
  if (!(await allowWorkspaceMutation(request))) {
    return rateLimitResponse();
  }

  let body: unknown;

  try {
    body = await readLimitedJson(request, MAX_TENANT_BODY_BYTES);
  } catch (error) {
    return workspaceApiError(error);
  }

  if (!isRecord(body) || typeof body.name !== "string") {
    return noStoreJson(
      { code: "invalid_tenant_payload", error: "Tenant name is required." },
      { status: 400 },
    );
  }

  try {
    const tenant = await createTenant(
      ownerTokenFromRequest(request),
      body.name,
    );
    return noStoreJson({ tenant }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantStoreError) {
      return noStoreJson(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }
    return workspaceApiError(error);
  }
}
