---
description: "Pre Pr workflow from agent-guardrails-ts"
---

# Pre Pr

Read AGENTS.md first. Then follow this workflow.

# Pre-PR gate

Use this command after the executor finishes an implementation and before Cursor opens a pull request. It is mandatory for agent-generated changes.

## Contract

- The QA reviewer is read-only and must use a clean context.
- Review the exact base and head SHAs recorded by pnpm qa:prepare.
- Use a different provider/model from the implementer whenever the model identity can be verified.
- If the implementer or reviewer model cannot be verified, stop and report that limitation; do not call the result cross-model QA.
- A source/test change after QA invalidates the report. Run qa:prepare again.
- Do not use paid overage, raise limits, merge, deploy or auto-merge.

## Sequence

1. Read AGENTS.md, the relevant plan/PRD, .ai/prompts/qa-cross-model.md, .ai/agents/qa-cross-model.md and .ai/skills/qa-review/SKILL.md.
2. Run the deterministic checks required by the repository, at least:

   pnpm quality:full

3. Capture the exact diff and working-tree snapshot:

   pnpm qa:prepare -- --base origin/main --head HEAD --implementer-provider <verified-implementer-provider> --implementer-model <verified-implementer-model>

   Use the real base ref for the branch when it is not origin/main. Do not guess model names.
4. Invoke the qa-cross-model subagent explicitly with a fresh context. Give it the generated input, repository guardrails and the exact diff. It must return only the documented JSON review and must not edit files.
5. Save the JSON response to .ai/workspace/qa/outputs/qa-review.json, then validate it:

   pnpm qa:validate

6. Record the model evidence. Pass the identities the host actually reports; do not guess them:

   pnpm qa:record -- --reviewer-provider <provider> --reviewer-model <model> --implementer-provider <provider> --implementer-model <model>

   If the host cannot provide either identity, stop instead of fabricating metadata. The manifest records `modelVerification: "declared"` and `identitySource: "operator-declared"`: the tools compare the identities but cannot prove them, so the operator is accountable for their accuracy and the PR must name them.
7. Run the strict pre-PR gate:

   pnpm prepr:gate

   This checks the exact head SHA, the working-tree snapshot, the QA-input digest, that the declared identities differ, schema and QA decision. A passing qa:gate alone is not sufficient.
8. If the decision is iterate, apply only the listed fixes, at most two rounds. After every fix repeat steps 2–7. If the decision is stop, a P0/P1 blocker remains, deterministic checks fail, or the independent model is unavailable, stop and return control to the human.
9. Only after pnpm prepr:gate passes may Cursor use its supported PR-creation action. Include the commands, exact models, score/decision, limitations and the fact that Cursor will perform a separate PR review. Do not merge or deploy.

The gate protects the supported workflow path. A vendor or external integration that creates a PR without running this command may bypass it and must be documented as outside the covered path.

## Post-PR review

After creating a PR, run `pnpm run pr:review -- --input <post-pr-review-input.json> --report <post-pr-review-report.json>` against the exact base/head SHA. Only APPROVED with durable evidence can proceed; PENDING, BLOCKED and CHANGES_REQUESTED stop the flow.
