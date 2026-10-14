import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertSameGrid, navarreExampleContract } from "../packages/domain/src/index.js";
import { readAlignedRasters, selectScenes } from "../packages/application/src/index.js";
import { FixtureStacAdapter } from "../apps/cli/src/fixture-stac-adapter.js";
import { GeotiffRasterAdapter } from "../apps/cli/src/geotiff-raster-adapter.js";
import { writeGeotiff } from "../apps/cli/src/write-geotiff.js";

const fixtureScale = { scale: 0.0001, offset: 0, noData: 0 };

function temporaryRaster(values: number[], noData?: number): string {
  const path = join(mkdtempSync(join(tmpdir(), "raster-")), "band.tif");
  writeGeotiff(path, values, 2, 2, navarreExampleContract.aoi, 32, noData);
  return path;
}

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
    const aligned = await adapter.readBand("test/fixtures/rasters/before-red.tif", fixtureScale);
    const skewed = await adapter.readBand("test/fixtures/rasters/misaligned-red.tif", fixtureScale);

    expect(() => assertSameGrid(aligned, skewed)).toThrow(/alignment/i);
  });

  it("masks the raw NoData code before applying a negative offset", async () => {
    const path = temporaryRaster([0, 1000, 2000, 3000]);

    const band = await new GeotiffRasterAdapter().readBand(path, { scale: 0.0001, offset: -0.1, noData: 0 });

    expect(band.values[0]).toBeCloseTo(-0.1);
    expect(band.values[1]).toBeCloseTo(0);
    expect(Array.from(band.validData)).toEqual([0, 1, 1, 1]);
    expect(band.noData).toBe(0);
  });

  it("keeps zero reflectance when no NoData code is declared", async () => {
    const path = temporaryRaster([0, 1000, 2000, 3000]);

    const band = await new GeotiffRasterAdapter().readBand(path, { scale: 0.0001, offset: 0 });

    expect(Array.from(band.validData)).toEqual([1, 1, 1, 1]);
    expect(band.noData).toBeUndefined();
  });

  it("reads the NoData code recorded in the GeoTIFF", async () => {
    const path = temporaryRaster([65535, 1000, 2000, 3000], 65535);

    const band = await new GeotiffRasterAdapter().readBand(path, { scale: 0.0001, offset: 0 });

    expect(band.noData).toBe(65535);
    expect(Array.from(band.validData)).toEqual([0, 1, 1, 1]);
  });

  it("rejects a declared NoData code that contradicts the GeoTIFF", async () => {
    const path = temporaryRaster([65535, 1000, 2000, 3000], 65535);

    await expect(new GeotiffRasterAdapter().readBand(path, { scale: 0.0001, offset: 0, noData: 0 })).rejects.toThrow(
      /NoData/,
    );
  });
});
