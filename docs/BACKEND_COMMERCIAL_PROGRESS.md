# Backend Commercial Progress

Snapshot date: 2026-06-27

This record captures the accepted backend/commercial state after the latest
backend push and before the current frontend productization stage continues.
Use it as a resume point for future backend work; do not treat current frontend
productization edits as backend completion evidence.

## Current Accepted Backend State

Latest accepted backend/commercial commit:

```text
d6da4ff feat: enforce live provider monthly usage
```

Accepted capabilities at that commit:

- Stripe-ready subscription core with hosted Checkout and Billing Portal routes.
- Signed Stripe webhook handling with durable event idempotency and stale-event
  protection.
- Hosted pricing and billing UI surfaces, including `/pricing` -> `/billing`.
- Tenant, RBAC, workspace, member, public-share, and plan-limit enforcement
  through the commercial entitlement contract.
- Monthly live-provider metering in `launchlens_live_provider_usage`.
- `workspace_generation` and `decision_brief` usage gates before live provider
  calls.
- Explicit `LAUNCHLENS_PROVIDER_LIVE_ENABLED` opt-in for real provider usage.
- Credential-safe billing usage summary for the billing surface.
- Commercial readiness verifier and cloud DB schema verifier.

Boundary:

- The backend/commercial infrastructure is Stripe-ready and usage-metered.
- The public portfolio deployment does not claim an activated live Stripe
  merchant account.
- The frontend productization stage is now separate work in progress and should
  not be mixed into this backend acceptance record.

## Verification Ledger

Accepted verification for commit `d6da4ff`:

| Gate | Result |
| --- | --- |
| `npm run quality` | Passed |
| Browser e2e | Passed, 21/21 |
| `npm run db:migrate` | Passed |
| `npm run verify:cloud-db` | Passed |
| `npm run release:cloud` | Passed |
| Production demo | Verified against `https://launchlens-ai-two.vercel.app` with SHA `d6da4ff` |
| GitHub Actions | Green |

Keep this ledger historical. Future backend changes should append a new dated
entry or create a successor record rather than weakening the accepted state
above.

## Operational Flags And Env Boundaries

- `LAUNCHLENS_PROVIDER_LIVE_ENABLED=true` is required before workspace
  generation can consume live-provider monthly allowance.
- `DECISION_COPILOT_LIVE_ENABLED=true` is separately required before decision
  briefs consume live-provider monthly allowance.
- Stripe checkout and portal activation require complete Stripe settings:
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SOLO`,
  `STRIPE_PRICE_TEAM`, and a valid HTTPS `NEXT_PUBLIC_APP_URL` outside local
  development.
- Persisted Stripe subscription state takes precedence over the public preview
  plan envelope.
- If live provider mode is enabled without cloud metering, API behavior should
  fail closed with `usage_meter_unavailable` rather than allow unbounded spend.
- No secrets, account credentials, webhook secrets, provider keys, or remote
  control URLs belong in this document or future progress notes.

## Open Backend Risks And Gaps

- Real account-owned Stripe sandbox and production activation evidence.
- Conventional identity and account-owned tenant migration.
- Billing-admin, support, refund, dispute, ownership-transfer, deletion,
  recovery, and audit workflows.
- Retained decision-history enforcement before retention windows are treated as
  billable behavior.
- Production analytics, observability, operator dashboards, and incident loops.
- Real customer onboarding, support intake, and post-activation feedback loops.

## Suggested Next Backend Stage

After the frontend productization stage lands and is verified, resume backend
work as a separate commercial activation stage:

1. Freeze the frontend productization acceptance point and confirm it did not
   change backend contract assumptions.
2. Write the identity/account migration design before schema or route changes.
3. Run an account-owned Stripe sandbox checkout and signed webhook acceptance
   flow; archive the evidence outside secrets.
4. Add billing-admin, support/admin, audit, ownership-transfer, and account
   recovery workflow designs before implementation.
5. Decide the production analytics and observability event model with privacy
   constraints for founder input, evidence notes, provider payloads, and
   recovery credentials.
6. Implement retained decision-history enforcement and quota reconciliation.
7. Re-run the backend gate set: `npm run quality`, browser e2e,
   `npm run db:migrate`, `npm run verify:cloud-db`, `npm run release:cloud`,
   `npm run verify:commercial-readiness`, production demo verification, and
   GitHub Actions.

## ZCode Note

ZCode job `zjob_20260627104038_f04caa43` is still running for a billing DB
smoke script. It has not been collected, reviewed, or accepted. Do not use that
job as verification evidence until Codex collects the result, checks the actual
diff, and runs the relevant local validation gates.
