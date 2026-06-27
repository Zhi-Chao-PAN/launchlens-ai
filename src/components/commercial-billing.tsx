"use client";

import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
  },
  {
    id: "team" as const,
    name: "Team",
    price: "$79 / month",
    summary: "Tenant workspaces, collaborators, and a shared evidence trail.",
  },
];

function dateLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function monthLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
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
      ? Math.min(100, Math.round((billing.usage.used / billing.usage.limit) * 100))
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 pb-24 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-card pb-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-accent">
          <CreditCard className="size-4" aria-hidden="true" />
          Billing
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Subscription and plan access
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-foreground/75">
          Stripe Checkout handles payment details. LaunchLens stores only the
          subscription state required to enforce plan access.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link
            href="/pricing"
            className="rounded text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Pricing
          </Link>
          <Link
            href="/"
            className="rounded text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Product workspace
          </Link>
        </div>
      </header>

      {loading ? (
        <div
          className="flex min-h-40 items-center justify-center border-y border-card"
          aria-busy="true"
        >
          <Loader2 className="size-5 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">Loading billing status</span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-signal-challenges bg-signal-challenges p-4 text-sm text-signal-challenges"
        >
          {error}
        </div>
      ) : null}

      {!loading && billing ? (
        <>
          <section
            aria-labelledby="billing-status-heading"
            className="grid gap-5 border-b border-card pb-8 md:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                Current access
              </p>
              <h2
                id="billing-status-heading"
                className="mt-2 text-xl font-semibold text-foreground"
              >
                {billing.entitlement.activePlanName}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-md bg-signal-neutral px-2 py-1 text-signal-neutral">
                  {billing.entitlement.source}
                </span>
                <span className="rounded-md bg-input px-2 py-1 text-foreground/75">
                  {billing.entitlement.subscriptionStatus}
                </span>
                <span className="rounded-md bg-input px-2 py-1 text-foreground/75">
                  {billing.entitlement.access}
                </span>
              </div>
              {periodEnd ? (
                <p className="mt-3 text-sm text-muted">
                  Current period ends {periodEnd}
                  {billing.entitlement.cancelAtPeriodEnd
                    ? "; cancellation is scheduled."
                    : "."}
                </p>
              ) : null}
              {graceUntil ? (
                <p className="mt-2 text-sm font-medium text-signal-challenges">
                  Payment grace period ends {graceUntil}.
                </p>
              ) : null}
              {billing.usage ? (
                <div className="mt-5 max-w-xl rounded-md bg-input p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-foreground">
                        Live AI usage
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {usageMonth ?? "Current month"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-foreground">
                      {billing.usage.used}/{billing.usage.limit}
                    </p>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-card"
                    role="progressbar"
                    aria-label="Live AI usage"
                    aria-valuemin={0}
                    aria-valuemax={billing.usage.limit}
                    aria-valuenow={billing.usage.used}
                  >
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {billing.usage.remaining} remaining
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => void refresh(ownerToken)}
                disabled={!ownerToken || Boolean(busy)}
                title="Refresh billing status"
                aria-label="Refresh billing status"
                className="flex size-10 items-center justify-center rounded-md border border-input bg-card text-foreground/80 transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
              </button>
              {billing.subscription && billing.billing.portalEnabled ? (
                <button
                  type="button"
                  onClick={() => void openBilling("/api/commercial/portal")}
                  disabled={Boolean(busy)}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] disabled:opacity-50"
                >
                  {busy === "/api/commercial/portal" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ExternalLink className="size-4" aria-hidden="true" />
                  )}
                  Manage billing
                </button>
              ) : null}
            </div>
          </section>

          {!billing.billing.configured ? (
            <section className="flex items-start gap-3 rounded-md border border-dashed border-input bg-input p-4">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-accent"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Checkout is disabled on this deployment
                </h2>
                <p className="mt-1 text-sm leading-6 text-foreground/75">
                  The subscription contract is active, but this environment has
                  no complete Stripe sandbox or live configuration.
                </p>
              </div>
            </section>
          ) : null}

          <section aria-labelledby="billing-plans-heading" className="grid gap-4">
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
            <div className="grid gap-4 md:grid-cols-2">
              {checkoutPlans.map((plan) => {
                const subscribed =
                  billing.subscription?.planId === plan.id;
                const current =
                  billing.entitlement.source === "subscription" &&
                  billing.entitlement.activePlanId === plan.id &&
                  billing.entitlement.access !== "restricted";
                const canCheckout =
                  billing.billing.checkoutEnabled &&
                  canStartCommercialCheckout(
                    billing.subscription?.status,
                  ) &&
                  billing.billing.billablePlans.includes(plan.id);

                return (
                  <article
                    key={plan.id}
                    className="flex min-h-48 flex-col gap-3 rounded-lg border border-card bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {plan.name}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-accent">
                          {plan.price}
                        </p>
                      </div>
                      {current ? (
                        <CheckCircle2
                          className="size-5 text-accent"
                          aria-label="Current plan"
                        />
                      ) : null}
                    </div>
                    <p className="text-sm leading-6 text-foreground/75">
                      {plan.summary}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void openBilling("/api/commercial/checkout", {
                          planId: plan.id,
                        })
                      }
                      disabled={!canCheckout || Boolean(busy)}
                      className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-input px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  );
}
