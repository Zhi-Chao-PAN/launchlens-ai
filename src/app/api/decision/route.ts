import { generateDecisionBrief } from "@/lib/launchlens/decision-provider";
import { normalizeDecisionSource } from "@/lib/launchlens/decision";
import {
  generateRequestId,
  noStoreJson,
  readLimitedJson,
  startTimer,
  WorkspaceRequestError,
} from "@/lib/launchlens/workspace-api";
import {
  ERROR_RATE_LIMITED,
  ERROR_DECISION_NO_EVIDENCE,
} from "@/lib/launchlens/error-codes";

export const runtime = "nodejs";
export const maxDuration = 65;

const MAX_DECISION_BODY_BYTES = 40_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 16;
const MAX_RATE_LIMIT_BUCKETS = 5_000;
const rateLimitBuckets = new Map<string, number[]>();

function clientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (
    forwardedFor?.trim() ||
    request.headers.get("x-real-ip") ||
    "local-decision-client"
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
  if (!rateLimit(request)) {
    return noStoreJson(
      { code: ERROR_RATE_LIMITED, error: "Too many decision requests. Please try again in a minute." },
      { status: 429 },
      requestId,
      timer(),
    );
  }

  let body: unknown;

  try {
    body = await readLimitedJson(request, MAX_DECISION_BODY_BYTES);
  } catch (error) {
    if (error instanceof WorkspaceRequestError) {
      return noStoreJson(
        {
          error:
            error.status === 413
              ? "Decision request is too large."
              : "Invalid JSON payload.",
        },
        { status: error.status },
        requestId,
      );
    }

    return noStoreJson({ error: "Invalid JSON payload." }, { status: 400 }, requestId);
  }

  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const source = normalizeDecisionSource(record.experiment);

  if (!source) {
    return noStoreJson(
      {
        code: ERROR_DECISION_NO_EVIDENCE,
        error:
          "Add at least one valid evidence item before generating a decision brief.",
      },
      { status: 422 },
      requestId,
      timer(),
    );
  }

  return noStoreJson(await generateDecisionBrief(source), {}, requestId, timer());
}

export function resetDecisionRateLimitsForTests() {
  rateLimitBuckets.clear();
}


