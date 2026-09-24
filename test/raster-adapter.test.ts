import { describe, expect, it } from "vitest";
import { assertSameGrid, navarreExampleContract } from "../packages/domain/src/index.js";
import { readAlignedRasters, selectScenes } from "../packages/application/src/index.js";
import { FixtureStacAdapter } from "../apps/cli/src/fixture-stac-adapter.js";
import { GeotiffRasterAdapter } from "../apps/cli/src/geotiff-raster-adapter.js";

describe("The GeoTIFF reader", () => {
  it("reads the fixture pair with scale, hashes and a shared validity mask", async () => {
    const pair = await selectScenes(navarreExampleContract, FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"));
    const rasters = await readAlignedRasters(pair, new GeotiffRasterAdapter());

    expect(rasters.before.red.width).toBe(2);
    expect(rasters.before.red.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(rasters.before.red.values[0]).toBeCloseTo(0.1);
    expect(Array.from(rasters.before.valid)).toEqual([1, 1, 0, 1]);
    expect(Array.from(rasters.after.valid)).toEqual([1, 0, 0, 1]);
    expect(rasters.before.red.crs).toBe("EPSG:4326");
  });

  it("rejects a grid that does not align", async () => {
    const adapter = new GeotiffRasterAdapter();
    const aligned = await adapter.readBand("test/fixtures/rasters/before-red.tif", 0.0001, 0);
    const skewed = await adapter.readBand("test/fixtures/rasters/misaligned-red.tif", 0.0001, 0);

    expect(() => assertSameGrid(aligned, skewed)).toThrow(/alignment/i);
  });
});
