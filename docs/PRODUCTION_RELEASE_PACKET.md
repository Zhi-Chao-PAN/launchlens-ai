# LaunchLens AI Production Release Packet

Date: 2026-06-27 Asia/Shanghai

This packet records the production release of the current release candidate to
the public production URL, the cloud gates that proved it, and the evidence that
should travel with the reviewer-facing handoff.

## Current State

- Local RC status: promoted and verified.
- Public production URL: `https://launchlens-ai-two.vercel.app`
- Production deployment URL:
  `https://launchlens-81kh3sk57-krogerhoxit-7182s-projects.vercel.app`
- Production deployment id: `dpl_SPNDnKoJQaPD5SMRR27HwtMGq9os`
- Promoted git SHA: `a8982b4893a49bd40ed8b8322f09aab2dd5eb42e`
- Evidence state before promotion: `promotion_pending`.
- Evidence state after promotion: `production_verified`.
- Production deploy status: completed through the `main` branch push.

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

Production promotion was authorized before this packet was moved from
pre-promotion to verified production state. Future production promotions should
still happen only after a clear instruction such as:

```text
Deploy production.
```

or an equally explicit instruction such as:

```text
Deploy this RC to production.
```

Absent that approval, future work should continue with verification, evidence,
documentation, and dry-run style checks only.

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

This release used the first approved path:

1. Push the verified commit to `main` and let Vercel's Git integration deploy
   production.
2. Or run a direct production deploy from the verified working tree:

```bash
npx vercel deploy . --prod -y
```

Recorded production details:

- Promoted git SHA: `a8982b4893a49bd40ed8b8322f09aab2dd5eb42e`
- Production URL: `https://launchlens-ai-two.vercel.app`
- Deployment URL:
  `https://launchlens-81kh3sk57-krogerhoxit-7182s-projects.vercel.app`
- Deployment id: `dpl_SPNDnKoJQaPD5SMRR27HwtMGq9os`

## Post-Promotion Execution

Run:

```bash
LAUNCHLENS_BASE_URL=https://launchlens-ai-two.vercel.app LAUNCHLENS_EXPECTED_GIT_SHA=a8982b4 npm run release:cloud
npm run evidence:release
```

Then run the hosted post-promotion workflow:

```text
Actions -> Post-promotion verification -> Run workflow
```

Observed success:

- `release:cloud` passed.
- `/api/status` reported the expected git SHA.
- `evidence:release` reported `production_verified`.
- Local evidence was written under `output/release-evidence/`.

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
- `launchlens-rc-evidence` artifact from GitHub, if the hosted pre-promotion
  workflow was run.
- `launchlens-release-evidence` artifact from GitHub, if the hosted
  post-promotion workflow was run.
- Vercel production deployment id: `dpl_SPNDnKoJQaPD5SMRR27HwtMGq9os`
- Final public demo URL: `https://launchlens-ai-two.vercel.app`
