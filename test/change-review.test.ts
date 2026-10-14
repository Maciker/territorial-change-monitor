import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { navarreExampleContract, reviewCandidateChange } from "../packages/domain/src/index.js";
import { writeQgisRecipe } from "../apps/cli/src/write-qgis-recipe.js";

const knownChangeGrid = {
  difference: [-0.5, 0, Number.NaN, 0],
  valid: [1, 0, 0, 1],
};

const noChangeGrid = {
  difference: [0, 0, 0, 0],
  valid: [1, 1, 1, 1],
};

const onlyMaskedLargeDiffGrid = {
  difference: [-0.9, 0, 0, 0],
  valid: [0, 1, 1, 1],
};

function reviewAt(
  grid: { difference: number[]; valid: number[] },
  threshold: number,
  minimumRegionPixels = 1,
) {
  return reviewCandidateChange({
    difference: Float32Array.from(grid.difference),
    valid: Uint8Array.from(grid.valid),
    width: 2,
    height: 2,
    bbox: navarreExampleContract.aoi,
    threshold,
    sign: "afterMinusBefore",
    minimumRegionPixels,
  });
}

describe("The candidate change review", () => {
  it("flags known-change pixels and excludes the mask", () => {
    const review = reviewAt(knownChangeGrid, 0.2);

    expect(review.candidateCount).toBe(1);
    expect(review.candidateAreaKm2).toBeGreaterThan(0);
    expect(review.limitations.join(" ")).toMatch(/seasonality|cloud|registration/i);
    expect(review.limitations.join(" ")).toMatch(/bounding boxes/);
    expect(review.limitations.join(" ")).toMatch(/scene-level/);
    expect(review.limitations.join(" ")).toMatch(/not been calibrated/);
  });

  it("reports no candidates for a no-change pair", () => {
    const review = reviewAt(noChangeGrid, 0.2);

    expect(review.candidateCount).toBe(0);
    expect(review.candidateAreaKm2).toBe(0);
  });

  it("drops regions smaller than the declared minimum", () => {
    const review = reviewAt({ difference: [-0.5, 0, 0, 0], valid: [1, 1, 1, 1] }, 0.2, 2);

    expect(review.candidateCount).toBe(0);
  });

  it("keeps the known-change candidate at threshold 0.2 and drops it when exploring 0.6", () => {
    const atRegistered = reviewAt(knownChangeGrid, 0.2);
    const atExploration = reviewAt(knownChangeGrid, 0.6);

    expect(atRegistered.candidateCount).toBe(1);
    expect(atExploration.candidateCount).toBe(0);
  });

  it("never counts masked pixels with large absolute difference at any threshold", () => {
    const lowThreshold = reviewAt(onlyMaskedLargeDiffGrid, 0.2);
    const highThreshold = reviewAt(onlyMaskedLargeDiffGrid, 0.01);

    expect(lowThreshold.candidateCount).toBe(0);
    expect(lowThreshold.candidateAreaKm2).toBe(0);
    expect(highThreshold.candidateCount).toBe(0);
    expect(highThreshold.candidateAreaKm2).toBe(0);
  });

  it("counts gains and losses separately because the threshold applies to the absolute difference", () => {
    const review = reviewAt({ difference: [0.5, -0.5, 0.1, -0.1], valid: [1, 1, 1, 1] }, 0.2);

    expect(review.candidateCount).toBe(2);
    expect(review.gainCount).toBe(1);
    expect(review.lossCount).toBe(1);
  });

  it("writes a relative-path QGIS recipe without Python using the contract threshold", () => {
    const directory = mkdtempSync(join(tmpdir(), "recipe-"));

    const path = writeQgisRecipe(directory, { ...navarreExampleContract, changeThreshold: 0.35 });

    const text = readFileSync(path, "utf8");
    expect(text).toContain("ndvi-difference.tif");
    expect(text).toContain("|after - before| >= 0.35");
    expect(text).not.toContain("0.20");
    expect(text).not.toContain(".py");
  });
});
