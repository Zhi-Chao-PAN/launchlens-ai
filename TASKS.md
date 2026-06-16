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
- [x] Added a post-generation validation model without changing provider output contracts.
- [x] Added evidence signals, confidence, decision, next-action, and stable task-link workflows.
- [x] Persisted execution state through local drafts, cloud snapshots, Markdown, and JSON exports.
- [x] Added a privacy-safe public execution projection that excludes evidence notes and sources.
- [x] Added realistic supported/testing/refuted evidence stories to stable examples.
- [x] Added compact responsive experiment review controls and execution progress scoring.
- [x] Completed a Phase 3B diff-scoped security review with 18/18 source-file receipts and no reportable finding.
- [x] Added an evidence-grounded AI decision copilot as the third connected workflow stage.
- [x] Added `/api/decision` with byte limits, bounded input validation, no-store responses, rate limiting, and deterministic mock mode.
- [x] Added optional live decision-provider support behind `DECISION_COPILOT_LIVE_ENABLED=true`.
- [x] Added per-claim evidence citations, source fingerprints, stale-brief invalidation, and private export support.
- [x] Refactored real-provider request/parsing code into a shared provider runtime.
- [x] Added `npm run eval:decision` with no-secret mock scoring and explicit live MiniMax fixture writing.
- [x] Added decision eval to GitHub Actions CI.
- [x] Persisted a secret-scanned MiniMax decision fixture for supported, neutral, and challenged evidence cases.
- [x] Normalized claim stance from cited evidence signals and cleaned stray provider quote prefixes.
- [x] Accepted Vercel Marketplace Neon terms, provisioned Neon, pulled ignored local env files, and ran the production migration.
- [x] Fixed the migration script for CJS-compatible `tsx` execution and sanitized migration errors.
- [x] Added `npm run smoke:cloud` for repeatable cloud save/restore/share/privacy/delete verification.
- [x] Verified the cloud flow against a production-env server connected to Neon.

## Done in Phase 6

- [x] Added Playwright-hosted visual regression with committed PNG baselines and dedicated pixel-comparator tests.
- [x] Added a decision-eval history feed and a trend-comparison command, and wired both into CI.
- [x] Added a hosted visual regression GitHub Actions workflow that builds, runs the production server, and uploads the report artifact.
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
- [x] Accept Vercel Marketplace Neon terms, provision the production resource, and verify the deployed cloud flow.
- [x] Add Neon-backed distributed mutation limiting with a local-only fallback.
- [x] Verify application and production runtime logs do not retain owner capability values.
- [x] Add registration-free recovery-key capability authentication after the anonymous-token beta.
- [x] Add an assumption-to-evidence-to-decision execution loop.
- [x] Keep execution state backward-compatible with existing snapshots and provider fixtures.
- [x] Keep private evidence details out of read-only public shares.
- [x] Add an evidence-grounded AI decision brief stage on top of recorded validation evidence.
- [x] Add recoverable capability authentication in Phase 3C.
- [x] Verify decision briefs through production Neon save/restore/share after Marketplace terms are accepted.
- [x] Add trend-ready eval fixtures for decision-brief recommendations and citation quality.
- [ ] Add historical comparison/reporting across multiple decision eval fixture versions as a post-portfolio enhancement.

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
- [x] Validation evidence, decisions, linked tasks, exports, and local restore have focused coverage and browser QA.
- [x] Evidence-grounded AI decision briefs have focused unit/API tests and desktop/mobile browser QA.
- [x] Decision copilot has mock CI eval and live MiniMax fixture evidence.
- [x] Production cloud save, restore, share, disable-share, and delete pass smoke QA against Neon.
- [x] Recovery migration revokes the previous owner credential and survives cleared browser storage.
- [x] Distributed cloud mutation limiting is persisted in Neon and exercised in production.
- [x] Application log tests and a production canary check show owner credentials are not emitted.
- [x] Final desktop and 390px mobile browser QA has no console errors or horizontal overflow.
- [x] Project is marked portfolio-ready only after CI and production deployment verification.



## UX Polish & Quality Rounds (2026-06-16)

- [x] Shrinking toast progress bar (time-remaining indicator via rAF-driven CSS transition, pause-on-hover/focus, resume on leave).
- [x] Shift+Esc to dismiss all toasts; "Dismiss all" button appears when >=2 toasts are queued.
- [x] Enter dismisses onboarding wizard; primary CTA autoFocus; Esc/Enter hint added to wizard footer.
- [x] Dot-pulse and staggered shimmer skeletons for generation loading states.
- [x] Soft page-entrance fade-in on main routes (`/`, `/pricing`, `/signin`, shared view, not-found).
- [x] Copilot analysis shimmer + staggered cloud snapshot list entrance (nth-child animation delay).
- [x] Grid-rows smooth expand/collapse for validation experiment cards (with `inert` on collapsed).
- [x] Overlay Escape priority stack (`pushOverlay()`/`hasOpenOverlay()`) — toasts defer to open modals/wizards/dropdowns; shortcuts modal and onboarding wizard register on open.
- [x] Shortcuts modal X focus ring; Shift+Esc hint in footer.
- [x] `Disclosure` component replacing native `<details>` on pricing FAQ: animated grid-rows 0fr→1fr, `inert` on collapsed panel, proper ARIA (`aria-expanded`, `aria-controls`, `role="region"`, `aria-labelledby`), chevron rotation, reduced-motion guard.
- [x] System status graceful failure states: network-error alert with manual Retry, online/offline browser events, AbortController 8s timeout, `role="dialog"` panel, viewport-clamped dropdown width.
- [x] Export polish: checkmark "Copied!" feedback on Markdown/JSON buttons (1.8s), `.md`/`.json` file download fallback, retry-copy from export textarea, format badge, aria-label on textarea.
- [x] Cloud recovery form inline validation: aria-invalid, aria-describedby error messages, invalid_recovery_input differentiation, Link-vs-Recover helper copy, disabled-state clarity with onBlur triggering validation.
- [x] Workspace-switch crossfade (120ms out / 200ms in) when loading example / resetting / restoring cloud snapshot; pointer-events gating; aria-busy; reduced-motion bypass; cleanup timer on unmount.
- [x] Mobile responsive audit: viewport-clamped modal/dropdown widths (`min(20rem, calc(100vw - 2rem))`), bottom padding to clear floating help button on small screens across workspace, pricing, signin, and shared views.
- [x] Vitest overlay stack invariants (2 new tests → 152 tests / 37 files passing).
- [x] All quality gates pass: ESLint (0 warnings), TSC, Vitest (152/37), Next.js production build.

