# LaunchLens AI Release Candidate

Date: 2026-06-27 Asia/Shanghai

This document captures the current release-candidate state for moving
LaunchLens AI from local-only confidence to cloud-verifiable, demoable,
and handoff-ready operation.

## Candidate Deployment

- Historical preview deployment:
  https://launchlens-js93654w2-krogerhoxit-7182s-projects.vercel.app
- Historical preview inspect URL:
  https://vercel.com/krogerhoxit-7182s-projects/launchlens-ai/9cZdNrft7sjtNek8sqzMcNzArUDM
- Verified production demo URL:
  https://launchlens-ai-two.vercel.app
- Verified production deployment URL:
  https://launchlens-81kh3sk57-krogerhoxit-7182s-projects.vercel.app
- Verified production deployment id:
  `dpl_SPNDnKoJQaPD5SMRR27HwtMGq9os`
- Verified production git SHA:
  `a8982b4893a49bd40ed8b8322f09aab2dd5eb42e`

The preview deployment built successfully on Vercel with Next.js 16.2.9.
This team's preview deployment currently requires Vercel authentication,
so it is useful as a cloud build artifact but not as a public demo URL.
The current RC has now been promoted to the production alias and verified
against the public URL.

## Verified Gates

Local release gate:

```bash
npm run release:local
```

Observed result:

- `npm run quality` passed.
- Vitest passed 114 test files and 1051 tests.
- TypeScript typecheck passed.
- Mock provider eval passed.
- Mock decision eval passed.
- `next build` passed.
- `npm audit --audit-level=moderate` reported 0 vulnerabilities.
- Playwright e2e passed 17 tests.

Cloud database schema gate:

```bash
npm run verify:cloud-db
```

Observed result after migration:

- `configured: true`
- `ok: true`
- 5 tables checked.
- 29 columns checked.
- 10 indexes checked.
- 0 schema issues.

Public demo status gate:

```bash
npm run verify:public-demo
```

The gate requires `/api/status` to return LaunchLens JSON, report
`status: "ok"`, include a deployed `gitSha`, and show configured healthy
cloud storage. Set `LAUNCHLENS_EXPECTED_GIT_SHA` before production
promotion verification to prove the public demo is running the intended
commit, for example:

```bash
LAUNCHLENS_EXPECTED_GIT_SHA=$(git rev-parse --short HEAD) npm run verify:public-demo
```

Release evidence snapshot:

```bash
npm run verify:release-readiness
npm run evidence:release
```

The readiness verifier checks the production-stage handoff packet, workflow
guards, required scripts, docs, and ignored evidence output. The evidence
collector writes Markdown and JSON evidence under `output/release-evidence/`.
Before production promotion, a healthy public URL serving an older SHA is
classified as `promotion_pending`; after promotion, the same command should
classify the public URL as `production_verified`.

Hosted pre-promotion verification:

```text
Actions -> Release candidate verification -> Run workflow
```

This runs the local release gate on GitHub-hosted Ubuntu, then uploads the same
release evidence artifact without deploying production.

Cloud smoke gates against a production-mode local server connected to the
configured cloud database:

```bash
npm run smoke:cloud
npm run smoke:tenant
npm run smoke:rbac
```

Observed result:

- Workspace create, restore, recovery, previous-owner revocation, public
  share, private-data boundary, share disable, and cleanup passed.
- Recovery-owned workspaces are visible through tenant-scoped APIs.
- Share expiration timestamps round-trip through private and tenant APIs.
- Tenant A and Tenant B isolation passed.
- Cross-owner tenant access returned the expected forbidden/not-found state.
- RBAC invite, accept, viewer read, viewer share denial, and owner cleanup
  passed.

## Issues Found And Fixed

- The cloud database was missing `launchlens_workspaces.share_expires_at`.
  The schema verifier caught it, `npm run db:migrate` fixed it, and the
  verifier passed after migration.
- Workspace recovery migrated workspace ownership and membership but did
  not migrate tenant ownership. This made recovered workspaces disappear
  from tenant-scoped APIs. Recovery now migrates tenant ownership as well.
- Tenant creation rejected the second tenant for the same owner because the
  insert guard incorrectly blocked any owner with an existing tenant. The
  creation path now uses an owner-scoped advisory lock plus a quota check.
- Workspace and tenant list/read queries did not consistently return
  `share_expires_at`, weakening expiring-share verification. The queries
  now include the field.
- `smoke:cloud` and `smoke:tenant` now include stronger cloud-readiness
  assertions and best-effort cleanup for temporary workspaces.

## Production Verification

The RC has been promoted to production and verified with:

```bash
LAUNCHLENS_BASE_URL=https://launchlens-ai-two.vercel.app LAUNCHLENS_EXPECTED_GIT_SHA=a8982b4 npm run release:cloud
```

Observed result:

- `/api/status` returned LaunchLens JSON from the production URL.
- The public deployment reported git SHA
  `a8982b4893a49bd40ed8b8322f09aab2dd5eb42e`.
- `npm run db:migrate` completed idempotently.
- `npm run verify:cloud-db` passed with 5 tables, 29 columns, and 10 indexes.
- `npm run smoke:cloud` passed workspace create, restore, recovery,
  previous-owner revocation, tenant visibility, expiring share, privacy
  boundary, share disable, and cleanup.
- `npm run smoke:tenant` passed per-tenant isolation and cross-owner denial.
- `npm run smoke:rbac` passed invite, accept, viewer read, viewer share denial,
  and owner cleanup.
- `npm run evidence:release` reported `production_verified`.

Operational details for future promotion, post-promotion verification, and
rollback are tracked in `docs/PRODUCTION_RUNBOOK.md`. A reviewer-facing live
demo track is tracked in `docs/DEMO_SCRIPT.md`.

## Demo Path

Use `docs/DEMO_SCRIPT.md` for the full live portfolio walkthrough. The compact
path is:

1. Open the preview or production deployment.
2. Generate a workspace from a concise founder brief.
3. Show the Validation Board: search, filters, evidence, timeline, exports,
   and decision brief.
4. Save the workspace to cloud storage.
5. Enable a 7-day public share link.
6. Open the public share and point out that private founder input, evidence
   notes, and private decision brief details are not exposed.
7. Disable sharing and show the revoked-link state.
8. Mention the release gates: local quality, cloud DB verifier, cloud smoke,
   tenant isolation, and RBAC smoke.
