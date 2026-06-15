"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, Cloud, Cpu, AlertTriangle, Loader2 } from "lucide-react";

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

export function SystemStatus() {
  const [systemStatus, setSystemStatus] = useState<Status | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setSystemStatus(data);
        }
      } catch {
        // Fail silently - status is non-critical
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStatus();
    const interval = window.setInterval(fetchStatus, 60_000); // Poll every minute

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  // Close dropdown on Escape (shared event)
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = () => setIsOpen(false);
    window.addEventListener("launchlens:escape", onEscape);
    return () => window.removeEventListener("launchlens:escape", onEscape);
  }, [isOpen]);

  const dbOk = systemStatus?.dbConfigured ? systemStatus.dbHealthy : null;
  const providerOk = systemStatus?.providerConfigured ?? false;
  const allOk = (dbOk === true || dbOk === null) && systemStatus?.status === "ok";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
        aria-label="System status"
        className="flex h-10 items-center gap-2 rounded-md border border-[#d8ded4] bg-white px-3 text-sm text-[#40504a] transition hover:border-[#138a72]"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-[#8e9c93]" aria-hidden="true" />
        ) : allOk ? (
          <CheckCircle2 className="size-4 text-[#138a72]" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-4 text-[#d85b3f]" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {loading ? "Checking..." : allOk ? "All systems operational" : "Degraded mode"}
        </span>
      </button>

      {isOpen && systemStatus && (
        <div
          className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-[#d8ded4] bg-white p-4 shadow-lg"
          role="tooltip"
        >
          <h3 className="mb-3 text-sm font-semibold text-[#17201d]">System status</h3>
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
        </div>
      )}
    </div>
  );
}
