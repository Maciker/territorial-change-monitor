import { aoiAreaKm2, type BoundingBox } from "./run-contract.js";

export type ChangeSign = "afterMinusBefore";

export type ChangeReviewInput = {
  difference: Float32Array;
  valid: Uint8Array;
  width: number;
  height: number;
  bbox: BoundingBox;
  threshold: number;
  sign: ChangeSign;
  minimumRegionPixels: number;
};

export type ChangeReview = {
  threshold: number;
  sign: ChangeSign;
  minimumRegionPixels: number;
  candidateCount: number;
  /** Candidates where after - before is positive. */
  gainCount: number;
  /** Candidates where after - before is negative. */
  lossCount: number;
  candidateAreaKm2: number;
  candidateFlags: Uint8Array;
  limitations: readonly string[];
};

const reviewLimitations = [
  "Registration residuals can create false candidate edges.",
  "Residual clouds and cloud shadows can survive the SCL mask.",
  "Seasonality can change NDVI without a lasting land-surface conversion.",
  "Scene coverage is estimated from catalog bounding boxes, not from valid-data footprints.",
  "Cloud cover filtering uses scene-level metadata, not cloud cover over the AOI.",
  "The change threshold is predeclared for screening and has not been calibrated against reference data.",
];

export function reviewCandidateChange(input: ChangeReviewInput): ChangeReview {
  const rawFlags = Uint8Array.from(input.difference, (value, index) => {
    if (input.valid[index] !== 1 || Number.isNaN(value)) return 0;
    return Math.abs(value) >= input.threshold ? 1 : 0;
  });
  const candidateFlags = dropSmallRegions(rawFlags, input.width, input.height, input.minimumRegionPixels);
  const candidateCount = candidateFlags.reduce((total, flag) => total + flag, 0);
  const gainCount = candidateFlags.reduce((total, flag, index) => total + (flag === 1 && input.difference[index]! > 0 ? 1 : 0), 0);
  const pixelArea = aoiAreaKm2(input.bbox) / (input.width * input.height);
  return {
    threshold: input.threshold,
    sign: input.sign,
    minimumRegionPixels: input.minimumRegionPixels,
    candidateCount,
    gainCount,
    lossCount: candidateCount - gainCount,
    candidateAreaKm2: candidateCount * pixelArea,
    candidateFlags,
    limitations: reviewLimitations,
  };
}

function dropSmallRegions(flags: Uint8Array, width: number, height: number, minimumRegionPixels: number): Uint8Array {
  const kept = new Uint8Array(flags.length);
  const seen = new Uint8Array(flags.length);
  for (let index = 0; index < flags.length; index += 1) {
    if (flags[index] !== 1 || seen[index] === 1) continue;
    const region: number[] = [];
    const stack = [index];
    seen[index] = 1;
    while (stack.length > 0) {
      const current = stack.pop()!;
      region.push(current);
      const column = current % width;
      const row = Math.floor(current / width);
      const neighbors = [
        { column: column - 1, row },
        { column: column + 1, row },
        { column, row: row - 1 },
        { column, row: row + 1 },
      ];
      for (const neighborCell of neighbors) {
        if (neighborCell.column < 0 || neighborCell.row < 0 || neighborCell.column >= width || neighborCell.row >= height) {
          continue;
        }
        const neighbor = neighborCell.row * width + neighborCell.column;
        if (flags[neighbor] === 1 && seen[neighbor] !== 1) {
          seen[neighbor] = 1;
          stack.push(neighbor);
        }
      }
    }
    if (region.length >= minimumRegionPixels) {
      for (const pixel of region) kept[pixel] = 1;
    }
  }
  return kept;
}
