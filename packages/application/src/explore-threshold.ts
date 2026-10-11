import {
  reviewCandidateChange,
  type BoundingBox,
  type ChangeReview,
  type ChangeSign,
} from "../../domain/src/index.js";

export type ExploreCandidateInput = {
  difference: number[] | Float32Array;
  valid: number[] | Uint8Array;
  width: number;
  height: number;
  bbox: BoundingBox;
  explorationThreshold: number;
  sign: ChangeSign;
  minimumRegionPixels: number;
};

export type ExplorationReading = {
  originalThreshold: number;
  explorationThreshold: number;
  review: ChangeReview;
};

export function exploreCandidateScenario(input: ExploreCandidateInput): ChangeReview {
  return reviewCandidateChange({
    difference: Float32Array.from(input.difference),
    valid: Uint8Array.from(input.valid),
    width: input.width,
    height: input.height,
    bbox: input.bbox,
    threshold: input.explorationThreshold,
    sign: input.sign,
    minimumRegionPixels: input.minimumRegionPixels,
  });
}

export function buildExplorationReading(
  input: ExploreCandidateInput & { originalThreshold: number },
): ExplorationReading {
  return {
    originalThreshold: input.originalThreshold,
    explorationThreshold: input.explorationThreshold,
    review: exploreCandidateScenario(input),
  };
}
