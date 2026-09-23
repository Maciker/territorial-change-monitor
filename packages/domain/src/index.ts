export function normalizedDifference(first: Float32Array, second: Float32Array): Float32Array {
  if (first.length !== second.length) throw new Error("Raster bands must have equal length");
  return first.map((value, index) => {
    const other = second[index]!;
    const total = Math.fround(value + other);
    return total === 0 ? Number.NaN : Math.fround(value - other) / total;
  });
}

export function maskedNormalizedDifference(first: Float32Array, second: Float32Array, valid: Uint8Array): Float32Array {
  const values = normalizedDifference(first, second);
  return values.map((value, index) => (valid[index] === 1 ? value : Number.NaN));
}

export { DomainError } from "./domain-error.js";
export { createRunContract, navarreExampleContract } from "./run-contract.js";
export type { BoundingBox, ObservationWindow, OutputManifestSchema, RunContract, RunContractInput } from "./run-contract.js";
export { intersectionCoveragePercent, selectComparableScenes } from "./scene.js";
export type { CatalogItem, Scene, SceneBand, SceneBandName, ScenePair } from "./scene.js";
export { applyScaleOffset, assertPixelBudget, assertSameGrid, combineMasks, validityMask } from "./raster-grid.js";
export type { RasterBand } from "./raster-grid.js";
