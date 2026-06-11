import { buildMockWorkspace } from "./mock-provider";
import type {
  BacklogItem,
  ContentItem,
  GenerationResult,
  LaunchLensInput,
  LaunchLensWorkspace,
  LaunchTask,
} from "./types";

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4.1-mini";

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
      throw new Error("Model response did not contain JSON.");
    }

    return JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>;
  }
}

function coerceWorkspace(
  payload: Record<string, unknown>,
  input: LaunchLensInput,
): LaunchLensWorkspace {
  const fallback = buildMockWorkspace(input, "openai");
  const landing =
    payload.landingPage && typeof payload.landingPage === "object"
      ? (payload.landingPage as Record<string, unknown>)
      : {};
  const pricing =
    payload.pricing && typeof payload.pricing === "object"
      ? (payload.pricing as Record<string, unknown>)
      : {};

  return {
    provider: "openai",
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

async function generateWithOpenAI(
  input: LaunchLensInput,
): Promise<LaunchLensWorkspace> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const baseUrl = process.env.OPENAI_BASE_URL ?? OPENAI_BASE_URL;
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are LaunchLens AI, a pragmatic SaaS go-to-market planning agent. Return only valid JSON that matches the requested schema. Favor actionable product and launch judgment over generic market theory.",
        },
        {
          role: "user",
          content: JSON.stringify({
            brief: input,
            schema: {
              summary: "string",
              targetUsers: ["string"],
              pains: ["string"],
              mvpScope: ["string"],
              backlog: [
                { feature: "string", why: "string", priority: "P0|P1|P2" },
              ],
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
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI-compatible provider failed: ${detail.slice(0, 180)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Provider returned an empty message.");
  }

  return coerceWorkspace(parseJsonObject(content), input);
}

export async function generateLaunchWorkspace(
  input: LaunchLensInput,
): Promise<GenerationResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      workspace: buildMockWorkspace(input),
      mode: "demo",
      usedFallback: false,
    };
  }

  try {
    return {
      workspace: await generateWithOpenAI(input),
      mode: "real",
      usedFallback: false,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown provider error.";

    return {
      workspace: buildMockWorkspace(input),
      mode: "demo",
      usedFallback: true,
      fallbackReason: message,
    };
  }
}
