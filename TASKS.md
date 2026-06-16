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

## Accessibility, Export Resilience & Validation Hardening (R64-R68, 2026-06-16)

- [x] `generateMetadata` added to `/share/[id]` route so shared links surface an explicit OG title/description without an extra DB round-trip.
- [x] New `CopyMarkdownButton` on the shared read-only view: Clipboard API with Promise-based write, `execCommand("copy")` fallback, and a Blob-download-as-`.md` fallback for non-secure contexts. Shift+click forces download directly. Downloaded state uses the copilot purple (`#554a8b` / `#e9e7f7`) to avoid being confused with clipboard-success green.
- [x] `safeMarkdownFilename` helper exported from `markdown-export.ts` to slugify project headlines into filesystem-safe names (truncated to 60 chars, dashes collapsed, punctuation stripped). Defaults to `launchlens-workspace.md`.
- [x] Shared-view storage-unavailable screen gained a `CloudOff` icon, friendlier explanatory copy, and a green Back-to-demo CTA so locked-out visitors still have a path forward.
- [x] New `useFocusTrap` hook (`src/hooks/use-focus-trap.ts`) implements a lightweight Tab/Shift+Tab cycle with `[autofocus]` preference and `inert`-aware candidate filtering. Wired into both the keyboard-shortcuts modal and onboarding wizard with `restoreFocus:false` so the existing animated focus-return logic stays authoritative.
- [x] Screen-reader generation status added to `launch-workspace.tsx`: an off-screen `aria-live="polite"` region announces "Workspace ready. N audience segments, N execution tasks, N validation hypotheses." on success and reports failure text on error.
- [x] `evaluateWorkspaceQuality` edge-case coverage extended: invalid backlog priority (P9), too-short task fields, duplicate pain bullets, too-short audience bullets, and the all-empty 0-score case.
- [x] `buildDecisionEvalFixture` now defensively validates its inputs (non-empty model, ISO timestamp, at least one case) and throws before emitting a malformed fixture; three new edge-case tests cover each guard.
- [x] Added `smoke:e2e` npm script that runs just the happy-path Playwright spec against the auto-started dev server for faster CI prechecks.
- [x] Test count **178 tests / 38 files**. All four quality gates green: ESLint 0-warn, tsc strict, Vitest 178/178, Next.js production build.

- [x] Extracted `copyTextToClipboard` (async, tries Clipboard API then execCommand fallback) and `downloadTextFile` (Blob+anchor) into `src/lib/launchlens/clipboard.ts` and reused them across `CopyLinkButton`, `CopyMarkdownButton`, and the in-app export Copy Markdown/Copy JSON buttons. Clipboard failures now download a file instead of asking the user to manually select from a textarea.
- [x] `safeMarkdownFilename` now accepts `landingPage.headline` as a fallback when no projectName is set; two more tests cover preference order and slugification of long headlines.
- [x] Export header now exposes explicit `.md` and `.json` download buttons alongside Copy Markdown / Copy JSON, so power users can grab a file without learning the Shift+click secret.
- [x] A small keyboard-hint line sits below the Generate workspace button (Ctrl+Enter to generate, ? for shortcuts); kbd chips use the existing Tailwind styling conventions.
- [x] The existing motion-reduce:transition-none on the workspace-switch opacity crossfade confirmed — reduced-motion users get an instant swap, no fade.
- [x] `smoke:e2e` npm script added for fast single-spec Playwright runs against the auto-started dev server.
- [x] Test count **180 tests / 38 files**. All four quality gates green: ESLint 0-warn, tsc strict, Vitest 180/180, Next.js production build.

## Clipboard Resilience, Accessibility & Error Normalization (R72-R79, 2026-06-16)

