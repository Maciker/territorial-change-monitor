import {
  combineMasks,
  maskedNormalizedDifference,
  type BoundingBox,
  type RunContract,
  type ScenePair,
} from "../../domain/src/index.js";
import type { AlignedRasterPair } from "./read-aligned-rasters.js";

export type DifferenceProvenance = {
  beforeId: string;
  afterId: string;
  beforeRedHash: string;
  afterRedHash: string;
  units: string;
  softwareVersion: string;
  changeThreshold: number;
};

export type NdviDifferenceResult = {
  width: number;
  height: number;
  bbox: BoundingBox;
  beforeNdvi: Float32Array;
  afterNdvi: Float32Array;
  difference: Float32Array;
  valid: Uint8Array;
  validCoverage: number;
  provenance: DifferenceProvenance;
};

export function computeNdviDifference(
  contract: RunContract,
  pair: ScenePair,
  rasters: AlignedRasterPair,
): NdviDifferenceResult {
  const valid = combineMasks([rasters.before.valid, rasters.after.valid]);
  const beforeNdvi = maskedNormalizedDifference(rasters.before.nir.values, rasters.before.red.values, rasters.before.valid);
  const afterNdvi = maskedNormalizedDifference(rasters.after.nir.values, rasters.after.red.values, rasters.after.valid);
  const difference = afterNdvi.map((value, index) =>
    valid[index] === 1 ? Math.fround(value - (beforeNdvi[index] ?? Number.NaN)) : Number.NaN,
  );
  return {
    width: rasters.before.red.width,
    height: rasters.before.red.height,
    bbox: rasters.before.red.bbox,
    beforeNdvi,
    afterNdvi,
    difference,
    valid,
    validCoverage: valid.length === 0 ? 0 : valid.filter((flag) => flag === 1).length / valid.length,
    provenance: {
      beforeId: pair.before.id,
      afterId: pair.after.id,
      beforeRedHash: rasters.before.red.hash,
      afterRedHash: rasters.after.red.hash,
      units: contract.units,
      softwareVersion: "0.1.0",
      changeThreshold: contract.changeThreshold,
    },
  };
}
