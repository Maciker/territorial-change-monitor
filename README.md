# Territorial Change Monitor

Compare a bounded pair of Sentinel-2 observations, mask invalid pixels and report candidate spectral change with provenance.

## Current state

The TypeScript MVP runs offline against recorded fixtures: a frozen Navarre AOI, STAC selection, aligned GeoTIFF reads, masked NDVI difference, thresholded review, resumable CLI, and a local MapLibre report. It does not download live imagery in CI and does not claim a cause for change.

All application, CLI and web code uses TypeScript on Node.js. QGIS desktop and PostGIS SQL remain GIS tools. There is no Python, FastAPI or PyQGIS runtime.

## Start

Use Node.js 22 or 24 and pnpm 10.17.1 (pinned in package.json).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm quality:fast
pnpm build
pnpm validate
pnpm change-run
pnpm web
```

`pnpm change-run` writes `outputs/fixture-run/` (gitignored). `pnpm web` serves the local viewer. See [local development](docs/development.md), [fixtures](docs/fixtures.md), [project specification](docs/project-spec.md), [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md).

## Agent workflow

Canonical instructions and skills are in `.ai/`, with generated adapters for Cursor, Codex, Copilot and Hermes. OpenCode can read root `AGENTS.md` and the named skill files explicitly. No automatic OpenCode discovery is assumed.

Imported from [agent-workflow-code-ts](https://github.com/Maciker/agent-workflow-code-ts/tree/c30e547b1306e10af31bbb8c6aa464832f5cf1b0). The pin, upstream MIT attribution and local adaptations are recorded in [workflow provenance](docs/workflow-provenance.json). This is a vendored snapshot: upstream changes require a reviewed update and regeneration, not a floating dependency on main.

Run `pnpm quality:full`, `pnpm prepr:gate` and `pnpm quality:stabilization` before review. Independent cross-model QA and human approval are merge requirements. Provider credentials are optional for local deterministic checks.

## Work order

The foundation is on `main`. Remaining product work is tracked in Linear project Territorial Change Monitor (parent [MAC-18](https://linear.app/maciker/issue/MAC-18/roadmap-deliver-the-typescript-gis-mvp-with-the-shared-agent-workflow)). Tickets specify dependencies, acceptance tests and relevant skills.

Keep source data immutable. Only tiny, licensed fixtures belong in Git; real datasets and generated outputs stay local.

## Post-PR review

Run `pnpm run pr:review -- --input <post-pr-review-input.json> --report <post-pr-review-report.json>` after PR creation. Only APPROVED is eligible for human merge consideration.
