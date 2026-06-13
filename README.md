# LaunchLens AI

[![CI](https://github.com/Zhi-Chao-PAN/launchlens-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Zhi-Chao-PAN/launchlens-ai/actions/workflows/ci.yml)

LaunchLens AI is an AI-powered SaaS workspace that turns a raw product idea into an editable go-to-market plan for indie founders, solo builders, and small product teams.

The portfolio goal is to show full-stack AI product judgment: product strategy, UX workflow, provider abstraction, secure environment handling, tests, and a path from mock demo to real LLM-backed SaaS. It is not a pure algorithm or notebook project.

## Case Study Snapshot

Problem: early founders often have many product ideas but no coherent path from concept to target user, MVP scope, pricing, launch content, and execution tasks.

Solution: LaunchLens AI converts a founder brief into a workspace that can be generated, edited, and then operated as an evidence loop: assumption -> observation -> confidence -> decision -> next action.

Audience: solo founders, tiny SaaS teams, and technical product managers who need sharp execution before overbuilding.

Current maturity: portfolio-ready. The product loop is generate -> edit -> collect evidence -> synthesize an evidence-grounded AI decision brief -> link execution -> save/recover/share -> export.

## Product Preview

![LaunchLens AI desktop go-to-market workspace](public/screenshots/launchlens-desktop.png)

<p align="center">
  <img src="public/screenshots/launchlens-mobile.png" alt="LaunchLens AI mobile workspace" width="390" />
</p>

## Current Product Flow

1. Choose a stable example workspace or write a new founder brief.
2. Generate a go-to-market workspace using the mock provider by default.
3. Review target users, pain map, MVP scope, feature backlog, launch plan, pricing, risks, assumptions, content calendar, and execution tasks.
4. Review each assumption as a validation experiment, add evidence, set confidence, record a decision, and link the next execution task.
5. Generate an AI decision brief that cites only recorded evidence and separates recommendation, evidence strength, grounded claims, unresolved risks, and next actions.
6. Toggle edit mode and refine generated sections.
7. Keep the current brief, workspace, and private validation record across refreshes through browser-local persistence.
8. When `DATABASE_URL` is configured, save decision-point snapshots, restore history, and explicitly enable a privacy-safe read-only share link.
9. Generate a recovery key, link the current cloud history, and recover the same capability account after browser storage is cleared or on another device.
10. When cloud storage is absent, continue in a clearly labeled local-only mode without losing generation, validation, editing, or export.
11. Watch generation progress and provider metadata without exposing any secret or upstream response detail.
12. Copy/export the private workspace, evidence record, and current decision briefs as Markdown or JSON.

## Demo Script

1. Start the app with `npm run dev`.
2. Select the `B2B SaaS activation` sample brief.
3. Click `Generate workspace`.
4. In `Validation loop`, review the first evidence-backed hypothesis and its product decision.
5. In `AI decision copilot`, inspect the evidence-bound recommendation and grounded claims.
6. Click `Regenerate brief` and confirm the brief is saved without exposing provider internals.
7. Add evidence to another hypothesis, set confidence, record a decision/next action, and link an execution task.
8. Refresh the page and confirm the private evidence record is restored.
9. Click `Copy Markdown` or `Copy JSON` and inspect the complete execution handoff.
10. On a database-enabled deployment, save a snapshot, generate a recovery key, link the history, clear browser storage, and recover it with the same handle/key pair.
11. Explicitly confirm a read-only share that excludes evidence notes, sources, founder input, and private AI decision briefs.

## Stable Demo Fixtures

The app includes deterministic example workspaces for B2B SaaS activation, clinic admin, and creator commerce. Their validation stories intentionally cover supported, testing, and refuted hypotheses so reviewers can inspect product judgment immediately.

## Evidence Loop Design

- Provider output stays focused on the generated GTM schema; evidence is post-generation user state rather than invented model evidence.
- Assumptions and tasks use stable identities so reorder/insert operations cannot silently move evidence to another hypothesis.
- Validation progress is distinct from generated-workspace quality.
- Evidence records are bounded by item count, field length, and total normalized snapshot size.
- Private local/cloud snapshots and Markdown/JSON exports include evidence details.
- The AI decision copilot consumes evidence as untrusted data and every generated claim must cite exact evidence IDs.
- Decision briefs are invalidated when the underlying experiment evidence changes.
- Private local/cloud snapshots and Markdown/JSON exports include current decision briefs.
- Public shares include status, confidence, decisions, next actions, linked tasks, and evidence counts only; evidence notes, sources, founder input, and AI decision briefs remain private.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Vitest
- Server route handlers for generation, decision synthesis, and workspace persistence
- Optional Neon Postgres cloud history through `@neondatabase/serverless`
- Mock/demo provider by default
- Optional OpenAI-compatible provider through server-side environment variables
- Optional MiniMax Token Plan provider through server-side environment variables

## AI Provider Design

LaunchLens AI always runs without secrets.

- `mock` mode returns deterministic demo output so reviewers can run the project immediately.
- `minimax` mode is enabled only when `MINIMAX_API_KEY` exists on the server.
- `openai` mode is enabled only when `OPENAI_API_KEY` exists and MiniMax is not configured.
- Real provider failures return a safe fallback code and mock output, not upstream response details.
- Provider calls use HTTPS base URL validation, host allowlists, request timeouts, field caps, body caps, and a lightweight demo rate limit.
- Provider parsing accepts fenced JSON, strips reasoning tags, repairs minor JSON formatting issues, and falls back safely when core structure is missing.
- Real provider output must include the complete workspace schema; incomplete output falls back instead of receiving a misleading mock-filled quality score.
- The UI shows safe generation metadata such as mode, generated time, and fallback code, but never provider secrets.
- Workspace quality is scored with deterministic checks for summary, users, pains, MVP scope, backlog, landing copy, pricing, launch plan, tasks, and assumptions.
- The decision copilot uses deterministic mock briefs by default. Live real-provider decision briefs require both a real provider key and `DECISION_COPILOT_LIVE_ENABLED=true`.
- Decision-brief validation rejects invented evidence IDs, overlong fields, stale source fingerprints, and incomplete provider payloads.

## Visual Regression and Decision Trend

The production build is verified against committed design baselines, and decision-brief quality is tracked across runs.

```bash
npm run visual:regression -- --url https://launchlens-ai-two.vercel.app --tolerance 0.02
```

The script uses Playwright to capture the desktop (1440x900) and mobile (390x844) viewports, diffs them against `public/screenshots/launchlens-*.png`, and writes a JSON report. Pass `--update-baseline` to refresh the committed baselines. The GitHub Actions workflow `hosted-visual-regression` runs the same check on every push to `main` and uploads the report as a build artifact.

Decision-brief evaluation also feeds a per-run history file and a trend comparison:

```bash
npm run eval:decision -- --write-history
npm run decision:history -- --compare
```

The history snapshots are committed to `fixtures/providers/decision-history/` so CI can detect drift in quality score or recommendation direction between runs.

## Provider Evaluation

The repository includes a repeatable provider eval over three public scenarios:

- B2B SaaS activation
- Clinic administration with privacy and human-approval constraints
- Creator commerce with a 10-day launch constraint

The default command always clears provider variables and evaluates mock mode:

```bash
npm run eval:provider
```

Live MiniMax evaluation is deliberately explicit:

```bash
npm run eval:provider -- --live --write-fixture
```

The live command requires server-side `MINIMAX_*` variables. It prints metrics only, rejects fallback or incomplete schemas, checks scenario compliance, scans for secret-like values, and atomically writes `fixtures/providers/minimax-m3-public-samples.json`. Standard CI runs only the no-secret mock eval.

The MiniMax integration follows the official [Responses API](https://platform.minimaxi.com/docs/api-reference/responses-create) request fields.

## Decision Copilot Evaluation

Decision briefs have their own repeatable eval gate because the product risk is different from workspace generation. The eval checks citation fidelity, evidence-signal alignment, recommendation direction, evidence strength, no-fallback behavior, and scenario-specific behavior across supported, neutral, and challenged evidence.

The default command always clears provider variables and evaluates deterministic mock mode:

```bash
npm run eval:decision
```

Live MiniMax decision evaluation is explicit and can update the public fixture:

```bash
npm run eval:decision -- --live --write-fixture
```

The persisted fixture lives at `fixtures/providers/minimax-m3-decision-samples.json`. It contains public sample evidence, safe metadata, and MiniMax decision outputs only; it is scanned for secret-like values before writing. Standard CI runs only the no-secret mock decision eval.

Optional local provider variables:

```bash
MINIMAX_API_KEY=
MINIMAX_MODEL=MiniMax-M3
MINIMAX_BASE_URL=https://api.minimaxi.com/v1

DECISION_COPILOT_LIVE_ENABLED=true

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Do not commit `.env.local` or any secret values.

## Cloud Workspace Design

Cloud history is optional. A fresh clone and the public demo still render and run in local-only mode when no database is configured.

- The browser starts with a 256-bit anonymous owner token and keeps it in local storage.
- A user can generate a recovery key and combine it with a normalized handle to derive the same capability account on another browser.
- The recovery key is never persisted by the app or sent to the server. Only the derived owner credential reaches same-origin workspace routes.
- The server stores only the owner credential's SHA-256 hash, never its plaintext value.
- Recovery migration locks both owner identities transactionally, preserves the 20-snapshot account quota, and revokes the previous browser credential.
- Each anonymous or recovery-linked identity can keep up to 20 snapshots.
- A transaction-level global capacity gate prevents an anonymous beta from growing storage without an upper bound.
- Sharing is disabled by default and must be explicitly enabled per snapshot.
- Shared pages expose a read-only workspace and validation summary, not the owner token, founder brief, evidence notes, or evidence sources.
- Streaming body limits, nested field/cardinality limits, known-field normalization, UUID validation, owner-scoped queries, safe error codes, atomic quotas, and mutation throttling protect the public API surface.
- Mutation limits use a SHA-256 client bucket in Neon so the 20-per-minute gate is shared across serverless instances; local-only mode retains a bounded in-process fallback.
- Application logs emit fixed event codes rather than request bodies, owner credentials, provider responses, or database connection values.
- Runtime routes use DML only. Schema DDL is isolated in an explicit migration command so production can use a least-privilege runtime role.

Vercel Marketplace Neon injects `DATABASE_URL` automatically. Run the migration once after provisioning:

```bash
npm run db:migrate
```

Use `DATABASE_MIGRATION_URL` for an elevated migration role when available, and keep the runtime `DATABASE_URL` limited to table DML.

After a database-enabled deployment, verify the full cloud flow with:

```bash
LAUNCHLENS_BASE_URL=https://your-deployment.example.com npm run smoke:cloud
```

The smoke creates a temporary workspace, restores it, migrates it to a recovery account, proves the previous credential lost access, enables a public share, checks that private evidence and decision-brief details are not exposed, disables sharing, and deletes the workspace.

## Security Boundaries

- Capability credentials are high entropy, same-origin only, and stored server-side only as hashes.
- Recovery is deliberately password-manager friendly and registration-free; possession of the handle/key pair is the authentication factor.
- Recovery keys are masked by default, can be copied explicitly, and are not stored by LaunchLens AI.
- Database quotas and owner migration use advisory locks to keep concurrent writes within account and global capacity.
- Public shares use a dedicated SQL projection that never selects founder input, evidence notes/sources, or private AI decision briefs.
- Provider and storage errors return fixed safe codes. Tests assert unexpected errors cannot echo owner credentials into application logs.
- Standard CI and all reviewer flows remain no-secret. Live provider evals are explicit opt-in operations.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Live Demo

[launchlens-ai-two.vercel.app](https://launchlens-ai-two.vercel.app)

## Validate

```bash
npm run lint
npm run test
npm run eval:provider
npm run eval:decision
npm run smoke:cloud # only against a database-enabled deployment
npm run db:migrate # only after configuring a database
npm run build
npm audit --audit-level=moderate
```

## Architecture

```mermaid
flowchart LR
  A["Founder brief"] --> B["Next.js client workspace"]
  B --> C["/api/generate route"]
  C --> D{"Provider env?"}
  D -->|"none"| E["Mock provider"]
  D -->|"MINIMAX_API_KEY"| F["MiniMax Responses API"]
  D -->|"OPENAI_API_KEY"| G["OpenAI-compatible chat completions"]
  F --> H["Safe parser and schema checks"]
  G --> H
  H --> I["Editable GTM workspace"]
  E --> I
  I --> J["Assumptions"]
  J --> K["Evidence and confidence"]
  K --> L["/api/decision"]
  L --> T{"Live decision enabled?"}
  T -->|"false"| U["Evidence-bound mock brief"]
  T -->|"true + provider key"| V["Real provider decision brief"]
  U --> W["Per-claim citation validation"]
  V --> W
  W --> X["Decision and linked task"]
  X --> M["Browser local storage / private export"]
  X --> N["/api/workspaces"]
  N --> O{"DATABASE_URL?"}
  O -->|"configured"| P["Neon snapshot history"]
  O -->|"absent"| Q["Explicit local-only mode"]
  N --> Y["Shared Neon mutation limit"]
  P --> R["Owner-scoped restore"]
  P --> S["Privacy-safe read-only share"]
  P --> Z["Recovery-key account migration"]
```

## Portfolio Positioning

This project is built for Zhi-Chao-PAN's UTS Master of Artificial Intelligence application as a high-quality AI SaaS portfolio artifact. It emphasizes AI full-stack product development and technical product management rather than isolated model research.

## License

MIT License. See `LICENSE`.

See:

- `ROADMAP.md`
- `TASKS.md`
- `PROJECT_MATURITY.md`
- `NIGHTLY_LOG.md`

