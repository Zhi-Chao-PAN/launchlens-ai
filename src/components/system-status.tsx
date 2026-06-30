"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSrAnnounce } from "@/hooks/use-sr-announce";
import { CheckCircle2, CloudOff, Cloud, Cpu, AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { pushOverlay } from "@/lib/launchlens/overlays";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Status = {
  status: string;
  version: string;
  provider: string;
  providerConfigured: boolean;
  workspaceProviderLiveEnabled?: boolean;
  workspaceProviderActive?: boolean;
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
  const { announce: setSrAnnouncement, message: srAnnouncement } = useSrAnnounce();
  const { t } = useLocale();
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
      setSrAnnouncement(t("status.srRestored"));
      setFetchState("loading");
      window.requestAnimationFrame(() => {
        if (mounted) void fetchStatus();
      });
    };
    const handleOffline = () => {
      if (!mounted) return;
      setSrAnnouncement(t("status.srLost"));
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
  }, [fetchStatus, setSrAnnouncement, t]);

  async function manualRetry() {
    setRetrying(true);
    setFetchState("loading");
    setSrAnnouncement(t("status.srRetrying"));
    await fetchStatus();
    setSrAnnouncement(fetchState === "ok" ? t("status.srCheckSucceeded") : t("status.srCheckFailing"));
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
  const providerOk = systemStatus?.workspaceProviderActive ?? false;
  const allOk = fetchState === "ok" && (dbOk === true || dbOk === null) && systemStatus?.status === "ok";

  const buttonIcon = () => {
    if (fetchState === "loading" || retrying) {
      return <Loader2 className="size-4 animate-spin text-muted" aria-hidden="true" />;
    }
    if (fetchState === "offline") {
      return <WifiOff className="size-4 text-muted" aria-hidden="true" />;
    }
    if (fetchState === "error" || !allOk) {
      return <AlertTriangle className="size-4 text-signal-challenges" aria-hidden="true" />;
    }
    return <CheckCircle2 className="size-4 text-accent" aria-hidden="true" />;
  };

  const buttonLabel = () => {
    if (retrying) return t("status.retrying");
    if (fetchState === "loading") return t("status.checking");
    if (fetchState === "offline") return t("status.offline");
    if (fetchState === "error") return t("status.unreachable");
    return allOk ? t("status.operational") : t("status.degraded");
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
        aria-label={t("status.ariaLabel")}
        className="flex h-10 items-center gap-2 rounded-md border border-card bg-card px-3 text-sm text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        {buttonIcon()}
        <span className="hidden sm:inline">{buttonLabel()}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] origin-top-right rounded-lg border border-card bg-card p-4 shadow-lg animate-[fadeInDown_150ms_ease-out]"
          role="dialog"
          aria-label={t("status.detailsAria")}
        >
          <h3 className="mb-3 text-sm font-semibold text-foreground">{t("status.ariaLabel")}</h3>

          {fetchState === "error" && (
            <div role="alert" className="mb-3 flex items-start gap-2 rounded-md border border-signal-challenges bg-signal-challenges p-2.5 text-xs leading-5 text-signal-challenges">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span className="flex-1">
                {t("status.endpointError")}
              </span>
              <button
                type="button"
                onClick={manualRetry}
                disabled={retrying}
                className="inline-flex shrink-0 items-center gap-1 rounded border border-signal-challenges bg-card px-2 py-0.5 text-[11px] font-medium text-signal-challenges transition hover:bg-signal-challenges focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1 disabled:opacity-50"
              >
                <RefreshCw className={`size-3 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
                {t("status.retry")}
              </button>
            </div>
          )}

          {fetchState === "offline" && (
            <div role="alert" className="mb-3 flex items-start gap-2 rounded-md border border-card bg-muted p-2.5 text-xs leading-5 text-foreground/80">
              <WifiOff className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{t("status.noNetwork")}</span>
            </div>
          )}

          {systemStatus && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/80">
                  <Cpu className="size-4" aria-hidden="true" />
                  {t("status.aiProvider")}
                </span>
                <span className={providerOk ? "text-accent" : "text-muted"}>
                  {providerOk ? systemStatus.provider : t("status.mockDemo")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground/80">
                  {dbOk === null ? (
                    <CloudOff className="size-4 text-muted" aria-hidden="true" />
                  ) : dbOk ? (
                    <Cloud className="size-4 text-accent" aria-hidden="true" />
                  ) : (
                    <CloudOff className="size-4 text-signal-challenges" aria-hidden="true" />
                  )}
                  {t("status.cloudStorage")}
                </span>
                <span
                  className={
                    dbOk === null
                      ? "text-muted"
                      : dbOk
                        ? "text-accent"
                        : "text-signal-challenges"
                  }
                >
                  {dbOk === null
                    ? t("status.localOnly")
                    : dbOk
                      ? `${t("status.healthy")}${systemStatus.dbLatencyMs ? ` (${systemStatus.dbLatencyMs}ms)` : ""}`
                      : t("status.unavailable")}
                </span>
              </div>
              {systemStatus.vercelEnv !== "production" && (
                <div className="mt-3 border-t border-card pt-2 text-xs text-muted">
                  {t("status.envPrefix")}{systemStatus.vercelEnv}
                </div>
              )}
              <div className="text-xs text-muted">
                {t("status.versionPrefix")}{systemStatus.version}
              </div>
            </div>
          )}

          {fetchState === "loading" && !systemStatus && (
            <p className="text-sm text-muted">{t("status.contacting")}</p>
          )}
        </div>
      )}
    </div>
  );
}
