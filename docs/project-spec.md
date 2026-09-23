# Territorial Change Monitor: bounded MVP

## Outcome
Compare a bounded pair of Sentinel-2 observations, mask invalid pixels and report candidate spectral change with provenance.

## Foundation delivered
The TypeScript fixture MVP is implemented: Navarre run contract, STAC selection, raster I/O and masks, NDVI difference, thresholded review, resumable CLI, and a local map/report. Live STAC downloads remain optional and are excluded from CI.

## Constraints
- TypeScript application code, Node 22/24, pnpm workspaces.
- Deterministic spatial/numerical results; never use an LLM as a geometry or accuracy oracle.
- Preserve CRS, units, NoData, source hashes, identifiers and licenses.
- Reject unsupported operations explicitly; never infer an authoritative CRS or silently repair inputs.
- Local demo first, bounded inputs and resources; no hosted service, billing or automatic publishing.

## Acceptance source
Linear project Territorial Change Monitor, parent [MAC-18](https://linear.app/maciker/issue/MAC-18/roadmap-deliver-the-typescript-gis-mvp-with-the-shared-agent-workflow), mirrors GitHub tracker #6.

## Workflow references
Use domain-modeling for contracts, architecture-hexagonal for ports/adapters, xp-tdd-practices and testing-standards for behavior, frontend-patterns for React, git-strategy for branches and qa-review for independent review. See canonical `.ai/skills/*/SKILL.md` and `.ai/commands/to-spec.md`, `to-tickets.md`.
