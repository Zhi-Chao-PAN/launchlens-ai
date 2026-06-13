# LaunchLens AI Architecture

This page collects the diagrams that explain how LaunchLens AI fits together. It is meant to be readable in five minutes by a reviewer who has not opened the code yet. The intent is to show how the product loop, the AI providers, the evidence and decision copilot, the persistence layer, and the security model compose into one application.

## 1. Product and data flow

The whole product is a small directed graph of three workflow stages, all backed by a single Next.js application that can run in mock-only mode without any database or API keys.

```
                  +-------------------+
   User brief --> |  Workspace editor  | -- markdown / json export --> User
                  +---------+---------+
                            |
                            v
                  +-------------------+
                  |  /api/generate    |
                  +---------+---------+
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
        [mock provider] [MiniMax Responses] [OpenAI-compatible]
              |             |             |
              +------+------+------+------+
                     |             |
                     v             v
              +-----------------------+
              | Safe parser + schema  |
              | + scenario compliance |
              +-----------+-----------+
                          |
                          v
                  editable workspace
                          |
                          v
                assumptions -> experiments
                          |
                          v
              /api/decision (deterministic mock by default)
                          |
                          v
        cited decision brief  +  invalidation when evidence changes
```

The same workspace powers three editor affordances: edit generated sections, add evidence per assumption, and ask the decision copilot for a cited recommendation. Each step is bounded: edit cannot exceed a per-field cap, evidence cannot exceed a per-experiment cap, and decision briefs must cite real evidence IDs that still exist in the workspace.

## 2. Provider, evidence, and decision gates

AI quality is enforced by a single repeatable CLI, not a hidden notebook. There are two eval commands and one trend command.

```
   scripts/evaluate-provider.ts    scripts/evaluate-decision.ts    scripts/decision-history.ts
            |                              |                              |
            v                              v                              v
   +----------------+             +----------------+            +-----------------+
   | 3 mock cases   |             | 3 mock cases   |            | latest history  |
   | score >= 90    |             | score == 100   |            | entry vs prev   |
   | no fallback    |             | citations ok   |            | + commit to     |
   +-------+--------+             +--------+-------+            | fixtures/...    |
           |                               |                    +--------+--------+
           v                               v                             |
   +----------------+             +----------------+                     v
   | live MiniMax   |             | live MiniMax   |             CI runs:
   | opt-in, secret |             | opt-in, secret |             lint -> test
   | scanned fixture|             | scanned fixture|             -> provider eval
   +----------------+             +----------------+             -> decision eval
                                                                 -> trend diff
                                                                 -> build
                                                                 -> audit
```

The CI step list itself is the second diagram. Every gate has a job name and a non-secret input. The CI never touches a real provider key unless the live mode is enabled by the operator; standard CI is mock-only.

## 3. Cloud persistence, recovery, and privacy

The cloud story is split into three concentric layers. The outer layer is capability authentication, the middle layer is owner-scoped persistence, and the inner layer is the public-share projection. Each layer uses a different SQL path.

```
   Browser (handle + recovery key)
        |
        v
   SHA-256 (handle + recovery key) -> owner capability token
        |
        v
   x-launchlens-owner: acct_...
        |
        v
   +----------------------------+  /api/workspaces/recovery
   | Neon launchlens_workspaces |
   | (owner_hash, ...)          |  <-- advisory lock per owner migration
   +-------------+--------------+  <-- conditional insert for quotas
                 |
                 v
   +----------------------------+
   | Public share projection    |  /share/[id]
   | excludes founder input,    |  read-only, privacy-safe
   | evidence notes/sources,   |
   | AI decision briefs         |
   +----------------------------+
```

A request to `/api/workspaces` is rate-limited through `launchlens_rate_limits` (a SHA-256-bucketed Neon table) and falls back to a per-process bucket only when the database is unavailable. The fallback is intentionally bounded so that no-database mode still has protection during local development.

## 4. Security in depth

Security is layered so that no single mistake escalates into a leak.

```
   +--------------------------------------------------+
   | 1. Transport + host allowlist                    |
   |    - HTTPS only                                  |
   |    - base URL and host allowlist before request  |
   +--------------------------------------------------+
                          |
                          v
   +--------------------------------------------------+
   | 2. Request body and shape                        |
   |    - byte limit checked before JSON parse        |
   |    - unknown fields stripped                     |
   |    - UUID v4 check on every id path              |
   +--------------------------------------------------+
                          |
                          v
   +--------------------------------------------------+
   | 3. Capability account                            |
   |    - high-entropy token, SHA-256 on server       |
   |    - recovery key never sent to server           |
   |    - handle is normalized client-side            |
   +--------------------------------------------------+
                          |
                          v
   +--------------------------------------------------+
   | 4. Storage isolation                             |
   |    - all queries parameterized on owner_hash     |
   |    - public share uses dedicated projection      |
   |    - migration uses two advisory locks + quota   |
   +--------------------------------------------------+
                          |
                          v
   +--------------------------------------------------+
   | 5. Provider isolation                            |
   |    - mock by default, no key required            |
   |    - real keys server-only, host allowlist       |
   |    - errors return fixed codes, never upstream   |
   +--------------------------------------------------+
                          |
                          v
   +--------------------------------------------------+
   | 6. Observability hygiene                         |
   |    - structured log lines use fixed event codes  |
   |    - owner credentials never logged              |
   |    - secret scan in CI before any push           |
   +--------------------------------------------------+
```

## 5. Why this design scales down to portfolio and up to commercial

A reviewer who wants to know whether this is a real product or a portfolio demo can look at three things:

1. The mock provider is not a stub; it is the same code path as the real providers, with the live call wrapped in a single function. Replacing the mock with a production key changes nothing else.
2. The local-only mode is not a fallback; it is the explicit capability state shown in the UI when no database is configured. The product loop is identical in both modes.
3. The cloud account model is a deliberate compromise: no third-party registration, but the same ownership guarantees as a logged-in account, and the upgrade path to a real identity provider is documented but not built.

These three properties are what let a single-author portfolio release carry the weight of a commercial product spec without pretending to be one. For the re-entry cost of converting this to a commercial SaaS, see the note at the end of `PROJECT_MATURITY.md`.
