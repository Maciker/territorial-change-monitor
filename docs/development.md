# Local development

Use Node.js 22 or 24, Corepack and pinned pnpm 10.17.1. From the repository root:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm quality:fast
pnpm build
pnpm quality:full
pnpm quality:stabilization
```

For environments with a different global pnpm, use `corepack pnpm` or enable Corepack shims first. Esbuild is the sole allowlisted dependency build script.

## Offline fixture commands

```sh
pnpm validate      # run contract
pnpm select        # recorded STAC pair
pnpm read          # aligned GeoTIFFs and masks
pnpm difference    # masked NDVI difference
pnpm review        # thresholded candidates and QGIS recipe
pnpm change-run    # full bounded pipeline with cache and 30s timeout
pnpm demo          # numerical kernel only
pnpm web           # local MapLibre report
```

`pnpm change-run` writes atomically to `outputs/fixture-run/` and keeps incomplete runs visible. Delete that directory to clean up. Disk budget is 10 MB. Raster budget is 10,000 pixels and 1 MB per file. See [run lifecycle](run-lifecycle.md) and [fixtures](fixtures.md).

`pnpm web` uses a self-contained MapLibre style (background + local AOI GeoJSON only; no remote tiles, glyphs, or sprites). After `pnpm change-run`, the AOI map still loads when external network access is blocked.

Live STAC calls are optional and are not part of CI. The HTTP adapter has a 4s timeout and two retries; CI uses recorded fixtures only.
