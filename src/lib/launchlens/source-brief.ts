import type { LaunchLensWorkspaceSourceBrief } from "./types";
import { normalizeExternalHttpUrl } from "./source-url";

export const RESEARCH_STUDIO_SOURCE = "launchlens-research-studio";

const MAX_SESSION_ID_CHARS = 200;
const MAX_REPORT_URL_CHARS = 2_048;
const MAX_EXPORTED_AT_CHARS = 40;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function trimmedString(value: unknown, maxChars: number) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  return text && text.length <= maxChars ? text : null;
}

function normalizedIsoTimestamp(value: unknown) {
  const text = trimmedString(value, MAX_EXPORTED_AT_CHARS);
  if (!text) {
    return null;
  }

  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function normalizedStoredScore(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function normalizedEnvelopeScore(value: unknown): number | null {
  return normalizedStoredScore(value) ?? null;
}

export function normalizeWorkspaceSourceBrief(
  value: unknown,
): LaunchLensWorkspaceSourceBrief | null {
  if (!isRecord(value) || value.source !== RESEARCH_STUDIO_SOURCE) {
    return null;
  }

  const sessionId = trimmedString(value.sessionId, MAX_SESSION_ID_CHARS);
  const exportedAt = normalizedIsoTimestamp(value.exportedAt);
  const opportunityScore = normalizedStoredScore(value.opportunityScore);
  const riskScore = normalizedStoredScore(value.riskScore);

  if (
    !sessionId ||
    !exportedAt ||
    opportunityScore === undefined ||
    riskScore === undefined
  ) {
    return null;
  }

  const sourceBrief: LaunchLensWorkspaceSourceBrief = {
    source: RESEARCH_STUDIO_SOURCE,
    sessionId,
    exportedAt,
    opportunityScore,
    riskScore,
  };

  if (value.reportUrl !== undefined && value.reportUrl !== null) {
    const candidateReportUrl = trimmedString(value.reportUrl, MAX_REPORT_URL_CHARS);
    if (!candidateReportUrl) {
      return null;
    }
    const reportUrl = normalizeExternalHttpUrl(candidateReportUrl);
    if (reportUrl) {
      sourceBrief.reportUrl = reportUrl;
    }
  }

  return sourceBrief;
}

export function sourceBriefFromResearchStudioEnvelope(
  envelope: Record<string, unknown>,
): LaunchLensWorkspaceSourceBrief | null {
  if (envelope.source !== RESEARCH_STUDIO_SOURCE) {
    return null;
  }

  const meta = isRecord(envelope.meta) ? envelope.meta : {};
  return normalizeWorkspaceSourceBrief({
    source: RESEARCH_STUDIO_SOURCE,
    sessionId: envelope.sessionId,
    reportUrl: envelope.reportUrl,
    exportedAt: envelope.exportedAt,
    opportunityScore: normalizedEnvelopeScore(meta.opportunityScore),
    riskScore: normalizedEnvelopeScore(meta.riskScore),
  });
}
