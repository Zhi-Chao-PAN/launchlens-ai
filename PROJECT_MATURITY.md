# Project Maturity

Status: early-stage
Completion estimate: 80%

LaunchLens AI is currently in an early SaaS product stage. It has a real product direction, a public Vercel demo, stable example workspace fixtures, an editable workspace interface, browser-local persistence, optional owner-scoped cloud snapshot history, opt-in read-only sharing, Markdown/JSON export, tests, and provider abstraction that supports no-key mock mode plus optional real providers.

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
- MiniMax provider behavior has unit coverage, a successful app-route smoke, and a persisted three-scenario live regression fixture.
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
- Provider evals are explicit, prompt-versioned, secret-scanned, scenario-aware, and mock-only in standard CI.
- The persisted MiniMax fixture covers activation SaaS, clinic administration, and creator commerce with real-provider output, no fallback, 100% structural quality, and passed scenario constraints.
- A lazy Neon data layer now supports owner-scoped snapshot creation, listing, restore, deletion, and explicit read-only sharing without breaking no-database builds.
- Anonymous owner tokens are generated in the browser and stored only as SHA-256 hashes server-side; API routes add nested schema validation, UUID checks, limits, safe errors, and mutation throttling.
- Request byte limits now run before JSON parsing; accepted snapshots are normalized to known fields with bounded strings, arrays, and timestamps.
- Anonymous snapshot creation uses transaction advisory locks and conditional insertion to enforce atomic per-owner and global capacity gates.
- Runtime database access is server-only and DML-only by design; schema DDL lives in an explicit migration command.
- Public share reads use a dedicated projection that does not select or type the private founder brief.
- The product now renders deliberate local-only, checking, empty-history, busy, success, and cloud-failure states.
- Cloud persistence has focused route and ownership tests, while local-only production rendering has browser evidence.
- A diff-scoped security review covered all changed/new source files; two request-body candidates were fixed and no reportable finding survived validation.

## Current Gaps

- Production Neon provisioning is waiting for the Vercel account owner to accept Marketplace legal terms; real deployed save/restore/share evidence is therefore still pending.
- Cloud ownership is an anonymous browser-token beta, not recoverable account authentication.
- Mutation throttling is process-local; distributed abuse control and hosting-log header verification remain production activation gates.
- Provider eval history is currently one snapshot; trend comparison and release thresholds are not automated yet.
- UX still needs deeper empty/error-state polish and deployed visual regression coverage.

## Portfolio Criteria Evidence

1. Product depth: partial pass. The app connects raw idea, audience/pain mapping, MVP scope, backlog, pricing, launch calendar, and tasks.
2. Agent/LLM depth: strong partial pass. It has provider orchestration, complete-schema validation, mock mode, real-provider env support, safe errors, parser repair, progress UI, safe metadata, prompt-versioned evals, deterministic quality scoring, scenario compliance checks, and persisted MiniMax regression evidence.
3. Full-stack quality: strong partial pass. Next.js, TypeScript, Tailwind, tests, editable UI, stable examples, local persistence, a Neon-backed snapshot API, owner-scoped history/share UI, Markdown/JSON export, responsive QA, and screenshots exist; production database activation and account auth are pending.
4. Verification: partial pass. `lint`, `test`, and `build` pass; production-mode Playwright QA now covers desktop/mobile rendering and the core no-key workflow.
5. Documentation: partial pass. README covers value prop, setup, env vars, demo flow, screenshots, architecture, AI design, roadmap, and portfolio story.
6. GitHub presentation: partial pass. Public repo, public Vercel demo, desktop/mobile screenshots, useful topics, clear commits, MIT license, and CI quality gate exist.
7. Portfolio story: partial pass. README explains AI full-stack Solopreneur/TPM positioning for the UTS Master of AI application and now includes public product and model-eval evidence; the story should become tighter with server persistence and final case-study metrics.
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
- [x] Three public MiniMax scenarios have persisted, secret-scanned, no-fallback regression fixtures.
- [x] README includes screenshots.
- [x] README includes architecture diagram and product demo script.
- [x] Public deployment URL is linked from README.
- [x] Repository includes a license.
- [x] Repository includes a CI quality gate.
- [x] Desktop and 390px mobile layouts pass production-mode browser QA without horizontal overflow or hydration errors.
- [x] Cloud workspace APIs are build-safe without a database and expose an explicit local-only capability state.
- [x] Anonymous owner-scoped snapshot history and opt-in read-only sharing are implemented with focused tests.
- [x] Cloud request streams, nested content, owner quotas, public projections, and migration privileges have security-focused controls and regression evidence.
- [ ] Production Neon save, restore, share, disable-share, and delete pass end-to-end browser verification.
- [ ] Distributed abuse protection and owner-header log hygiene are verified on the production host.
- [ ] Recoverable user authentication replaces anonymous browser ownership.
- [ ] The app clearly communicates AI product thinking, full-stack skill, and TPM-style prioritization.
- [x] No secrets, private tokens, or generated local environment files are committed.

## Maturity Notes

The next cycles should activate production Neon, capture end-to-end cloud evidence, then move from anonymous ownership to recoverable authentication. Deployed visual regression coverage and historical provider-eval comparison remain useful follow-ups. The project now demonstrates the code shape of a durable SaaS workflow, but it should not be called portfolio-ready until the production data path and final quality audit are complete.
