import { createHash } from "node:crypto";

import {
  cloudStorageConfigured,
  consumeWorkspaceMutationSlot,
  WorkspaceStoreError,
} from "./workspace-store";

export const OWNER_HEADER = "x-launchlens-owner";
export const MAX_WORKSPACE_BODY_BYTES = 160_000;
export const MAX_SHARE_BODY_BYTES = 1_024;
export const MAX_MEMBER_BODY_BYTES = 2_048;
export const MAX_ACCEPT_BODY_BYTES = 4_096;
export const MAX_TENANT_BODY_BYTES = 1_024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const MAX_RATE_LIMIT_BUCKETS = 5_000;
const mutationBuckets = new Map<string, number[]>();

export function ownerTokenFromRequest(request: Request) {
  return request.headers.get(OWNER_HEADER)?.trim() ?? "";
}

export class WorkspaceRequestError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceRequestError";
  }
}

export async function readLimitedJson(request: Request, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new WorkspaceRequestError(
      "workspace_too_large",
      413,
      "Request body is too large.",
    );
  }

  if (!request.body) {
    throw new WorkspaceRequestError(
      "invalid_json",
      400,
      "Invalid JSON payload.",
    );
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new WorkspaceRequestError(
          "workspace_too_large",
          413,
          "Request body is too large.",
        );
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.parse(text) as unknown;
  } catch {
    throw new WorkspaceRequestError(
      "invalid_json",
      400,
      "Invalid JSON payload.",
    );
  }
}

function inProcessMutationSlot(key: string) {
  const now = Date.now();
  const recent = (mutationBuckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    mutationBuckets.set(key, recent);
    return false;
  }

  if (mutationBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
    mutationBuckets.clear();
  }

  recent.push(now);
  mutationBuckets.set(key, recent);
  return true;
}

export async function allowWorkspaceMutation(request: Request) {
  const forwardedFor = (
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for")
  )?.split(",")[0];
  const clientAddress =
    forwardedFor?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local-cloud-client";
  const bucketKey = createHash("sha256")
    .update(`workspace-mutation-v1\u0000${clientAddress}`, "utf8")
    .digest("hex");

  if (cloudStorageConfigured()) {
    try {
      return await consumeWorkspaceMutationSlot(
        bucketKey,
        RATE_LIMIT_MAX,
        RATE_LIMIT_WINDOW_MS,
      );
    } catch {
      console.error(
        "[launchlens:workspace-rate-limit] distributed_limit_unavailable",
      );
    }
  }

  return inProcessMutationSlot(bucketKey);
}

export function rateLimitResponse() {
  return noStoreJson(
    {
      code: "cloud_rate_limited",
      error: "Too many cloud workspace changes. Please try again in a minute.",
    },
    { status: 429 },
  );
}

export function workspaceApiError(error: unknown) {
  if (error instanceof WorkspaceRequestError) {
    return noStoreJson(
      { code: error.code, error: error.message },
      { status: error.status },
    );
  }

  if (error instanceof WorkspaceStoreError) {
    return noStoreJson(
      { code: error.code, error: error.message },
      { status: error.status },
    );
  }

  console.error("[launchlens:workspace-store] request_failed");
  return noStoreJson(
    {
      code: "cloud_request_failed",
      error: "Cloud workspace storage is temporarily unavailable.",
    },
    { status: 503 },
  );
}

export function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");

  return Response.json(body, { ...init, headers });
}

export function resetWorkspaceRateLimitsForTests() {
  mutationBuckets.clear();
}


