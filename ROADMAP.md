# LaunchLens AI Roadmap

## North Star

LaunchLens AI should become a credible AI SaaS portfolio project that shows product thinking, full-stack engineering, and practical AI workflow design. The product turns a raw SaaS idea into an actionable go-to-market workspace.

## Phase 1: Foundation and Demo Flow

- Scaffold Next.js, TypeScript, Tailwind, and lint/build tooling.
- Create a demo-first workspace interface rather than a blank landing page.
- Add a mock provider so the app works without secrets.
- Add an optional OpenAI-compatible provider behind server-side environment variables.
- Add an optional MiniMax Token Plan provider behind server-side environment variables.
- Add editable generated sections and Markdown export.
- Add tests for mock mode, fallback behavior, and API validation.
- Document the roadmap, tasks, maturity status, and nightly handoff log.

## Phase 2: Portfolio-Ready Product Loop

- Add persistent saved workspaces.
- Add persistence for edited workspaces.
- Add JSON export and then add export history/share links.
- Track assumptions and validation evidence.
- Add stable example workspaces for realistic reviewer demos.
- Add tests for provider fallback and API validation.
- Add loading/progress UX for long real-provider calls.
- Add provider quality scoring, then persist MiniMax and OpenAI-compatible regression fixtures.
- Add explicit live-provider evals with prompt versions, scenario compliance checks, secret-safe fixtures, and mock-only CI.
- Publish a public Vercel demo and keep the no-key mock experience as the default.
- Capture desktop/mobile product screenshots and maintain responsive browser QA evidence.

## Phase 3: SaaS Shape

- Phase 3A: add anonymous owner-scoped cloud snapshot history, restore, deletion, and opt-in read-only sharing while preserving local-only mode.
- Activate and verify the Neon-backed flow on the public Vercel deployment.
- Phase 3B: turn generated assumptions into an evidence-driven execution loop with confidence, decisions, next actions, and linked tasks.
- Phase 3C: add registration-free capability authentication, account recovery, and user-owned workspace history.
- Phase 4A: add evidence-grounded AI decision intelligence so the product has a third connected AI workflow stage after generation and validation.
- Add pricing and usage limits.
- Add team collaboration primitives.
- Add prompt versioning, eval fixtures, and generation quality checks.
- Add historical eval comparison and release thresholds for provider latency, structure, and scenario compliance as a post-portfolio enhancement.
- Harden the public demo with a polished README, screenshots, and production observability.

## Product Principles

- Start with a complete founder workflow, not a generic chatbot.
- Always run without secrets through the mock provider.
- Treat AI output as editable product infrastructure.
- Return safe fallback codes instead of exposing provider error details.
- Keep portfolio evidence visible in code, docs, and demo UX.
- Prefer clear product judgment over algorithm theater.

## Phase 3A Acceptance

- [x] Cloud storage initializes lazily and does not break a no-database build.
- [x] Anonymous owner tokens are high entropy and stored server-side only as SHA-256 hashes.
- [x] Workspace snapshots support owner-scoped list, create, restore, and delete operations.
- [x] Read-only sharing is off by default and has an explicit enable/disable action.
- [x] The UI communicates local-only, empty, ready, loading, and failure states.
- [x] API routes enforce body/schema/UUID validation, record limits, safe errors, and mutation throttling.
- [x] Request bodies are byte-limited before JSON parsing and normalized into known bounded fields.
- [x] Schema DDL is isolated in a deployment migration; runtime database code is server-only and DML-only.
- [x] Per-owner and global snapshot quotas use transaction advisory locks plus a conditional insert.
- [x] Public share queries use a dedicated projection that never selects founder input.
- [x] Neon is provisioned through Vercel Marketplace and the production save/restore/share flow is smoke-verified.
- [x] Add distributed abuse controls before enabling anonymous cloud writes at meaningful public scale.
- [x] Recovery-key capability authentication can replace an anonymous browser token without third-party registration.

## Phase 3B Acceptance

- [x] Every generated assumption becomes a stable validation experiment outside the provider schema.
- [x] Users can record bounded evidence with source, signal, and observed time.
- [x] Experiments track validation status, confidence, decision, next action, and a stable linked task ID.
- [x] Evidence state survives browser refresh and travels with cloud snapshots.
- [x] Markdown and JSON exports include the complete private validation record.
- [x] Public shares expose decision state and evidence counts but exclude evidence notes, sources, and founder input.
- [x] Legacy local/cloud snapshots without execution state receive safe defaults.
- [x] Stable examples include realistic supported, testing, and refuted validation stories.
- [x] Desktop and 390px mobile layouts provide a compact, keyboard-operable experiment review flow.
- [x] Production Neon round-trip verification proves execution state persists through cloud save/restore/share.
- [x] Phase 3C adds recoverable capability authentication before cloud history is treated as durable user-owned data.

