# Project Maturity

Status: portfolio-ready
Completion estimate: 100%

LaunchLens AI has reached the portfolio release defined for this project. It is a deployed AI SaaS workflow, not a scaffold or isolated model demo. Reviewers can move from a founder brief to an editable GTM workspace, turn assumptions into evidence-backed experiments, generate cited AI decision briefs, persist or export the private state, recover cloud history on another browser, and publish a privacy-safe read-only view.

Future commercial features still exist, but none are required to demonstrate the intended AI full-stack Solopreneur and TPM portfolio story.

## Commercial/Productization Readiness

The post-portfolio phase has started. The detailed plan now lives in
`docs/COMMERCIAL_READINESS.md`, with a public stage page at
`https://launchlens-ai-two.vercel.app/readiness`.
The first executable commercial slice is now tracked in
`docs/COMMERCIAL_ENTITLEMENTS.md` and exposed through
`/api/commercial/entitlements`.
The second executable slice is tracked in `docs/COMMERCIAL_BILLING.md`:
subscription state, Stripe-ready hosted Checkout and Portal routes, signed
webhooks, durable event idempotency, fixed past-due grace behavior, persisted
entitlement precedence, and `/billing` are implemented. The public deployment
still does not claim an activated Stripe merchant account.

This readiness phase does not claim that LaunchLens AI is already a paid SaaS.
It converts the commercial gap into explicit, verifiable tracks:

- Reviewer evidence index.
- Identity and tenant model.
- Billing and plan limits.
- Onboarding and activation.
- Eval and ops visibility.
- Security and compliance re-entry.

The verifier for this phase is:

```bash
npm run verify:commercial-readiness
```

The commercial readiness gate is intentionally connected to the existing
portfolio and release gates instead of replacing them.

## Release Evidence

1. Product depth: pass. The product connects idea intake, target users, pains, MVP scope, backlog, landing copy, pricing, launch/content plans, assumptions, evidence, decisions, cited AI briefs, and execution tasks.
2. AI workflow: pass. Three connected stages are implemented: structured GTM generation, human evidence collection, and evidence-grounded decision synthesis.
3. Provider design: pass. Deterministic mock mode works without keys; optional MiniMax and OpenAI-compatible providers are server-only, bounded, schema-validated, and safely fall back.
4. Full-stack quality: pass. Next.js, TypeScript, Tailwind, route handlers, Neon Postgres, browser-local persistence, cloud history, recovery, private export, and public sharing form one working product.
5. Ownership and recovery: pass. A handle plus high-entropy recovery key derives a registration-free capability account. The key stays client-side, migration is transactional and quota-safe, and the previous browser credential loses access.
6. Security and privacy: pass. Request/schema limits, owner-scoped SQL, hashed credentials and rate-limit buckets, atomic quotas, distributed mutation limits, safe fixed error logs, dedicated public projections, and secret scans cover the exposed surface.
7. Verification: pass. Typecheck, zero-warning lint, tests, provider eval, decision eval, production build, moderate audit, local/production cloud smoke, responsive browser QA, GitHub CI, and Vercel deployment are release gates.
8. Documentation and presentation: pass. README includes product value, screenshots, demo flow, setup, provider/env design, architecture, cloud/security boundaries, live demo, case-study framing, and UTS/TPM positioning.
9. Repository quality: pass. The repository is public, licensed, topic-tagged, incrementally committed, CI-protected, deployed, and free of committed secrets.

## Portfolio-Ready Acceptance Checklist

- [x] Fresh clone runs without provider or database secrets.
- [x] Mock provider and real-provider fallback behavior have focused tests.
- [x] At least three connected AI SaaS workflow stages are usable.
- [x] Generated workspaces are editable and exportable as Markdown and JSON.
- [x] Validation evidence, decisions, linked tasks, and AI decision briefs persist locally and in private cloud snapshots.
- [x] MiniMax generation and decision fixtures provide secret-scanned real-provider evidence.
- [x] Public shares exclude founder input, evidence notes/sources, owner credentials, and private AI decision briefs.
- [x] Neon save, restore, recovery migration, sharing, share revocation, and deletion pass end-to-end smoke QA.
- [x] Recovery works after browser storage is cleared and the previous owner credential is revoked.
- [x] Distributed mutation limiting is stored in Neon; no-database mode retains a bounded local fallback.
- [x] Application logs use fixed event codes and production canary verification finds no owner capability value.
- [x] Desktop and 390px mobile layouts pass browser QA without console errors, hydration failures, or horizontal overflow.
- [x] Typecheck, lint, tests, provider eval, decision eval, build, and audit pass.
- [x] GitHub Actions and the final Vercel production deployment pass.
- [x] No secrets or local environment files are committed.
- [x] Product story clearly supports AI full-stack Solopreneur, TPM, and UTS Master of AI positioning.




