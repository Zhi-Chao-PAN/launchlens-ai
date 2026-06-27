# LaunchLens AI Commercial Readiness

LaunchLens AI is currently a production-verified portfolio product, not a paid
commercial SaaS. This document starts the next phase: converting the portfolio
artifact into a credible productization plan without pretending that billing,
identity, analytics, or support operations already exist.

Hosted readiness page:

```text
https://launchlens-ai-two.vercel.app/readiness
```

Related artifacts:

- `PROJECT_MATURITY.md` - honest maturity and re-entry cost.
- `docs/PORTFOLIO_CASE_STUDY.md` - reviewer-facing product case study.
- `docs/PRODUCTION_RUNBOOK.md` - production and rollback operations.
- `docs/DEMO_SCRIPT.md` - spoken demo path.

## Current Boundary

The current product proves the AI workflow and production engineering base:

- Founder brief -> structured GTM workspace -> validation evidence -> cited
  decision brief.
- Local persistence, private export, cloud snapshots, recovery keys, public
  privacy-safe shares, tenants, and RBAC smoke coverage.
- Deterministic mock mode by default, with optional server-side MiniMax and
  OpenAI-compatible providers.
- CI, hosted visual regression, CodeQL, cloud smoke, production browser e2e,
  release evidence, provider eval, and decision eval gates.

It does not yet prove an activated paid commercial product:

- Stripe Checkout, Portal, and signed webhook code now exist, but the public
  portfolio deployment does not claim an activated merchant account.
- Subscription lifecycle and idempotency are implemented, but an account-owned
  Stripe sandbox acceptance run is still required.
- No conventional user identity or passkeys.
- No product analytics event model.
- No support/admin workflow.
- No long-term operational dashboard beyond committed eval artifacts and CI
  artifacts.

The first true commercial substage is executable plan entitlements:
`docs/COMMERCIAL_ENTITLEMENTS.md`,
`src/lib/launchlens/commercial-entitlements.ts`, and
`/api/commercial/entitlements` define Free, Solo, and Team-preview limits
independently from the payment provider.

The second commercial substage is executable subscription billing:
`docs/COMMERCIAL_BILLING.md`, `/billing`,
`/api/commercial/subscription`, `/api/commercial/checkout`,
`/api/commercial/portal`, and `/api/webhooks/stripe` implement the hosted
Checkout, Portal, subscription-state, grace-period, and webhook-idempotency
path while remaining disabled without Stripe configuration.

The third commercial substage is live-provider usage metering:
`src/lib/launchlens/live-provider-usage.ts`, `/api/generate`, `/api/decision`,
and `/billing` enforce the plan's monthly live-provider allowance before real
provider calls are made.

The next phase should reduce this gap deliberately. The goal is not to ship
billing first. The goal is to make the re-entry path explicit enough that a
future implementation can be judged, estimated, and verified.

## Commercial Readiness Tracks

The phase is split into five tracks. Each track has a concrete artifact and a
gate that can be checked before implementation expands.

| Track | Near-term artifact | Why it matters | Gate |
| --- | --- | --- | --- |
| Reviewer Evidence Index | Public `/readiness` page and links to current verification commands | Lets a reviewer or future maintainer see the production proof path quickly | `npm run verify:commercial-readiness` |
| Identity And Tenant Model | Written migration plan from capability account to conventional account | Prevents billing work from colliding with owner-hash assumptions | Identity decisions documented before schema changes |
| Billing And Plan Limits | Executable entitlement and subscription contract tied to quotas and signed checkout events | Keeps pricing honest and connects billing state to enforceable limits | Billing domain, routes, webhook, migration, and `/billing` are tested |
| Onboarding And Activation | First-session path and activation event model | Turns the demo into a product funnel instead of a static workspace | Activation events and empty states are specified |
| Eval And Ops Visibility | Public-facing summary of eval history and release evidence | Shows AI quality is operated, not hand-waved | Eval and release evidence are linked from docs/pages |

## Reviewer Evidence Index

The first commercial-readiness deliverable is a public index that connects:

- Live production demo.
- Public case study.
- Pricing page.
- Cloud release gate.
- Production browser demo.
- Commercial readiness verifier.
- Decision history gate.
- Release evidence collection.

Minimum commands that must stay visible:

