# LaunchLens AI Portfolio Case Study

LaunchLens AI is a production-deployed AI SaaS portfolio project for showing
full-stack AI product engineering: product framing, model-bound workflow design,
cloud persistence, privacy boundaries, evaluation, and release operations.

Live demo:

```text
https://launchlens-ai-two.vercel.app
```

Hosted reviewer page:

```text
https://launchlens-ai-two.vercel.app/case-study
```

## Reviewer Quick Path

Use this path when you have 10 to 15 minutes:

1. Open the hosted case-study page at `/case-study`.
2. Open the live demo.
3. Choose the `B2B SaaS activation` sample brief.
4. Generate the workspace.
5. Open the Validation Board and inspect a supported, testing, and refuted
   hypothesis.
6. Inspect or regenerate the cited AI decision brief.
7. Save a cloud snapshot, enable a public share, then verify that private
   evidence notes and founder input are excluded from the share page.
8. Scan the release evidence map below to see how the project is verified.

For a spoken walkthrough, use `docs/DEMO_SCRIPT.md`.

## Problem

Early founders often jump from a product idea to feature building before they
have a clear target user, painful switching reason, launch plan, or evidence
loop. Generic chat output can help with ideation, but it usually leaves the
operator with an unstructured transcript and no durable path from assumptions
to decisions.

## Product Answer

LaunchLens turns a founder brief into a structured go-to-market workspace and
then keeps the human validation loop attached to the generated plan.

The core loop is:

```text
founder brief -> GTM workspace -> validation evidence -> cited AI decision
              -> execution task -> private snapshot/share/export
```

The important product choice is that the model does not own the whole truth.
The generation provider proposes the workspace. Human evidence is recorded
after generation. The decision copilot can only cite evidence IDs that already
exist in the selected experiment.

## What It Demonstrates

### AI Product Engineering

- Deterministic no-secret mock mode for reviewers.
- Optional MiniMax and OpenAI-compatible providers through server-side
  environment variables only.
- Provider host allowlists, request timeouts, body caps, schema validation,
  JSON repair, and safe fallback codes.
- Separate generation and decision-copilot workflows so evidence reasoning is
  not hidden inside the first prompt.
- Repeatable provider and decision eval scripts.

### Full-Stack SaaS Shape

- Next.js App Router with TypeScript route handlers.
- Browser-local persistence that works without cloud secrets.
- Optional Neon Postgres cloud snapshot history.
- Registration-free capability recovery with client-side key derivation.
- Privacy-safe public shares that intentionally exclude founder input,
  evidence notes, evidence sources, owner credentials, and private decision
  briefs.
- Tenant isolation and RBAC smoke coverage for the cloud path.

### Release And Operations

- Local quality gate: lint, tests, typecheck, provider eval, decision eval,
  build, and audit.
- Cloud release gate: public status check, idempotent migration, database
  schema verifier, workspace smoke, tenant smoke, and RBAC smoke.
- Production demo gate: public `/api/status` plus Playwright browser e2e
  against the live production URL.
- GitHub post-promotion workflow that repeats the cloud and browser gates in a
  hosted Ubuntu runner.
- Release evidence collector that writes ignored Markdown and JSON artifacts.

## Architecture Map

Read `ARCHITECTURE.md` for the full diagrams. The short version:

```text
Client workspace
  -> /api/generate
  -> provider runtime
  -> editable GTM workspace
  -> validation board
  -> /api/decision
  -> cited decision brief
  -> local storage / Neon snapshots / public share projection
```

The persistence model uses owner-scoped records and server-only database code.
Runtime routes use DML only; schema changes are isolated in
`npm run db:migrate`.

## Evidence Map

| Claim | Evidence |
| --- | --- |
| Public case-study page is live | `https://launchlens-ai-two.vercel.app/case-study` |
| Public demo is live | `npm run verify:public-demo` |
| Production browser demo works | `npm run verify:production-demo` |
| Cloud database contract is intact | `npm run verify:cloud-db` |
| Save, restore, recovery, privacy share, and cleanup work | `npm run smoke:cloud` |
| Tenant isolation works | `npm run smoke:tenant` |
| RBAC invite/read/mutation boundaries work | `npm run smoke:rbac` |
| Cloud release gate is reproducible end to end | `npm run release:cloud` |
| Local release gate is reproducible | `npm run release:local` |
| Portfolio docs and public case-study page stay connected | `npm run verify:portfolio` |
| Release handoff stays connected | `npm run verify:release-readiness` |
| Operator process is documented | `docs/PRODUCTION_RUNBOOK.md` |
| Demo narrative is documented | `docs/DEMO_SCRIPT.md` |
| Production release packet is documented | `docs/PRODUCTION_RELEASE_PACKET.md` |

## Design Tradeoffs

### Why capability recovery instead of OAuth?

The portfolio artifact optimizes for a frictionless reviewer demo. A visitor can
use the product without creating an account, while still proving that cloud
history can be recovered on another browser. The server stores only hashes, and
the recovery key is not persisted by the app.

OAuth, passkeys, billing, and organization management are commercial product
work. Their re-entry cost is documented in `PROJECT_MATURITY.md`.

### Why mock mode first?

The project must be inspectable from a fresh clone without secrets. Mock mode is
not a toy fallback; it is the deterministic review path that keeps CI, local
testing, screenshots, and demo behavior stable. Live provider evals remain
explicit opt-in commands.

### Why not expose evidence notes publicly?

Founder input, raw evidence notes, and sources can contain sensitive research
or customer information. Public shares show validation status, confidence,
decisions, next actions, linked tasks, and evidence counts, but not private
details.

## Current Maturity

The current milestone is portfolio-ready and production-verified. It is strong
enough for a reviewer to inspect as a serious AI product engineering artifact.

It is not yet a paid commercial SaaS. The next commercial slice would need:

- Conventional account identity or passkeys.
- Tenant billing and plan quotas.
- Team comments and ownership transfer.
- Long-term eval and latency dashboards.
- Product analytics and user onboarding metrics.

The practical next stage for the portfolio is not more feature sprawl. It is to
make the artifact easier to judge: sharper case study, stronger evidence links,
repeatable hosted verification, and a cleaner reviewer handoff.