## Continued Quality Iteration (R46-R50, 2026-06-16)

- [x] `not-found.tsx`: fixed undefined `launchlens-fade-in` keyframe (replaced with registered `fadeInDown`), rebranded CTA to green "Open the demo workspace" with ArrowRight icon, added secondary pricing CTA.
- [x] `error.tsx` (global client error boundary): dev-only `error.message` pre block (hidden in production), rounded-xl card, green primary action, Home icon on "Back to demo", fade-in entrance.
- [x] Added `shimmer` variant to `<Skeleton>` primitive using the global `launchlens-shimmer` keyframe; route-level `loading.tsx` rebuilt with shimmer skeletons for top bar, sidebar, and three main-column cards; `aria-busy`/`aria-label` for AT.
- [x] New `DisclosureGroup` component with WAI-ARIA accordion keyboard navigation (Up/Down moves focus between toggles, Home/End jumps to first/last); context-based registration so disclosures can be nested.
- [x] Pricing FAQ wrapped in `DisclosureGroup` with visible kbd hint (arrow keys); fixed same broken `launchlens-fade-in` class on pricing page.
- [x] Modal focus-return: `OnboardingWizard` and `KeyboardShortcutsModal` now save the previously-focused element when opening and restore it after the 220ms close animation; shortcuts X button `autoFocus`.
- [x] Unit coverage expansion: recovery edge cases (invalid chars, 24/23/160/161 boundaries, case-sensitivity, URL-safe output); `generated-time` HH:MM padding + invalid date handling; `visual-regression` identical/size-mismatch/threshold/diff/sample-caps/0x0; `sample-briefs` structure/ids/population.
- [x] Test suite: **152 -> 164 tests / 37 -> 38 files passing**.
- [x] All quality gates pass: ESLint (0 warnings), TSC, Vitest (164/38), Next.js production build.

## Brand System & Global Polish (R55-R63, 2026-06-16)

- [x] Register `launchlens-fade-in` keyframe defensively in `@theme` so any future `animate-[launchlens-fade-in_...]` utility resolves to a real animation instead of silently failing.
- [x] Shared read-only workspace header now includes a Copy Link button (client component, Clipboard API + execCommand fallback, 1.8s checkmark feedback matching export-copy).
- [x] Primary CTAs globally aligned to the brand green (`#138a72` / hover `#0f7665`) with mint ring (`#cbe8df`): Generate workspace, Save snapshot, Link history, Regenerate brief, Add evidence, pricing highlight CTA, onboarding Get Started, signin Submit, not-found Open-demo, error Try again, shared-view Open-demo.
- [x] Signin page recolored and given a Back-to-demo secondary action so accidentally-landed reviewers can return without using browser back.
- [x] Sample-brief selector upgraded to `role="group"` with `aria-pressed`, selected-state styling (mint background, green border, green text), and `disabled` during workspace crossfade.
- [x] Cloud recovery form onChange handlers cleaned of no-op `if (touched) setTouched(true)`; toggle-share button title fixed from incorrect "Copy share link" to "Enable sharing" when the snapshot is private.
- [x] Overlay stack unit tests extended (nesting to depth 10, out-of-order pop, reset helper) — suite now at **166 tests / 38 files**.
- [x] README keyboard-shortcut table expanded to document Cmd/Ctrl+Enter (generate), Cmd/Ctrl+H (replay tour), and Shift+Esc (dismiss all toasts).
- [x] PROJECT_MATURITY.md updated with a "Post-portfolio quality iteration" section narrating the R46-R54 polish pass.
- [x] All quality gates green: ESLint (0 warnings), TypeScript strict, Vitest 166/166, Next.js production build.

## Post-Portfolio Enhancements

- [ ] Add optional OAuth/passkey identity for teams that prefer conventional accounts.
- [ ] Add team roles, comments, and collaborative workspace ownership.
- [ ] Add longitudinal provider/decision eval dashboards and latency drift thresholds.
- [ ] Add automated deployed visual-regression snapshots.


## P3 — Multi-Tenant Workspace Isolation (2026-06-14)

- [x] Add launchlens_tenants migration to migrate-cloud-db.ts.
- [x] Backfill existing workspaces with tenant_id.
- [x] Implement 	enant-store.ts with list/create/get tenants, workspace CRUD scoped to tenant.
- [x] Auto-create default tenant in createWorkspace for new owners.
- [x] Fix transaction destructure bug (results[3] instead of [, rows]).
- [x] Add /api/tenants, /api/tenants/[id], /api/tenants/[id]/workspaces routes.
- [x] Write smoke:tenant script (6 assertions: 2 tenants, cross-tenant isolation, cross-owner 404, same-owner visibility).
- [x] Add unit tests for tenant store (4 tests, 96 total).
- [x] Verify triple smoke (tenant, cloud, rbac) all pass against production Neon.
