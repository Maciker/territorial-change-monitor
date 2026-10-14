# Territorial Change Monitor

Compare a bounded pair of Sentinel-2 observations, mask invalid pixels and report candidate spectral change with provenance.

## Current state

The TypeScript MVP runs offline against **synthetic** fixtures: a frozen Navarre AOI, STAC selection from a recorded catalog, aligned GeoTIFF reads with NoData and SCL masks, masked NDVI difference, a thresholded review (|after − before| ≥ threshold, gains and losses counted separately), a CLI whose completed runs are cached by contract and source-file hashes, a QGIS-ready difference GeoTIFF and a local MapLibre report. It does not claim a cause for change.

What it does not do yet:

- **No real imagery path.** `HttpStacAdapter` is tested but not wired into the CLI, the raster reader only opens local files, and it rejects anything other than EPSG:4326 on a shared grid. Real Sentinel-2 L2A tiles (UTM, 10 m and 20 m bands) are rejected explicitly rather than reprojected or resampled.
- **No stage-level resume.** A cancelled run restarts from the beginning; only a completed run with unchanged inputs is reused.
- **No calibration.** The 0.20 threshold is predeclared for screening, not validated against reference data.

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

`pnpm change-run` writes `outputs/fixture-run/` (gitignored): `run.json` with the effective contract and source hashes, `report.txt`, `ndvi-difference.json`, `ndvi-difference.tif` and a QGIS recipe. It runs on the synthetic 20×20 demo scene described in [data/fixtures/navarre-demo](data/fixtures/navarre-demo/README.md): a loss patch, a gain patch, an isolated pixel, a masked cloud and a NoData column, giving 51 candidates (20 gain, 31 loss) at 0.875 valid coverage. `pnpm web` serves the local viewer, which works with external network access blocked. See [local development](docs/development.md), [fixtures](docs/fixtures.md), [project specification](docs/project-spec.md), [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md).

## Agent workflow

Canonical instructions and skills are in `.ai/`, with generated adapters for Cursor, Codex, Copilot and Hermes. OpenCode can read root `AGENTS.md` and the named skill files explicitly. No automatic OpenCode discovery is assumed.

Imported from [agent-workflow-code-ts](https://github.com/Maciker/agent-workflow-code-ts/tree/c30e547b1306e10af31bbb8c6aa464832f5cf1b0). The pin, upstream MIT attribution and local adaptations are recorded in [workflow provenance](docs/workflow-provenance.json). This is a vendored snapshot: upstream changes require a reviewed update and regeneration, not a floating dependency on main.

Run `pnpm quality:full`, `pnpm prepr:gate` and `pnpm quality:stabilization` before review. Independent cross-model QA and human approval are merge requirements. Provider credentials are optional for local deterministic checks.

## Work order

The foundation is on `main`. Remaining product work is tracked in Linear project Territorial Change Monitor (parent [MAC-18](https://linear.app/maciker/issue/MAC-18/roadmap-deliver-the-typescript-gis-mvp-with-the-shared-agent-workflow)). Tickets specify dependencies, acceptance tests and relevant skills.

Keep source data immutable. Only tiny, licensed fixtures belong in Git; real datasets and generated outputs stay local.

## Post-PR review

Run `pnpm run pr:review -- --input <post-pr-review-input.json> --report <post-pr-review-report.json>` after PR creation. Only APPROVED is eligible for human merge consideration.
