import { buildMockWorkspace } from "./mock-provider";
import {
  configuredRealProvider,
  ProviderError,
  requestStructuredJson,
  type RealProviderName,
} from "./provider-runtime";
import type {
  BacklogItem,
  ContentItem,
  GenerationResult,
  LaunchLensInput,
  LaunchLensWorkspace,
  LaunchTask,
} from "./types";

export const LAUNCHLENS_PROMPT_VERSION = "launchlens-workspace-v1";
const MINIMAX_MAX_OUTPUT_TOKENS = 2_400;

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

function hasCompleteWorkspaceShape(payload: Record<string, unknown>) {
  const landingPage =
    payload.landingPage && typeof payload.landingPage === "object"
      ? (payload.landingPage as Record<string, unknown>)
      : null;
  const pricing =
    payload.pricing && typeof payload.pricing === "object"
      ? (payload.pricing as Record<string, unknown>)
      : null;

  return (
    typeof payload.summary === "string" &&
    Array.isArray(payload.targetUsers) &&
    Array.isArray(payload.pains) &&
    Array.isArray(payload.mvpScope) &&
    Array.isArray(payload.backlog) &&
    landingPage !== null &&
    typeof landingPage.headline === "string" &&
    typeof landingPage.subheadline === "string" &&
    typeof landingPage.cta === "string" &&
    Array.isArray(landingPage.proofBullets) &&
    pricing !== null &&
    typeof pricing.hypothesis === "string" &&
    Array.isArray(pricing.tiers) &&
    Array.isArray(pricing.risks) &&
    Array.isArray(payload.launchPlan) &&
    Array.isArray(payload.contentCalendar) &&
    Array.isArray(payload.tasks) &&
    Array.isArray(payload.assumptions)
  );
}

function promptPayload(input: LaunchLensInput) {
  return {
    brief: input,
    instructions:
      "Return compact JSON with the exact top-level keys shown. Keep each list to the number of example items shown. Use one sentence per string.",
    schema: {
      summary: "string",
      targetUsers: ["string", "string", "string"],
      pains: ["string", "string", "string"],
      mvpScope: ["string", "string", "string", "string"],
      backlog: [
        { feature: "string", why: "string", priority: "P0|P1|P2" },
        { feature: "string", why: "string", priority: "P0|P1|P2" },
        { feature: "string", why: "string", priority: "P0|P1|P2" },
        { feature: "string", why: "string", priority: "P0|P1|P2" },
      ],
      landingPage: {
        headline: "string",
        subheadline: "string",
        cta: "string",
        proofBullets: ["string", "string", "string"],
      },
      pricing: {
        hypothesis: "string",
        tiers: ["string", "string", "string"],
        risks: ["string", "string"],
      },
      launchPlan: ["string", "string", "string", "string"],
      contentCalendar: [
        { channel: "string", angle: "string", cadence: "string" },
        { channel: "string", angle: "string", cadence: "string" },
        { channel: "string", angle: "string", cadence: "string" },
      ],
      tasks: [
        {
          title: "string",
          owner: "string",
          due: "string",
          outcome: "string",
        },
        {
          title: "string",
          owner: "string",
          due: "string",
          outcome: "string",
        },
        {
          title: "string",
          owner: "string",
          due: "string",
          outcome: "string",
        },
        {
          title: "string",
          owner: "string",
          due: "string",
          outcome: "string",
        },
      ],
      assumptions: ["string", "string", "string"],
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

function parseWorkspacePayload(
  payload: Record<string, unknown>,
  input: LaunchLensInput,
  provider: RealProviderName,
) {
  if (!hasCompleteWorkspaceShape(payload)) {
    throw new ProviderError(
      "Provider response did not include enough workspace structure.",
      "provider_validation_failed",
    );
  }

  return coerceWorkspace(payload, input, provider);
}

async function generateWithRealProvider(
  input: LaunchLensInput,
  provider: RealProviderName,
): Promise<LaunchLensWorkspace> {
  const payload = await requestStructuredJson({
    provider,
    system:
      "You are LaunchLens AI, a pragmatic SaaS go-to-market planning agent. Return only valid compact JSON matching the requested schema. Favor actionable product and launch judgment over generic market theory.",
    payload: promptPayload(input),
    openAiMaxTokens: 1_200,
    miniMaxMaxOutputTokens: MINIMAX_MAX_OUTPUT_TOKENS,
  });

  return parseWorkspacePayload(payload, input, provider);
}

export async function generateLaunchWorkspace(
  input: LaunchLensInput,
): Promise<GenerationResult> {
  const provider = configuredRealProvider();

  if (!provider) {
    return {
      workspace: buildMockWorkspace(input),
      mode: "demo",
      usedFallback: false,
    };
  }

  try {
    const workspace = await generateWithRealProvider(input, provider);

    return {
      workspace,
      mode: "real",
      usedFallback: false,
    };
  } catch (error) {
    const code =
      error instanceof ProviderError ? error.publicCode : "provider_failed";

    console.warn("[LaunchLens provider fallback]", { code });

    return {
      workspace: buildMockWorkspace(input),
      mode: "demo",
      usedFallback: true,
      fallbackReason: code,
    };
  }
}
