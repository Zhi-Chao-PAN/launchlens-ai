# Security Policy

## Scope

This is a single-author portfolio release of LaunchLens AI. The repository is built and run as a public Next.js application against an optional Neon Postgres database. The threat model below covers what the project actually exposes, not a hypothetical commercial SaaS.

## In scope

- The Next.js application code under `src/`, the public routes under `src/app/`, and the server-only helpers under `src/lib/launchlens/`.
- The optional cloud persistence path that activates only when a `DATABASE_URL` is configured. This is the only path that holds user-generated content.
- The provider runtime that calls MiniMax Token Plan or an OpenAI-compatible endpoint when an API key is configured on the server.

## Out of scope

- The Vercel preview deployment, which is treated as ephemeral and is not used to store user content beyond the lifetime of a single review.
- The hosted Neon database. Credentials are stored in the deployment environment, not in the repository, and the runtime role is intentionally limited to DML.
- Third-party providers (MiniMax, OpenAI-compatible). Report an issue here, but the provider's own security posture is theirs to own.

## What is safe to share in a report

- An account handle and a recovery key only if you can prove you derived them. Do not include any production Neon connection string or any real MiniMax / OpenAI key, even if you happen to have one.
- A public workspace share link from the public demo. These links exclude founder input, evidence notes and sources, and private AI decision briefs by design; you can include the URL in a report.

## What is never acceptable to share in a report

- A real API key, a real database connection string, a real recovery key from a private account, or any production credentials. The repository is public and any paste here is a paste in the public log.

## How to report

- Open a GitHub issue using the `bug_report` template and prefix the title with `[security]`.
- If the report is sensitive, mark the issue private at creation time and request a maintainer review.

## Response targets

- Acknowledgement within 3 days.
- Triage decision within 7 days.
- Fixes land in the next nightly cycle. Critical issues block the v1.x release line.

## Hardening checklist for this repository

- `.env*` files are git-ignored; no real key is ever in a commit.
- Provider runtime enforces HTTPS base URLs, host allowlists, request timeouts, and field/body caps.
- Workspace routes enforce owner-scoped SQL, hashed credentials, distributed mutation throttling, and a fixed set of safe error codes.
- Application logs emit fixed event codes only; the production canary check confirms that owner capability values are never emitted.
- Decision-brief validation rejects invented evidence IDs, overlong fields, and stale source fingerprints.
- Public share projection never selects founder input, evidence notes/sources, or private AI decision briefs.
