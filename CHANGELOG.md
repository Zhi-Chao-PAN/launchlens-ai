# Changelog

All notable changes to LaunchLens AI are documented in this file. The format is
loosely based on Keep a Changelog. Releases are pushed to `main` continuously;
tags are cut for milestone demos.

## [Unreleased]

### Added
- Frontend productization pass — calmer neutral product surface replacing the
  pastel card-heavy look, with a dark compact app header and more credible
  metric cards; rebuilt Billing as a real B2B account/billing console;
  reworked mobile navigation to avoid clipped half-visible labels; stable
  English-locale month formatting in Billing to stop Chinese system-locale
  leakage; mojibake cleanup across error/404 surfaces; high-density workflows
  kept usable on mobile with horizontal-overflow checks
- `PRODUCT.md` — product/design direction (precise, credible, product-minded;
  calm SaaS workspace; workflow before decoration; evidence earns trust)
- `docs/BACKEND_COMMERCIAL_PROGRESS.md` — historical backend/commercial
  acceptance ledger, kept separate from frontend polish records
- Shared read-only workspace views with Copy Markdown, Copy Link, and explicit
  .md / .json download buttons
- `src/lib/launchlens/clipboard.ts` — shared `copyTextToClipboard` and
  `downloadTextFile` helpers unifying clipboard / download fallback across the app
- `src/hooks/use-focus-trap.ts` — lightweight focus-trap hook wired into the
  onboarding wizard and keyboard-shortcuts modal
- Skip-to-content link on every route
- 410 "link revoked" page for share links the owner has turned off (distinct
  from 404 and from the cloud-unavailable screen)
- Dedicated `DownloadMarkdownButton` / `DownloadJsonButton` components
- `safeMarkdownFilename` / `safeJsonFilename` helpers for slugified file exports
- A `smoke:e2e` npm script for fast single-spec Playwright runs
- An `api-errors.ts` friendly-message map so code-driven errors present
  consistent copy across the UI
- Generate-button hint line documenting Ctrl+Enter and `?`
- `decision_invalid_response` error code and user-facing copy for provider responses that fail schema normalization
- Screen-reader live-region announcements on the system status bar for network state transitions
- `aria-describedby` wiring on the evidence-form Signal select (sr-only hint) and on validation-board Decision/NextAction textareas (character-count descriptions)
- Screen-reader live-region announcements on the evidence form for successful recording and validation failures
- Error code chip with one-click copy button on the cloud workspaces error panel
- `aria-busy` attributes on decision copilot generate button and system status retry button during loading
- Dark mode support with full theme token system (145 hardcoded colors → 0)
- AI-purple, info-blue, and skeleton theme tokens for consistent dark/light styling
- Theme toggle button with localStorage persistence and system preference detection
- 310+ unit tests covering core logic, hooks, API routes, and components
- Accessibility improvements: aria-describedby on evidence form and decision textareas,
  screen-reader live-region announcements for status transitions, skip-to-content link
- 410 "link revoked" page for disabled share links (distinct from 404 and cloud-unavailable)
- Decision copilot with keyboard shortcut (D) and evidence-aware validation
- Evidence reordering with up/down buttons and keyboard arrow-key support
- Workspace recovery key system with PBKDF2-derived owner tokens
- Clipboard and download utilities unified across share, export, and error states

- `useSrAnnounce` hook (`src/hooks/use-sr-announce.ts`) for consistent screen-reader live-region announcements
- Collapsible workspace sections (click header / `[` & `]` keyboard shortcuts) with full ARIA semantics
- Evidence editing support: pencil button opens pre-filled form, submit saves changes
- Auto-save visual flash + screen-reader announcement when workspace is persisted\n- Two-stage confirmation for evidence deletion to prevent mobile mis-taps
- Safe-area CSS variables + utility classes (`pt-safe`, `pb-safe`, etc.) with `viewport-fit=cover` for iOS PWA
- Screen-reader live-region announcements for decision generation (start / success / failure) and system status retries
- ormatRelativeTime utility and relative-time save badge ("Saved 2m ago") with a 30-second refresh tick
- Print styles: hidden toolbars/buttons, removed shadows/animations, section page-break avoidance, visible link URLs
- Mobile density improvements for the keyboard shortcuts modal (larger help button, flexible layout, safe-area padding)
- Evidence move up/down reordering with ChevronUp/ChevronDown buttons, disabled at boundaries, screen-reader announcements
- 10 new tests bringing total to 270 across 41 test files (formatRelativeTime, summarizeExecutionState, reconcileExecutionState, evaluateExecutionProgress)

