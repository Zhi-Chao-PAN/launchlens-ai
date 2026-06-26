# LaunchLens AI Production Release Packet

Date: 2026-06-27 Asia/Shanghai

This packet is the handoff for the next major stage: promoting the current
release candidate to the public production URL, proving it with cloud gates, and
leaving a reviewer-friendly evidence trail.

## Current State

- Local RC status: ready for production approval.
- Public production URL: `https://launchlens-ai-two.vercel.app`
- Current public URL state before promotion: healthy but serving the previous
  production SHA.
- Expected evidence state before promotion: `promotion_pending`.
- Expected evidence state after promotion: `production_verified`.
- Production deploy status: not performed in this packet.

The latest generated evidence lives under:

```text
output/release-evidence/
```

That directory is intentionally ignored by Git so each operator can generate a
fresh local or GitHub artifact without committing machine-specific evidence.

## Go / No-Go

Go only when all of these are true:

- `git status --short --branch` shows no uncommitted source changes.
- `npm run release:local` passes.
- `npm run verify:release-readiness` passes.
- `npm run evidence:release` returns either `promotion_pending` before
  promotion or `production_verified` after promotion.
- The operator has explicit production approval.
- `LAUNCHLENS_SMOKE_DATABASE_URL` is configured in GitHub Actions secrets before
  the hosted post-promotion workflow is used.

No-go when any of these are true:

- The pre-promotion workflow contains a production deploy command.
- The public `/api/status` response is missing, protected by auth, or reports an
  unhealthy database.
- `release:local` or `verify:release-readiness` fails.
- The production database secret is missing and no local cloud-smoke substitute
  has been agreed.
- There is no explicit production approval.

## Explicit Production Approval

Production promotion is the only remaining external action. It should happen
only after a clear instruction such as:

```text
发布 production
```

or an equally explicit English instruction such as:

```text
Deploy this RC to production.
```

Absent that approval, continue with verification, evidence, documentation, and
dry-run style checks only.

## Pre-Promotion Execution

Run locally:

```bash
npm run verify:release-readiness
npm run release:local
npm run evidence:release
```

Then run the hosted pre-promotion workflow:

```text
Actions -> Release candidate verification -> Run workflow
```

The hosted workflow should upload `launchlens-rc-evidence`. A
`promotion_pending` result is acceptable here because the public production URL
is expected to still serve the previous SHA before promotion.

## Promotion Execution

Use one approved path:

1. Push the verified commit to `main` and let Vercel's Git integration deploy
   production.
2. Or run a direct production deploy from the verified working tree:

```bash
npx vercel deploy . --prod -y
```

Record the promoted git SHA, production URL, Vercel inspect URL, and the time of
promotion.

## Post-Promotion Execution

Run:

```bash
LAUNCHLENS_BASE_URL=https://launchlens-ai-two.vercel.app LAUNCHLENS_EXPECTED_GIT_SHA=$(git rev-parse --short HEAD) npm run release:cloud
npm run evidence:release
```

Then run the hosted post-promotion workflow:

```text
Actions -> Post-promotion verification -> Run workflow
```

Success means:

- `release:cloud` passes.
- `/api/status` reports the expected git SHA.
- `evidence:release` reports `production_verified`.
- The workflow uploads `launchlens-release-evidence`.

## Demo Handoff

After production verification, use `docs/DEMO_SCRIPT.md` for the portfolio
walkthrough. The minimum manual pass is:

1. Open the production URL.
2. Generate the B2B SaaS activation workspace.
3. Show Validation Board search/filter/evidence/timeline/export.
4. Generate or inspect the cited AI decision brief.
5. Save a cloud snapshot.
6. Enable a 7-day share link.
7. Confirm public share excludes private founder input, evidence notes, sources,
   owner credentials, and private decision briefs.
8. Disable sharing and confirm the revoked-link state.

## Final Release Evidence

Attach these to the release note:

- Local `release:local` result.
- `verify:release-readiness` result.
- `release:cloud` result.
- `launchlens-rc-evidence` artifact from GitHub.
- `launchlens-release-evidence` artifact from GitHub.
- Vercel production inspect URL.
- Final public demo URL.
