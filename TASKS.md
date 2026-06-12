# LaunchLens AI Tasks

## Done in Phase 1 Start

- [x] Confirmed GitHub CLI is installed and authenticated as `Zhi-Chao-PAN`.
- [x] Confirmed remote repository did not exist before initialization.
- [x] Scaffolded a Next.js, TypeScript, Tailwind project.
- [x] Added the first LaunchLens workspace UI.
- [x] Added mock generation flow.
- [x] Added optional OpenAI-compatible provider flow.
- [x] Added planning and maturity documentation.
- [x] Created the public GitHub repository and pushed `main`.
- [x] Added sample briefs, editable workspace sections, assumptions/risks, and Markdown export.
- [x] Added Vitest coverage for mock provider, provider fallback, Markdown export, and API validation.
- [x] Added optional MiniMax Token Plan provider path with env-only secrets.
- [x] Added route/provider safety guards: field caps, body caps, rate limit, timeout, safe fallback codes, and provider host allowlists.
- [x] Added browser-local persistence for the current brief and generated workspace.
- [x] Added accessible labels/status regions for the main editing and feedback controls.
- [x] Hardened provider parsing for fenced JSON, reasoning tags, and repairable JSON formatting.
- [x] Added stable example workspace fixtures for repeatable reviewer demos.
- [x] Added generation progress UI for longer real-model calls.
- [x] Added safe provider metadata display without exposing secrets.
- [x] Added MIT license for clearer GitHub presentation.
- [x] Ran one MiniMax live app-route smoke with safe metadata only.
- [x] Added GitHub Actions CI for lint, test, build, and audit.
- [x] Fixed lockfile sync issue caught by the first CI run.
- [x] Added JSON export for machine-readable workspace handoff.
- [x] Added deterministic workspace quality evaluator and UI score.
- [x] Published a public Vercel demo and linked it from README.
- [x] Added desktop/mobile screenshots and responsive browser evidence.
- [x] Fixed deterministic generated-time rendering to prevent hydration mismatch.
- [x] Added repeatable mock/live provider eval CLI with explicit live opt-in.
- [x] Persisted a secret-scanned MiniMax fixture for all three public scenarios.
- [x] Added scenario compliance checks and strict complete-schema validation.
- [x] Added mock provider eval to GitHub Actions CI.
- [x] Added a lazy Neon-backed workspace store that remains build-safe without database credentials.
- [x] Added anonymous owner-scoped cloud snapshot list/create/read/delete APIs.
- [x] Added explicit read-only share enable/disable and public snapshot pages.
- [x] Added cloud history, restore, share, delete, empty, error, and local-only UI states.
- [x] Added complete nested workspace validation, UUID checks, body limits, record limits, mutation throttling, and owner-token hashing.
- [x] Added focused cloud route, schema, ownership, and fallback tests.
- [x] Added streaming request limits, nested cardinality limits, field normalization, and unknown-field stripping.
- [x] Moved schema DDL into `npm run db:migrate` and marked runtime storage as server-only.
- [x] Added atomic per-owner and global capacity gates for anonymous cloud snapshots.
- [x] Removed founder brief data from the public share query and public record type.
- [x] Completed a diff-scoped security review with two candidates fixed and no surviving reportable findings.

## Next Nightly Builder Tasks

- [x] Add unit tests for `buildMockWorkspace` and provider fallback.
- [x] Add route handler tests for invalid input and no-key demo mode.
- [x] Add editable workspace sections.
- [x] Add "copy as Markdown" export.
- [x] Add "copy as JSON" export.
- [x] Add local persistence for edited workspace drafts.
- [x] Add saved example workspace fixtures.
- [x] Add screenshot assets for README.
- [x] Add basic loading skeletons for long real-model calls.
- [x] Add provider usage metadata without exposing secrets.
- [x] Tune MiniMax request shape and parser for compact JSON responses.
- [x] Run one live MiniMax smoke and document safe metadata.
- [x] Automate repeatable live MiniMax smoke/eval and document quality.
- [x] Add repeatable provider quality fixtures/evals for generated workspaces.
- [x] Add persisted MiniMax output fixtures for regression comparison.
- [x] Add optional server-side workspace snapshot history without breaking no-database demo mode.
- [x] Add owner-scoped restore/delete and opt-in read-only share links.
- [ ] Accept Vercel Marketplace Neon terms, provision the production resource, and browser-verify the deployed cloud flow.
- [ ] Add distributed rate limiting or a managed challenge before scaling anonymous cloud writes.
- [ ] Verify hosting logs do not retain the owner capability header.
- [ ] Add account authentication and recoverable ownership after the anonymous-token beta.

## Portfolio-Ready Checklist

- [x] `npm run lint` passes.
- [x] `npm run test` passes.
- [x] `npm run build` passes.
- [x] Product can run from a fresh clone without API keys.
- [x] README includes screenshots.
- [x] README includes demo script.
- [x] README includes architecture notes.
- [x] Generated workspace is editable and exportable.
- [x] Current workspace is restorable from browser-local storage after refresh.
- [x] API/provider behavior has tests.
- [x] Public deployment URL is available.
- [x] GitHub history shows incremental nightly progress.
- [x] Repository includes a license.
- [x] Repository includes a CI quality gate.
- [x] Desktop and 390px mobile product flows pass production-mode browser QA.
- [x] Cloud history APIs and local-only degradation have focused automated coverage.
- [ ] Production cloud save, restore, share, disable-share, and delete pass browser QA against Neon.
