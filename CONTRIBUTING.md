# Contributing

LaunchLens AI is a single-author portfolio release, but the project is built with a real multi-contributor shape on purpose so the conventions are not invented for the first outside review.

## Code of conduct

Be respectful. This is a portfolio build, not a community; reviewers, interviewers, and recruiters are the primary external audience.

## How to file an issue

- Use the `bug_report` template for anything that reproduces a wrong behavior, a broken test, a CI failure, or a security-adjacent observation.
- Use the `feature_request` template for product ideas.
- For security-sensitive observations, see `SECURITY.md` and prefix the title with `[security]`.

## How to open a pull request

- Open a draft PR early and link it to the matching issue.
- The PR description should cover: what the change does, why the change is the right fix, what alternatives were considered, and how the change was verified.
- A PR that touches behavior, tests, configuration, or the schema should be green on:
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm test`
  - `npm run build`
  - the GitHub Actions `CI` workflow
- A PR that touches the visual surface should also be green on the `hosted-visual-regression` workflow against the live Vercel deployment.
- A PR that touches the cloud schema should also be green on the `cloud-smoke` workflow, but only if a `LAUNCHLENS_SMOKE_DATABASE_URL` repo variable is configured. This workflow is intentionally optional.

## Style

- TypeScript strict, ESM, no `any`, no `@ts-nocheck`. Prefer narrow types and discriminated unions.
- Comments are short. Add a comment only when the code is not self-explanatory and the next reader would otherwise have to re-derive the rule.
- File names use `kebab-case.ts` for modules and `PascalCase.tsx` for React components.
- Tailwind utility classes only, no inline styles, no CSS modules. The portfolio uses a single muted palette and an accent color, defined once in `globals.css` and reused through `text-[#17201d]`, `bg-[#f6f8f4]`, `border-[#138a72]`, and `text-[#138a72]`.

## Commit messages

- One-line subject, lowercase, conventional commit prefix where it fits (`feat`, `fix`, `docs`, `ci`, `chore`, `refactor`, `test`).
- The body, when present, names the underlying cause and the verification command, not the symptoms.
- A commit should not mix a behavior change with a lockfile regeneration or a UI copy tweak. Split if it does.

## Things that need an extra reviewer

- Schema migrations: any change to `scripts/migrate-cloud-db.ts` or to a Postgres DDL statement.
- Provider runtime: any change to `src/lib/launchlens/provider*.ts`, `provider-runtime.ts`, or the `MINIMAX_*` and `OPENAI_*` env contracts.
- Rate limit, owner migration, or quota gates: any change to `src/lib/launchlens/workspace-store.ts` or `workspace-api.ts`.
- Public share projection: any change to the SQL that selects what is exposed on a `/share/[id]` page.

## Things that do not

- Documentation only changes to `README.md`, `ROADMAP.md`, `TASKS.md`, `PROJECT_MATURITY.md`, `NIGHTLY_LOG.md`, and `ARCHITECTURE.md`.
- Test additions or refactors that do not change behavior.
- Lockfile regeneration that is the natural result of a fresh `pnpm install` or `npm install` on a different OS / Node version.
