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

## Next Nightly Builder Tasks

- [x] Add unit tests for `buildMockWorkspace` and provider fallback.
- [x] Add route handler tests for invalid input and no-key demo mode.
- [x] Add editable workspace sections.
- [x] Add "copy as Markdown" export.
- [x] Add local persistence for edited workspace drafts.
- [ ] Add saved example workspace fixtures.
- [ ] Add screenshot assets for README.
- [ ] Add basic loading skeletons for long real-model calls.
- [ ] Add provider usage metadata without exposing secrets.
- [ ] Investigate MiniMax live response timeout and tune request shape if needed.

## Portfolio-Ready Checklist

- [x] `npm run lint` passes.
- [x] `npm run test` passes.
- [x] `npm run build` passes.
- [ ] Product can run from a fresh clone without API keys.
- [ ] README includes screenshots.
- [x] README includes demo script.
- [x] README includes architecture notes.
- [x] Generated workspace is editable and exportable.
- [x] Current workspace is restorable from browser-local storage after refresh.
- [x] API/provider behavior has tests.
- [ ] Public deployment URL is available.
- [ ] GitHub history shows incremental nightly progress.
