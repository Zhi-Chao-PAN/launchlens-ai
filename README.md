# LaunchLens AI

[![CI](https://github.com/Zhi-Chao-PAN/launchlens-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Zhi-Chao-PAN/launchlens-ai/actions/workflows/ci.yml)

LaunchLens AI is an AI-powered SaaS workspace that turns a raw product idea into an editable go-to-market plan for indie founders, solo builders, and small product teams.

The portfolio goal is to show full-stack AI product judgment: product strategy, UX workflow, provider abstraction, secure environment handling, tests, and a path from mock demo to real LLM-backed SaaS. It is not a pure algorithm or notebook project.

## Case Study Snapshot

Problem: early founders often have many product ideas but no coherent path from concept to target user, MVP scope, pricing, launch content, and execution tasks.

Solution: LaunchLens AI converts a founder brief into a workspace that can be generated, edited, reviewed for assumptions/risks, and exported as Markdown.

Audience: solo founders, tiny SaaS teams, and technical product managers who need sharp execution before overbuilding.

Current maturity: early-stage, but now beyond a static scaffold. The product loop is generate -> edit -> validate assumptions -> save locally or as a cloud snapshot -> restore/share -> export.

## Product Preview

![LaunchLens AI desktop go-to-market workspace](public/screenshots/launchlens-desktop.png)

<p align="center">
  <img src="public/screenshots/launchlens-mobile.png" alt="LaunchLens AI mobile workspace" width="390" />
</p>

## Current Product Flow

1. Choose a stable example workspace or write a new founder brief.
2. Generate a go-to-market workspace using the mock provider by default.
3. Review target users, pain map, MVP scope, feature backlog, launch plan, pricing, risks, assumptions, content calendar, and execution tasks.
4. Toggle edit mode and refine generated sections.
5. Keep the current brief and workspace across refreshes through browser-local persistence.
6. When `DATABASE_URL` is configured, save decision-point snapshots, restore history, and explicitly enable a read-only share link.
7. When cloud storage is absent, continue in a clearly labeled local-only mode without losing generation, editing, or export.
8. Watch generation progress and provider metadata without exposing any secret or upstream response detail.
9. Copy/export the workspace as Markdown or JSON for a README, Notion doc, product memo, automation, or launch plan.

## Demo Script

1. Start the app with `npm run dev`.
2. Select the `B2B SaaS activation` sample brief.
3. Click `Generate workspace`.
4. Review the assumptions and pricing risks to show that the output is not just marketing copy.
5. Click `Edit`, change one assumption or landing page line, then click `Preview`.
6. Refresh the page and confirm the local workspace is restored.
7. On a database-enabled deployment, click `Save snapshot`, restore it from cloud history, and explicitly enable a read-only share link.
8. Click `Copy Markdown` or `Copy JSON` and inspect the generated export text.

## Stable Demo Fixtures

The app includes deterministic example workspaces for the B2B SaaS activation, clinic admin, and creator commerce scenarios. They give reviewers a repeatable product walkthrough alongside the hosted demo and screenshot set.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Vitest
- Server route handlers for generation and workspace persistence
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

Optional local provider variables:

```bash
MINIMAX_API_KEY=
MINIMAX_MODEL=MiniMax-M3
MINIMAX_BASE_URL=https://api.minimaxi.com/v1

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Do not commit `.env.local` or any secret values.

## Cloud Workspace Design

Cloud history is optional. A fresh clone and the public demo still render and run in local-only mode when no database is configured.

- The browser creates a 256-bit anonymous owner token and keeps it in local storage.
- Requests send that token only to same-origin workspace routes.
- The server stores only the token's SHA-256 hash, never the plaintext token.
- Each browser identity can keep up to 20 snapshots.
- A transaction-level global capacity gate prevents an anonymous beta from growing storage without an upper bound.
- Sharing is disabled by default and must be explicitly enabled per snapshot.
- Shared pages expose a read-only workspace, not the owner token or founder brief.
- Streaming body limits, nested field/cardinality limits, known-field normalization, UUID validation, owner-scoped queries, safe error codes, atomic quotas, and mutation throttling protect the public API surface.
- Losing browser storage loses access to anonymous cloud history. Account-based recovery is intentionally deferred to the authentication phase.
- Runtime routes use DML only. Schema DDL is isolated in an explicit migration command so production can use a least-privilege runtime role.

Vercel Marketplace Neon injects `DATABASE_URL` automatically. Run the migration once after provisioning:

```bash
npm run db:migrate
```

Use `DATABASE_MIGRATION_URL` for an elevated migration role when available, and keep the runtime `DATABASE_URL` limited to table DML.

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
  I --> J["Browser local storage"]
  I --> K["Markdown export"]
  I --> L["/api/workspaces"]
  L --> M{"DATABASE_URL?"}
  M -->|"configured"| N["Neon snapshot history"]
  M -->|"absent"| O["Explicit local-only mode"]
  N --> P["Owner-scoped restore"]
  N --> Q["Opt-in read-only share page"]
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