### Changed
- Global primary-CTA color aligned to the brand green (#138a72) with mint focus ring
- Toast system: pause-on-hover, Shift+Esc dismiss-all, visibilitychange fix for
  background-tab timer drift
- Modal close buttons now have a 44×44 hit area
- The shared-view and in-app Copy Markdown flows now use a three-tier fallback
  (Clipboard API → execCommand → file download)
- `getSharedWorkspace` returns a `status: "ok" | "revoked" | "not_found"`
  discriminant so the share route can render the right surface
- `/api/decision` error responses now carry `{code, error}` consistently
- Cloud snapshot save / restore / share / delete errors route through the
  friendly-message map
- Validation-board loading, shimmer, and disclosure animations respect
  `prefers-reduced-motion`
- `normalizeDecisionBrief` is wrapped in a top-level try-catch so malformed
  provider responses degrade to `null` instead of throwing
- Decision copilot distinguishes "API error" from "valid response with
  unparseable brief" and surfaces the `decision_invalid_response` code
- Character-count captions on Decision/NextAction textareas now include the
  word "characters" for clearer screen-reader output
- Evidence list sorts newest-first so freshly recorded items appear at the top
- Evidence delete buttons use 44px touch targets on mobile (sm: 32px)
- `npm run quality` now runs the full CI gate sequence (lint ? test ? typecheck ? provider eval ? decision eval ? build ? audit)
- Evidence form submission auto-focuses the evidence list for keyboard / screen-reader flow continuity
- Evidence deletion preserves keyboard focus (moves to neighbor) and announces removal via screen reader
- Decision-brief claim list items are keyboard-focusable with descriptive aria-labels
- iOS safe-area insets applied to body, toast, and skip-link ? full-screen PWA content no longer clipped
- Workspace header uses compact layout on mobile (smaller logo, title, buttons, tighter spacing)
- All screen-reader announcements consolidated through the `useSrAnnounce` hook
- Workspace sections collapsible with click + keyboard shortcuts, including on shared read-only pages
- Shared workspace page uses compact mobile layout with safe-area padding
- Evidence entries editable inline via pencil button (form pre-fills with existing data)
- "Saved locally" badge flashes green on autosave for clearer visual feedback
- Validation-board header uses compact spacing and typography on mobile
- Evidence list sorts newest-first, with 44px touch-target delete buttons on mobile

### Fixed
- Overlay-stack `pushOverlay` handles are now idempotent, preventing a
  StrictMode double-invoke from underflowing the Escape-stack counter
- `launchlens-fade-in` keyframe registered defensively in `@theme` so future
  `animate-[launchlens-fade-in_...]` utilities cannot silently fail
- Cloud recovery onChange handlers cleaned of no-op touched-state sets
- Toggle-share `title` attribute fixed (was incorrectly labeled "Copy link")
- Signin page given a Back-to-demo secondary action
- Copy Markdown button on shared page uses purple downloaded-state styling
- Focus properly returns to the previously active element after modal close
  animation

### Tests
- Coverage grew from 166 to 193 tests. New edge-case tests cover workspace
  quality, decision-eval fixtures, markdown/json export, filename slugification,
  error-code registry completeness, and overlay-stack double-dispose behavior.
- Four quality gates remain green on every iteration: ESLint 0-warn, strict
  `tsc --noEmit`, Vitest, `next build`.

## [1.0.0] — 2026-06-12

- Portfolio-ready LaunchLens AI release: mock + MiniMax + OpenAI-compatible
  provider paths, evidence-grounded decision copilot, cloud persistence with
  Neon, share links, validation board, keyboard shortcuts, export (Markdown +
  JSON), and a production Vercel demo.
