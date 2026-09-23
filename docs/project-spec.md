# Territorial Change Monitor: bounded MVP

## Outcome
Compare a bounded pair of Sentinel-2 observations, mask invalid pixels and report candidate spectral change with provenance.

## Foundation delivered by this branch
The normalized-difference kernel and a validated Navarre run contract are in TypeScript. STAC, raster I/O, masking, pipeline and map are pending.

## Constraints
- TypeScript application code, Node 22/24, pnpm workspaces.
- Deterministic spatial/numerical results; never use an LLM as a geometry or accuracy oracle.
- Preserve CRS, units, NoData, source hashes, identifiers and licenses.
- Reject unsupported operations explicitly; never infer an authoritative CRS or silently repair inputs.
- Local demo first, bounded inputs and resources; no hosted service, billing or automatic publishing.

## Acceptance source
[Tracker #6](https://github.com/Maciker/territorial-change-monitor/issues/6) is the authoritative product backlog. Each linked ticket provides a vertical user outcome, dependencies and testable acceptance criteria.

## Workflow references
Use domain-modeling for contracts, architecture-hexagonal for ports/adapters, xp-tdd-practices and testing-standards for behavior, frontend-patterns for React, git-strategy for branches and qa-review for independent review. See canonical `.ai/skills/*/SKILL.md` and `.ai/commands/to-spec.md`, `to-tickets.md`.
