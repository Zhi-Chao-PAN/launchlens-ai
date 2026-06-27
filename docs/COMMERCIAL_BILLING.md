# LaunchLens AI Commercial Billing

LaunchLens has an executable Stripe subscription path. The code is safe to
deploy without Stripe credentials: the public product remains on its configured
preview entitlement until a signed Stripe subscription event is persisted.

This document describes implemented behavior. It does not claim that the public
portfolio deployment has an activated merchant account.

## Implemented Surface

- `/billing` shows the current entitlement, subscription state, and current
  live-provider usage.
- `GET /api/commercial/subscription` returns a credential-safe account summary.
- `POST /api/commercial/checkout` creates hosted Stripe Checkout sessions.
- `POST /api/commercial/portal` creates Stripe customer portal sessions.
- `POST /api/webhooks/stripe` verifies the raw-body Stripe signature before
  processing subscription events.
- `launchlens_commercial_subscriptions` stores the latest account subscription.
- `launchlens_billing_events` provides durable event idempotency.
- `launchlens_live_provider_usage` stores owner-scoped monthly live-provider
  usage for workspace generation and decision briefs.

Card details remain on Stripe-hosted pages. LaunchLens stores provider customer
and subscription identifiers only on the server.

## State And Entitlement Precedence

Persisted billing state always takes precedence over
`LAUNCHLENS_COMMERCIAL_PLAN`.

| Stripe state | Effective access |
| --- | --- |
| `active`, `trialing` | Full persisted Solo or Team plan |
| `past_due` before `grace_until` | Persisted plan with `grace` access |
| `past_due` after grace | Free restrictions |
| `incomplete`, `incomplete_expired` | Free restrictions |
| `paused`, `unpaid`, `canceled` | Free restrictions |
| No subscription row | Configured preview envelope |

The first `past_due` event starts a fixed seven-day grace period. Later
`past_due` events retain that deadline instead of extending it.

Accounts with an existing `active`, `trialing`, `past_due`, `incomplete`,
`unpaid`, or `paused` subscription must use the billing portal instead of
opening a second subscription. A new Checkout session is available only after
`canceled` or `incomplete_expired`.

## Webhook Safety

The route reads the unmodified request body and verifies `Stripe-Signature`
with the official Stripe SDK. A valid event is claimed by the compound primary
key `(provider, event_id)` before subscription state changes.

Each subscription row records `latest_event_created_at` and `latest_event_id`.
Older events are retained as `stale` but cannot overwrite newer state. Duplicate
deliveries return success without applying the event twice. Unknown tenants or
invalid LaunchLens metadata are ignored without granting access.

## Live Provider Usage Metering

When `LAUNCHLENS_PROVIDER_LIVE_ENABLED=true` and a real provider is configured,
`/api/generate` consumes one `workspace_generation` slot before calling the
provider. `/api/decision` consumes one `decision_brief` slot only when
`DECISION_COPILOT_LIVE_ENABLED` is `true` and a real provider is configured.
Mock/demo requests do not consume monthly allowance.

The meter resolves the caller's persisted subscription entitlement, locks the
owner and UTC month with `pg_advisory_xact_lock`, and increments
`launchlens_live_provider_usage` only when the plan still has remaining
`liveProviderRunsPerMonth` capacity. If live provider mode is enabled without
cloud metering, the API returns `usage_meter_unavailable` instead of allowing
unbounded provider spend.

The implementation follows Stripe guidance for [webhook signature
verification](https://docs.stripe.com/webhooks) and [subscription webhook
events](https://docs.stripe.com/billing/subscriptions/webhooks).

## Configuration

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_SOLO=
STRIPE_PRICE_TEAM=
NEXT_PUBLIC_APP_URL=https://your-domain.example
```

Checkout is enabled only when the secret key, webhook secret, and both recurring
price IDs are present. `NEXT_PUBLIC_APP_URL` must be HTTPS outside local
development.

Create a Stripe event destination for:

```text
https://your-domain.example/api/webhooks/stripe
```

Subscribe to:

```text
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
```

Checkout writes `launchlensTenantId` and `launchlensPlanId` to the underlying
Subscription metadata. Current Stripe price IDs take precedence over metadata
when a customer changes plan in the portal.

## Verification

```bash
npx vitest run src/lib/launchlens/commercial-subscription.test.ts src/lib/launchlens/stripe-billing.test.ts src/lib/launchlens/stripe-server.test.ts
npx vitest run src/app/api/commercial/subscription/route.test.ts src/app/api/commercial/checkout/route.test.ts src/app/api/commercial/portal/route.test.ts src/app/api/webhooks/stripe/route.test.ts
npx vitest run src/lib/launchlens/live-provider-usage.test.ts src/app/api/generate/route.live-usage.test.ts src/app/api/decision/route.live-usage.test.ts
npm run db:migrate
npm run verify:cloud-db
npm run verify:commercial-readiness
```

An external Stripe sandbox checkout remains an environment acceptance step. It
requires account-owned test keys, recurring prices, a registered webhook
endpoint, and a successful signed event delivery.

## Remaining Commercial Work

- Replace or wrap the capability account with conventional identity.
- Define billing-admin and support roles independent of workspace roles.
- Add retained decision-history enforcement before treating retention windows
  as billable enforcement.
- Add audit and support workflows for refunds, disputes, ownership transfer,
  deletion, and account recovery.
- Run and archive an account-owned Stripe sandbox and production activation
  checklist.
