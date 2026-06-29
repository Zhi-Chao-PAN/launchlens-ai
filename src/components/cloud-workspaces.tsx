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
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useToast } from "@/components/toast";
import { Skeleton } from "@/components/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { copyTextToClipboard } from "@/lib/launchlens/clipboard";
import { friendlyApiMessage } from "@/lib/launchlens/api-errors";

import type {
  CloudWorkspaceErrorResponse,
  CloudWorkspaceListResponse,
  CloudWorkspaceRecord,
  CloudWorkspaceResponse,
  CloudWorkspaceSummary,
} from "@/lib/launchlens/cloud-workspace";
import { formatSnapshotTime } from "@/lib/launchlens/snapshot-time";
import { shareExpirySuffix } from "@/lib/launchlens/share-expiry-suffix";
import { cloudRowExpiry } from "@/lib/launchlens/cloud-row-expiry";
import { validateRecoveryInput } from "@/lib/launchlens/recovery-input";
import { ownerScopeLabel } from "@/lib/launchlens/owner-scope";
import { futureIso } from "@/lib/launchlens/future-iso";
import { stage2HeadersFromCurrentUrl } from "@/lib/launchlens/stage2-context";
import {
  getOrCreateOwnerToken,
  OWNER_TOKEN_STORAGE_KEY,
} from "@/lib/launchlens/owner-token";
import type { WorkspaceExecutionState } from "@/lib/launchlens/execution";
import {
  createRecoveryKey,
  deriveRecoveryOwnerToken,
} from "@/lib/launchlens/recovery";
import type {
  LaunchLensInput,
  LaunchLensWorkspace,
} from "@/lib/launchlens/types";

const RECOVERY_LABEL_KEY = "launchlens.recoveryLabel.v1";

type CloudWorkspacesProps = {
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
  execution: WorkspaceExecutionState;
  onRestore: (record: CloudWorkspaceRecord) => void;
};

type CloudState = "checking" | "ready" | "unavailable" | "error";

