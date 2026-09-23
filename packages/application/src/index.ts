export { selectScenes, stacSearchBounds } from "./select-scenes.js";
export type { StacCatalog, StacSearchQuery } from "./ports/stac-catalog.js";
export { readAlignedRasters, rasterLimits } from "./read-aligned-rasters.js";
export type { AlignedRasterPair, MaskedSceneRasters } from "./read-aligned-rasters.js";
export type { RasterReader } from "./ports/raster-reader.js";
export { computeNdviDifference } from "./compute-ndvi-difference.js";
export type { DifferenceProvenance, NdviDifferenceResult } from "./compute-ndvi-difference.js";
