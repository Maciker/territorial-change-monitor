# Methodology

1. Define a compact AOI and a question with a meaningful observation window.
2. Discover Sentinel-2 Level-2A items via STAC.
3. Select before/after scenes using documented cloud, seasonality, and coverage criteria.
4. Apply data-quality masks and calculate NDVI from red and near-infrared bands.
5. Calculate the difference (after − before) and flag valid pixels where |difference| ≥ a predeclared threshold, reporting gains and losses separately. Report the run as insufficient below 20% valid pixels.
6. Inspect candidate change in QGIS and publish an uncertainty statement.

The result is a screening signal, not evidence of cause or an operational land-cover product. Known false-positive sources: seasonality, residual clouds and shadows, registration residuals, bounding-box (not footprint) coverage and scene-level cloud cover. The threshold is not calibrated against reference data.
