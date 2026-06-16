"use client";

import {
  Cloud,
  CloudOff,
  Copy,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Loader2,
  RefreshCw,
  Share2,
  Trash2,
  Unlink,
  UploadCloud,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { Skeleton } from "@/components/skeleton";
import { copyTextToClipboard } from "@/lib/launchlens/clipboard";
import { friendlyApiMessage } from "@/lib/launchlens/api-errors";

import type {
  CloudWorkspaceErrorResponse,
  CloudWorkspaceListResponse,
  CloudWorkspaceRecord,
  CloudWorkspaceResponse,
  CloudWorkspaceSummary,
} from "@/lib/launchlens/cloud-workspace";
import { MAX_CLOUD_WORKSPACES } from "@/lib/launchlens/cloud-workspace";
import type { WorkspaceExecutionState } from "@/lib/launchlens/execution";
import {
  createRecoveryKey,
  deriveRecoveryOwnerToken,
} from "@/lib/launchlens/recovery";
import type {
  LaunchLensInput,
  LaunchLensWorkspace,
} from "@/lib/launchlens/types";

const OWNER_TOKEN_KEY = "launchlens.ownerToken.v1";
const RECOVERY_LABEL_KEY = "launchlens.recoveryLabel.v1";
const OWNER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

type CloudWorkspacesProps = {
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
  execution: WorkspaceExecutionState;
  onRestore: (record: CloudWorkspaceRecord) => void;
};

type CloudState = "checking" | "ready" | "unavailable" | "error";

function createOwnerToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function formatSnapshotTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CloudWorkspaces({
  input,
  workspace,
  execution,
  onRestore,
}: CloudWorkspacesProps) {
  const [ownerToken, setOwnerToken] = useState("");
  const [cloudState, setCloudState] = useState<CloudState>("checking");
  const [cloudError, setCloudError] = useState<{ code: string; message: string } | null>(null);
  const [workspaces, setWorkspaces] = useState<CloudWorkspaceSummary[]>([]);
  const [busyAction, setBusyAction] = useState("");
  const [recoveryLabel, setRecoveryLabel] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [listRenderKey, setListRenderKey] = useState(0);
  const [recoveryTouched, setRecoveryTouched] = useState(false);
  const { showToast } = useToast();

  const trimmedLabel = recoveryLabel.trim();
  const trimmedKey = recoveryKey.trim();
  const labelError =
    !trimmedLabel
      ? "Enter the handle you used when you first saved the key."
      : trimmedLabel.length > 160
        ? "Handle is too long (max 160 characters)."
        : "";
  const keyError = !recoveryKey
    ? "Enter or generate your recovery key."
    : !/^[A-Za-z0-9_-]{24,128}$/.test(trimmedKey)
      ? "Key does not look like a valid LaunchLens recovery key."
      : "";
  const recoveryReady = !labelError && !keyError && trimmedLabel && trimmedKey;

  async function cloudRequest<T>(path: string, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    headers.set("x-launchlens-owner", ownerToken);

    if (init?.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers,
    });
    const body = response.status === 204 ? null : await response.json();

    if (!response.ok) {
      const error = body as CloudWorkspaceErrorResponse | null;
      throw new Error(error?.code || "cloud_request_failed");
    }

    return body as T;
  }

  async function refresh(nextToken = ownerToken) {
    if (!nextToken) {
      return;
    }

    setBusyAction("refresh");

    try {
      const response = await fetch("/api/workspaces", {
        cache: "no-store",
        headers: { "x-launchlens-owner": nextToken },
      });
      const body = (await response.json()) as
        | CloudWorkspaceListResponse
        | CloudWorkspaceErrorResponse;

      if (!response.ok) {
        if ("code" in body && body.code === "cloud_unavailable") {
          setCloudState("unavailable");
          setWorkspaces([]);
          return;
        }

        const code = "code" in body ? body.code : "cloud_request_failed";
        setCloudError({ code, message: friendlyApiMessage(code, "Cloud history could not be reached.") });
        throw new Error(code || "cloud_request_failed");
      }

      if (!("workspaces" in body)) {
        setCloudError({ code: "cloud_request_failed", message: "Cloud history returned an unexpected response." });
        throw new Error("cloud_request_failed");
      }

      if (!body.configured) {
        setCloudState("unavailable");
        setWorkspaces([]);
        return;
      }

      setWorkspaces(body.workspaces);
      setCloudState("ready");
      setListRenderKey((k) => k + 1);
    } catch (error) {
      setCloudState("error");
      if (!cloudError) {
        const code = error instanceof Error ? error.message : "";
        setCloudError({ code, message: friendlyApiMessage(code, "Cloud history could not be reached. Your local draft remains available.") });
      }
    } finally {
      setBusyAction("");
    }
  }

  useEffect(() => {
    let cancelled = false;

    window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      try {
        const storedToken = localStorage.getItem(OWNER_TOKEN_KEY) ?? "";
        const token = OWNER_TOKEN_PATTERN.test(storedToken)
          ? storedToken
          : createOwnerToken();
        localStorage.setItem(OWNER_TOKEN_KEY, token);
        setRecoveryLabel(localStorage.getItem(RECOVERY_LABEL_KEY) ?? "");
        setOwnerToken(token);
        void refresh(token);
      } catch {
        setCloudState("error");
      }
    }, 0);

    return () => {
      cancelled = true;
    };
    // refresh intentionally runs after the stable browser token is created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSnapshot() {
    setBusyAction("save");
    try {
      await cloudRequest<CloudWorkspaceResponse>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({
          title: workspace.landingPage.headline,
          input,
          workspace,
          execution,
        }),
      });
      showToast("Cloud snapshot saved.", "success");
      setListRenderKey((k) => k + 1);
      await refresh();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const defaultMsg =
        code === "quota_exceeded" || code === "workspace_limit_reached"
          ? "Cloud history is full. Delete a snapshot before saving."
          : "Cloud save failed. Your local draft is still safe.";
      showToast(friendlyApiMessage(code, defaultMsg), "error");
    } finally {
      setBusyAction("");
    }
  }

  async function restoreSnapshot(id: string) {
    setBusyAction(`restore:${id}`);
    try {
      const response = await cloudRequest<CloudWorkspaceResponse>(
        `/api/workspaces/${id}`,
      );
      onRestore(response.workspace);
      showToast("Cloud snapshot restored to the editor.", "success");
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      showToast(
        friendlyApiMessage(code, "Could not restore that cloud snapshot."),
        "error",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function toggleShare(item: CloudWorkspaceSummary) {
    if (
      !item.isPublic &&
      !window.confirm(
        "Enable a public read-only link? Validation decisions and evidence counts will be visible, while evidence notes, sources, and the founder brief stay private.",
      )
    ) {
      return;
    }

    setBusyAction(`share:${item.id}`);
    try {
      await cloudRequest<CloudWorkspaceResponse>(
        `/api/workspaces/${item.id}/share`,
        {
          method: "POST",
          body: JSON.stringify({ enabled: !item.isPublic }),
        },
      );

      if (!item.isPublic) {
        const shareUrl = `${window.location.origin}/share/${item.id}`;

        const copied = await copyTextToClipboard(shareUrl);
        if (copied) {
          showToast("Read-only share link copied to clipboard.", "success");
        } else {
          showToast(`Share link ready: ${shareUrl}`, "info");
        }
      } else {
        showToast("Public sharing disabled.", "info");
      }

      await refresh();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      showToast(
        friendlyApiMessage(code, "Could not update sharing settings."),
        "error",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function copyShareLink(item: CloudWorkspaceSummary) {
    const shareUrl = `${window.location.origin}/share/${item.id}`;

    const copied = await copyTextToClipboard(shareUrl);
    if (copied) {
      showToast("Read-only share link copied to clipboard.", "success");
    } else {
      showToast(`Share link ready: ${shareUrl}`, "info");
    }
  }

  async function deleteSnapshot(item: CloudWorkspaceSummary) {
    if (!window.confirm(`Delete "${item.title}" from cloud history?`)) {
      return;
    }

    setBusyAction(`delete:${item.id}`);
    try {
      await cloudRequest<null>(`/api/workspaces/${item.id}`, {
        method: "DELETE",
      });
      showToast("Cloud snapshot deleted.", "success");
      await refresh();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      showToast(
        friendlyApiMessage(code, "Could not delete cloud snapshot."),
        "error",
      );
    } finally {
      setBusyAction("");
    }
  }

  function generateRecoveryKey() {
    setRecoveryKey(createRecoveryKey());
    setShowRecoveryKey(true);
    showToast("Recovery key generated - keep it somewhere private!", "success");
  }

  async function copyRecoveryKey() {
    const copied = await copyTextToClipboard(recoveryKey);
    if (copied) {
      showToast("Recovery key copied. Store it safely!", "success");
    } else {
      showToast("Copy failed - please select and save the key manually.", "error");
    }
  }

  async function linkRecoveryOwner() {
    if (!recoveryReady) {
      setRecoveryTouched(true);
      return;
    }
    setBusyAction("recovery");
    try {
      const recoveryOwnerToken = await deriveRecoveryOwnerToken(
        trimmedLabel,
        trimmedKey,
      );
      await cloudRequest<{ migrated: number }>("/api/workspaces/recovery", {
        method: "POST",
        body: JSON.stringify({ recoveryOwnerToken }),
      });

      localStorage.setItem(OWNER_TOKEN_KEY, recoveryOwnerToken);
      localStorage.setItem(RECOVERY_LABEL_KEY, trimmedLabel);
      setOwnerToken(recoveryOwnerToken);
      setRecoveryTouched(false);
      showToast("Cloud history linked to your recovery key.", "success");
      await refresh(recoveryOwnerToken);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      if (message === "invalid_recovery_input") {
        setRecoveryTouched(true);
        showToast("Recovery details don't look right - double-check handle and key.", "error");
      } else {
        showToast("Recovery failed - check your handle and recovery key.", "error");
      }
    } finally {
      setBusyAction("");
    }
  }

  async function recoverOwner() {
    if (!recoveryReady) {
      setRecoveryTouched(true);
      return;
    }
    setBusyAction("recovery");
    try {
      const recoveryOwnerToken = await deriveRecoveryOwnerToken(
        trimmedLabel,
        trimmedKey,
      );

      localStorage.setItem(OWNER_TOKEN_KEY, recoveryOwnerToken);
      localStorage.setItem(RECOVERY_LABEL_KEY, trimmedLabel);
      setOwnerToken(recoveryOwnerToken);
      setRecoveryTouched(false);
      showToast("Recovery key loaded - cloud history restored.", "success");
      await refresh(recoveryOwnerToken);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      if (message === "invalid_recovery_input") {
        setRecoveryTouched(true);
        showToast("Recovery details don't look right - double-check handle and key.", "error");
      } else {
        showToast("Recovery failed - check your handle and recovery key.", "error");
      }
    } finally {
      setBusyAction("");
    }
  }

  const isBusy = Boolean(busyAction);
  const ownerScope = ownerToken.startsWith("acct_")
    ? "Recovery-linked"
    : "This browser";

  return (
    <section className="rounded-lg border border-card bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-signal-supports text-signal-supports">
            {cloudState === "unavailable" ? (
              <CloudOff className="size-4" aria-hidden="true" />
            ) : (
              <Cloud className="size-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Cloud history
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {cloudState === "ready"
                ? `${ownerScope}, ${workspaces.length} of ${MAX_CLOUD_WORKSPACES} snapshots`
                : cloudState === "unavailable"
                  ? "Local-only mode"
                  : cloudState === "checking"
                    ? "Checking availability"
                    : "Cloud status unavailable"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={!ownerToken || isBusy}
            title="Refresh cloud history"
            aria-label="Refresh cloud history"
            className="flex size-10 items-center justify-center rounded-md border border-input bg-input text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${busyAction === "refresh" ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={saveSnapshot}
            disabled={cloudState !== "ready" || isBusy}
            className="flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cbe8df] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#89938f]"
          >
            {busyAction === "save" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UploadCloud className="size-4" aria-hidden="true" />
            )}
            Save snapshot
          </button>
        </div>
      </div>

      {cloudState === "unavailable" && (
        <p className="mt-4 rounded-md border border-card bg-input p-3 text-sm leading-6 text-foreground/80">
          Cloud history is not configured on this deployment. Local autosave,
          editing, generation, and export remain available.
        </p>
      )}

      {cloudState === "error" && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-[#e7c9bd] bg-[#fff6f1] p-3 text-sm leading-6 text-[#8b3d28]"
        >
          <p>{cloudError?.message || "Cloud history could not be reached. Your local draft remains available."}</p>
          {cloudError?.code && (
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#e7c9bd] pt-2 text-xs">
              <code className="rounded bg-[#ffe5d7] px-1.5 py-0.5 font-mono text-[#8b3d28]">{cloudError.code}</code>
              <button
                type="button"
                onClick={() => {
                  copyTextToClipboard(cloudError.code);
                  showToast("Error code copied to clipboard.", "success");
                }}
                className="rounded border border-[#e7c9bd] bg-card px-2 py-1 font-medium transition hover:bg-[#fff6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d85b3f] focus-visible:ring-offset-1"
              >
                Copy code
              </button>
            </div>
          )}
        </div>
      )}

      {cloudState === "checking" ? (
        <div className="mt-4 space-y-2" aria-busy="true" aria-label="Checking cloud history">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md border border-card bg-card p-3"
            >
              <Skeleton shimmer rounded="md" className="size-8 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton shimmer className="h-3 w-2/3" />
                <Skeleton shimmer className="h-3 w-1/3" />
              </div>
              <Skeleton shimmer rounded="md" className="h-8 w-20 shrink-0" />
            </div>
          ))}
        </div>
      ) : null}

      {cloudState === "ready" && workspaces.length === 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-dashed border-input bg-input p-4">
          <History className="size-5 text-accent" aria-hidden="true" />
          <p className="text-sm text-foreground/80">
            No cloud snapshots yet. Save the current workspace when it reaches
            a useful decision point.
          </p>
        </div>
      )}

      {cloudState === "ready" && (
        <div className="mt-4 rounded-md border border-card bg-input p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-foreground/80">
              <KeyRound className="size-4" aria-hidden="true" />
            </span>
            <form
              className="min-w-0 flex-1"
              onSubmit={(event) => event.preventDefault()}
            >
              <h3 className="text-sm font-semibold text-foreground">
                Account recovery
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted">
                Save this key privately. Possession grants access to cloud
                history. Use <strong>Link history</strong> on the device that created the account and <strong>Recover</strong> on a new device.
              </p>
              <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-semibold uppercase text-muted">
                    Handle
                  </span>
                  <input
                    value={recoveryLabel}
                    onChange={(event) => { setRecoveryLabel(event.target.value); }}
                    onBlur={() => setRecoveryTouched(true)}
                    placeholder="founder@example.com"
                    aria-invalid={recoveryTouched && !!labelError}
                    aria-describedby={recoveryTouched && labelError ? "recovery-label-error" : undefined}
                    className={`h-10 w-full rounded-md border bg-card px-3 text-sm text-foreground outline-none ${
                      recoveryTouched && labelError
                        ? "border-[#d85b3f] focus:border-[#d85b3f] focus:ring-2 focus:ring-[#f2d4c8]"
                        : "border-input focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                    }`}
                  />
                  {recoveryTouched && labelError && (
                    <p id="recovery-label-error" role="alert" className="mt-1 text-[11px] leading-4 text-error">{labelError}</p>
                  )}
                </label>
                <div className="min-w-0">
                  <span className="mb-1 block text-xs font-semibold uppercase text-muted">
                    Recovery key
                  </span>
                  <div className="flex min-w-0 gap-1">
                    <input
                      aria-label="Recovery key"
                      type={showRecoveryKey ? "text" : "password"}
                      autoComplete="off"
                      spellCheck={false}
                      value={recoveryKey}
                      onChange={(event) => { setRecoveryKey(event.target.value); }}
                      onBlur={() => setRecoveryTouched(true)}
                      aria-invalid={recoveryTouched && !!keyError}
                      aria-describedby={recoveryTouched && keyError ? "recovery-key-error" : undefined}
                      className={`h-10 min-w-0 flex-1 rounded-md border bg-card px-3 font-mono text-sm text-foreground outline-none ${
                        recoveryTouched && keyError
                          ? "border-[#d85b3f] focus:border-[#d85b3f] focus:ring-2 focus:ring-[#f2d4c8]"
                          : "border-input focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryKey((value) => !value)}
                      title={
                        showRecoveryKey
                          ? "Hide recovery key"
                          : "Show recovery key"
                      }
                      aria-label={
                        showRecoveryKey
                          ? "Hide recovery key"
                          : "Show recovery key"
                      }
                      className="flex size-10 shrink-0 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
                    >
                      {showRecoveryKey ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={copyRecoveryKey}
                      disabled={!recoveryKey}
                      title="Copy recovery key"
                      aria-label="Copy recovery key"
                      className="flex size-10 shrink-0 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1 disabled:opacity-50"
                    >
                      <Copy className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
              {recoveryTouched && keyError && (
                <p id="recovery-key-error" role="alert" className="mt-2 text-[11px] leading-4 text-error">{keyError}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={generateRecoveryKey}
                  disabled={isBusy}
                  className="flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1 disabled:opacity-50"
                >
                  <KeyRound className="size-4" aria-hidden="true" />
                  Generate key
                </button>
                <button
                  type="button"
                  onClick={linkRecoveryOwner}
                  disabled={isBusy || (recoveryTouched ? !recoveryReady : (!recoveryLabel || !recoveryKey))}
                  aria-disabled={isBusy || (recoveryTouched ? !recoveryReady : (!recoveryLabel || !recoveryKey))}
                  className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cbe8df] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#89938f]"
                >
                  Link history
                </button>
                <button
                  type="button"
                  onClick={recoverOwner}
                  disabled={isBusy || (recoveryTouched ? !recoveryReady : (!recoveryLabel || !recoveryKey))}
                  aria-disabled={isBusy || (recoveryTouched ? !recoveryReady : (!recoveryLabel || !recoveryKey))}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1 disabled:opacity-50"
                >
                  Recover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {workspaces.length > 0 && (
        <div className="mt-4 grid gap-2">
          {workspaces.map((item, index) => (
            <article
              key={`${listRenderKey}-${item.id}`}
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              className="flex flex-col gap-3 rounded-md border border-card bg-input p-3 opacity-0 motion-safe:animate-[launchlens-fade-in-up_260ms_ease-out_both] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  {item.isPublic && (
                    <span className="shrink-0 rounded-md bg-signal-neutral px-2 py-1 text-xs font-semibold text-signal-neutral">
                      Shared
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Saved {formatSnapshotTime(item.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => restoreSnapshot(item.id)}
                  disabled={isBusy}
                  title="Restore snapshot"
                  aria-label={`Restore ${item.title}`}
                  className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1 disabled:opacity-50"
                >
                  {busyAction === `restore:${item.id}` ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <History className="size-4" aria-hidden="true" />
                  )}
                </button>
                {item.isPublic && (
                  <button
                    type="button"
                    onClick={() => copyShareLink(item)}
                    disabled={isBusy}
                    title="Copy share link"
                    aria-label={`Copy share link for ${item.title}`}
                    className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1 disabled:opacity-50"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleShare(item)}
                  disabled={isBusy}
                  title={item.isPublic ? "Disable sharing" : "Enable sharing"}
                  aria-label={
                    item.isPublic
                      ? `Disable sharing for ${item.title}`
                      : `Share ${item.title}`
                  }
                  className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1 disabled:opacity-50"
                >
                  {item.isPublic ? (
                    <Unlink className="size-4" aria-hidden="true" />
                  ) : (
                    <Share2 className="size-4" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSnapshot(item)}
                  disabled={isBusy}
                  title="Delete snapshot"
                  aria-label={`Delete ${item.title}`}
                  className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-[#8b3d28] transition hover:border-[#c86b50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d85b3f] focus-visible:ring-offset-1 disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

    </section>
  );
}
