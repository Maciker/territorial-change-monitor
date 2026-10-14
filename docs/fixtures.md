# Fixtures and licenses

The GeoTIFF files under `test/fixtures/rasters/` are synthetic 2x2 arrays for unit tests, and `data/fixtures/navarre-demo/` holds the synthetic 20x20 demo scene used by the CLI and viewer (layout and expected counts in its README). Both are written by `tools/generate-raster-fixtures.mjs`. They are not Sentinel-2 products and contain no Earth observation pixels. The local viewer labels these synthetic NDVI grids and shows the AOI polygon on a self-contained MapLibre style (see [development](development.md)).

STAC records in `test/fixtures/stac/navarre-items.json` are recorded search fixtures for CI. They use Copernicus Sentinel-2 identifiers as examples. A live search would be subject to the [Copernicus Sentinel data terms](https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice).

Do not commit raw imagery, paid data, or credentials. Generated run outputs stay in `outputs/`.