### Post-portfolio UX polish pass (2026-06-16)
After the portfolio-ready gate was set, an additional polish pass was applied to strengthen the demonstration quality of the product:
- Toast system: per-id timer map, shrinking progress bar, pause-on-hover, Shift+Esc dismiss-all, dismiss-all affordance at ≥2 toasts.
- Animation system: page-entrance fade-in, grid-rows collapsible panels, copilot shimmer, staggered snapshot list entrance, loading dot-pulse, workspace-switch crossfade.
- Overlay stack: `launchlens:escape` dispatcher plus `pushOverlay()` counter ensures Escape closes topmost overlay first; `inert` blocks focus into collapsed content.
- Error resilience: system-status offline/error/retry states, AbortController timeouts, online/offline events, recovery form inline validation, decision-brief parse-failure code path with dedicated `decision_invalid_response` message.
- Export robustness: "Copied!" feedback, `.md`/`.json` download fallback, retry-copy from fallback textarea.
- A11y: aria-describedby on wizard, role=dialog/aria-invalid on forms, chevron rotation on disclosures, reduced-motion respected globally.
- A11y (round 2): signal-select aria-describedby hint, Decision/NextAction textarea character-count announcements, system-status live-region network announcements, sr-only helper text on evidence forms.
- Mobile: viewport-clamped panels, bottom padding for floating help button.

These additions do not change the portfolio scope but raise the ceiling on demonstration polish so reviewers experience fewer seams when walking the product manually.

## Deliberate Non-Blocking Enhancements

These are commercial expansion paths, not missing evidence for the current portfolio release. They are ranked from cheapest to most expensive, with the cheapest items deliberately left for a future "pricing and evaluation polish" pass because they are not portfolio blockers.

### P0 - Hosted pricing page and self-serve onboarding
- **Status: billing core done, merchant activation pending.** `/pricing` links
  to `/billing`; hosted Checkout and Portal sessions activate only when complete
  Stripe settings exist.
- Card details remain on Stripe-hosted surfaces, and the disabled public state
  does not pretend that a merchant account is live.

### P1 - Longitudinal provider/decision eval retention and drift alerts
- Done. `fixtures/providers/decision-history/` keeps committed per-run history, `npm run decision:history -- --window --size 5 --drift-threshold 5` is wired into CI as a release gate, and `docs/decision-dashboard.html` is regenerated and uploaded as a build artifact on every push to `main`. A 90-day retention policy with a 10-entry minimum is enforced by `npm run decision:history -- --prune`.
- Why it is not in the portfolio release: a single decision fixture is enough evidence of a repeatable eval gate, and a real trend dashboard needs retention and querying choices that are themselves a design exercise.

### P2 - Team roles, comments, and collaboration primitives
- **Status: done.** Shipped as a membership table with role-aware storage, request, and migration paths. See the P2 entry under "Maturity Notes" for the per-route surface and the `smoke:rbac` exercise.
- The re-entry cost note for converting to a real commercial SaaS (P3 below) still covers billing and tenant isolation; the P2 work does not unlock that path on its own.


### P3 - Multi-tenant workspaces, billing, and hosted pricing as a real product
- **Status: core infrastructure implemented, external activation and identity
  remain.** Tenant isolation, RBAC, plan quotas, subscription persistence,
  webhook idempotency, Checkout, Portal, and hosted billing UI now exist.
- Still required: conventional identity, billing-admin/support roles,
  live-provider usage metering, account-owned Stripe sandbox evidence, and
  production merchant activation.

## Re-entry cost to convert this into a real commercial SaaS

This is a written-for-the-future-me note, not a deferred task. The original
P3 estimate has been reduced by implemented tenant, RBAC, entitlement, and
billing infrastructure, but accepting real payments still changes account,
support, audit, and operations responsibilities.

Honest scope estimate from a code review in mid-2026:

