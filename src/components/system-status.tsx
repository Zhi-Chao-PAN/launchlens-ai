"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CloudOff, Cloud, Cpu, AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { pushOverlay } from "@/lib/launchlens/overlays";

type Status = {
  status: string;
  version: string;
  provider: string;
  providerConfigured: boolean;
  dbConfigured: boolean;
  dbHealthy: boolean;
  dbLatencyMs: number | null;
  vercelEnv: string;
};

type FetchState = "loading" | "ok" | "error" | "offline";

export function SystemStatus() {
  const [systemStatus, setSystemStatus] = useState<Status | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [isOpen, setIsOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && "onLine" in navigator && !navigator.onLine) {
        setFetchState("offline");
        return;
      }
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch("/api/status", {
        cache: "no-store",
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`status_${res.status}`);
      }
      const data = (await res.json()) as Status;
      setSystemStatus(data);
      setFetchState("ok");
    } catch {
      setFetchState((prev) => (prev === "ok" || prev === "loading" ? "error" : prev));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Defer initial fetch past the commit so the setState-in-effect linter
    // does not flag cascading-render risk (the await inside fetchStatus
    // already makes it async, but we match the rest of the codebase which
    // uses rAF for initial side-effects).
    window.requestAnimationFrame(() => {
      if (!mounted) return;
      void fetchStatus();
    });

    pollTimerRef.current = window.setInterval(() => {
      if (mounted) void fetchStatus();
    }, 60_000);

    const handleOnline = () => {
      if (!mounted) return;
      setSrAnnouncement("Network connection restored. Checking system status.");
      setFetchState("loading");
      window.requestAnimationFrame(() => {
        if (mounted) void fetchStatus();
      });
    };
    const handleOffline = () => {
      if (!mounted) return;
      setSrAnnouncement("Network connection lost. Showing offline indicator.");
      setFetchState("offline");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      mounted = false;
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchStatus]);

  async function manualRetry() {
    setRetrying(true);
    setFetchState("loading");
    setSrAnnouncement("Retrying system status check.");
    await fetchStatus();
    setSrAnnouncement(fetchState === "ok" ? "System status check succeeded." : "System status check still failing.");
    setRetrying(false);
  }

  // Wire Escape + click-outside.
  useEffect(() => {
    if (!isOpen) return;
    const pop = pushOverlay();
    const onEscape = (e: Event) => {
      e.stopImmediatePropagation?.();
      setIsOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("launchlens:escape", onEscape);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("launchlens:escape", onEscape);
      window.removeEventListener("mousedown", onClickOutside);
      pop();
    };
  }, [isOpen]);

  const dbOk = systemStatus?.dbConfigured ? systemStatus.dbHealthy : null;
  const providerOk = systemStatus?.providerConfigured ?? false;
  const allOk = fetchState === "ok" && (dbOk === true || dbOk === null) && systemStatus?.status === "ok";

  const buttonIcon = () => {
    if (fetchState === "loading" || retrying) {
      return <Loader2 className="size-4 animate-spin text-[#8e9c93]" aria-hidden="true" />;
    }
    if (fetchState === "offline") {
      return <WifiOff className="size-4 text-[#8e9c93]" aria-hidden="true" />;
    }
    if (fetchState === "error" || !allOk) {
      return <AlertTriangle className="size-4 text-[#d85b3f]" aria-hidden="true" />;
    }
    return <CheckCircle2 className="size-4 text-[#138a72]" aria-hidden="true" />;
  };

  const buttonLabel = () => {
    if (retrying) return "Retrying...";
    if (fetchState === "loading") return "Checking...";
    if (fetchState === "offline") return "Offline";
    if (fetchState === "error") return "Status unreachable";
    return allOk ? "All systems operational" : "Degraded mode";
  };

  return (
    <div className="relative" ref={containerRef}>
      <span role="status" aria-live="polite" className="sr-only">
        {srAnnouncement}
      </span>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="System status"
        className="flex h-10 items-center gap-2 rounded-md border border-[#d8ded4] bg-white px-3 text-sm text-[#40504a] transition hover:border-[#138a72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
      >
        {buttonIcon()}
        <span className="hidden sm:inline">{buttonLabel()}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] origin-top-right rounded-lg border border-[#d8ded4] bg-white p-4 shadow-lg animate-[fadeInDown_150ms_ease-out]"
          role="dialog"
          aria-label="System status details"
        >
          <h3 className="mb-3 text-sm font-semibold text-[#17201d]">System status</h3>

          {fetchState === "error" && (
            <div role="alert" className="mb-3 flex items-start gap-2 rounded-md border border-[#e7c9bd] bg-[#fff6f1] p-2.5 text-xs leading-5 text-[#8b3d28]">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span className="flex-1">
                Could not reach the status endpoint. The app may be offline or the server is restarting.
              </span>
              <button
                type="button"
                onClick={manualRetry}
                disabled={retrying}
                className="inline-flex shrink-0 items-center gap-1 rounded border border-[#e7c9bd] bg-white px-2 py-0.5 text-[11px] font-medium text-[#8b3d28] transition hover:bg-[#fff6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d85b3f] focus-visible:ring-offset-1 disabled:opacity-50"
              >
                <RefreshCw className={`size-3 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
                Retry
              </button>
            </div>
          )}

          {fetchState === "offline" && (
            <div role="alert" className="mb-3 flex items-start gap-2 rounded-md border border-[#d8ded4] bg-[#f6f8f4] p-2.5 text-xs leading-5 text-[#40504a]">
              <WifiOff className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>Browser reports no network connection. Local draft and export still work.</span>
            </div>
          )}

          {systemStatus && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#40504a]">
                  <Cpu className="size-4" aria-hidden="true" />
                  AI Provider
                </span>
                <span className={providerOk ? "text-[#138a72]" : "text-[#8e9c93]"}>
                  {providerOk ? systemStatus.provider : "Mock demo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#40504a]">
                  {dbOk === null ? (
                    <CloudOff className="size-4 text-[#8e9c93]" aria-hidden="true" />
                  ) : dbOk ? (
                    <Cloud className="size-4 text-[#138a72]" aria-hidden="true" />
                  ) : (
                    <CloudOff className="size-4 text-[#d85b3f]" aria-hidden="true" />
                  )}
                  Cloud storage
                </span>
                <span
                  className={
                    dbOk === null
                      ? "text-[#8e9c93]"
                      : dbOk
                        ? "text-[#138a72]"
                        : "text-[#d85b3f]"
                  }
                >
                  {dbOk === null
                    ? "Local only"
                    : dbOk
                      ? `Healthy${systemStatus.dbLatencyMs ? ` (${systemStatus.dbLatencyMs}ms)` : ""}`
                      : "Unavailable"}
                </span>
              </div>
              {systemStatus.vercelEnv !== "production" && (
                <div className="mt-3 border-t border-[#edf0ea] pt-2 text-xs text-[#8e9c93]">
                  Environment: {systemStatus.vercelEnv}
                </div>
              )}
              <div className="text-xs text-[#8e9c93]">
                Version: {systemStatus.version}
              </div>
            </div>
          )}

          {fetchState === "loading" && !systemStatus && (
            <p className="text-sm text-[#8e9c93]">Contacting status endpoint...</p>
          )}
        </div>
      )}
    </div>
  );
}