## Phase 4A Acceptance

- [x] The app includes a third connected AI SaaS workflow stage: generated workspace -> validation evidence -> evidence-grounded decision brief.
- [x] Decision briefs are generated by a dedicated `/api/decision` route with body limits, rate limits, no-store responses, and safe fallback behavior.
- [x] The default decision provider is deterministic mock mode so reviewers can run the flow without secrets.
- [x] Live decision briefs require explicit `DECISION_COPILOT_LIVE_ENABLED=true` plus a configured real provider key.
- [x] Every generated claim cites exact evidence IDs already present in the selected experiment.
- [x] Decision briefs are rejected when provider output invents citations, omits required sections, exceeds field limits, or no longer matches the evidence fingerprint.
- [x] The UI invalidates stale briefs when experiment evidence changes and shows provider/mode/citation metadata without secrets.
- [x] Private Markdown/JSON exports include decision briefs; public shares keep evidence notes, sources, founder input, and AI decision briefs private.
- [x] Desktop and 390px mobile product screenshots now include the decision-copilot stage.
- [x] Production Neon round-trip proves decision briefs persist through cloud save/restore and remain private in public shares.
- [x] Add repeatable decision-brief evals for citation fidelity, signal alignment, recommendation direction, and no-fallback behavior.
- [x] Persist a secret-scanned MiniMax decision fixture for the three public evidence scenarios.
- [ ] Compare decision eval history over time and add release thresholds for latency drift as a post-portfolio enhancement.

## Phase 4B Acceptance

- [x] `npm run eval:decision` evaluates the decision copilot in no-secret mock mode.
- [x] Standard CI runs the mock decision eval alongside lint, tests, provider eval, build, and audit.
- [x] Live MiniMax decision eval is explicit through `npm run eval:decision -- --live --write-fixture`.
- [x] The live eval fixture records public supported, neutral, and challenged evidence scenarios without secrets.
- [x] Eval scoring checks all supplied evidence is cited, citations point to supplied evidence only, source fingerprints match, recommendation direction follows evidence, and no fallback was required.
- [x] Claim stance is normalized from cited evidence signals so UI labels cannot drift from the underlying evidence.
- [x] Provider text normalization removes stray generated quote prefixes from persisted decision briefs.
- [ ] Add longitudinal trend comparison across multiple fixture versions as a post-portfolio enhancement.

## Phase 3C Acceptance

- [x] Recovery credentials are derived client-side from a normalized handle plus a high-entropy key.
- [x] The recovery key is neither persisted by the app nor sent to the server.
- [x] Linking history transactionally migrates snapshots and revokes the previous browser credential.
- [x] Owner migration locks both identities and cannot merge beyond the per-account snapshot quota.
- [x] The same handle/key pair restores cloud history after local storage is cleared.
- [x] Recovery controls include masked input, reveal, copy, validation, loading, and error states.
- [x] Desktop and 390px mobile browser QA cover the recovery flow without console errors or horizontal overflow.

## Portfolio Release Acceptance

- [x] Three connected AI SaaS stages are usable: GTM generation, evidence validation, and cited decision synthesis.
- [x] Mock mode, optional real providers, structured validation, safe fallback, and eval fixtures are present.
- [x] Browser-local and Neon persistence, recovery, private export, and privacy-safe public sharing are verified.
- [x] Distributed mutation limiting is backed by Neon and keeps a local-only fallback.
- [x] Lint, typecheck, tests, provider evals, decision evals, build, audit, browser QA, cloud smoke, CI, and production deployment pass.
- [x] README, screenshots, architecture, demo script, case study, license, topics, and UTS/TPM positioning are complete.

## Phase 6 Acceptance

- [x] A Playwright-based hosted visual regression script captures the production build and diffs the result against the committed PNG baselines.
- [x] Visual diff supports an update-baseline mode and a configurable tolerance, with a dedicated pixel comparator and unit tests.
- [x] Decision eval writes a timestamped history entry on every run and exposes a trend-comparison command.
- [x] CI runs the decision trend comparison and a hosted visual regression build, uploading the visual regression report as an artifact.
- [x] Production deployment and visual regression both pass with zero pixel diff and zero decision quality drift.

