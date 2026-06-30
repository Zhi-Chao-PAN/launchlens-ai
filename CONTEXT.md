# LaunchLens AI domain context

LaunchLens AI turns a product or market brief into a go-to-market workspace. The product serves readers with different levels of operating sophistication, so the same generated workspace can be rendered at different information densities without changing the underlying data.

## Core product terms

- Output Profile: a reader-facing display mode that changes information density and advanced-tool visibility while preserving the complete workspace data model.
- Idea Profile: the plain-language mode for individual builders or people with an early product idea. It prioritizes target user, pain, MVP, positioning, launch steps, and immediate execution tasks.
- Founder Profile: the balanced operating mode for early teams. It keeps validation, backlog, pricing, launch plan, assumptions, content calendar, and execution rhythm visible.
- Analyst Profile: the full-density mode for expert readers. It exposes the complete validation loop, decision copilot, risk surface, evidence workflow, and operating artifacts.
- Validation Loop: the workspace area where assumptions become hypotheses, evidence, confidence, and decisions.
- Decision Copilot: the evidence-grounded AI layer that summarizes only recorded validation evidence and should not invent external evidence.

## Implementation rule

Output Profiles must not mutate or truncate saved workspace data. Any simplified view may hide or slice displayed items, but edit mode must expose the complete workspace so users do not accidentally save a reduced artifact.
