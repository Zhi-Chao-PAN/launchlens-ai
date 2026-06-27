import {
  RESEARCH_STUDIO_SOURCE,
  sourceBriefFromResearchStudioEnvelope,
} from "./source-brief";
import type { LaunchLensInput, LaunchLensWorkspaceSourceBrief } from "./types";
import { isRecord } from "./workspace-validation";

export type BriefImportSource =
  | "research-studio"
  | "launchlens"
  | "plain-input";

export type BriefImportResult = {
  input: LaunchLensInput;
  sourceBrief?: LaunchLensWorkspaceSourceBrief;
  warnings: string[];
  source: BriefImportSource;
};

export type BriefImportError = {
  code: "invalid_json" | "missing_input" | "too_large";
  message: string;
};

const MAX_IMPORT_SIZE = 512 * 1024; // 512 KB — mirrors workspace import
const MAX_FIELD_CHARS = 1_200; // launchlens-ai server gate (/api/generate)
const IDEA_MIN_CHARS = 12; // launchlens-ai server gate

/** Coerce an unknown value to a trimmed string, or "" if not a string. */
function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Clamp a field to the server limit, recording a warning when cut. */
function clampField(
  raw: unknown,
  name: keyof LaunchLensInput,
  warnings: string[],
): string {
  const text = asString(raw).trim();
  if (text.length <= MAX_FIELD_CHARS) return text;
  warnings.push(`${name} was truncated to ${MAX_FIELD_CHARS} characters.`);
  return text.slice(0, MAX_FIELD_CHARS);
}

/**
 * Parse a JSON string into a LaunchLens brief input.
 *
 * Accepts three shapes, in order of preference:
 *  1. Research Studio envelope: `{ schemaVersion, source, input: {…} }`
 *  2. Bare LaunchLensInput: `{ idea, audience, market, tone, constraints }`
 *  3. Legacy free-text: `{ launchlensBrief: "…" }` — the paragraph is placed
 *     into `idea` and a neutral audience/market/tone/constraints are filled in
 *     so the result still clears the server gate.
 *
 * Fields longer than 1200 chars are truncated (with a warning) rather than
 * rejected, matching how Research Studio clamps on export.
 */
export function briefFromJson(json: string): BriefImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    const err: BriefImportError = {
      code: "invalid_json",
      message: error instanceof Error ? error.message : "Invalid JSON",
    };
    throw err satisfies BriefImportError;
  }

  if (!isRecord(parsed)) {
    const err: BriefImportError = {
      code: "invalid_json",
      message: "Expected a JSON object, got " + typeof parsed,
    };
    throw err satisfies BriefImportError;
  }

  const warnings: string[] = [];

  // Shape 1: Research Studio envelope { source, input: {…} }
  if (isRecord(parsed.input) && typeof parsed.source === "string") {
    const inputRaw = parsed.input;
    const input = buildInput(inputRaw, warnings);
    if (!input) {
      throw missingInputError(parsed.source === "launchlens-research-studio");
    }
    const source: BriefImportSource =
      parsed.source === RESEARCH_STUDIO_SOURCE ? "research-studio" : "launchlens";
    const sourceBrief =
      source === "research-studio"
        ? sourceBriefFromResearchStudioEnvelope(parsed)
        : null;
    if (source === "research-studio" && !sourceBrief) {
      warnings.push(
        "Research Studio provenance was incomplete; the workspace backlink will be omitted.",
      );
    }
    if (typeof parsed.schemaVersion === "string") {
      // Informational only for now; no migrations needed at v1.0.0.
    }
    return sourceBrief
      ? { input, warnings, source, sourceBrief }
      : { input, warnings, source };
  }

  // Shape 2: bare LaunchLensInput
  if (hasAnyInputField(parsed)) {
    const input = buildInput(parsed, warnings);
    if (!input) {
      throw missingInputError(false);
    }
    return { input, warnings, source: "launchlens" };
  }

  // Shape 3: legacy free-text { launchlensBrief: "…" }
  if (typeof parsed.launchlensBrief === "string" && parsed.launchlensBrief.trim()) {
    const idea = clampField(parsed.launchlensBrief, "idea", warnings);
    warnings.push("Imported a legacy free-text brief — only the idea field is populated. Review the other fields before generating.");
    return {
      input: {
        idea,
        audience: "",
        market: "",
        tone: "",
        constraints: "",
      },
      warnings,
      source: "launchlens",
    };
  }

  throw missingInputError(false);
}

/** Parse a File (from <input type="file">) into a brief, enforcing a size cap. */
export async function briefFromFile(file: File): Promise<BriefImportResult> {
  if (file.size > MAX_IMPORT_SIZE) {
    const err: BriefImportError = {
      code: "too_large",
      message: `File is too large (${Math.round(file.size / 1024)} KB). Max is ${Math.round(MAX_IMPORT_SIZE / 1024)} KB.`,
    };
    throw err satisfies BriefImportError;
  }
  const text = await file.text();
  return briefFromJson(text);
}

function hasAnyInputField(value: Record<string, unknown>): boolean {
  return (
    "idea" in value ||
    "audience" in value ||
    "market" in value ||
    "tone" in value ||
    "constraints" in value
  );
}

/** Build + clamp a LaunchLensInput from a record. Returns null only when every
 *  field is empty (nothing to import). Idea must clear the 12-char gate after
 *  clamping or the result is rejected so generate() does not fail server-side. */
function buildInput(
  value: Record<string, unknown>,
  warnings: string[],
): LaunchLensInput | null {
  const idea = clampField(value.idea, "idea", warnings);
  const audience = clampField(value.audience, "audience", warnings);
  const market = clampField(value.market, "market", warnings);
  const tone = clampField(value.tone, "tone", warnings);
  const constraints = clampField(value.constraints, "constraints", warnings);

  if (!idea && !audience && !market && !tone && !constraints) {
    return null;
  }
  if (idea.length < IDEA_MIN_CHARS) {
    warnings.push(`idea is shorter than ${IDEA_MIN_CHARS} characters and may be rejected when generating.`);
  }
  return { idea, audience, market, tone, constraints };
}

function missingInputError(fromResearchStudio: boolean): BriefImportError {
  return {
    code: "missing_input",
    message: fromResearchStudio
      ? "Research Studio export does not contain a complete input object."
      : "JSON does not contain a recognizable LaunchLens brief.",
  };
}
