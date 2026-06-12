"use client";

import {
  Cloud,
  CloudOff,
  Copy,
  History,
  Loader2,
  RefreshCw,
  Share2,
  Trash2,
  Unlink,
  UploadCloud,
} from "lucide-react";
import { useEffect, useState } from "react";

import type {
  CloudWorkspaceErrorResponse,
  CloudWorkspaceListResponse,
  CloudWorkspaceRecord,
  CloudWorkspaceResponse,
  CloudWorkspaceSummary,
} from "@/lib/launchlens/cloud-workspace";
import { MAX_CLOUD_WORKSPACES } from "@/lib/launchlens/cloud-workspace";
import type {
  LaunchLensInput,
  LaunchLensWorkspace,
} from "@/lib/launchlens/types";

const OWNER_TOKEN_KEY = "launchlens.ownerToken.v1";
const OWNER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type CloudWorkspacesProps = {
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
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
  onRestore,
}: CloudWorkspacesProps) {
  const [ownerToken, setOwnerToken] = useState("");
  const [cloudState, setCloudState] = useState<CloudState>("checking");
  const [workspaces, setWorkspaces] = useState<CloudWorkspaceSummary[]>([]);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState("");

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

        throw new Error("cloud_request_failed");
      }

      if (!("workspaces" in body)) {
        throw new Error("cloud_request_failed");
      }

      if (!body.configured) {
        setCloudState("unavailable");
        setWorkspaces([]);
        return;
      }

      setWorkspaces(body.workspaces);
      setCloudState("ready");
    } catch {
      setCloudState("error");
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
    setNotice("");

    try {
      await cloudRequest<CloudWorkspaceResponse>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({
          title: workspace.landingPage.headline,
          input,
          workspace,
        }),
      });
      setNotice("Cloud snapshot saved.");
      await refresh();
    } catch (error) {
      setNotice(
        error instanceof Error && error.message === "workspace_limit_reached"
          ? "Cloud history is full. Delete a snapshot before saving."
          : "Cloud save failed. Your local draft is still safe.",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function restoreSnapshot(id: string) {
    setBusyAction(`restore:${id}`);
    setNotice("");

    try {
      const response = await cloudRequest<CloudWorkspaceResponse>(
        `/api/workspaces/${id}`,
      );
      onRestore(response.workspace);
      setNotice("Cloud snapshot restored to the editor.");
    } catch {
      setNotice("That cloud snapshot could not be restored.");
    } finally {
      setBusyAction("");
    }
  }

  async function toggleShare(item: CloudWorkspaceSummary) {
    setBusyAction(`share:${item.id}`);
    setNotice("");

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

        try {
          await navigator.clipboard.writeText(shareUrl);
          setNotice("Read-only share link copied.");
        } catch {
          setNotice(`Share link ready: ${shareUrl}`);
        }
      } else {
        setNotice("Public sharing disabled.");
      }

      await refresh();
    } catch {
      setNotice("Sharing could not be updated.");
    } finally {
      setBusyAction("");
    }
  }

  async function copyShareLink(item: CloudWorkspaceSummary) {
    const shareUrl = `${window.location.origin}/share/${item.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("Read-only share link copied.");
    } catch {
      setNotice(`Share link ready: ${shareUrl}`);
    }
  }

  async function deleteSnapshot(item: CloudWorkspaceSummary) {
    if (!window.confirm(`Delete "${item.title}" from cloud history?`)) {
      return;
    }

    setBusyAction(`delete:${item.id}`);
    setNotice("");

    try {
      await cloudRequest<null>(`/api/workspaces/${item.id}`, {
        method: "DELETE",
      });
      setNotice("Cloud snapshot deleted.");
      await refresh();
    } catch {
      setNotice("Cloud snapshot could not be deleted.");
    } finally {
      setBusyAction("");
    }
  }

  const isBusy = Boolean(busyAction);

  return (
    <section className="rounded-lg border border-[#d8ded4] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-[#e5f4ef] text-[#0f766e]">
            {cloudState === "unavailable" ? (
              <CloudOff className="size-4" aria-hidden="true" />
            ) : (
              <Cloud className="size-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <h2 className="text-base font-semibold text-[#17201d]">
              Cloud history
            </h2>
            <p className="mt-0.5 text-sm text-[#607069]">
              {cloudState === "ready"
                ? `This browser, ${workspaces.length} of ${MAX_CLOUD_WORKSPACES} snapshots`
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
            className="flex size-10 items-center justify-center rounded-md border border-[#cfd8d1] bg-[#fbfcfa] text-[#40504a] transition hover:border-[#138a72] disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex h-10 items-center gap-2 rounded-md bg-[#17201d] px-3 text-sm font-semibold text-white transition hover:bg-[#24312d] disabled:cursor-not-allowed disabled:bg-[#89938f]"
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
        <p className="mt-4 rounded-md border border-[#d8ded4] bg-[#fbfcfa] p-3 text-sm leading-6 text-[#40504a]">
          Cloud history is not configured on this deployment. Local autosave,
          editing, generation, and export remain available.
        </p>
      )}

      {cloudState === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-[#e7c9bd] bg-[#fff6f1] p-3 text-sm leading-6 text-[#8b3d28]"
        >
          Cloud history could not be reached. Your local draft remains
          available.
        </p>
      )}

      {cloudState === "ready" && workspaces.length === 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-dashed border-[#cfd8d1] bg-[#fbfcfa] p-4">
          <History className="size-5 text-[#138a72]" aria-hidden="true" />
          <p className="text-sm text-[#40504a]">
            No cloud snapshots yet. Save the current workspace when it reaches
            a useful decision point.
          </p>
        </div>
      )}

      {workspaces.length > 0 && (
        <div className="mt-4 grid gap-2">
          {workspaces.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-md border border-[#d8ded4] bg-[#fbfcfa] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-[#17201d]">
                    {item.title}
                  </h3>
                  {item.isPublic && (
                    <span className="shrink-0 rounded-md bg-[#f6df8f] px-2 py-1 text-xs font-semibold text-[#493b08]">
                      Shared
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[#607069]">
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
                  className="flex size-9 items-center justify-center rounded-md border border-[#cfd8d1] bg-white text-[#40504a] transition hover:border-[#138a72] hover:text-[#17201d] disabled:opacity-50"
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
                    className="flex size-9 items-center justify-center rounded-md border border-[#cfd8d1] bg-white text-[#40504a] transition hover:border-[#138a72] hover:text-[#17201d] disabled:opacity-50"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleShare(item)}
                  disabled={isBusy}
                  title={item.isPublic ? "Disable sharing" : "Copy share link"}
                  aria-label={
                    item.isPublic
                      ? `Disable sharing for ${item.title}`
                      : `Share ${item.title}`
                  }
                  className="flex size-9 items-center justify-center rounded-md border border-[#cfd8d1] bg-white text-[#40504a] transition hover:border-[#138a72] hover:text-[#17201d] disabled:opacity-50"
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
                  className="flex size-9 items-center justify-center rounded-md border border-[#cfd8d1] bg-white text-[#8b3d28] transition hover:border-[#c86b50] disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {notice && (
        <p role="status" className="mt-3 text-sm leading-6 text-[#40504a]">
          {notice}
        </p>
      )}
    </section>
  );
}