- Conventional identity, tenant ownership migration, deletion, and recovery:
  2 to 4 weeks.
- Account-owned Stripe sandbox, production activation, billing-admin/support
  policy, audit evidence, and incident runbook: 1 to 2 weeks.
- Live-provider usage metering and quota reconciliation: 3 to 5 days.
- Tenant isolation, billing state, hosted pricing, and team roles: implemented.
- Eval retention and drift alerts: 1 to 2 days.

Remaining re-entry estimate: roughly 3 to 6 weeks for a small team to move from
the current Stripe-ready core to a supportable paid SaaS. The bar for
portfolio-ready is met; the code path for billing now exists; the bar for
accepting and supporting real paying teams is not yet met.

### P3 - Multi-tenant workspace isolation (2026-06-14)
- Database migration adds launchlens_tenants table with UUID PK, owner_hash FK, and tenant_id column on workspaces.
- createWorkspace auto-creates a default tenant for new owners via INSERT ... WHERE NOT EXISTS.
- All existing workspaces backfilled with tenant_id via migration script.
- New API routes: GET/POST /api/tenants, GET /api/tenants/[id], GET/POST /api/tenants/[id]/workspaces.
- TenantStoreError with typed code+status for consistent error responses.
- Smoke test (smoke:tenant) verifies: 2 tenants per owner, cross-tenant workspace isolation, cross-owner 404, same-owner visibility.
- Unit tests for tenant store (4 tests).
- Status: ✅ Complete. Smoke:tenant, smoke:cloud, smoke:rbac all pass against production Neon.
- Remaining re-entry work is identity migration, billing/support roles,
  provider usage metering, and external Stripe acceptance evidence.

## Engineering hygiene (2026-06-14)

The portfolio release itself was complete at v1.0.0, but the project still benefited from a small, deliberate round of engineering-hygiene additions that real open-source maintainers ship, even for a single-author portfolio:

- SECURITY.md documents the threat model, what is in and out of scope, the responsible-disclosure flow, the response targets, and the hardening checklist.
- CONTRIBUTING.md documents the issue templates, the PR template, the style, the commit message convention, and which kinds of changes need an extra reviewer.
- .github/ISSUE_TEMPLATE/bug_report.md, .github/ISSUE_TEMPLATE/feature_request.md, .github/ISSUE_TEMPLATE/security.md give reviewers and recruiters the same structured intake forms that a real maintenance project would.
- .github/PULL_REQUEST_TEMPLATE.md asks for an explicit description of the affected surface, the verification matrix, the risk and rollback plan, and the linked issues.
- .github/workflows/codeql.yml runs a weekly GitHub Actions scan against the TypeScript and JavaScript sources so the security story is not a snapshot.
- NIGHTLY_LOG.md already carries a hand-written-diary disclaimer so no reader mistakes the log for a cron output.

This is not new portfolio scope; it is the kind of engineering hygiene that a Master of AI admissions reviewer can verify in five minutes by opening the repo and looking at the top-level files.

## Post-portfolio quality iteration (2026-06-16, R46-R54)

After v1.0.0 shipped, the repo accumulated another sustained pass of UX and robustness polish. None of this changes scope or moves the product closer to a paid SaaS; it narrows the gap between portfolio and real-software feel.

- **Error / loading / 404 surfaces brought onto the brand system.** Global `error.tsx`, `not-found.tsx`, and route-level `loading.tsx` all now use the established green/orange palette, the registered `fadeInDown` keyframe, accessible headings, and clear primary actions ("Open the demo workspace", "Try again" / "Back to demo"). Dev builds render the raw error message; production renders a friendly card.
- **Skeleton primitive upgraded with a shimmer variant.** All loading states now use the same `launchlens-shimmer` sweep (diagonal gradient animating across a muted-gray bar) instead of Tailwind's uniform `animate-pulse`. The route shell, cloud history "checking" rows, and per-panel async surfaces all use it.
- **DisclosureGroup for WAI-ARIA accordion keyboard nav.** The pricing FAQ is wrapped in a DisclosureGroup so Up/Down/Home/End move focus between toggles. The component is generic and reusable for other FAQ-style surfaces.
- **Modal focus-return.** The onboarding wizard and shortcuts modal now save the previously-focused element when they open and restore focus after the close animation finishes, preventing the "focus lands on `<body>`" accessibility anti-pattern.
- **Toast background-tab drift fixed.** A `visibilitychange` listener pauses all running toast timers when the tab is hidden and resumes them (reading the live DOM progress-bar width) when it becomes visible, so the auto-dismiss stays accurate even when setTimeout is throttled.
- **Broken animation class references cleaned up** and `launchlens-fade-in` registered defensively in `@theme` to prevent future silent-fail regressions where Tailwind emits a class pointing at a nonexistent keyframe.
- **Defensive empty-state** on the validation board for corrupted/zero-experiment workspaces.
- **Unit coverage expanded from 152 / 37 files to 164 / 38 files**, adding edge cases for recovery-key validation, `formatGeneratedTime`, the visual-regression pixel diff, and sample-brief structural invariants.
- **README keyboard-shortcut table** updated to include Cmd/Ctrl+Enter (generate from brief), Cmd/Ctrl+H (replay tour), and Shift+Esc (dismiss all toasts) which were all implemented but undocumented.

