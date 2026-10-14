import { describe, expect, it } from "vitest";
import {
  applyScaleOffset,
  assertPixelBudget,
  assertSameGrid,
  navarreExampleContract,
  rawValidData,
  validityMask,
} from "../packages/domain/src/index.js";
import type { RasterBand } from "../packages/domain/src/index.js";

function band(values: number[], overrides: Partial<RasterBand> = {}): RasterBand {
  return {
    width: 2,
    height: 2,
    bbox: navarreExampleContract.aoi,
    crs: "EPSG:4326",
    values: new Float32Array(values),
    noData: 0,
    validData: new Uint8Array(values.length).fill(1),
    hash: "abc",
    ...overrides,
  };
}

describe("The raster grid", () => {
  it("applies scale and offset before masking", () => {
    const scaled = applyScaleOffset(new Float32Array([1000, 0]), 0.0001, 0);

    expect(scaled[0]).toBeCloseTo(0.1);
    expect(scaled[1]).toBe(0);
  });

  it("masks NoData and cloud classification pixels", () => {
    const optical = band([0.1, -0.1, 0.2, 0.2], { validData: Uint8Array.from([1, 0, 1, 1]) });
    const scl = band([4, 4, 9, 4]);

    const mask = validityMask(optical, scl);

    expect(Array.from(mask)).toEqual([1, 0, 0, 1]);
  });

  it("keeps a scaled value that equals the raw NoData code", () => {
    const optical = band([0, 0.1, 0.2, 0.3], { noData: 0, validData: Uint8Array.from([1, 1, 1, 1]) });

    expect(Array.from(validityMask(optical))).toEqual([1, 1, 1, 1]);
  });

  it("matches a fractional NoData code against float32 samples", () => {
    expect(Array.from(rawValidData(new Float32Array([-9999.9, 1]), -9999.9))).toEqual([0, 1]);
  });

  it("rejects a CRS or grid mismatch instead of resampling", () => {
    expect(() =>
      assertSameGrid(band([1, 1, 1, 1]), band([1, 1, 1, 1], { crs: "EPSG:32630" })),
    ).toThrow(/unsupported reprojection/i);
    expect(() => assertSameGrid(band([1, 1, 1, 1]), band([1, 1, 1, 1, 1, 1], { width: 3, height: 2 }))).toThrow(
      /alignment/i,
    );
  });

  it("rejects rasters that exceed the pixel budget", () => {
    expect(() => assertPixelBudget(512, 512, 10_000)).toThrow(/pixel/i);
  });
});
