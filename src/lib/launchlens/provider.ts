import { buildMockWorkspace } from "./mock-provider";
import type {
  BacklogItem,
  ContentItem,
  GenerationResult,
  LaunchLensInput,
  LaunchLensWorkspace,
  LaunchTask,
  ProviderName,
} from "./types";

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const MINIMAX_BASE_URL = "https://api.minimaxi.com/v1";
const DEFAULT_MINIMAX_MODEL = "MiniMax-M3";
const PROVIDER_TIMEOUT_MS = 25_000;

type RealProviderName = Exclude<ProviderName, "mock">;

class ProviderError extends Error {
  constructor(
    message: string,
    readonly publicCode:
      | "provider_failed"
      | "provider_timeout"
      | "provider_misconfigured"
      | "provider_validation_failed" = "provider_failed",
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

function list(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
}

function backlog(value: unknown, fallback: BacklogItem[]): BacklogItem[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const priority = record.priority;

      return {
        feature:
          typeof record.feature === "string"
            ? record.feature
            : "Untitled feature",
        why: typeof record.why === "string" ? record.why : "Needs validation.",
        priority:
          priority === "P0" || priority === "P1" || priority === "P2"
            ? priority
            : "P1",
      };
    })
    .filter((item): item is BacklogItem => item !== null);

  return items.length > 0 ? items : fallback;
}

function content(value: unknown, fallback: ContentItem[]): ContentItem[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;

      return {
        channel:
          typeof record.channel === "string" ? record.channel : "Owned channel",
        angle:
          typeof record.angle === "string"
            ? record.angle
            : "Founder-led validation story",
        cadence:
          typeof record.cadence === "string" ? record.cadence : "Weekly",
      };
    })
    .filter((item): item is ContentItem => item !== null);

  return items.length > 0 ? items : fallback;
}

function tasks(value: unknown, fallback: LaunchTask[]): LaunchTask[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;

      return {
        title:
          typeof record.title === "string" ? record.title : "Validate next step",
        owner: typeof record.owner === "string" ? record.owner : "Founder",
        due: typeof record.due === "string" ? record.due : "This week",
        outcome:
          typeof record.outcome === "string"
            ? record.outcome
            : "Clearer execution signal",
      };
    })
    .filter((item): item is LaunchTask => item !== null);

  return items.length > 0 ? items : fallback;
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function parseJsonObject(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new ProviderError(
        "Model response did not contain JSON.",
        "provider_validation_failed",
      );
    }

    return JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>;
  }
}

function hasRequiredWorkspaceShape(payload: Record<string, unknown>) {
  return (
    typeof payload.summary === "string" &&
    Array.isArray(payload.targetUsers) &&
    Array.isArray(payload.pains) &&
    Array.isArray(payload.mvpScope) &&
    Array.isArray(payload.backlog) &&
    payload.landingPage !== null &&
    typeof payload.landingPage === "object" &&
    payload.pricing !== null &&
    typeof payload.pricing === "object" &&
    Array.isArray(payload.launchPlan) &&
    Array.isArray(payload.contentCalendar) &&
    Array.isArray(payload.tasks) &&
    Array.isArray(payload.assumptions)
  );
}

function validatedBaseUrl(options: {
  rawBaseUrl: string;
  allowedHosts: string;
}) {
  const { rawBaseUrl, allowedHosts } = options;
  let url: URL;

  try {
    url = new URL(rawBaseUrl);
  } catch {
    throw new ProviderError("Invalid provider base URL.", "provider_misconfigured");
  }

  if (url.protocol !== "https:") {
    throw new ProviderError(
      "Provider base URL must use HTTPS.",
      "provider_misconfigured",
    );
  }

  const allowed = allowedHosts
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed.includes(url.hostname.toLowerCase())) {
    throw new ProviderError(
      "Provider base URL host is not allowlisted.",
      "provider_misconfigured",
    );
  }

  return url.toString().replace(/\/$/, "");
}

function promptPayload(input: LaunchLensInput) {
  return {
    brief: input,
    schema: {
      summary: "string",
      targetUsers: ["string"],
      pains: ["string"],
      mvpScope: ["string"],
      backlog: [{ feature: "string", why: "string", priority: "P0|P1|P2" }],
      landingPage: {
        headline: "string",
        subheadline: "string",
        cta: "string",
        proofBullets: ["string"],
      },
      pricing: {
        hypothesis: "string",
        tiers: ["string"],
        risks: ["string"],
      },
      launchPlan: ["string"],
      contentCalendar: [
        { channel: "string", angle: "string", cadence: "string" },
      ],
      tasks: [
        {
          title: "string",
          owner: "string",
          due: "string",
          outcome: "string",
        },
      ],
      assumptions: ["string"],
    },
  };
}

