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
- Phase 3C: replace anonymous browser ownership with authentication, account recovery, and user-owned workspace history.
- Add pricing and usage limits.
- Add team collaboration primitives.
- Add prompt versioning, eval fixtures, and generation quality checks.
- Add historical eval comparison and release thresholds for provider latency, structure, and scenario compliance.
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
- [ ] Neon is provisioned through Vercel Marketplace and the production save/restore/share flow is browser-verified.
- [ ] Add distributed abuse controls before enabling anonymous cloud writes at meaningful public scale.
- [ ] Authentication and recoverable account ownership replace the anonymous browser token in Phase 3C.

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
- [ ] Production Neon round-trip verification proves execution state persists through live cloud save/restore/share.
- [ ] Phase 3C adds recoverable authentication before cloud history is treated as a durable user account.