```bash
npm run verify:commercial-readiness
npm run verify:portfolio
npm run verify:production-demo
npm run release:cloud
npm run decision:history -- --window --size 5 --drift-threshold 5
```

This does not replace CI. It gives humans the shortest map from "what is this
project?" to "what proves this project is healthy?".

## Identity And Tenant Model

Current state:

- Anonymous browser owner token.
- Recovery handle + high-entropy recovery key.
- Server stores hashes, not plaintext owner credentials.
- Tenant and RBAC smoke tests exist, but the account model is still
  registration-free.

Commercial re-entry target:

- Conventional account identity or passkeys.
- Tenant membership anchored to user accounts rather than browser-only
  capability credentials.
- Explicit migration path for existing owner-scoped snapshots.
- Account deletion, ownership transfer, and audit semantics.

Open design decisions:

- Whether the capability account remains as a low-friction anonymous trial.
- Whether billing belongs to the tenant or to a user-owned workspace.
- How recovery keys map to passkey or OAuth identities after upgrade.
- How public share links behave when a workspace changes tenant ownership.

Required before implementation:

- A schema migration note for owner hash -> account + tenant ownership.
- Route-level authorization matrix for owner, editor, viewer, billing admin,
  and support/admin roles.
- Compatibility plan for existing recovery-key snapshots.

## Billing And Plan Limits

Current state:

- `/pricing` links to the operational `/billing` surface.
- Cloud snapshots, tenants, and workspace members now read from the commercial
  entitlement contract.
- Public share limits and persisted subscription state also feed enforcement.
- The public deployment defaults to Team preview so tenant/RBAC smoke tests
  remain exercisable without live billing.
- Hosted Stripe Checkout and the customer portal are implemented but remain
  disabled unless the deployment has complete Stripe configuration.
- Signed subscription events are idempotent, reject stale updates, and persist
  cancellation, unpaid, trial, current-period, and grace-period state.
- Live-provider usage is metered by owner and UTC month for workspace
  generation and decision briefs.

Executable artifact:

- `docs/COMMERCIAL_ENTITLEMENTS.md`
- `src/lib/launchlens/commercial-entitlements.ts`
- `src/app/api/commercial/entitlements/route.ts`
- `/api/commercial/entitlements`
- `docs/COMMERCIAL_BILLING.md`
- `src/lib/launchlens/commercial-subscription.ts`
- `src/lib/launchlens/commercial-subscription-store.ts`
- `src/lib/launchlens/live-provider-usage.ts`
- `src/lib/launchlens/stripe-server.ts`
- `/billing`
- `/api/generate`
- `/api/decision`
- `/api/commercial/subscription`
- `/api/commercial/checkout`
- `/api/commercial/portal`
- `/api/webhooks/stripe`

Commercial re-entry target:

- A plan model that maps pricing claims to enforceable product behavior.
- Checkout, subscription status, billing portal, cancellation, and grace-period
  handling.
- Tenant-scoped limits for saved workspaces, collaborators, live-provider
  usage, public shares, and eval history retention.

Initial plan envelope:

| Plan | Intended customer | Enforced limits to define before checkout |
| --- | --- | --- |
| Free demo | Reviewer or early founder trying the workflow | Local draft, mock provider, limited cloud history, no paid provider quota |
| Solo | One founder validating a product idea | Per-account cloud history, recovery, live-provider allowance, public shares |
| Team | Small product team | Tenant workspaces, members, role permissions, shared evidence trail |

Completed in this substage:

- Free, Solo, and Team preview limits have a single source of truth.
- Workspace snapshot, tenant, and member invite limits consume that source.
- The reviewer-safe entitlement API exposes limits without credentials or
  billing data.
- Focused Vitest coverage proves default plan resolution, env override,
  stable `commercial_plan_limit_reached` behavior, and API output.
- The subscription state machine distinguishes preview, full, grace, and
  restricted access.
- Persisted subscription state takes precedence over the preview plan.
- Stripe Checkout, Portal, and raw-body signature verification are implemented
  with lazy SDK initialization.
- Durable event IDs prevent duplicate application, and event timestamps prevent
  stale webhook state from replacing newer state.
- Cancellation, unpaid, paused, incomplete, and expired grace states resolve to
  Free restrictions.
- Billing UI and API error copy expose configuration and state without exposing
  customer IDs, subscription IDs, owner hashes, or secrets.
