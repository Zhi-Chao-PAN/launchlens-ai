# Project Maturity

Status: early-stage
Completion estimate: 70%

LaunchLens AI is currently in an early product loop stage. It has a real product direction, a public Vercel demo, stable example workspace fixtures, an editable workspace interface, browser-local persistence, Markdown/JSON export, tests, and provider abstraction that supports no-key mock mode plus optional real providers.

It is not portfolio-ready yet.

## Current Strengths

- The project is a practical AI SaaS workflow, not a pure theory or algorithm artifact.
- It can run without secrets through a mock provider.
- The first screen shows a product workflow: founder brief to generated GTM workspace to editing and Markdown export.
- Stable example fixtures give reviewers repeatable demo outputs before screenshots or deployment exist.
- Markdown and JSON export support both human-readable review and machine-readable automation handoff.
- Assumptions and pricing risks are visible, making AI product judgment easier to review.
- The current brief and generated workspace are saved in browser-local storage and restored after refresh.
- MiniMax and OpenAI-compatible provider hooks are optional and guarded by env-based configuration.
- MiniMax provider behavior has unit coverage and one successful live app-route smoke; persisted real-output regression fixtures still need a dedicated pass.
- Provider parsing now handles fenced JSON, reasoning tags, minor JSON repair, and safe fallback.
- Generation progress and safe provider metadata are visible without exposing secrets.
- Deterministic workspace quality checks now score generated outputs for structural completeness.
- Documentation now gives nightly automation a clear continuation path.
- The repository now includes an MIT license.
- GitHub Actions CI now runs lint, tests, build, and moderate audit on pushes and pull requests.
- A fresh clone was verified without API keys using `npm ci`, tests, build, audit, page smoke, and mock `/api/generate`.
- A public Vercel deployment is linked from README and keeps the no-key mock experience available.
- README now includes desktop and mobile product screenshots.
- Production-mode browser QA covers desktop and 390px mobile layouts, editing, local restore, mock generation, and horizontal overflow.
- Generated timestamps use deterministic UTC formatting so server and browser output hydrate consistently.

## Current Gaps

- Persistence is local-only; there is no server-side workspace history or user-owned account model yet.
- MiniMax live response quality still needs persisted real-output regression fixtures beyond one successful smoke and the deterministic structure evaluator.
- UX still needs deeper empty/error-state polish and deployed visual regression coverage.

## Portfolio Criteria Evidence

1. Product depth: partial pass. The app connects raw idea, audience/pain mapping, MVP scope, backlog, pricing, launch calendar, and tasks.
2. Agent/LLM depth: partial pass. It has provider orchestration, structured output coercion, mock mode, real-provider env support, safe errors, parser repair, progress UI, safe metadata, deterministic quality scoring, and one successful MiniMax live smoke; persisted live-provider regression evidence is still pending.
3. Full-stack quality: partial pass. Next.js, TypeScript, Tailwind, tests, editable UI, stable example fixtures, local persistence, and Markdown export exist; server persistence and screenshots are pending.
4. Verification: partial pass. `lint`, `test`, and `build` pass; production-mode Playwright QA now covers desktop/mobile rendering and the core no-key workflow.
5. Documentation: partial pass. README covers value prop, setup, env vars, demo flow, screenshots, architecture, AI design, roadmap, and portfolio story.
6. GitHub presentation: partial pass. Public repo, public Vercel demo, desktop/mobile screenshots, useful topics, clear commits, MIT license, and CI quality gate exist.
7. Portfolio story: partial pass. README explains AI full-stack Solopreneur/TPM positioning for the UTS Master of AI application; the story should become tighter once screenshots and deployment exist.
8. Maturity: partial pass. Multiple meaningful iterations now exist, but it remains a 1-2 week marathon project rather than finished portfolio work.
9. Quality review: not yet complete. A final quality pass must still cover UX, accessibility, mobile, docs, secret hygiene, build/test status, and story before completion.

## 1-2 Week Portfolio-Ready Acceptance Checklist

- [x] Fresh clone runs with `npm ci`, `npm run dev`, and no API key.
- [x] `npm run lint`, `npm run test`, and `npm run build` pass in documented local verification.
- [x] Mock provider and real-provider fallback have tests.
- [x] User can edit key generated sections.
- [x] User can export a workspace to Markdown and JSON.
- [x] User can restore the current workspace from browser-local storage after refresh.
- [x] Generation progress and safe provider metadata are visible.
- [x] Deterministic workspace quality scoring is included.
- [x] At least two realistic sample workspaces are included.
- [x] Stable example workspace fixtures are included for repeatable reviewer demos.
- [x] One MiniMax live app-route smoke succeeded without fallback using repo-external secrets.
- [x] README includes screenshots.
- [x] README includes architecture diagram and product demo script.
- [x] Public deployment URL is linked from README.
- [x] Repository includes a license.
- [x] Repository includes a CI quality gate.
- [x] Desktop and 390px mobile layouts pass production-mode browser QA without horizontal overflow or hydration errors.
- [ ] The app clearly communicates AI product thinking, full-stack skill, and TPM-style prioritization.
- [x] No secrets, private tokens, or generated local environment files are committed.

## Maturity Notes

The next nightly cycles should focus on server-side persistence, deployed visual regression coverage, richer empty/error states, and repeatable MiniMax quality fixtures. The credible portfolio loop is now public and visually documented, but it still needs production-depth evidence.