type ConfirmKind = "share-enable" | "snapshot-delete";
type ShareExpiry = "permanent" | "days7" | "days30";
type PendingConfirm = {
  kind: ConfirmKind;
  item: CloudWorkspaceSummary;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  shareExpiry?: ShareExpiry;
};

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
  const [cloudSnapshotLimit, setCloudSnapshotLimit] = useState(0);
  const [busyAction, setBusyAction] = useState("");
  const [recoveryLabel, setRecoveryLabel] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [listRenderKey, setListRenderKey] = useState(0);
  const [recoveryTouched, setRecoveryTouched] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [shareExpiry, setShareExpiry] = useState<ShareExpiry>("permanent");
  const { showToast } = useToast();
  const { t } = useLocale();

  const {
    trimmedLabel,
    trimmedKey,
    labelError,
    keyError,
    ready: recoveryReady,
  } = validateRecoveryInput({ label: recoveryLabel, key: recoveryKey });

  async function cloudRequest<T>(path: string, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    headers.set("x-launchlens-owner", ownerToken);
    for (const [key, value] of Object.entries(stage2HeadersFromCurrentUrl())) {
      headers.set(key, value);
    }

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
          setCloudSnapshotLimit(0);
          return;
        }

        const code = "code" in body ? body.code : "cloud_request_failed";
        setCloudError({ code, message: friendlyApiMessage(code, t("toast.cloudUnreachable")) });
        throw new Error(code || "cloud_request_failed");
      }

      if (!("workspaces" in body)) {
        setCloudError({ code: "cloud_request_failed", message: t("toast.cloudUnexpected") });
        throw new Error("cloud_request_failed");
      }

      if (!body.configured) {
        setCloudState("unavailable");
        setWorkspaces([]);
        setCloudSnapshotLimit(0);
        return;
      }

      setWorkspaces(body.workspaces);
      setCloudSnapshotLimit(body.cloudSnapshotLimit);
      setCloudState("ready");
      setListRenderKey((k) => k + 1);
    } catch (error) {
      setCloudState("error");
      if (!cloudError) {
        const code = error instanceof Error ? error.message : "";
        setCloudError({ code, message: friendlyApiMessage(code, t("cloud.errorFallback")) });
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
        const token = getOrCreateOwnerToken(
          localStorage,
          OWNER_TOKEN_STORAGE_KEY,
        );
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
      const saved = await cloudRequest<CloudWorkspaceResponse>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({
          title: workspace.landingPage.headline,
          input,
          workspace,
          execution,
        }),
      });
      const newId = saved.workspace.id;
      const nowIso = new Date().toISOString();
      showToast(t("toast.cloudSaved"), "success", 5000, {
        label: t("share.enable"),
        onClick: () => toggleShare({
          id: newId,
          isPublic: false,
          expiresAt: saved.workspace.expiresAt ?? null,
          title: saved.workspace.title ?? "Workspace",
          createdAt: saved.workspace.createdAt ?? nowIso,
          updatedAt: saved.workspace.updatedAt ?? nowIso,
        }),
      });
      setListRenderKey((k) => k + 1);
      await refresh();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const defaultMsg =
        code === "quota_exceeded" || code === "workspace_limit_reached"
          ? t("toast.cloudFull")
          : t("toast.cloudSaveFailed");
      showToast(friendlyApiMessage(code, defaultMsg), "error");
    } finally {
      setBusyAction("");
    }
  }

  const previousSnapshotForUndo = useRef<Pick<CloudWorkspaceRecord, "input" | "workspace" | "execution"> | null>(null);

  async function restoreSnapshot(id: string) {
    setBusyAction(`restore:${id}`);
    try {
      const response = await cloudRequest<CloudWorkspaceResponse>(
        `/api/workspaces/${id}`,
      );
      previousSnapshotForUndo.current = { input, workspace, execution };
      onRestore(response.workspace);
      showToast(t("toast.cloudRestoredEditor"), "success", 7000, { label: t("toast.undo"), onClick: () => { const prev = previousSnapshotForUndo.current; if (prev) { previousSnapshotForUndo.current = null; onRestore(prev as CloudWorkspaceRecord); showToast(t("toast.restoreUndone"), "success"); } } });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      showToast(
        friendlyApiMessage(code, t("toast.restoreFailed")),
        "error",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function toggleShare(item: CloudWorkspaceSummary, confirmed = false) {
    if (!item.isPublic && !confirmed) {
      setShareExpiry("permanent");
      setPendingConfirm({
        kind: "share-enable",
        item,
        title: t("share.enableTitle"),
        body: t("share.enableBody"),
        confirmLabel: t("share.enableConfirm"),
      });
      return;
    }

    setBusyAction(`share:${item.id}`);
    try {
      await cloudRequest<CloudWorkspaceResponse>(
        `/api/workspaces/${item.id}/share`,
        {
          method: "POST",
          body: JSON.stringify({
            enabled: !item.isPublic,
            expiresInDays: !item.isPublic
              ? (shareExpiry === "days7" ? 7 : shareExpiry === "days30" ? 30 : null)
              : null,
          }),
        },
      );

      if (!item.isPublic) {
        const shareUrl = `${window.location.origin}/share/${item.id}`;
        const newExpiresAt = futureIso(shareExpiry === "days7" ? 7 : shareExpiry === "days30" ? 30 : null);
        const justShared: CloudWorkspaceSummary = {
          id: item.id, title: item.title, isPublic: true, expiresAt: newExpiresAt,
          createdAt: item.createdAt, updatedAt: new Date().toISOString(),
        };
        const copied = await copyTextToClipboard(shareUrl);
        const suffix = shareExpirySuffix(justShared.expiresAt);
        const label = suffix.labelKey ? t(suffix.labelKey, suffix.labelParams) : "";
        const suffixText = t(suffix.key, suffix.labelKey ? { label } : undefined);
        if (copied) {
          showToast(t("share.linkCopied") + suffixText, "success");
        } else {
          showToast(t("share.linkReady", { url: shareUrl }) + suffixText, "info");
        }
      } else {
        showToast(
          t("share.disabled"),
          "info",
          6000,
          {
            label: t("toast.undo"),
            onClick: async () => {
              try {
                setBusyAction(`share:${item.id}`);
                await cloudRequest<CloudWorkspaceResponse>(
                  `/api/workspaces/${item.id}/share`,
                  {
                    method: "POST",
                    body: JSON.stringify({ enabled: true }),
                  },
                );
                showToast(t("share.reenabled"), "success");
                await refresh();
              } catch (err) {
                const code = err instanceof Error ? err.message : "";
                showToast(
                  friendlyApiMessage(code, t("share.reenableFailed")),
                  "error",
                );
              } finally {
                setBusyAction("");
              }
            },
          },
        );
      }

      await refresh();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      showToast(
        friendlyApiMessage(code, t("share.updateFailed")),
        "error",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function copyShareLink(item: CloudWorkspaceSummary) {
    const shareUrl = `${window.location.origin}/share/${item.id}`;
    const suffix = shareExpirySuffix(item.expiresAt);
    const label = suffix.labelKey ? t(suffix.labelKey, suffix.labelParams) : "";
    const suffixText = t(suffix.key, suffix.labelKey ? { label } : undefined);

    const copied = await copyTextToClipboard(shareUrl);
    if (copied) {
      showToast(t("share.linkCopied") + suffixText, "success");
    } else {
      showToast(t("share.linkReady", { url: shareUrl }) + suffixText, "info");
    }
  }

  async function deleteSnapshot(item: CloudWorkspaceSummary) {
    setPendingConfirm({
      kind: "snapshot-delete",
      item,
      title: t("cloud.deleteTitle"),
      body: t("cloud.deleteBody", { title: item.title }),
      confirmLabel: t("cloud.deleteConfirm"),
      danger: true,
    });
  }

  async function performDelete(item: CloudWorkspaceSummary) {
    setBusyAction(`delete:${item.id}`);    setBusyAction(`delete:${item.id}`);
    try {
      await cloudRequest<null>(`/api/workspaces/${item.id}`, {
        method: "DELETE",
      });
      showToast(t("toast.cloudDeleted"), "success");
      await refresh();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      showToast(
        friendlyApiMessage(code, t("toast.deleteFailed")),
        "error",
      );
    } finally {
      setBusyAction("");
    }
  }

  function generateRecoveryKey() {
    setRecoveryKey(createRecoveryKey());
    setShowRecoveryKey(true);
    showToast(t("toast.recoveryGenerated"), "success");
  }

  async function copyRecoveryKey() {
    const copied = await copyTextToClipboard(recoveryKey);
    if (copied) {
      showToast(t("toast.recoveryCopied"), "success");
    } else {
      showToast(t("toast.recoveryCopyFailed"), "error");
    }
  }

  async function performRecovery(
    successMessage: string,
    beforeSetToken: ((token: string) => Promise<void>) | null,
  ) {
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
      if (beforeSetToken) {
        await beforeSetToken(recoveryOwnerToken);
      }
      localStorage.setItem(OWNER_TOKEN_STORAGE_KEY, recoveryOwnerToken);
      localStorage.setItem(RECOVERY_LABEL_KEY, trimmedLabel);
      setOwnerToken(recoveryOwnerToken);
      setRecoveryTouched(false);
      showToast(successMessage, "success");
      await refresh(recoveryOwnerToken);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      if (message === "invalid_recovery_input") {
        setRecoveryTouched(true);
        showToast(t("toast.recoveryInvalid"), "error");
      } else {
        showToast(t("toast.recoveryFailed"), "error");
      }
    } finally {
      setBusyAction("");
    }
  }

  async function linkRecoveryOwner() {
    await performRecovery(
      t("toast.recoveryLinked"),
      async (token) => {
        await cloudRequest<{ migrated: number }>("/api/workspaces/recovery", {
          method: "POST",
          body: JSON.stringify({ recoveryOwnerToken: token }),
        });
      },
    );
  }

  async function recoverOwner() {
    await performRecovery(t("toast.recoveryLoaded"), null);
  }

  const isBusy = Boolean(busyAction);
  const ownerScope = ownerScopeLabel(ownerToken);


  return (
    <section className="rounded-md border border-card bg-card p-5 shadow-[0_24px_80px_-68px_rgba(17,19,18,0.55)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-foreground text-background">
            {cloudState === "unavailable" ? (
              <CloudOff className="size-4" aria-hidden="true" />
            ) : (
              <Cloud className="size-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
              {t("cloud.heading")}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {cloudState === "ready"
                ? t("cloud.snapshotCount", { scope: ownerScope, count: String(workspaces.length), total: String(cloudSnapshotLimit) })
                : cloudState === "unavailable"
                  ? t("cloud.localOnlyMode")
                  : cloudState === "checking"
                    ? t("cloud.checking")
                    : t("cloud.statusUnavailable")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={!ownerToken || isBusy}
            title={t("cloud.refresh")}
            aria-label={t("cloud.refresh")}
            className="flex size-10 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent hover:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted"
          >
            {busyAction === "save" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UploadCloud className="size-4" aria-hidden="true" />
            )}
            {t("cloud.save")}
          </button>
        </div>
      </div>

      {cloudState === "unavailable" && (
        <p className="mt-4 rounded-md border border-card bg-input p-3 text-sm leading-6 text-foreground/80">
          {t("cloud.unavailableBody")}
        </p>
      )}

      {cloudState === "error" && (
        <div
          id="cloud-error"
          role="alert"
          className="mt-4 rounded-md border border-signal-challenges bg-signal-challenges p-3 text-sm leading-6 text-signal-challenges"
        >
          <p>{cloudError?.message || t("cloud.errorFallback")}</p>
          {cloudError?.code && (
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-signal-challenges pt-2 text-xs">
              <code className="rounded bg-card px-1.5 py-0.5 font-mono text-signal-challenges">{cloudError.code}</code>
              <button
                type="button"
                onClick={() => {
                  copyTextToClipboard(cloudError.code);
                  showToast(t("cloud.errorCodeCopied"), "success");
                }}
                className="rounded border border-signal-challenges bg-card px-2 py-1 font-medium transition hover:bg-signal-challenges focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1"
              >
                {t("cloud.copyCode")}
              </button>
            </div>
          )}
        </div>
      )}

      {cloudState === "checking" ? (
        <div className="mt-4 space-y-2" aria-busy="true" aria-label={t("cloud.checkingAria")}>
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
            {t("cloud.empty")}
          </p>
        </div>
      )}

      {cloudState === "ready" && (
        <div className="mt-4 rounded-md border border-input bg-input p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-foreground/80">
              <KeyRound className="size-4" aria-hidden="true" />
            </span>
            <form
              className="min-w-0 flex-1"
              onSubmit={(event) => event.preventDefault()}
            >
              <h3 className="text-sm font-semibold text-foreground">
                {t("recovery.title")}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted">
                {t("recovery.body", {
                  link: t("recovery.link"),
                  recover: t("recovery.recover"),
                })}
              </p>
              <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-semibold uppercase text-muted">
                    {t("recovery.handle")}
                  </span>
                  <input
                    value={recoveryLabel}
                    onChange={(event) => { setRecoveryLabel(event.target.value); }}
                    onBlur={() => setRecoveryTouched(true)}
                    placeholder={t("recovery.handlePlaceholder")}
                    aria-invalid={recoveryTouched && !!labelError}
                    aria-describedby={recoveryTouched && labelError ? "recovery-label-error" : undefined}
                    className={`h-10 w-full rounded-md border bg-card px-3 text-sm text-foreground outline-none ${
                      recoveryTouched && labelError
                        ? "border-signal-challenges focus:border-signal-challenges focus:ring-2 focus:ring-signal-challenges/40"
                        : "border-input focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                    }`}
                  />
                  {recoveryTouched && labelError && (
                    <p id="recovery-label-error" role="alert" className="mt-1 text-[11px] leading-4 text-error">{labelError}</p>
                  )}
                </label>
                <div className="min-w-0">
                  <span className="mb-1 block text-xs font-semibold uppercase text-muted">
                    {t("recovery.key")}
                  </span>
                  <div className="flex min-w-0 gap-1">
                    <input
                      aria-label={t("recovery.keyAria")}
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
                          ? "border-signal-challenges focus:border-signal-challenges focus:ring-2 focus:ring-signal-challenges/40"
                          : "border-input focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryKey((value) => !value)}
                      title={
                        showRecoveryKey
                          ? t("recovery.hide")
                          : t("recovery.show")
                      }
                      aria-label={
                        showRecoveryKey
                          ? t("recovery.hide")
                          : t("recovery.show")
                      }
                      className="flex size-10 shrink-0 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
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
                      title={t("recovery.copy")}
                      aria-label={t("recovery.copy")}
                      className="flex size-10 shrink-0 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50"
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
                  className="flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50"
                >
                  <KeyRound className="size-4" aria-hidden="true" />
                  {t("recovery.generate")}
                </button>
                <button
                  type="button"
                  onClick={linkRecoveryOwner}
                  disabled={isBusy || (recoveryTouched ? !recoveryReady : (!recoveryLabel || !recoveryKey))}
                  aria-disabled={isBusy || (recoveryTouched ? !recoveryReady : (!recoveryLabel || !recoveryKey))}
                  className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted"
                >
                  {t("recovery.link")}
                </button>
                <button
                  type="button"
                  onClick={recoverOwner}
                  disabled={isBusy || (recoveryTouched ? !recoveryReady : (!recoveryLabel || !recoveryKey))}
                  aria-disabled={isBusy || (recoveryTouched ? !recoveryReady : (!recoveryLabel || !recoveryKey))}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50"
                >
                  {t("recovery.recover")}
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
              className="flex flex-col gap-3 rounded-md border border-input bg-card p-3 opacity-0 motion-safe:animate-[launchlens-fade-in-up_260ms_ease-out_both] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  {item.isPublic && (
                    <span className="shrink-0 rounded-md bg-signal-neutral px-2 py-1 text-xs font-semibold text-signal-neutral">
                      {t("cloud.sharedBadge")}
                    </span>
                  )}
                  {item.isPublic && (() => {
                    const row = cloudRowExpiry(item.expiresAt);
                    if (!row) return null;
                    return (
                      <span
                        className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800"
                        title={row.title}
                      >
                        {t(row.key, row.params)}
                      </span>
                    );
                  })()}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {t("cloud.savedPrefix")}<time dateTime={item.updatedAt} title={new Date(item.updatedAt).toLocaleString()}>{formatSnapshotTime(item.updatedAt, Intl.DateTimeFormat().resolvedOptions().timeZone)}</time>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => restoreSnapshot(item.id)}
                  disabled={isBusy}
                  title={t("cloud.restore")}
                  aria-label={t("cloud.restoreFor", { title: item.title })}
                  className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50"
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
                    title={t("share.copyLink")}
                    aria-label={t("share.copyLinkFor", { title: item.title })}
                    className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleShare(item)}
                  disabled={isBusy}
                  title={item.isPublic ? t("share.disable") : t("share.enable")}
                  aria-label={
                    item.isPublic
                      ? t("share.disableFor", { title: item.title })
                      : t("share.for", { title: item.title })
                  }
                  className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50"
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
                  title={t("cloud.delete")}
                  aria-label={t("cloud.deleteFor", { title: item.title })}
                  className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-signal-challenges transition hover:border-signal-challenges focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}


      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        title={pendingConfirm?.title ?? ""}
        body={
          <>
            <p>{pendingConfirm?.body}</p>
            {pendingConfirm?.kind === "share-enable" ? (
              <fieldset className="mt-4 space-y-2">
                <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/70">{t("share.expiresLegend")}</legend>
                {[
                  { v: "permanent", label: t("share.expiryPermanent") },
                  { v: "days7", label: t("share.expiry7") },
                  { v: "days30", label: t("share.expiry30") },
                ].map((opt) => (
                  <label key={opt.v} className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-muted/40">
                    <input
                      type="radio"
                      name="share-expiry"
                      value={opt.v}
                      checked={shareExpiry === opt.v}
                      onChange={() => setShareExpiry(opt.v as ShareExpiry)}
                      className="accent-accent"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </fieldset>
            ) : null}
          </>
        }
        confirmLabel={pendingConfirm?.confirmLabel ?? t("share.confirm")}
        danger={Boolean(pendingConfirm?.danger)}
        busy={isBusy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={async () => {
          if (!pendingConfirm) return;
          const item = pendingConfirm.item;
          const kind = pendingConfirm.kind;
          if (kind === "share-enable") await toggleShare(item, true);
          else if (kind === "snapshot-delete") await performDelete(item);
        }}
      />
    </section>
  );
}
