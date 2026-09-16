# Territorial Change Monitor

A reproducible, local-first workflow for detecting and explaining land-surface change from open satellite imagery.

This portfolio project focuses on a small area of interest in Spain. It demonstrates STAC discovery, cloud-aware image selection, raster processing, change metrics, quality controls, and an explainable map/report.

## First release

1. Define one small AOI and a land-change question.
2. Search public Sentinel-2 imagery through STAC.
3. Select comparable low-cloud scenes and document the selection.
4. Compute an NDVI difference product and a change mask.
5. Produce a map, a concise report, and a reproducible run command.

## Repository structure

- `config/` — example AOI and run configuration.
- `src/` — reusable processing code.
- `notebooks/` — exploratory work only; promote stable logic to `src/`.
- `docs/` — project brief, methodology, and data policy.
- `data/` — instructions and small fixtures; raw imagery is ignored.
- `outputs/` — generated products, ignored by Git.

## Scope guardrails

The first release answers one specific question over one AOI. It does not claim a universal land-cover classifier, infer causation from change, or depend on paid APIs.

## Learning connection

This is the second portfolio project in the [Modern Geospatial Engineering roadmap](https://github.com/Maciker/modern-geospatial-engineering).
