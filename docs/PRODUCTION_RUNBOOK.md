# LaunchLens AI Production Runbook

Date: 2026-06-27 Asia/Shanghai

This runbook turns the current release candidate into an operator-friendly
production process. It deliberately separates three things:

1. pre-promotion confidence,
2. the explicit production promotion action,
3. post-promotion verification and rollback.

Do not treat a successful preview deployment as production readiness. The
current Vercel preview URL is a useful cloud build artifact, but it is protected
by Vercel authentication and cannot serve as the public demo gate.

## Current Handles

- Repository: `https://github.com/Zhi-Chao-PAN/launchlens-ai`
- Local project path: `C:\Users\22304\ai-portfolio-automation\launchlens-ai`
- Production demo URL: `https://launchlens-ai-two.vercel.app`
- Current RC evidence: `docs/RELEASE_CANDIDATE.md`
- Production handoff packet: `docs/PRODUCTION_RELEASE_PACKET.md`
- Pre-promotion workflow: `.github/workflows/release-candidate-verify.yml`
- Post-promotion workflow: `.github/workflows/post-promotion-verify.yml`

## Pre-Promotion Gate

Run this before any production action:

```bash
git status --short --branch
npm run verify:release-readiness
npm run verify:portfolio
npm run release:local
npm run verify:public-demo
npm run evidence:release
```

Expected meaning:

- `release:local` proves lint, unit tests, typecheck, provider eval, decision
  eval, production build, audit, and local Playwright e2e are green.
- `verify:release-readiness` proves the release packet, required scripts,
  pre-promotion workflow, post-promotion workflow, docs, and ignored evidence
  output are wired together.
- `verify:portfolio` proves the reviewer case study, demo script, production
  packet, README, and live-demo references still form a coherent portfolio
  handoff.
- `verify:public-demo` proves the currently public URL is healthy and connected
  to cloud storage.
- `verify:production-demo` proves the public URL reports the expected SHA and
  passes the browser e2e suite without starting a local server.
- If production is still on an older commit, `verify:public-demo` can pass
  without `LAUNCHLENS_EXPECTED_GIT_SHA`; that only proves the old public demo is
  alive. It does not prove the RC has been promoted.
- `evidence:release` writes a Markdown and JSON snapshot to
  `output/release-evidence/` so the operator can attach concrete evidence
  without copying details from terminal scrollback.

Before promotion, also confirm GitHub Actions has this secret configured:

```text
LAUNCHLENS_SMOKE_DATABASE_URL
```

Use the same value as the production Neon database URL unless a narrower
smoke-test role is available. Prefer an elevated `DATABASE_MIGRATION_URL` only
for migration work; the app runtime should continue using a least-privilege
`DATABASE_URL` role.

For a hosted pre-promotion audit trail that does not deploy production, run the
manual workflow:

```text
Actions -> Release candidate verification -> Run workflow
```

This workflow runs `npm run release:local`, collects release evidence, and
uploads `launchlens-rc-evidence`. A `promotion_pending` evidence result is
acceptable before production approval when the public URL is healthy but still
serving an older SHA.

## Explicit Production Action

Production promotion is an external/public action. Run it only after an explicit
operator decision.

Supported paths:

1. Push the verified commit to `main` and let the linked Vercel project deploy
   production through its normal Git integration.
2. Or run a direct Vercel production deploy from the verified working tree:

```bash
npx vercel deploy . --prod -y
```

Record the production deployment URL, the Vercel inspect URL, and the git SHA
that should become public.

## Post-Promotion Gate

After the production action finishes, run the full cloud gate against the public
URL and the expected commit:

```bash
LAUNCHLENS_BASE_URL=https://launchlens-ai-two.vercel.app LAUNCHLENS_EXPECTED_GIT_SHA=$(git rev-parse --short HEAD) npm run release:cloud
```

This gate checks:

- `/api/status` returns LaunchLens JSON instead of a Vercel auth page.
- The public deployment reports the intended `gitSha`.
- The production database schema matches the expected contract.
- Workspace save, restore, recovery migration, public share, private-data
  boundary, share revocation, tenant isolation, and RBAC smoke paths pass.

Then run the browser demo gate:

```bash
LAUNCHLENS_BASE_URL=https://launchlens-ai-two.vercel.app LAUNCHLENS_EXPECTED_GIT_SHA=$(git rev-parse --short HEAD) npm run verify:production-demo
```

For a GitHub-hosted audit trail, run the manual workflow:

```text
Actions -> Post-promotion verification -> Run workflow
```

Inputs:

- `base_url`: `https://launchlens-ai-two.vercel.app`
- `expected_git_sha`: the promoted commit SHA; leave blank to use the workflow
  run's checked-out SHA.

The workflow intentionally verifies production; it does not deploy production.

## Evidence To Capture

Attach or paste these into the release note after promotion:

- Promoted git SHA.
- Production URL.
- Vercel inspect URL.
- Output of `npm run release:cloud` with matching `gitSha`.
- Output or artifact from `npm run evidence:release`.
- GitHub `Post-promotion verification` workflow run URL.
- Any migration output from `npm run db:migrate`.
- Any known deviations, especially skipped cloud smoke gates or missing secrets.

## Rollback

If the post-promotion gate fails:

1. Keep the failed deployment URL and inspect URL for diagnosis.
2. Do not run another migration unless the failure clearly requires a schema
   fix and the fix has been reviewed.
3. Restore the previous known-good production deployment from the Vercel
   dashboard, or revert the faulty commit and promote the revert.
4. Re-run:

```bash
LAUNCHLENS_BASE_URL=https://launchlens-ai-two.vercel.app npm run verify:public-demo
```

5. If the rollback restored a known-good commit, re-run with its expected SHA:

```bash
LAUNCHLENS_BASE_URL=https://launchlens-ai-two.vercel.app LAUNCHLENS_EXPECTED_GIT_SHA=<known-good-sha> npm run verify:public-demo
```

Use `release:cloud` again only when the rollback deployment should also prove
database mutation paths, tenant isolation, and RBAC end to end.

## Operator Notes

- The cloud smoke scripts create temporary workspaces and clean them up on a
  best-effort basis.
- A failed public-share revocation check is high signal because it protects the
  privacy boundary that makes LaunchLens safe to demo publicly.
- A failed `gitSha` check usually means the public URL is healthy but still
  serving an older deployment.
- A Vercel authentication HTML response from `/api/status` means the target URL
  is not a public production URL and cannot satisfy the demo gate.