- [x] `src/lib/launchlens/clipboard.ts` now exports two shared helpers: `copyTextToClipboard` (async: Clipboard API → execCommand fallback, returns boolean) and `downloadTextFile` (Blob + anchor click, returns boolean). Both the shared-readonly view and in-app export buttons now use them so non-secure-context or permission-denied contexts still succeed via execCommand, and last-resort failure downloads a file instead of showing a dead-end toast.
- [x] `CopyMarkdownButton` (shared view) has three-tier fallback: async Clipboard API → `copyTextToClipboard` → `.md` download; Shift+click forces download. Downloaded state uses copilot purple (#554a8b / #e9e7f7) so it is not confused with clipboard-success green.
- [x] New `DownloadMarkdownButton` and `DownloadJsonButton` in the shared view header provide explicit file-download affordances alongside Copy, so visitors who prefer "Save as" do not need to discover Shift+click.
- [x] `safeJsonFilename` added to `json-export.ts` mirroring `safeMarkdownFilename`; both slugify `projectName` → `landingPage.headline` → default, 60-char cap, collapsed dashes.
- [x] The in-app Copy Markdown and Copy JSON buttons now fall back through the same helper chain and auto-download a file on total failure rather than asking the user to manually select from a textarea. Explicit `.md` and `.json` download chips were added to the export toolbar.
- [x] Skip-to-content link (`src/components/skip-link.tsx`) added to the root layout; visually hidden until focused, jumps to `#main-content` (verified present on every route including /, /pricing, /auth/signin, /share/[id], not-found, error, loading).
- [x] Overlay-stack `pushOverlay()` handles were made idempotent via a per-handle `disposed` flag so React StrictMode double-invoke of effects cannot underflow the counter; three new tests cover double-dispose and bulk 50-handle scenarios.
- [x] `src/lib/launchlens/api-errors.ts` introduces a `friendlyApiMessage(code, fallback)` helper plus a comprehensive code→user-message map covering every constant in `error-codes.ts`. The generation flow now reads `data.code` from API errors and prefers the friendly message over a raw string; 429 rate-limit responses get a specific "wait a moment" message.
- [x] `/api/decision` error responses were normalized to include `{ code, error }` (previously `Invalid JSON payload.` and the 413 catch branch returned no code). All /api/* routes now return the `{ code, error }` envelope on errors.
- [x] Cloud-workspaces panel: toggle-share copy, copy-share-link, and copy-recovery-key all now use `copyTextToClipboard`. Save / restore / share-toggle / delete catches now route error codes through `friendlyApiMessage`.
- [x] `getSharedWorkspace` now returns a `SharedWorkspaceResult` discriminant (`ok` | `revoked` | `not_found`) instead of a nullable record; `/share/[id]` renders a dedicated "link is no longer available" page (Link2Off icon + friendly copy + Back-to-demo CTA) when the owner has revoked sharing, instead of returning a misleading 404.
- [x] Keyboard hint added beneath the Generate workspace button (Ctrl+Enter to generate, `?` for all shortcuts) using kbd chips styled consistently with the shortcuts panel.
- [x] README keyboard-shortcut table documents Shift+click-to-download on Copy Markdown.
- [x] Modal close buttons (onboarding wizard X, shortcuts modal X) bumped from `p-1` / no-padding to 40×40 `size-10` flex-centered hit targets with a subtle hover background, meeting WCAG target-size guidance.
- [x] Test count **192 tests / 39 files**. All four quality gates green: ESLint 0-warn, tsc strict, Vitest 192/192, Next.js production build.

## Validation, Contributor Docs & 410 Semantics (R82-R86, 2026-06-16)

- [x] CHANGELOG.md initialized with a `[Unreleased]` section consolidating the R65-R81 changes and a `[1.0.0]` anchor for the portfolio release.
- [x] Evidence form on the validation board now runs inline validation: source requires at least 2 characters, observation requires at least 8, fields become marked-invalid on blur with error rings, `aria-invalid`, `aria-describedby`, and visible `role="alert"` messages. Submitting with invalid fields shows a form-level alert and focuses stays put. Touched state resets on successful submit.
- [x] CONTRIBUTING.md added: setup, quality gates, directory map, brand tokens, focus-ring conventions, motion-reduce rule, PowerShell-safe commit-message tip, overlay/shortcut/API code conventions, and PR guidance.
- [x] ARCHITECTURE.md preserved (the pre-existing full architecture document with data-flow diagrams and security model) and appended with an R65-R85 addendum documenting the clipboard-resilience chain, `useFocusTrap`, idempotent overlay handles, the `{code, error}` envelope, 410-vs-404 share semantics, the skip link, and the no-jsdom testing strategy.
- [x] Cross-exporter parity test: `safeMarkdownFilename` and `safeJsonFilename` agree on default slug output, long-name truncation (60 char cap), and repeated-separator collapse, preventing drift if either helper is edited later.
- [x] Test count **195 tests / 40 files**. All four quality gates green: ESLint 0-warn, tsc strict, Vitest 195/195, Next.js production build.

## Skeleton Loaders, PWA Meta & Cloud Error Messaging (R87-R94, 2026-06-16)

- [x] Decision copilot loading state upgraded from a centered pulse-spinner to a content-shaped skeleton (chips, paragraphs, claim-list rows) using the shared `Skeleton` primitive with `launchlens-shimmer`, matching the route-shell and cloud "checking" loading patterns. `aria-busy="true"` remains on the container.
- [x] Decision copilot `/api/decision` failures now read `data.code` and route through `friendlyApiMessage`, with a dedicated 429 "wait a moment" fallback instead of surfacing a raw error string.
- [x] Recovery-key module edge tests: `createRecoveryKey` returns 32-char URL-safe base64url and successive calls produce distinct keys; `deriveRecoveryOwnerToken` rejects empty labels, labels over 160 chars, and keys with invalid characters.
- [x] Validation-board Decision and Next-Action textareas now display live character counts (`N/800`) in a muted right-aligned caption so founders know when they are approaching the field cap.
- [x] PWA polish: `public/manifest.webmanifest` (brand name, green `#138a72` theme, standalone display, SVG icon), `public/icon.svg` (compass-styled mark), `theme-color` metadata, and apple-mobile-web-app meta tags in `<head>` so iOS Safari and Android Chrome display the app properly when saved to the home screen.
- [x] Contributor experience: `npm run quality` one-command script runs lint (0-warn), vitest, `tsc --noEmit`, and `next build` in sequence; `npm run typecheck` is also exposed directly.
- [x] Cloud-history error states now render a code-specific friendly message (via `friendlyApiMessage`) in the error card instead of a generic "could not be reached" paragraph, so quota, auth, and misconfiguration failures surface actionable copy.
- [x] Test count milestone: **200 tests / 40 files**. All four quality gates remain green: ESLint 0-warn, tsc strict, Vitest, `next build`.

## Accessibility Deep Dive & Decision Brief Parse Hardening (R95-R100, 2026-06-16 ? 2026-06-17)

- [x] `isUuid` edge-case tests: empty string, whitespace, bad version digit, bad variant digit (N/8/9/a/b rule) ? rounds out the UUID validation surface.
- [x] System status bar now announces network transitions (saving, saved, offline, error) through a screen-reader live region (`role="status"`, `aria-live="polite"`) instead of only visual color changes.
- [x] Evidence form Signal select now carries an `aria-describedby` reference to a screen-reader-only hint explaining what the signal dropdown represents.
- [x] Validation board Decision and Next-Action textareas now expose their character counts via `aria-describedby`, so screen-reader users can hear the `N/800 characters` counter instead of only seeing it.
- [x] `normalizeDecisionBrief` is wrapped in a top-level try-catch so booby-trapped objects (getters that throw, proxies, etc.) degrade gracefully to `null` instead of propagating a raw TypeError.
- [x] New `decision_invalid_response` error code and copy added to `API_ERROR_MESSAGES` for when the provider returns a brief that fails schema normalization ? distinct from generic generation failure.
- [x] Decision copilot distinguishes "API returned an error" from "API returned data but the brief is unparseable" and routes the latter through `decision_invalid_response` for a clearer user-facing message.
- [x] Decision brief normalization tests: non-record inputs (null/undefined/string/number/array), corrupted schema fields, claims referencing non-existent evidence ids, and getter-throwing objects all return null safely.
- [x] API error catalog stability tests: decision-specific codes are mapped, all keys use lowercase snake_case, messages are at least two words ending in punctuation, and over 70% of messages are semantically unique.
- [x] Test count: **210 tests / 40 files**. All four quality gates green.

## Evidence UX Polish & Cloud Error Code Visibility (R101-R105, 2026-06-17)

- [x] Evidence form screen-reader live region announces successful recording and validation errors with context (source + total count).
- [x] `npm run quality` now matches CI order: lint ? test ? typecheck ? provider eval ? decision eval ? build ? audit.
- [x] Evidence list renders newest-first so newly recorded items appear at the top of the expanded panel.
- [x] Evidence delete buttons are 44px touch-friendly on mobile (`size-11`, `sm:size-8`), matching iOS/Android touch-target guidelines.
- [x] Evidence note text uses `break-words` for long unbroken strings, preventing horizontal overflow on narrow viewports.
- [x] Cloud workspaces error panel now displays the raw error code in a monospaced chip with a one-click "Copy code" button, making bug reports more actionable.
- [x] Decision-brief normalization test coverage expanded: duplicate evidence ids, stance/signal mismatch, fingerprint stability, stale-brief detection, prompt-version mismatch, provider-name rejection, usedFallback/fallbackReason consistency.
- [x] Execution test coverage expanded: zero-experiment progress, valid baseline round-trip normalization.
- [x] Test count: **220 tests / 40 files**. All four quality gates green.

## Accessibility Deep Dive Round 2 (R106-R110, 2026-06-17)

- [x] Decision copilot generate button carries `aria-busy` during synthesis and an `aria-describedby` link to a screen-reader status region.
- [x] Decision copilot live-region announces generation start, success (with mode/fallback context), and failure (with error message).
- [x] Evidence form submission auto-focuses the evidence list (`tabindex="-1"`, focus ring) so keyboard and screen-reader users land on the updated content immediately.
- [x] Validation-board header uses compact mobile layout: smaller padding (p-4 ? p-5 sm:p-5), tighter typography, condensed stat cards.
- [x] System status retry button has `aria-busy` + explicit `aria-label` when retrying, and announces retry start/result through the status live region.
- [x] Test count expanded from 220 to **233 tests / 40 files** with coverage across error-codes, filename slugs, markdown-export, and json-export edge cases.
- [x] All four quality gates green: ESLint 0-warn, tsc strict, Vitest, Next.js build.

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

## Accessibility Polish & Mobile Safe Areas (R111-R115, 2026-06-17)

- [x] Evidence deletion preserves keyboard focus: moves to the next/previous delete button or falls back to the list container, with a screen-reader announcement of the removed source.
- [x] Decision-brief claim list items are keyboard-focusable (`tabindex="0"`, focus ring) with `role="group"` and descriptive `aria-label` including stance, claim text, citation count, and sources.
- [x] `useSrAnnounce` hook extracted to `src/hooks/use-sr-announce.ts` ? single source of truth for screen-reader live-region messaging with clear-then-set pattern for repeat announcements.
- [x] Mobile safe-area insets added: `env(safe-area-inset-*)` CSS variables + utility classes (`pt-safe`, `pb-safe`, `px-safe`, etc.) and `viewport-fit=cover` for iOS PWA full-screen display.
- [x] Test count expanded from 233 to **240 tests / 41 files**: `useSrAnnounce` hook tests, filename slugger edge cases (headline fallback, extension guarantees, priority order), execution summary stability.
- [x] All four quality gates green: ESLint 0-warn, tsc strict, Vitest, Next.js build.
