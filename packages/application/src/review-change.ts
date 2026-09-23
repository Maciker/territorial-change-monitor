import { reviewCandidateChange, type ChangeReview, type RunContract } from "../../domain/src/index.js";
import type { NdviDifferenceResult } from "./compute-ndvi-difference.js";
import type { AlignedRasterPair } from "./read-aligned-rasters.js";

export function reviewDifference(
  contract: RunContract,
  rasters: AlignedRasterPair,
  difference: NdviDifferenceResult,
): ChangeReview {
  return reviewCandidateChange({
    difference: difference.difference,
    valid: difference.valid,
    width: rasters.before.red.width,
    height: rasters.before.red.height,
    bbox: contract.aoi,
    threshold: contract.changeThreshold,
    sign: "afterMinusBefore",
    minimumRegionPixels: 1,
  });
}
