# Territorial Change Monitor

Compare a bounded pair of Sentinel-2 observations, mask invalid pixels and report candidate spectral change with provenance.

## Current state

The normalized-difference kernel and its known-result test are ported to TypeScript. STAC, raster I/O, masking, pipeline and map are pending. This is a foundation, not a completed GIS product.

All application, CLI and API code uses TypeScript on Node.js. QGIS desktop and PostGIS SQL remain GIS tools. There is no Python, FastAPI or PyQGIS runtime.

## Start

Use Node.js 22 or 24 and pnpm 10.17.1 (pinned in package.json).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm quality:fast
pnpm build
```

See [local development](docs/development.md), [project specification](docs/project-spec.md), [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md).

## Agent workflow

Canonical instructions and skills are in `.ai/`, with generated adapters for Cursor, Codex, Copilot and Hermes. OpenCode can read root `AGENTS.md` and the named skill files explicitly. No automatic OpenCode discovery is assumed.

Imported from [agent-workflow-code-ts](https://github.com/Maciker/agent-workflow-code-ts/tree/97d01f03436cbbf35936c172008e74e55be56dd5). The pin, upstream MIT attribution and local adaptations are recorded in [workflow provenance](docs/workflow-provenance.json). This is a vendored snapshot: upstream changes require a reviewed update and regeneration, not a floating dependency on main.

Run `pnpm quality:full` and `pnpm quality:stabilization` before review. Independent cross-model QA and human approval are merge requirements. Provider credentials are optional for local deterministic checks.

## Work order

Start with [foundation #7](https://github.com/Maciker/territorial-change-monitor/issues/7), then follow [MVP tracker #6](https://github.com/Maciker/territorial-change-monitor/issues/6). Tickets specify dependencies, acceptance tests and relevant skills. No feature is complete merely because its ticket exists.

Keep source data immutable. Only tiny, licensed fixtures belong in Git; real datasets and generated outputs stay local.
