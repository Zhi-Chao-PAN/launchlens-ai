# LaunchLens AI Commercial Entitlements

This document defines the first executable commercial substage for LaunchLens
AI. The product is still a portfolio/public-preview deployment, not a paid SaaS,
but plan limits are now represented in code and consumed by product flows.

Authoritative code:

- `src/lib/launchlens/commercial-entitlements.ts`
- `src/app/api/commercial/entitlements/route.ts`
- `src/lib/launchlens/commercial-entitlements.test.ts`
- `src/app/api/commercial/entitlements/route.test.ts`

Reviewer-safe API:

```text
/api/commercial/entitlements
```

## Active Preview Plan

The default public deployment resolves to `team`.

Reason: the hosted reviewer build must keep tenant isolation, RBAC invites,
cloud history, and smoke tests exercisable without pretending Stripe checkout is
live. The plan is therefore a Team preview entitlement, not a paid Team
subscription.

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
| Solo | manual intake | 20 | 1 | 1 | 100/month |
| Team preview | manual intake | 20 | 5 | 10 | 500/month |

## Enforced Today

The entitlement contract is already consumed by:

- cloud workspace list and create limits;
- tenant creation limits;
- tenant-scoped workspace create limits;
- workspace member invite capacity;
- pricing and readiness public pages;
- reviewer-safe entitlement API output.

The current implementation intentionally does not create billing records or
customer identities. It turns pricing claims into a single tested source of
truth so checkout can be added without scattering plan constants through the
workspace code.

## Still Pending

Real commercialization still needs:

- Stripe checkout and billing portal;
- subscription status storage;
- webhook idempotency;
- cancellation, unpaid, trial, and grace-period behavior;
- quota-source precedence when billing data is unavailable;
- account identity, passkeys or OAuth, and tenant ownership migration.

These remain tracked in `docs/COMMERCIAL_READINESS.md`.

## Verification

Run:

```bash
npx vitest run src/lib/launchlens/commercial-entitlements.test.ts src/app/api/commercial/entitlements/route.test.ts
npm run verify:commercial-readiness
```

The commercial readiness verifier requires this document, the entitlement
source, the entitlement API, and their tests to remain linked from the public
readiness package.
