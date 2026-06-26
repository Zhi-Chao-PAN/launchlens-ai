# LaunchLens AI Release Candidate

Date: 2026-06-27 Asia/Shanghai

This document captures the current release-candidate state for moving
LaunchLens AI from local-only confidence to cloud-verifiable, demoable,
and handoff-ready operation.

## Candidate Deployment

- Preview deployment:
  https://launchlens-js93654w2-krogerhoxit-7182s-projects.vercel.app
- Inspect URL:
  https://vercel.com/krogerhoxit-7182s-projects/launchlens-ai/9cZdNrft7sjtNek8sqzMcNzArUDM
- Production demo URL currently listed in the README:
  https://launchlens-ai-two.vercel.app

The preview deployment built successfully on Vercel with Next.js 16.2.9.
This team's preview deployment currently requires Vercel authentication,
so it is useful as a cloud build artifact but not as a public demo URL.
It has not been promoted to the production alias in this RC snapshot.

## Verified Gates

Local release gate:

```bash
npm run release:local
```

Observed result:

- `npm run quality` passed.
- Vitest passed 111 test files and 1040 tests.
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

## Current Known Gap

The current production URL is healthy, but it is still serving the previous
production commit until this RC is explicitly promoted. The SHA-aware public
demo gate is expected to fail before promotion when it is pointed at the
current RC commit:

```text
Public demo gitSha <previous-production-sha> does not match expected <current-rc-sha>.
```

This is the right failure mode: it proves the public URL is alive, but it also
prevents an older deployment from being mistaken for the current RC. The
database schema is already migrated and verified; the remaining gap is
production code parity.

The preview URL also cannot be used as the public release gate target
because `/api/status` returns the Vercel authentication page rather than
the LaunchLens API JSON. Production promotion is therefore required before
the public demo URL can be called cloud-verified.

Operational details for promotion, post-promotion verification, and rollback
are tracked in `docs/PRODUCTION_RUNBOOK.md`. A reviewer-facing live demo track
is tracked in `docs/DEMO_SCRIPT.md`.

## Promotion Checklist

Before calling this RC production-ready:

1. Promote or deploy the current RC code to the production alias.
2. Run:

```bash
LAUNCHLENS_BASE_URL=https://launchlens-ai-two.vercel.app LAUNCHLENS_EXPECTED_GIT_SHA=$(git rev-parse --short HEAD) npm run release:cloud
```

3. Confirm the GitHub `Cloud smoke (optional)` workflow has
   `LAUNCHLENS_SMOKE_DATABASE_URL` configured as a secret.
4. Run the workflow manually or through a main-branch push.
5. Keep `npm run release:local` green before any production promotion.

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
