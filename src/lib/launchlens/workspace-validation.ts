import type { LaunchLensInput, LaunchLensWorkspace } from "./types";

const PROVIDERS = new Set(["mock", "openai", "minimax"]);
const PRIORITIES = new Set(["P0", "P1", "P2"]);
const MAX_INPUT_FIELD_CHARS = 1_200;
const MAX_SUMMARY_CHARS = 6_000;
const MAX_TEXT_CHARS = 2_000;
const MAX_SHORT_TEXT_CHARS = 500;
const MAX_LIST_ITEMS = 24;
const MAX_BACKLOG_ITEMS = 30;
const MAX_CONTENT_ITEMS = 30;
const MAX_TASKS = 40;
const MAX_NORMALIZED_SNAPSHOT_CHARS = 120_000;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedString(value: unknown, maxChars: number) {
  return typeof value === "string" && value.length <= maxChars ? value : null;
}

function normalizedStringArray(
  value: unknown,
  maxItems = MAX_LIST_ITEMS,
  maxChars = MAX_TEXT_CHARS,
) {
  if (!Array.isArray(value) || value.length > maxItems) {
    return null;
  }

  const items = value.map((item) => normalizedString(item, maxChars));
  return items.every((item): item is string => item !== null) ? items : null;
}

function normalizedGeneratedAt(value: unknown) {
  if (typeof value !== "string" || value.length > 40) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function normalizeInput(value: unknown): LaunchLensInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const idea = normalizedString(value.idea, MAX_INPUT_FIELD_CHARS);
  const audience = normalizedString(value.audience, MAX_INPUT_FIELD_CHARS);
  const market = normalizedString(value.market, MAX_INPUT_FIELD_CHARS);
  const tone = normalizedString(value.tone, MAX_INPUT_FIELD_CHARS);
  const constraints = normalizedString(value.constraints, MAX_INPUT_FIELD_CHARS);

  if (
    idea === null ||
    audience === null ||
    market === null ||
    tone === null ||
    constraints === null
  ) {
    return null;
  }

  return { idea, audience, market, tone, constraints };
}

function normalizeWorkspace(value: unknown): LaunchLensWorkspace | null {
  if (!isRecord(value) || !PROVIDERS.has(String(value.provider))) {
    return null;
  }

  const generatedAt = normalizedGeneratedAt(value.generatedAt);
  const summary = normalizedString(value.summary, MAX_SUMMARY_CHARS);
  const targetUsers = normalizedStringArray(value.targetUsers);
  const pains = normalizedStringArray(value.pains);
  const mvpScope = normalizedStringArray(value.mvpScope);
  const launchPlan = normalizedStringArray(value.launchPlan);
  const assumptions = normalizedStringArray(value.assumptions);

  if (
    !generatedAt ||
    summary === null ||
    !targetUsers ||
    !pains ||
    !mvpScope ||
    !launchPlan ||
    !assumptions ||
    !Array.isArray(value.backlog) ||
    value.backlog.length > MAX_BACKLOG_ITEMS ||
    !isRecord(value.landingPage) ||
    !isRecord(value.pricing) ||
    !Array.isArray(value.contentCalendar) ||
    value.contentCalendar.length > MAX_CONTENT_ITEMS ||
    !Array.isArray(value.tasks) ||
    value.tasks.length > MAX_TASKS
  ) {
    return null;
  }

  const backlog = value.backlog.map((item) => {
    if (!isRecord(item) || !PRIORITIES.has(String(item.priority))) {
      return null;
    }

    const feature = normalizedString(item.feature, MAX_SHORT_TEXT_CHARS);
    const why = normalizedString(item.why, MAX_TEXT_CHARS);

    return feature !== null && why !== null
      ? {
          feature,
          why,
          priority: item.priority as "P0" | "P1" | "P2",
        }
      : null;
  });
  const headline = normalizedString(
    value.landingPage.headline,
    MAX_SHORT_TEXT_CHARS,
  );
  const subheadline = normalizedString(
    value.landingPage.subheadline,
    MAX_TEXT_CHARS,
  );
  const cta = normalizedString(value.landingPage.cta, MAX_SHORT_TEXT_CHARS);
  const proofBullets = normalizedStringArray(value.landingPage.proofBullets);
  const hypothesis = normalizedString(value.pricing.hypothesis, MAX_TEXT_CHARS);
  const tiers = normalizedStringArray(value.pricing.tiers);
  const risks = normalizedStringArray(value.pricing.risks);
  const contentCalendar = value.contentCalendar.map((item) => {
    if (!isRecord(item)) {
      return null;
    }

    const channel = normalizedString(item.channel, MAX_SHORT_TEXT_CHARS);
    const angle = normalizedString(item.angle, MAX_TEXT_CHARS);
    const cadence = normalizedString(item.cadence, MAX_SHORT_TEXT_CHARS);

    return channel !== null && angle !== null && cadence !== null
      ? { channel, angle, cadence }
      : null;
  });
  const tasks = value.tasks.map((item) => {
    if (!isRecord(item)) {
      return null;
    }

    const title = normalizedString(item.title, MAX_SHORT_TEXT_CHARS);
    const owner = normalizedString(item.owner, MAX_SHORT_TEXT_CHARS);
    const due = normalizedString(item.due, MAX_SHORT_TEXT_CHARS);
    const outcome = normalizedString(item.outcome, MAX_TEXT_CHARS);

    return title !== null &&
      owner !== null &&
      due !== null &&
      outcome !== null
      ? { title, owner, due, outcome }
      : null;
  });

  if (
    backlog.some((item) => item === null) ||
    headline === null ||
    subheadline === null ||
    cta === null ||
    !proofBullets ||
    hypothesis === null ||
    !tiers ||
    !risks ||
    contentCalendar.some((item) => item === null) ||
    tasks.some((item) => item === null)
  ) {
    return null;
  }

  return {
    provider: value.provider as LaunchLensWorkspace["provider"],
    generatedAt,
    summary,
    targetUsers,
    pains,
    mvpScope,
    backlog: backlog as LaunchLensWorkspace["backlog"],
    landingPage: { headline, subheadline, cta, proofBullets },
    pricing: { hypothesis, tiers, risks },
    launchPlan,
    contentCalendar: contentCalendar as LaunchLensWorkspace["contentCalendar"],
    tasks: tasks as LaunchLensWorkspace["tasks"],
    assumptions,
  };
}

export function isLaunchLensInput(value: unknown): value is LaunchLensInput {
  return normalizeInput(value) !== null;
}

export function isLaunchLensWorkspace(
  value: unknown,
): value is LaunchLensWorkspace {
  return normalizeWorkspace(value) !== null;
}

export type WorkspaceSnapshotPayload = {
  title: string;
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
};

export function parseWorkspaceSnapshot(
  value: unknown,
): WorkspaceSnapshotPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  const input = normalizeInput(value.input);
  const workspace = normalizeWorkspace(value.workspace);

  if (!input || !workspace) {
    return null;
  }

  const requestedTitle = normalizedString(value.title, 120)?.trim() ?? "";
  const payload = {
    title:
      requestedTitle ||
      workspace.landingPage.headline.trim() ||
      "Untitled workspace",
    input,
    workspace,
  };

  return JSON.stringify(payload).length <= MAX_NORMALIZED_SNAPSHOT_CHARS
    ? payload
    : null;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
