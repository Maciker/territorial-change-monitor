# Architecture

## Current scaffold
The TypeScript MVP is a vertical slice over recorded fixtures: run contract, STAC ports, GeoTIFF adapter, NDVI difference, change review, resumable CLI and a local web viewer. Live downloads and hosted publishing are out of scope.

## Dependency direction
`apps/` contains entry points and delivery adapters (`cli`, `web`). `packages/domain/` contains pure computational behavior. `packages/application/` contains use cases and ports. Infrastructure adapters in `apps/cli` depend on those ports.

Domain code must not depend on application, infrastructure, HTTP, filesystem, databases or browser APIs. CLI and web reuse contracts/use cases instead of duplicating rules. TypeScript is the implementation language throughout; SQL and QGIS desktop assets are external tools, not alternate application runtimes.

## Planned boundaries
- Inputs are validated at adapters; preserve source metadata and stable IDs.
- Computation returns explicit results and limitations.
- Persistence/export adapters keep immutable provenance and distinguish incomplete runs.
- UI displays only recorded results; bounded requests and cancellation precede large inputs.

## Workflow
The imported `.ai/` skills are canonical. Generated vendor projections must be regenerated with `pnpm ai:sync`; validate with `pnpm quality:stabilization`. Architecture, lint, test, duplication, dead-code and ratchet checks include apps/packages. Upstream workflow manuals remain under docs and may describe the original boilerplate; this page and project-spec.md define this product's architecture.
