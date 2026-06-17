import type { LaunchLensWorkspace } from "./types";
import type { WorkspaceExecutionState } from "./execution";

export type WorkspaceImportResult = {
  workspace: LaunchLensWorkspace;
  execution?: WorkspaceExecutionState;
  warnings: string[];
};

export type ImportError = {
  code: "invalid_json" | "missing_workspace" | "schema_mismatch" | "too_large";
  message: string;
};

const MAX_IMPORT_SIZE = 512 * 1024; // 512 KB
const REQUIRED_WORKSPACE_FIELDS = [
  "summary",
  "targetUsers",
  "pains",
  "backlog",
  "landingPage",
  "assumptions",
] as const;

/**
 * Parse and validate a JSON string into a workspace (plus optional execution state).
 * Returns a structured result with warnings for optional fields that are missing.
 */
export function workspaceFromJson(json: string): WorkspaceImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    const err: ImportError = {
      code: "invalid_json",
      message: error instanceof Error ? error.message : "Invalid JSON",
    };
    throw err satisfies ImportError;
  }

  if (typeof parsed !== "object" || parsed === null) {
    const err: ImportError = {
      code: "invalid_json",
      message: "Expected a JSON object, got " + typeof parsed,
    };
    throw err satisfies ImportError;
  }

  const raw = parsed as Record<string, unknown>;
  const warnings: string[] = [];

  // Detect shape: could be { workspace, execution } or just workspace directly
  let workspaceRaw: Record<string, unknown>;
  let executionRaw: WorkspaceExecutionState | undefined;

  if ("workspace" in raw && typeof raw.workspace === "object" && raw.workspace !== null) {
    workspaceRaw = raw.workspace as Record<string, unknown>;
    if ("execution" in raw && raw.execution !== null && typeof raw.execution === "object") {
      executionRaw = raw.execution as WorkspaceExecutionState;
    }
  } else if ("summary" in raw || "targetUsers" in raw || "assumptions" in raw) {
    workspaceRaw = raw;
  } else {
    const err: ImportError = {
      code: "missing_workspace",
      message: "JSON does not contain a LaunchLens workspace.",
    };
    throw err satisfies ImportError;
  }

  // Validate required fields
  for (const field of REQUIRED_WORKSPACE_FIELDS) {
    if (!(field in workspaceRaw) || workspaceRaw[field] === undefined) {
      const err: ImportError = {
        code: "schema_mismatch",
        message: `Missing required workspace field: ${field}`,
      };
      throw err satisfies ImportError;
    }
  }

  // Type coercion for array fields
  const workspace = workspaceRaw as unknown as LaunchLensWorkspace;

  // Warn about non-fatal missing optional fields
  if (!workspace.generatedAt) {
    workspace.generatedAt = new Date().toISOString();
    warnings.push("Missing generatedAt â€?set to current time.");
  }
  if (!workspace.provider) {
    workspace.provider = "mock";
    warnings.push("Missing provider â€?set to 'mock'.");
  }
  if (!Array.isArray(workspace.mvpScope)) {
    warnings.push("mvpScope is not an array â€?may be incomplete.");
  }
  if (!workspace.landingPage?.headline) {
    warnings.push("landingPage.headline is missing.");
  }

  return {
    workspace,
    execution: executionRaw,
    warnings,
  };
}

/**
 * Validate a File object (from <input type="file">) before import.
 * Checks size and returns the parsed result.
 */
export async function importWorkspaceFromFile(file: File): Promise<WorkspaceImportResult> {
  if (file.size > MAX_IMPORT_SIZE) {
    const err: ImportError = {
      code: "too_large",
      message: `File is too large (${Math.round(file.size / 1024)} KB). Max is ${Math.round(MAX_IMPORT_SIZE / 1024)} KB.`,
    };
    throw err satisfies ImportError;
  }

  const text = await file.text();
  return workspaceFromJson(text);
}


export function safeJsonFilename(workspace: {
  projectName?: string | null;
  landingPage?: { headline?: string | null };
}) {
  const raw =
    workspace.projectName || workspace.landingPage?.headline || "launchlens-workspace";
  const base = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "launchlens-workspace"}.json`;
}
export function workspaceToJson(
  workspace: LaunchLensWorkspace,
  execution?: WorkspaceExecutionState,
) {
  return `${JSON.stringify(
    execution ? { workspace, execution } : workspace,
    null,
    2,
  )}\n`;
}