function coerceWorkspace(
  payload: Record<string, unknown>,
  input: LaunchLensInput,
  provider: RealProviderName,
): LaunchLensWorkspace {
  const fallback = buildMockWorkspace(input, provider);
  const landing =
    payload.landingPage && typeof payload.landingPage === "object"
      ? (payload.landingPage as Record<string, unknown>)
      : {};
  const pricing =
    payload.pricing && typeof payload.pricing === "object"
      ? (payload.pricing as Record<string, unknown>)
      : {};

  return {
    provider,
    generatedAt: new Date().toISOString(),
    summary: text(payload.summary, fallback.summary),
    targetUsers: list(payload.targetUsers, fallback.targetUsers),
    pains: list(payload.pains, fallback.pains),
    mvpScope: list(payload.mvpScope, fallback.mvpScope),
    backlog: backlog(payload.backlog, fallback.backlog),
    landingPage: {
      headline: text(landing.headline, fallback.landingPage.headline),
      subheadline: text(
        landing.subheadline,
        fallback.landingPage.subheadline,
      ),
      cta: text(landing.cta, fallback.landingPage.cta),
      proofBullets: list(
        landing.proofBullets,
        fallback.landingPage.proofBullets,
      ),
    },
    pricing: {
      hypothesis: text(pricing.hypothesis, fallback.pricing.hypothesis),
      tiers: list(pricing.tiers, fallback.pricing.tiers),
      risks: list(pricing.risks, fallback.pricing.risks),
    },
    launchPlan: list(payload.launchPlan, fallback.launchPlan),
    contentCalendar: content(payload.contentCalendar, fallback.contentCalendar),
    tasks: tasks(payload.tasks, fallback.tasks),
    assumptions: list(payload.assumptions, fallback.assumptions),
  };
}

function responsesApiText(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }

  const record = data as Record<string, unknown>;

  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  if (!Array.isArray(record.output)) {
    return "";
  }

  return record.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const contentParts = (item as Record<string, unknown>).content;

      if (!Array.isArray(contentParts)) {
        return [];
      }

      return contentParts
        .map((part) => {
          if (!part || typeof part !== "object") {
            return "";
          }

          const textValue = (part as Record<string, unknown>).text;
          return typeof textValue === "string" ? textValue : "";
        })
        .filter(Boolean);
    })
    .join("\n");
}

async function parseWorkspaceResponse(
  response: Response,
  input: LaunchLensInput,
  provider: RealProviderName,
) {
  if (!response.ok) {
    throw new ProviderError(
      `Provider returned HTTP ${response.status}.`,
      "provider_failed",
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? responsesApiText(data);

  if (!content) {
    throw new ProviderError("Provider returned an empty message.", "provider_failed");
  }

  const payload = parseJsonObject(content);

  if (!hasRequiredWorkspaceShape(payload)) {
    throw new ProviderError(
      "Provider response did not match the workspace schema.",
      "provider_validation_failed",
    );
  }

  return coerceWorkspace(payload, input, provider);
}

async function generateWithOpenAI(
  input: LaunchLensInput,
): Promise<LaunchLensWorkspace> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const baseUrl = validatedBaseUrl({
    rawBaseUrl: process.env.OPENAI_BASE_URL ?? OPENAI_BASE_URL,
    allowedHosts: process.env.OPENAI_ALLOWED_BASE_URL_HOSTS ?? "api.openai.com",
  });
  const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are LaunchLens AI, a pragmatic SaaS go-to-market planning agent. Return only valid JSON that matches the requested schema. Favor actionable product and launch judgment over generic market theory.",
          },
          {
            role: "user",
            content: JSON.stringify(promptPayload(input)),
          },
        ],
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ProviderError("Provider request timed out.", "provider_timeout");
    }

    throw new ProviderError("Provider request failed.", "provider_failed");
  }

  return parseWorkspaceResponse(response, input, "openai");
}

async function generateWithMiniMax(
  input: LaunchLensInput,
): Promise<LaunchLensWorkspace> {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is not configured.");
  }

  const baseUrl = validatedBaseUrl({
    rawBaseUrl: process.env.MINIMAX_BASE_URL ?? MINIMAX_BASE_URL,
    allowedHosts:
      process.env.MINIMAX_ALLOWED_BASE_URL_HOSTS ??
      "api.minimaxi.com,api.minimax.io",
  });
  const model = process.env.MINIMAX_MODEL ?? DEFAULT_MINIMAX_MODEL;
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_output_tokens: 1800,
        reasoning: { effort: "none" },
        input: [
          {
            role: "system",
            content:
              "You are LaunchLens AI, a pragmatic SaaS go-to-market planning agent. Return only valid JSON that matches the requested schema. Favor actionable product and launch judgment over generic market theory.",
          },
          {
            role: "user",
            content: JSON.stringify(promptPayload(input)),
          },
        ],
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ProviderError("Provider request timed out.", "provider_timeout");
    }

    throw new ProviderError("Provider request failed.", "provider_failed");
  }

  return parseWorkspaceResponse(response, input, "minimax");
}

export async function generateLaunchWorkspace(
  input: LaunchLensInput,
): Promise<GenerationResult> {
  if (!process.env.MINIMAX_API_KEY && !process.env.OPENAI_API_KEY) {
    return {
      workspace: buildMockWorkspace(input),
      mode: "demo",
      usedFallback: false,
    };
  }

  try {
    const workspace = process.env.MINIMAX_API_KEY
      ? await generateWithMiniMax(input)
      : await generateWithOpenAI(input);

    return {
      workspace,
      mode: "real",
      usedFallback: false,
    };
  } catch (error) {
    const code =
      error instanceof ProviderError ? error.publicCode : "provider_failed";

    console.warn("[LaunchLens provider fallback]", {
      code,
      message: error instanceof Error ? error.message : "Unknown provider error.",
    });

    return {
      workspace: buildMockWorkspace(input),
      mode: "demo",
      usedFallback: true,
      fallbackReason: code,
    };
  }
}
