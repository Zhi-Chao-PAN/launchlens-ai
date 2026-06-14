# LaunchLens AI v1.0.0

First stable portfolio release for the UTS Master of AI application.

## What this is

LaunchLens AI is an AI-powered SaaS workspace for solo founders and small product teams. It turns a raw product brief into an editable go-to-market plan, an evidence loop (hypothesis -> observation -> confidence -> decision), and an evidence-grounded AI decision brief with per-claim citations.

- Always runs without secrets via the deterministic mock provider.
- Optional real providers: MiniMax Token Plan (preferred) and OpenAI-compatible chat completions.
- Optional Neon Postgres for cloud history, recovery-key account linking, and privacy-safe public sharing.

## Portfolio release highlights

- **Three connected AI SaaS workflow stages**: structured GTM generation, evidence validation, evidence-bound decision synthesis.
- **Provider abstraction with real safety guardrails**: HTTPS base URL validation, host allowlists, request timeouts, field caps, body caps, demo rate limit, safe parser, structured output validation, and safe fallback codes.
- **Decision copilot with anti-hallucination controls**: every claim must cite an evidence ID; source fingerprint is re-checked at read time; real provider output is rejected if incomplete; eval gate covers citation fidelity, source match, recommendation direction, and no-fallback behavior.
- **Persistence and ownership**: 20-snapshot account quota, transaction-level global capacity, advisory locks on owner migration, hashed credentials, distributed mutation limit, and a recovery-key account that does not depend on email/password.
- **Multi-tenant foundation (P3)**: owner-scoped `launchlens_tenants` table, default tenant auto-created for new owners, tenant-scoped API routes, and a 6-step smoke covering cross-tenant and cross-owner isolation.
- **Team roles and collaboration (P2)**: 7-step RBAC smoke covering invite, accept, role-aware reads, viewer denial, and owner-only deletion.
- **Eval retention and drift gate (P1)**: per-run history, sliding-window drift threshold, static decision dashboard, and a 90-day retention policy.
- **Hosted pricing page (P0)**: three transparent tiers, public link, and visual regression coverage.
- **Production engineering**: GitHub Actions CI, hosted visual regression workflow with committed baselines, lockfile discipline across Windows and Ubuntu runners, and zero-warning lint.

## Documentation map

- `README.md` - product story, demo flow, provider and cloud design, security boundaries, run locally, validate, case-study framing.
- `ARCHITECTURE.md` - product, persistence, and security diagrams in one place.
- `ROADMAP.md` - phased plan and acceptance criteria.
- `TASKS.md` - executed task ledger per phase.
- `PROJECT_MATURITY.md` - portfolio release evidence, deliberate non-blocking enhancements, and the honest re-entry cost to convert this to a paying product.
- `NIGHTLY_LOG.md` - per-cycle build diary (with the disclaimer that this is hand-written, not cron output).

## Verification on this tag

- `npx tsc --noEmit` -> 0 errors.
- `npm run lint` -> 0 warnings.
- `npm test` -> 96 tests in 29 files, all green.
- `npm run build` -> production build succeeds with 15 routes (3 static, 12 dynamic).
- GitHub Actions: CI success, Hosted visual regression success. Cloud smoke (optional) is skip-on-missing-secret by design.

## Deliberately out of scope for the portfolio release

- Real billing, hosted paid pricing, per-tenant quota plans.
- OAuth / passkey / SSO identity.
- Long-running hosted eval retention (the eval gate ships; the 90-day retention/dashboard is a static artifact).
- Real-time collaboration cursors, comments, and notifications beyond the existing P2 primitives.

Re-entry cost to convert this to a real commercial SaaS is estimated at 6 to 10 weeks for a small team; see `PROJECT_MATURITY.md` for the breakdown.

## Demo and live deployment

- Live demo: https://launchlens-ai-two.vercel.app
- Repository: https://github.com/Zhi-Chao-PAN/launchlens-ai
