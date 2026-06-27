"use client";

import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gauge,
  KeyRound,
  Loader2,
  RefreshCw,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { friendlyApiMessage } from "@/lib/launchlens/api-errors";
import type { CommercialPlanId } from "@/lib/launchlens/commercial-entitlements";
import {
  canStartCommercialCheckout,
  type StripeSubscriptionStatus,
} from "@/lib/launchlens/commercial-subscription";
import { createOwnerToken } from "@/lib/launchlens/owner-token";

const OWNER_TOKEN_KEY = "launchlens.ownerToken.v1";
const OWNER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

type BillingResponse = {
  billing: {
    provider: "stripe";
    configured: boolean;
    checkoutEnabled: boolean;
    portalEnabled: boolean;
    webhookEnabled: boolean;
    billablePlans: CommercialPlanId[];
  };
  entitlement: {
    activePlanId: CommercialPlanId;
    activePlanName: string;
    source: "preview" | "subscription";
    access: "preview" | "full" | "grace" | "restricted";
    subscriptionStatus: string;
    graceUntil: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  subscription: {
    planId: CommercialPlanId;
    status: StripeSubscriptionStatus;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    graceUntil: string | null;
    updatedAt: string;
  } | null;
  usage: {
    periodStart: string;
    planId: CommercialPlanId;
    planName: string;
    limit: number;
    used: number;
    remaining: number;
  } | null;
};

type BillingError = {
  code?: string;
  error?: string;
};

const checkoutPlans = [
  {
    id: "solo" as const,
    name: "Solo",
    price: "$19 / month",
    summary: "Cloud history and live-provider allowance for one founder.",
    features: [
      "Single owner account",
      "Monthly live AI allowance",
      "Billing portal access",
    ],
  },
  {
    id: "team" as const,
    name: "Team",
    price: "$79 / month",
    summary: "Tenant workspaces, collaborators, and a shared evidence trail.",
    features: [
      "Tenant workspaces",
      "Collaborator seats",
      "Shared launch evidence",
    ],
  },
];

type StatusTone = "success" | "warning" | "danger" | "neutral";

function formatStatus(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function chipClass(tone: StatusTone) {
  switch (tone) {
    case "success":
      return "bg-signal-supports text-signal-supports";
    case "warning":
      return "bg-signal-neutral text-signal-neutral";
    case "danger":
      return "bg-signal-challenges text-signal-challenges";
    default:
      return "bg-input text-foreground/75";
  }
}

function dotClass(tone: StatusTone) {
  switch (tone) {
    case "success":
      return "bg-signal-supports";
    case "warning":
      return "bg-signal-neutral";
    case "danger":
      return "bg-signal-challenges";
    default:
      return "bg-muted";
  }
}

function accessTone(access?: BillingResponse["entitlement"]["access"]): StatusTone {
  if (access === "full") {
    return "success";
  }
  if (access === "grace" || access === "preview") {
    return "warning";
  }
  if (access === "restricted") {
    return "danger";
  }
  return "neutral";
}

function StatusChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold ${chipClass(
        tone,
      )}`}
    >
      {children}
    </span>
  );
}

function DetailRow({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="grid gap-1 border-b border-card py-3 last:border-b-0 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
      <dd className="text-sm text-foreground">
        <span className="font-semibold">{value}</span>
        {note ? <span className="mt-1 block text-sm text-muted">{note}</span> : null}
      </dd>
    </div>
  );
}

function LoadingState() {
  return (
    <section
      className="grid gap-5 border-y border-card py-8 lg:grid-cols-[1fr_300px]"
      aria-busy="true"
      aria-label="Loading billing status"
    >
      <div className="rounded-md border border-card bg-card p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-accent" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Loading billing status
            </p>
            <p className="mt-1 text-sm text-muted">
              Checking subscription access, usage, and billing configuration.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-20 rounded-md bg-muted motion-safe:animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="rounded-md border border-card bg-card p-5">
        <div className="h-4 w-24 rounded bg-muted motion-safe:animate-pulse" />
        <div className="mt-4 h-10 rounded bg-muted motion-safe:animate-pulse" />
        <div className="mt-3 h-10 rounded bg-muted motion-safe:animate-pulse" />
      </div>
    </section>
  );
}

function dateLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function monthLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function CommercialBilling() {
  const [ownerToken, setOwnerToken] = useState("");
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/commercial/subscription", {
        cache: "no-store",
        headers: { "x-launchlens-owner": token },
      });
      const body = (await response.json()) as BillingResponse | BillingError;
      if (!response.ok || !("billing" in body)) {
        const code = "code" in body ? body.code ?? "" : "";
        throw new Error(code || "billing_request_failed");
      }
      setBilling(body);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "";
      setError(
        friendlyApiMessage(
          code,
          "Billing status is temporarily unavailable.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      try {
        const stored = localStorage.getItem(OWNER_TOKEN_KEY) ?? "";
        const token = OWNER_TOKEN_PATTERN.test(stored)
          ? stored
          : createOwnerToken();
        localStorage.setItem(OWNER_TOKEN_KEY, token);
        setOwnerToken(token);
        void refresh(token);
      } catch {
        setError("This browser could not initialize the capability account.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [refresh]);

  async function openBilling(path: string, body?: unknown) {
    if (!ownerToken) {
      return;
    }

    setBusy(path);
    setError("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const result = (await response.json()) as
        | { url: string }
        | BillingError;
      if (!response.ok || !("url" in result)) {
        const code = "code" in result ? result.code ?? "" : "";
        throw new Error(code || "billing_request_failed");
      }
      window.location.assign(result.url);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "";
      setError(
        friendlyApiMessage(
          code,
          "The billing request could not be started.",
        ),
      );
    } finally {
      setBusy("");
    }
  }

  const periodEnd = dateLabel(billing?.entitlement.currentPeriodEnd ?? null);
  const graceUntil = dateLabel(billing?.entitlement.graceUntil ?? null);
  const usageMonth = monthLabel(billing?.usage?.periodStart ?? null);
  const usagePercent =
    billing?.usage && billing.usage.limit > 0
      ? Math.min(
          100,
          Math.round((billing.usage.used / billing.usage.limit) * 100),
        )
      : 0;
  const usageTone: StatusTone = !billing?.usage
    ? "neutral"
    : billing.usage.remaining <= 0
      ? "danger"
      : usagePercent >= 80
        ? "warning"
        : "success";
  const usageStatus =
    usageTone === "danger"
      ? "Limit reached"
      : usageTone === "warning"
        ? "Approaching limit"
        : billing?.usage
          ? "Healthy"
          : "Unavailable";
  const canOpenPortal = Boolean(
    billing?.subscription && billing.billing.portalEnabled,
  );
  const configurationChecks = billing
    ? [
        {
          label: "Stripe provider",
          detail: "Provider contract and price lookup",
          ready: billing.billing.configured,
          readyLabel: "Configured",
          missingLabel: "Needs setup",
        },
        {
          label: "Checkout",
          detail: "Recurring subscription entry point",
          ready: billing.billing.checkoutEnabled,
          readyLabel: "Enabled",
          missingLabel: "Disabled",
        },
        {
          label: "Customer portal",
          detail: "Self-serve invoices and payment methods",
          ready: billing.billing.portalEnabled,
          readyLabel: "Enabled",
          missingLabel: "Disabled",
        },
        {
          label: "Webhook",
          detail: "Subscription lifecycle sync",
          ready: billing.billing.webhookEnabled,
          readyLabel: "Listening",
          missingLabel: "Not linked",
        },
      ]
    : [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-24 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-md border border-[#24352f] bg-[#0d1512] text-white shadow-[0_18px_60px_rgba(13,21,18,0.16)]">
        <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 text-xs font-semibold uppercase text-white/70">
              <CreditCard className="size-4" aria-hidden="true" />
              Billing
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              Subscription and plan access
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Manage the account contract, live AI allowance, and Stripe
              readiness from a secret-safe billing surface.
            </p>
          </div>
          <nav
            aria-label="Billing navigation"
            className="flex flex-wrap items-center gap-2 text-sm font-semibold lg:justify-end"
          >
            <Link
              href="/pricing"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-3 text-[#0d1512] transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Pricing
              <ExternalLink className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-white/10 bg-white/5 px-3 text-white transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Product workspace
            </Link>
          </nav>
        </div>
        <dl className="grid border-t border-white/10 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-white/10 p-4 sm:border-r lg:border-b-0">
            <dt className="text-xs font-semibold uppercase text-white/50">
              Plan
            </dt>
            <dd className="mt-2 font-semibold text-white">
              {billing?.entitlement.activePlanName ??
                (loading ? "Loading account" : "Account pending")}
            </dd>
            <p className="mt-1 text-xs text-white/50">
              {billing ? `ID ${billing.entitlement.activePlanId}` : "Capability scope"}
            </p>
          </div>
          <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
            <dt className="text-xs font-semibold uppercase text-white/50">
              Access
            </dt>
            <dd className="mt-2">
              <span className="font-semibold text-white">
                {billing
                  ? formatStatus(billing.entitlement.access)
                  : loading
                    ? "Checking"
                    : "Unavailable"}
              </span>
            </dd>
            <p className="mt-1 text-xs text-white/50">
              {billing
                ? `Source ${formatStatus(billing.entitlement.source)}`
                : "Subscription source"}
            </p>
          </div>
          <div className="border-b border-white/10 p-4 sm:border-r sm:border-b-0">
            <dt className="text-xs font-semibold uppercase text-white/50">
              Renewal
            </dt>
            <dd className="mt-2 font-semibold text-white">
              {periodEnd ?? (loading ? "Resolving" : "No billing period")}
            </dd>
            <p className="mt-1 text-xs text-white/50">
              {billing?.entitlement.cancelAtPeriodEnd
                ? "Cancellation scheduled"
                : "Recurring contract state"}
            </p>
          </div>
          <div className="p-4">
            <dt className="text-xs font-semibold uppercase text-white/50">
              Live usage
            </dt>
            <dd className="mt-2 font-semibold text-white">
              {billing?.usage
                ? `${billing.usage.used}/${billing.usage.limit}`
                : loading
                  ? "Syncing meter"
                  : "Meter pending"}
            </dd>
            <p className="mt-1 text-xs text-white/50">{usageStatus}</p>
          </div>
        </dl>
      </header>

      {loading ? <LoadingState /> : null}

      {error ? (
        <section
          role="alert"
          className="flex flex-col gap-4 rounded-md border border-signal-challenges bg-signal-challenges p-4 text-sm text-signal-challenges sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Billing status needs a refresh</h2>
              <p className="mt-1 leading-6">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refresh(ownerToken)}
            disabled={!ownerToken || loading || Boolean(busy)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-signal-challenges bg-card px-3 font-semibold text-signal-challenges transition hover:bg-signal-challenges hover:text-signal-challenges focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Retry
          </button>
        </section>
      ) : null}

      {!loading && billing ? (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="grid gap-6">
              <section
                aria-labelledby="billing-status-heading"
                className="overflow-hidden rounded-md border border-card bg-card"
              >
                <div className="flex flex-col gap-5 border-b border-card bg-muted p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted">
                      Account overview
                    </p>
                    <h2
                      id="billing-status-heading"
                      className="mt-2 text-xl font-semibold text-foreground"
                    >
                      {billing.entitlement.activePlanName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-foreground/75">
                      Access is resolved from the safest available subscription
                      state, with preview access clearly separated from paid
                      subscription status.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <StatusChip tone={accessTone(billing.entitlement.access)}>
                      Access {formatStatus(billing.entitlement.access)}
                    </StatusChip>
                    <StatusChip
                      tone={
                        billing.entitlement.source === "subscription"
                          ? "success"
                          : "warning"
                        }
                    >
                      Source {formatStatus(billing.entitlement.source)}
                    </StatusChip>
                    <StatusChip>
                      Status {formatStatus(billing.entitlement.subscriptionStatus)}
                    </StatusChip>
                  </div>
                </div>
                <dl className="px-5">
                  <DetailRow
                    label="Plan"
                    value={billing.entitlement.activePlanName}
                    note={`Plan ID: ${billing.entitlement.activePlanId}`}
                  />
                  <DetailRow
                    label="Renewal"
                    value={periodEnd ?? "No active billing period"}
                    note={
                      billing.entitlement.cancelAtPeriodEnd
                        ? "Cancellation is scheduled at period end."
                        : "The page does not render Stripe customer or subscription IDs."
                    }
                  />
                  <DetailRow
                    label="Grace"
                    value={graceUntil ?? "No payment grace window"}
                    note={
                      graceUntil
                        ? "Access remains available until this date."
                        : "No overdue payment recovery window is active."
                    }
                  />
                </dl>
              </section>

              <section
                aria-labelledby="billing-usage-heading"
                className="overflow-hidden rounded-md border border-card bg-card"
              >
                <div className="flex flex-col gap-4 border-b border-card bg-muted p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                      <Gauge className="size-4" aria-hidden="true" />
                      Usage meter
                    </div>
                    <h2
                      id="billing-usage-heading"
                      className="mt-2 text-lg font-semibold text-foreground"
                    >
                      Live AI usage
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {usageMonth ?? "Current billing period"}
                    </p>
                  </div>
                  <StatusChip tone={usageTone}>{usageStatus}</StatusChip>
                </div>
                {billing.usage ? (
                  <div className="p-5">
                    <dl className="grid divide-y divide-card border-b border-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                      <div className="py-3 sm:px-4 sm:first:pl-0">
                        <dt className="text-xs font-semibold uppercase text-muted">
                          Used
                        </dt>
                        <dd className="mt-1 text-xl font-semibold text-foreground">
                          {billing.usage.used}
                        </dd>
                      </div>
                      <div className="py-3 sm:px-4">
                        <dt className="text-xs font-semibold uppercase text-muted">
                          Remaining
                        </dt>
                        <dd className="mt-1 text-xl font-semibold text-foreground">
                          {billing.usage.remaining}
                        </dd>
                      </div>
                      <div className="py-3 sm:px-4 sm:last:pr-0">
                        <dt className="text-xs font-semibold uppercase text-muted">
                          Limit
                        </dt>
                        <dd className="mt-1 text-xl font-semibold text-foreground">
                          {billing.usage.limit}
                        </dd>
                      </div>
                    </dl>
                    <div
                      className="mt-5 h-2.5 overflow-hidden rounded-full bg-input"
                      role="progressbar"
                      aria-label="Live AI usage"
                      aria-valuemin={0}
                      aria-valuemax={billing.usage.limit}
                      aria-valuenow={billing.usage.used}
                    >
                      <div
                        className={`h-full rounded-full ${dotClass(usageTone)}`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {usagePercent}% of {billing.usage.planName} monthly live
                      provider capacity has been used.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-5">
                    <AlertCircle
                      className="mt-0.5 size-5 shrink-0 text-muted"
                      aria-hidden="true"
                    />
                    <p className="text-sm leading-6 text-foreground/75">
                      Usage data is not available yet. The meter appears after
                      the first capability account usage record is created.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <aside
              aria-labelledby="billing-actions-heading"
              className="overflow-hidden rounded-md border border-card bg-card lg:sticky lg:top-6"
            >
              <div className="flex items-start justify-between gap-3 border-b border-card bg-muted p-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted">
                    Action rail
                  </p>
                  <h2
                    id="billing-actions-heading"
                    className="mt-2 text-lg font-semibold text-foreground"
                  >
                    Billing controls
                  </h2>
                </div>
                <span
                  className={`mt-1 size-2.5 rounded-full ${dotClass(
                    accessTone(billing.entitlement.access),
                  )}`}
                />
              </div>
              <div className="p-5">
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => void refresh(ownerToken)}
                    disabled={!ownerToken || Boolean(busy)}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Refresh status
                  </button>
                  <button
                    type="button"
                    onClick={() => void openBilling("/api/commercial/portal")}
                    disabled={!canOpenPortal || Boolean(busy)}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-text transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] disabled:cursor-not-allowed disabled:border disabled:border-input disabled:bg-muted disabled:text-foreground/55"
                  >
                    {busy === "/api/commercial/portal" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ExternalLink className="size-4" aria-hidden="true" />
                    )}
                    Manage billing
                  </button>
                </div>
                <div className="mt-5 divide-y divide-card border-y border-card">
                  <div className="flex items-center gap-3 py-3">
                    <ReceiptText className="size-4 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {billing.subscription
                          ? "Subscription on file"
                          : "No paid subscription"}
                      </p>
                      <p className="text-xs text-muted">
                        {billing.subscription
                          ? `Updated ${
                              dateLabel(billing.subscription.updatedAt) ?? "recently"
                            }`
                          : "Preview access can be upgraded through Checkout."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-3">
                    <KeyRound className="size-4 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Browser capability
                      </p>
                      <p className="text-xs text-muted">
                        Owner token is stored locally and never displayed.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-3">
                    <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Secret-safe surface
                      </p>
                      <p className="text-xs text-muted">
                        Provider IDs and API secrets stay off the page.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusChip
                    tone={billing.billing.configured ? "success" : "warning"}
                  >
                    {billing.billing.configured
                      ? "Stripe configured"
                      : "Setup required"}
                  </StatusChip>
                  <StatusChip
                    tone={billing.billing.checkoutEnabled ? "success" : "neutral"}
                  >
                    Checkout {billing.billing.checkoutEnabled ? "on" : "off"}
                  </StatusChip>
                  <StatusChip
                    tone={billing.billing.webhookEnabled ? "success" : "neutral"}
                  >
                    Webhook {billing.billing.webhookEnabled ? "on" : "off"}
                  </StatusChip>
                </div>
              </div>
            </aside>
          </div>

          <section
            aria-labelledby="billing-configuration-heading"
            className="overflow-hidden rounded-md border border-card bg-card"
          >
            <div className="flex flex-col gap-3 border-b border-card bg-muted p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Settings2 className="size-4" aria-hidden="true" />
                  Billing configuration state
                </div>
                <h2
                  id="billing-configuration-heading"
                  className="mt-2 text-lg font-semibold text-foreground"
                >
                  Stripe readiness
                </h2>
                <p className="mt-1 text-sm leading-6 text-foreground/75">
                  Operational checks for subscription entry, self-serve
                  management, and webhook-backed entitlement sync.
                </p>
              </div>
              <StatusChip tone={billing.billing.configured ? "success" : "warning"}>
                {billing.billing.configured ? "Ready" : "Sandbox incomplete"}
              </StatusChip>
            </div>
            <div className="hidden grid-cols-[1.1fr_1fr_140px] border-b border-card bg-muted px-5 py-3 text-xs font-semibold uppercase text-muted md:grid">
              <span>Check</span>
              <span>Scope</span>
              <span className="text-right">State</span>
            </div>
            <div className="divide-y divide-card">
              {configurationChecks.map((check) => (
                <div
                  key={check.label}
                  className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[1.1fr_1fr_140px] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-foreground">{check.label}</p>
                  </div>
                  <p className="text-muted">{check.detail}</p>
                  <div className="md:justify-self-end">
                    <StatusChip tone={check.ready ? "success" : "warning"}>
                      {check.ready ? check.readyLabel : check.missingLabel}
                    </StatusChip>
                  </div>
                </div>
              ))}
            </div>
            {!billing.billing.configured ? (
              <div className="flex items-start gap-3 border-t border-card p-5">
                <ShieldCheck
                  className="mt-0.5 size-5 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Checkout is disabled on this deployment
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-foreground/75">
                    The subscription contract is active, but this environment
                    has no complete Stripe sandbox or live configuration.
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          <section
            aria-labelledby="billing-plans-heading"
            className="overflow-hidden rounded-md border border-card bg-card"
          >
            <div className="flex flex-col gap-2 border-b border-card bg-muted p-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  Available plans
                </p>
                <h2
                  id="billing-plans-heading"
                  className="mt-2 text-lg font-semibold text-foreground"
                >
                  Choose a recurring subscription
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-muted">
                Checkout opens Stripe for recurring billing; plan access remains
                visible here after webhooks update the subscription state.
              </p>
            </div>
            <div className="grid divide-y divide-card md:grid-cols-2 md:divide-x md:divide-y-0">
              {checkoutPlans.map((plan) => {
                const subscribed = billing.subscription?.planId === plan.id;
                const entitled =
                  billing.entitlement.activePlanId === plan.id &&
                  billing.entitlement.access !== "restricted";
                const current =
                  billing.entitlement.source === "subscription" && entitled;
                const canCheckout =
                  billing.billing.checkoutEnabled &&
                  canStartCommercialCheckout(
                    billing.subscription?.status,
                  ) &&
                  billing.billing.billablePlans.includes(plan.id);
                const planTone: StatusTone = current
                  ? "success"
                  : entitled
                    ? "warning"
                    : canCheckout
                      ? "neutral"
                      : "warning";
                const planStatus = current
                  ? "Current subscription"
                  : entitled
                    ? "Preview access"
                    : canCheckout
                      ? "Available"
                      : "Checkout unavailable";

                return (
                  <article
                    key={plan.id}
                    className={`flex min-h-72 flex-col gap-4 p-5 ${
                      current ? "bg-input" : "bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {plan.id === "team" ? (
                            <Users className="size-4 text-accent" aria-hidden="true" />
                          ) : (
                            <CreditCard
                              className="size-4 text-accent"
                              aria-hidden="true"
                            />
                          )}
                          <h3 className="text-base font-semibold text-foreground">
                            {plan.name}
                          </h3>
                        </div>
                        <p className="mt-3 text-2xl font-semibold text-foreground">
                          {plan.price}
                        </p>
                      </div>
                      <StatusChip tone={planTone}>{planStatus}</StatusChip>
                    </div>
                    <p className="text-sm leading-6 text-foreground/75">
                      {plan.summary}
                    </p>
                    <ul className="grid gap-2 border-t border-card pt-4 text-sm text-foreground/80">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle2
                            className="size-4 shrink-0 text-accent"
                            aria-hidden="true"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() =>
                        void openBilling("/api/commercial/checkout", {
                          planId: plan.id,
                        })
                      }
                      disabled={!canCheckout || Boolean(busy)}
                      className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50"
                    >
                      {busy === "/api/commercial/checkout" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <CreditCard className="size-4" aria-hidden="true" />
                      )}
                      {current
                        ? "Current plan"
                        : subscribed
                          ? `Restart ${plan.name}`
                          : `Choose ${plan.name}`}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {!loading && !billing && !error ? (
        <section className="flex items-start gap-3 rounded-md border border-dashed border-input bg-input p-5">
          <CalendarClock
            className="mt-0.5 size-5 shrink-0 text-accent"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Capability account is initializing
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground/75">
              Refresh this page if the browser has not finished creating the
              local account capability.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
