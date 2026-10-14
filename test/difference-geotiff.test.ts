import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runFixturePipeline } from "../apps/cli/src/fixture-pipeline.js";
import { GeotiffRasterAdapter } from "../apps/cli/src/geotiff-raster-adapter.js";
import { writeDifferenceGeotiff } from "../apps/cli/src/write-difference-result.js";

describe("The NDVI difference GeoTIFF", () => {
  it("keeps the grid, the values and masked pixels as NoData for QGIS", async () => {
    const { result } = await runFixturePipeline();
    const directory = mkdtempSync(join(tmpdir(), "difference-tif-"));

    const path = writeDifferenceGeotiff(directory, result);
    const band = await new GeotiffRasterAdapter().readBand(path, { scale: 1, offset: 0 });

    expect(path).toBe(join(directory, "ndvi-difference.tif"));
    expect(band.width).toBe(result.width);
    expect(band.height).toBe(result.height);
    expect(band.bbox).toEqual(result.bbox);
    expect(band.values[0]).toBeCloseTo(result.difference[0]!);
    expect(Array.from(band.validData)).toEqual(Array.from(result.valid));
  });
});