- `/api/generate` and live `/api/decision` consume
  `launchlens_live_provider_usage` slots before provider calls, with an
  advisory lock protecting monthly quota concurrency.
- `/api/commercial/subscription` returns a credential-safe monthly usage
  summary for `/billing`.

Still required before accepting real payments:

- Complete an account-owned Stripe sandbox checkout and signed webhook run.
- Provision recurring prices and secrets in the intended production project.
- Register and verify the production webhook destination.
- Complete the identity and tenant-ownership migration plan.
- Add retained decision-history enforcement before its retention window is
  billable.

## Onboarding And Activation

Current state:

- The app opens directly into the workspace.
- A quick-start guide explains the main interaction.
- Stable sample briefs make the demo repeatable.

Commercial re-entry target:

- A first-session flow that distinguishes reviewer, founder, and team
  evaluator intent.
- Activation milestones that can be measured without logging sensitive founder
  input.
- Clear re-entry prompts for saving, recovering, sharing, and inviting.

Activation events to design:

- First workspace generated.
- First validation evidence recorded.
- First cited decision brief generated.
- First cloud snapshot saved.
- First public share enabled.
- First collaborator invited or accepted.

Privacy rule:

Analytics must never record founder brief text, evidence notes, evidence
sources, owner credentials, recovery keys, provider payloads, or private
decision briefs.

## Eval And Ops Visibility

Current state:

- Provider eval and decision eval run in CI.
- Decision history and a static dashboard exist as artifacts.
- Hosted visual regression and cloud smoke are already wired.

Commercial re-entry target:

- A visible operations page or release-note surface that summarizes current AI
  quality gates, latency risk, release status, and failure ownership.
- Clear distinction between mock-mode quality, live-provider fixture quality,
  and production runtime health.

Near-term visibility tasks:

- Link the latest CI, visual regression, and release evidence from the
  readiness page.
- Add a human-readable explanation of decision drift thresholds.
- Decide whether latency drift belongs in committed fixtures, hosted artifacts,
  or database-backed telemetry.

## Security And Compliance Re-entry

Commercialization changes the security model because account identity, billing,
and support access create new sensitive surfaces.

Before paid launch, the project needs:

- Threat model update for checkout, webhooks, account linking, and support
  access.
- Tenant-aware audit log strategy.
- Data retention and deletion policy.
- Abuse controls for anonymous trials and public shares.
- Support access policy that avoids exposing founder briefs and evidence notes.

The existing privacy projection and secret-free CI posture should stay intact:
public shares must continue to exclude founder input, evidence notes, evidence
sources, owner credentials, and private decision briefs.

## Acceptance Gate

This phase is accepted only when all of the following are true:

- `npm run verify:commercial-readiness` passes.
- The entitlement contract tests pass:
  `npx vitest run src/lib/launchlens/commercial-entitlements.test.ts src/app/api/commercial/entitlements/route.test.ts`.
- The billing lifecycle tests pass:
  `npx vitest run src/lib/launchlens/commercial-subscription.test.ts src/lib/launchlens/stripe-billing.test.ts src/lib/launchlens/stripe-server.test.ts src/app/api/commercial/subscription/route.test.ts src/app/api/commercial/checkout/route.test.ts src/app/api/commercial/portal/route.test.ts src/app/api/webhooks/stripe/route.test.ts`.
- The live-provider metering tests pass:
  `npx vitest run src/lib/launchlens/live-provider-usage.test.ts src/app/api/generate/route.live-usage.test.ts src/app/api/decision/route.live-usage.test.ts`.
- `npm run verify:portfolio` passes.
- `npm run verify:release-readiness` passes.
- `npm run verify:production-demo` passes after the public deployment updates.
- `npm run release:cloud` passes against a database-enabled production target.
- The README, case study, demo script, maturity note, roadmap, and task list all
  link to this commercial readiness plan.
- The hosted `/readiness` page links back to this document and exposes the
  verification trail.

## Non-goals

This phase does not pretend to ship:

- An activated live Stripe merchant account or completed external sandbox run.
- OAuth or passkey login.
- A support console.
- A production analytics warehouse.
- A legal/compliance package.

Those are implementation phases that should follow this readiness package. This
document exists so the next implementation can be scoped honestly instead of
turning portfolio polish into accidental product debt.
