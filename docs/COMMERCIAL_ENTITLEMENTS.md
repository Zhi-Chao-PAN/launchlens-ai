# LaunchLens AI Commercial Entitlements

This document defines the first executable commercial substage for LaunchLens
AI. The product is still a portfolio/public-preview deployment, not a paid SaaS,
but plan limits are now represented in code and consumed by product flows.

Authoritative code:

- `src/lib/launchlens/commercial-entitlements.ts`
- `src/lib/launchlens/commercial-subscription.ts`
- `src/lib/launchlens/commercial-subscription-store.ts`
- `src/lib/launchlens/live-provider-usage.ts`
- `src/lib/launchlens/stripe-server.ts`
- `src/app/api/commercial/entitlements/route.ts`
- `src/app/api/commercial/subscription/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/lib/launchlens/commercial-entitlements.test.ts`
- `src/lib/launchlens/live-provider-usage.test.ts`
- `src/app/api/commercial/entitlements/route.test.ts`

Billing operations and deployment configuration are documented in
`docs/COMMERCIAL_BILLING.md`.

Reviewer-safe API:

```text
/api/commercial/entitlements
```

## Active Preview Plan

The default public deployment resolves to the `team` preview envelope.

Reason: the hosted reviewer build must keep tenant isolation, RBAC invites,
cloud history, and smoke tests exercisable without pretending Stripe checkout is
live. A persisted Stripe subscription takes precedence over this preview.

The active plan can be changed later with:

```text
LAUNCHLENS_COMMERCIAL_PLAN=free|solo|team
```

`LAUNCHLENS_COMMERCIAL_PLAN` takes precedence over
`NEXT_PUBLIC_LAUNCHLENS_COMMERCIAL_PLAN`. Unknown values fall back to the Team
preview default.

## Plan Matrix

| Plan | Checkout status | Cloud snapshots | Tenants | Members per workspace | Live-provider allowance |
| --- | --- | ---: | ---: | ---: | ---: |
| Free demo | not wired | 0 | 0 | 1 | 0 |
| Solo | Stripe-ready | 20 | 1 | 1 | 100/month |
| Team | Stripe-ready | 20 | 5 | 10 | 500/month |

## Enforced Today

The entitlement contract is already consumed by:

- cloud workspace list and create limits;
- tenant creation limits;
- tenant-scoped workspace create limits;
- workspace member invite capacity;
- public share-link capacity;
- live-provider monthly usage capacity;
- persisted subscription precedence and cancellation restrictions;
- pricing and readiness public pages;
- reviewer-safe entitlement API output.

Checkout, portal, signed webhooks, event idempotency, fixed grace periods, and
subscription storage are implemented. They remain disabled on deployments that
do not provide a complete Stripe configuration.

## Still Pending

Real commercialization still needs:

- account-owned Stripe sandbox and production activation evidence;
- account identity, passkeys or OAuth, and tenant ownership migration;
- retained decision-history enforcement;
- billing-admin, support, refund, dispute, and audit workflows.

These remain tracked in `docs/COMMERCIAL_READINESS.md`.

## Verification

Run:

```bash
npx vitest run src/lib/launchlens/commercial-entitlements.test.ts src/app/api/commercial/entitlements/route.test.ts
npx vitest run src/lib/launchlens/live-provider-usage.test.ts src/app/api/generate/route.live-usage.test.ts src/app/api/decision/route.live-usage.test.ts
npm run verify:commercial-readiness
```

The commercial readiness verifier requires this document, the entitlement
source, the entitlement API, and their tests to remain linked from the public
readiness package.