Quality gates remain green end-to-end: ESLint 0 warnings, strict `tsc --noEmit`, Vitest 164/164, and a clean `next build` on every iteration.


## Post-portfolio accessibility & export resilience pass (2026-06-16, R55-R71)

After R54, the iteration loop turned toward accessibility hardening, clipboard/export resilience, and modal keyboard polish — the kinds of gaps users only notice when they try to operate the product on a locked-down machine or with a screen reader.

- **Global primary-CTA color alignment.** Buttons that perform the primary action on every surface (Generate, Save, Share toggle, Regenerate brief, Add evidence, Submit, Open demo, Try again, Back to demo, Sign in) are now all the brand green (#138a72 / hover #0f7665) with a mint focus ring (#cbe8df). Previously a handful of CTAs inherited the near-black fill and felt heavier than the rest of the system.
- **Shared read-only view.** A Copy Link button and a Copy Markdown button now sit in the shared-page header. Copy Markdown has a three-tier fallback: Clipboard API → execCommand("copy") → Blob .md download, so visitors on http:// or with clipboard-deny permissions still walk away with the plan. Shift+click forces a download. Storage-unavailable renders a friendly card with a CloudOff icon and a green Back-to-demo CTA instead of a dead-end paragraph. `generateMetadata` provides OG tags without an extra DB round-trip.
- **`useFocusTrap` hook** provides Tab/Shift+Tab cycling inside the shortcuts modal and onboarding wizard, with [autofocus] preference and inert-aware candidate filtering. Existing animated focus-return is preserved (restoreFocus:false) so close animations are not interrupted.
- **Clipboard helpers extracted to `src/lib/launchlens/clipboard.ts`:** `copyTextToClipboard` (async, modern API with execCommand fallback, returns boolean) and `downloadTextFile` (Blob + anchor, returns boolean). The in-app Copy Markdown and Copy JSON buttons now use them and auto-download on failure rather than forcing the user to manually select from a textarea. Explicit `.md` and `.json` download buttons sit alongside Copy in the export header.
- **Screen-reader announcements.** An off-screen aria-live="polite" region in launch-workspace announces "Workspace ready. N audience segments, N tasks, N hypotheses" on generation success and reads back error messages on failure.
- **`safeMarkdownFilename`** slugifies landing-page headlines into 60-char-max filesystem-safe filenames (dashes collapsed, punctuation stripped, default fallback); tested for empty, duplicated dashes, and landingPage-headline fallback paths.
- **`buildDecisionEvalFixture`** gained three defensive checks (non-empty model label, ISO-8601 evaluatedAt, at least one eval case) with corresponding unit tests, so malformed fixtures fail fast during eval runs instead of silently propagating.
- **Workspace-quality edge cases** tested: invalid backlog priority, too-short task fields, duplicate pain bullets, too-short audience bullets, all-empty zero-score case.
- **Keyboard hint line** below the Generate button reminds users of Ctrl+Enter and ? for all shortcuts. README shortcut table updated to document Shift+click-to-download on Copy Markdown.
- **Test count: 180 tests / 38 files.** Quality gates remain green (ESLint 0-warn, tsc strict, Vitest, next build).

## Re-entry cost to a real commercial SaaS

Unchanged from the v1.0.0 release. See PROJECT_MATURITY.md for the 6 to 10 weeks of refactoring that would be needed to convert this portfolio release into a paying product.
