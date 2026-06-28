import {
  generateLaunchWorkspace,
  launchWorkspaceLiveProviderEnabled,
} from "@/lib/launchlens/provider";
import { configuredRealProvider } from "@/lib/launchlens/provider-runtime";
import { normalizeWorkspaceSourceBrief } from "@/lib/launchlens/source-brief";
import type {
  LaunchLensInput,
  LaunchLensWorkspaceSourceBrief,
} from "@/lib/launchlens/types";
import {
  generateRequestId,
  noStoreJson,
  ownerTokenFromRequest,
  startTimer,
  workspaceApiError,
} from "@/lib/launchlens/workspace-api";
import { consumeLiveProviderUsageSlot } from "@/lib/launchlens/live-provider-usage";
import { hashOwnerToken } from "@/lib/launchlens/workspace-store";
import { recordProductEvent } from "@/lib/launchlens/product-events";
import {
  ERROR_BODY_TOO_LARGE,
  ERROR_RATE_LIMITED,
  ERROR_INVALID_JSON,
  ERROR_IDEA_TOO_SHORT,
  ERROR_FIELD_TOO_LONG,
  ERROR_BRIEF_INVALID,
} from "@/lib/launchlens/error-codes";

export const runtime = "nodejs";
export const maxDuration = 65;

const MAX_CONTENT_LENGTH = 10_000;
const MAX_FIELD_LENGTH = 1_200;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const MAX_RATE_LIMIT_BUCKETS = 5_000;
const rateLimitBuckets = new Map<string, number[]>();

function field(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type GenerateRequestPayload = {
  input: LaunchLensInput;
  sourceBrief?: LaunchLensWorkspaceSourceBrief;
  sourceBriefInvalid: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeInput(value: unknown): LaunchLensInput {
  const record =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    idea: field(record.idea),
    audience: field(record.audience),
    market: field(record.market),
    tone: field(record.tone),
    constraints: field(record.constraints),
  };
}

function normalize(body: unknown): GenerateRequestPayload {
  const record = isRecord(body) ? body : {};
  const inputRaw = isRecord(record.input) ? record.input : record;
  const sourceBriefRaw = record.sourceBrief;
  const sourceBrief =
    sourceBriefRaw === undefined || sourceBriefRaw === null
      ? undefined
      : normalizeWorkspaceSourceBrief(sourceBriefRaw);

  return {
    input: normalizeInput(inputRaw),
    ...(sourceBrief ? { sourceBrief } : {}),
    sourceBriefInvalid:
      sourceBriefRaw !== undefined &&
      sourceBriefRaw !== null &&
      sourceBrief === null,
  };
}

type ValidationResult =
  | { ok: true; error?: never; code?: never }
  | { ok: false; error: string; code: string };

function validateInput(input: LaunchLensInput): ValidationResult {
  if (input.idea.length < 12) {
    return {
      ok: false,
      code: ERROR_IDEA_TOO_SHORT,
      error: "Please provide a product idea with at least 12 characters.",
    };
  }

  const entries = Object.entries(input) as Array<[keyof LaunchLensInput, string]>;
  const longField = entries.find(([, value]) => value.length > MAX_FIELD_LENGTH);

  if (longField) {
    return {
      ok: false,
      code: ERROR_FIELD_TOO_LONG,
      error: `${longField[0]} must be ${MAX_FIELD_LENGTH} characters or less.`,
    };
  }

  return { ok: true };
}

function clientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (
    forwardedFor?.trim() ||
    request.headers.get("x-real-ip") ||
    "local-demo-client"
  );
}

function rateLimit(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const recent = (rateLimitBuckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(key, recent);
    return false;
  }

  if (rateLimitBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
    rateLimitBuckets.clear();
  }

  recent.push(now);
  rateLimitBuckets.set(key, recent);
  return true;
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const timer = startTimer();
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > MAX_CONTENT_LENGTH) {
    return noStoreJson(
      { code: ERROR_BODY_TOO_LARGE, error: "Request body is too large for the demo endpoint." },
      { status: 413 },
      requestId,
      timer(),
    );
  }

  if (!rateLimit(request)) {
    return noStoreJson(
      { code: ERROR_RATE_LIMITED, error: "Too many generation requests. Please try again in a minute." },
      { status: 429 },
      requestId,
      timer(),
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return noStoreJson({ code: ERROR_INVALID_JSON, error: "Invalid JSON payload." }, { status: 400 }, requestId, timer());
  }

  const payload = normalize(body);
  const { input, sourceBrief } = payload;
  const validation = validateInput(input);

  if (!validation.ok) {
    return noStoreJson(
      { code: validation.code, error: validation.error },
      { status: 400 },
      requestId,
      timer(),
    );
  }

  if (payload.sourceBriefInvalid) {
    return noStoreJson(
      {
        code: ERROR_BRIEF_INVALID,
        error: "sourceBrief must contain valid Research Studio provenance.",
      },
      { status: 400 },
      requestId,
      timer(),
    );
  }

  try {
    const ownerToken = ownerTokenFromRequest(request);
    await recordProductEvent({
      ownerToken,
      eventName: "workspace_generation_started",
      subjectKey: sourceBrief?.sessionId,
    });
    const usage =
      launchWorkspaceLiveProviderEnabled() && configuredRealProvider()
      ? await consumeLiveProviderUsageSlot({
          ownerHash: hashOwnerToken(ownerToken),
          feature: "workspace_generation",
        })
      : null;
    const result = await generateLaunchWorkspace(input);
    const responseBody = sourceBrief
      ? {
          ...result,
          workspace: {
            ...result.workspace,
            sourceBrief,
          },
        }
      : result;
    await recordProductEvent({
      ownerToken,
      eventName: "workspace_generation_completed",
      subjectKey: sourceBrief?.sessionId,
      provider: result.workspace.provider,
      mode: result.usedFallback ? "fallback" : result.mode,
    });

    return noStoreJson(
      usage ? { ...responseBody, usage } : responseBody,
      {},
      requestId,
      timer(),
    );
  } catch (error) {
    return workspaceApiError(error, requestId);
  }
}


export function resetGenerateRateLimitsForTests() {
  rateLimitBuckets.clear();
}



