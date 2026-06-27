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

It does not yet prove a paid commercial product:

- No real checkout.
- No subscription lifecycle.
- No conventional user identity or passkeys.
- No product analytics event model.
- No support/admin workflow.
- No long-term operational dashboard beyond committed eval artifacts and CI
  artifacts.

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
| Billing And Plan Limits | Plan matrix tied to quotas, tenant roles, and checkout events | Keeps pricing honest and connects UI claims to enforceable limits | Plan limits have code owners and migration notes |
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

- `/pricing` is a portfolio pricing page with mailto links.
- Cloud snapshots currently use account-level and global quotas.
- The public deployment does not collect payment details.

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

Required before implementation:

- Subscription state machine.
- Webhook idempotency plan.
- Quota-source precedence when billing data is delayed or unavailable.
- Failure copy for expired, unpaid, or quota-exceeded accounts.

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

- Real Stripe checkout.
- Real subscription webhooks.
- OAuth or passkey login.
- A support console.
- A production analytics warehouse.
- A legal/compliance package.

Those are implementation phases that should follow this readiness package. This
document exists so the next implementation can be scoped honestly instead of
turning portfolio polish into accidental product debt.
