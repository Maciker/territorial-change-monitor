import { describe, expect, it } from "vitest";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import {
  buildExplorationReading,
  exploreCandidateScenario,
} from "../packages/application/src/explore-threshold.js";

describe("The exploration threshold scenario", () => {
  const knownChangeArrays = {
    difference: [-0.5, 0, Number.NaN, 0],
    valid: [1, 0, 0, 1],
    width: 2,
    height: 2,
    bbox: navarreExampleContract.aoi,
    sign: "afterMinusBefore" as const,
    minimumRegionPixels: 1,
  };

  it("applies the exploration threshold when recounting candidates", () => {
    const atRegistered = exploreCandidateScenario({
      ...knownChangeArrays,
      explorationThreshold: 0.2,
    });
    const atExploration = exploreCandidateScenario({
      ...knownChangeArrays,
      explorationThreshold: 0.6,
    });

    expect(atRegistered.candidateCount).toBe(1);
    expect(atRegistered.threshold).toBe(0.2);
    expect(atExploration.candidateCount).toBe(0);
    expect(atExploration.threshold).toBe(0.6);
  });

  it("does not mutate the input difference or valid arrays", () => {
    const difference = [-0.5, 0, Number.NaN, 0];
    const valid = [1, 0, 0, 1];
    const differenceSnapshot = [...difference];
    const validSnapshot = [...valid];

    exploreCandidateScenario({
      difference,
      valid,
      width: 2,
      height: 2,
      bbox: navarreExampleContract.aoi,
      explorationThreshold: 0.2,
      sign: "afterMinusBefore",
      minimumRegionPixels: 1,
    });

    expect(difference).toEqual(differenceSnapshot);
    expect(valid).toEqual(validSnapshot);
  });

  it("keeps the original threshold distinct from the exploration scenario", () => {
    const reading = buildExplorationReading({
      ...knownChangeArrays,
      originalThreshold: 0.2,
      explorationThreshold: 0.6,
    });

    expect(reading.originalThreshold).toBe(0.2);
    expect(reading.explorationThreshold).toBe(0.6);
    expect(reading.review.threshold).toBe(0.6);
    expect(reading.review.candidateCount).toBe(0);
  });
});
