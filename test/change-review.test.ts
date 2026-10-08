import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { navarreExampleContract, reviewCandidateChange } from "../packages/domain/src/index.js";
import { writeQgisRecipe } from "../apps/cli/src/write-qgis-recipe.js";

describe("The candidate change review", () => {
  it("flags known-change pixels and excludes the mask", () => {
    const review = reviewCandidateChange({
      difference: new Float32Array([-0.5, 0, Number.NaN, 0]),
      valid: new Uint8Array([1, 0, 0, 1]),
      width: 2,
      height: 2,
      bbox: navarreExampleContract.aoi,
      threshold: 0.2,
      sign: "afterMinusBefore",
      minimumRegionPixels: 1,
    });

    expect(review.candidateCount).toBe(1);
    expect(review.candidateAreaKm2).toBeGreaterThan(0);
    expect(review.limitations.join(" ")).toMatch(/seasonality|cloud|registration/i);
  });

  it("reports no candidates for a no-change pair", () => {
    const review = reviewCandidateChange({
      difference: new Float32Array([0, 0, 0, 0]),
      valid: new Uint8Array([1, 1, 1, 1]),
      width: 2,
      height: 2,
      bbox: navarreExampleContract.aoi,
      threshold: 0.2,
      sign: "afterMinusBefore",
      minimumRegionPixels: 1,
    });

    expect(review.candidateCount).toBe(0);
    expect(review.candidateAreaKm2).toBe(0);
  });

  it("drops regions smaller than the declared minimum", () => {
    const review = reviewCandidateChange({
      difference: new Float32Array([-0.5, 0, 0, 0]),
      valid: new Uint8Array([1, 1, 1, 1]),
      width: 2,
      height: 2,
      bbox: navarreExampleContract.aoi,
      threshold: 0.2,
      sign: "afterMinusBefore",
      minimumRegionPixels: 2,
    });

    expect(review.candidateCount).toBe(0);
  });

  it("keeps the known-change candidate at threshold 0.2 and drops it when exploring 0.6", () => {
    const knownChange = {
      difference: new Float32Array([-0.5, 0, Number.NaN, 0]),
      valid: new Uint8Array([1, 0, 0, 1]),
      width: 2,
      height: 2,
      bbox: navarreExampleContract.aoi,
      sign: "afterMinusBefore" as const,
      minimumRegionPixels: 1,
    };

    const atRegistered = reviewCandidateChange({ ...knownChange, threshold: 0.2 });
    const atExploration = reviewCandidateChange({ ...knownChange, threshold: 0.6 });

    expect(atRegistered.candidateCount).toBe(1);
    expect(atExploration.candidateCount).toBe(0);
  });

  it("never counts masked pixels with large absolute difference at any threshold", () => {
    const onlyMaskedLargeDiff = {
      difference: new Float32Array([-0.9, 0, 0, 0]),
      valid: new Uint8Array([0, 1, 1, 1]),
      width: 2,
      height: 2,
      bbox: navarreExampleContract.aoi,
      sign: "afterMinusBefore" as const,
      minimumRegionPixels: 1,
    };

    const lowThreshold = reviewCandidateChange({ ...onlyMaskedLargeDiff, threshold: 0.2 });
    const highThreshold = reviewCandidateChange({ ...onlyMaskedLargeDiff, threshold: 0.01 });

    expect(lowThreshold.candidateCount).toBe(0);
    expect(lowThreshold.candidateAreaKm2).toBe(0);
    expect(highThreshold.candidateCount).toBe(0);
    expect(highThreshold.candidateAreaKm2).toBe(0);
  });

  it("writes a relative-path QGIS recipe without Python", () => {
    const path = writeQgisRecipe("outputs/fixture-run");

    const text = readFileSync(path, "utf8");
    expect(text).toContain("test/fixtures/rasters/");
    expect(text).not.toContain(".py");
  });
});
