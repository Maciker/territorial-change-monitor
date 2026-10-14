import { describe, expect, it } from "vitest";
import { maskedNormalizedDifference } from "../packages/domain/src/index.js";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import { readFileSync } from "node:fs";
import { computeNdviDifference, readAlignedRasters, selectScenes, softwareVersion } from "../packages/application/src/index.js";
import { FixtureStacAdapter } from "../apps/cli/src/fixture-stac-adapter.js";
import { GeotiffRasterAdapter } from "../apps/cli/src/geotiff-raster-adapter.js";

describe("The masked NDVI difference", () => {
  it("preserves the known kernel result and masks invalid pixels", () => {
    const difference = maskedNormalizedDifference(
      new Float32Array([0.3, 0]),
      new Float32Array([0.1, 0]),
      new Uint8Array([1, 0]),
    );

    expect(difference[0]).toBeCloseTo(0.5);
    expect(difference[1]).toBeNaN();
  });

  it("computes the fixture pair difference with coverage and provenance", async () => {
    const pair = await selectScenes(navarreExampleContract, FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"));
    const rasters = await readAlignedRasters(pair, new GeotiffRasterAdapter());

    const result = computeNdviDifference(navarreExampleContract, pair, rasters);

    expect(result.beforeNdvi[0]).toBeCloseTo(0.5);
    expect(result.afterNdvi[0]).toBeCloseTo(0);
    expect(result.difference[0]).toBeCloseTo(-0.5);
    expect(result.difference[1]).toBeNaN();
    expect(result.validCoverage).toBeCloseTo(0.5);
    expect(result.provenance.beforeRedHash).toBe(rasters.before.red.hash);
    expect(result.provenance.units).toBe(navarreExampleContract.units);
    expect(result.provenance.softwareVersion).toBe(softwareVersion);
    expect(result.provenance.beforeNirHash).toBe(rasters.before.nir.hash);
    expect(result.provenance.afterNirHash).toBe(rasters.after.nir.hash);
  });

  it("derives the software version from the package manifest", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

    expect(softwareVersion).toBe(manifest.version);
  });
});
