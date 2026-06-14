## What this PR does

One or two sentences.

## Why this is the right fix

Why is this the right change and not a smaller, safer, easier, or more compatible alternative?

## Affected surface

- [ ] Public surface (`src/app/`)
- [ ] API routes (`src/app/api/`)
- [ ] Provider runtime (`src/lib/launchlens/provider*.ts`, `provider-runtime.ts`)
- [ ] Cloud schema (`scripts/migrate-cloud-db.ts`)
- [ ] Persistence (`src/lib/launchlens/workspace-store.ts`, `tenant-store.ts`, `workspace-rbac.ts`)
- [ ] Public share projection (`/share/[id]` SQL)
- [ ] Documentation only

## Verification

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run eval:provider` (only if provider runtime touched)
- [ ] `npm run eval:decision` (only if decision path touched)
- [ ] `npm run smoke:cloud` (only if `LAUNCHLENS_BASE_URL` and DB env are available)
- [ ] GitHub Actions `CI` is green on the PR SHA
- [ ] GitHub Actions `hosted-visual-regression` is green on the PR SHA (only if a UI surface changed)

## Risk and rollback

What can go wrong? How do we roll back?

## Linked issues

Closes #

## Notes for the reviewer

Anything the reviewer should read first or test by hand.
