import {
  CommercialBillingStoreError,
} from "./commercial-subscription-store";
import { StripeBillingError } from "./stripe-server";
import {
  WorkspaceRequestError,
  noStoreJson,
} from "./workspace-api";
import { WorkspaceStoreError } from "./workspace-store";
import { ERROR_BILLING_REQUEST_FAILED } from "./error-codes";

export function commercialBillingApiError(
  error: unknown,
  requestId?: string,
) {
  if (
    error instanceof WorkspaceRequestError ||
    error instanceof WorkspaceStoreError ||
    error instanceof CommercialBillingStoreError ||
    error instanceof StripeBillingError
  ) {
    return noStoreJson(
      { code: error.code, error: error.message },
      { status: error.status },
      requestId,
    );
  }

  console.error("[launchlens:commercial-billing] request_failed", {
    requestId,
  });
  return noStoreJson(
    {
      code: ERROR_BILLING_REQUEST_FAILED,
      error: "Commercial billing is temporarily unavailable.",
    },
    { status: 503 },
    requestId,
  );
}
