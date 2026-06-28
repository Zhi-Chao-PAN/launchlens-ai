import {
  cloudStorageConfigured,
  createWorkspace,
  hashOwnerToken,
  listWorkspacesForMember
} from "@/lib/launchlens/workspace-store";
import { resolveCommercialEntitlementForOwnerHash } from "@/lib/launchlens/commercial-subscription-store";
import { generateRequestId,
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
} from "@/lib/launchlens/error-codes";
import { parseWorkspaceSnapshot } from "@/lib/launchlens/workspace-validation";
import { recordProductEvent } from "@/lib/launchlens/product-events";
import { stage2ContextFromRequest } from "@/lib/launchlens/stage2-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = generateRequestId();
  if (!cloudStorageConfigured()) {
    return noStoreJson({
      configured: false,
      workspaces: [],
      cloudSnapshotLimit: 0,
    });
  }

  try {
    const ownerToken = ownerTokenFromRequest(request);
    const [workspaces, entitlement] = await Promise.all([
      listWorkspacesForMember(ownerToken),
      resolveCommercialEntitlementForOwnerHash(hashOwnerToken(ownerToken)),
    ]);
    return noStoreJson({
      configured: true,
      workspaces,
      cloudSnapshotLimit: entitlement.plan.limits.cloudSnapshots,
    });
  } catch (error) {
    return workspaceApiError(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  if (!(await allowWorkspaceMutation(request))) {
    return rateLimitResponse(requestId);
  }

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
    const ownerToken = ownerTokenFromRequest(request);
    const stage2 = stage2ContextFromRequest(request);
    const workspace = await createWorkspace(
      ownerToken,
      payload,
    );
    await recordProductEvent({
      ownerToken,
      eventName: "cloud_snapshot_saved",
      subjectKey: workspace.id,
      ...(stage2 ? { stage2 } : {}),
    });
    return noStoreJson({ workspace }, { status: 201 });
  } catch (error) {
    return workspaceApiError(error, requestId);
  }
}
