import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import type { Scene, ScenePair } from "../packages/domain/src/index.js";
import { readAlignedRasters } from "../packages/application/src/index.js";
import { GeotiffRasterAdapter } from "../apps/cli/src/geotiff-raster-adapter.js";
import { writeGeotiff } from "../apps/cli/src/write-geotiff.js";

function temporaryRaster(values: number[], noData?: number): string {
  const path = join(mkdtempSync(join(tmpdir(), "aligned-raster-")), "band.tif");
  writeGeotiff(path, values, 2, 2, navarreExampleContract.aoi, 32, noData);
  return path;
}

function pair(sclScale: number): ScenePair {
  const red = temporaryRaster([1000, 1000, 1000, 1000]);
  const nir = temporaryRaster([2000, 2000, 2000, 2000]);
  const scl = temporaryRaster([4, 4, 9, 4]);
  const scene = (id: string): Scene => ({
    id,
    datetime: "2024-06-12T10:55:00Z",
    acquiredAt: "2024-06-12T10:55:00Z",
    processingLevel: "L2A",
    cloudCoverPercent: 1,
    aoiCoveragePercent: 100,
    bbox: navarreExampleContract.aoi,
    href: `https://example.test/${id}`,
    bands: [
      { name: "red", href: red, scale: 0.0001, offset: 0, noData: 0 },
      { name: "nir", href: nir, scale: 0.0001, offset: 0, noData: 0 },
      { name: "scl", href: scl, scale: sclScale, offset: 0, noData: 0 },
    ],
  });
  return { before: scene("before"), after: scene("after") };
}

describe("readAlignedRasters", () => {
  it("masks cloud SCL classes even when the catalog declares reflectance scale on SCL", async () => {
    const rasters = await readAlignedRasters(pair(0.0001), new GeotiffRasterAdapter());

    expect(rasters.before.red.values[0]).toBeCloseTo(0.1);
    expect(rasters.before.nir.values[0]).toBeCloseTo(0.2);
    expect(Array.from(rasters.before.valid)).toEqual([1, 1, 0, 1]);
  });
});
