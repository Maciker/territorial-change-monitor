import { DomainError } from "./domain-error.js";
import type { BoundingBox } from "./run-contract.js";

const invalidScl = new Set([0, 1, 3, 8, 9, 10]);

export type RasterBand = {
  width: number;
  height: number;
  bbox: BoundingBox;
  crs: string;
  values: Float32Array;
  /** NoData code in the raw (unscaled) units of the source file, when one is declared. */
  noData: number | undefined;
  /** 1 where the raw sample is finite and differs from the NoData code. */
  validData: Uint8Array;
  hash: string;
};

export type BandReadOptions = {
  scale: number;
  offset: number;
  noData?: number;
};

export function applyScaleOffset(raw: Float32Array, scale: number, offset: number): Float32Array {
  return raw.map((value) => Math.fround(value * scale + offset));
}

export const excludedSclClasses: readonly number[] = [...invalidScl].sort((left, right) => left - right);

export function rawValidData(raw: Float32Array, noData: number | undefined): Uint8Array {
  return Uint8Array.from(raw, (value) => (Number.isNaN(value) || (noData !== undefined && value === noData) ? 0 : 1));
}

export function validityMask(optical: RasterBand, scl?: RasterBand): Uint8Array {
  return Uint8Array.from(optical.values, (value, index) => {
    if (optical.validData[index] !== 1 || Number.isNaN(value)) return 0;
    if (scl && (scl.validData[index] !== 1 || invalidScl.has(scl.values[index]!))) return 0;
    return 1;
  });
}

export function assertSameGrid(left: RasterBand, right: RasterBand): void {
  if (left.crs !== right.crs) {
    throw DomainError.createValidation("Unsupported reprojection: raster CRS must already match");
  }
  if (left.width !== right.width || left.height !== right.height) {
    throw DomainError.createValidation("Raster alignment mismatch");
  }
  if (
    left.bbox.west !== right.bbox.west ||
    left.bbox.south !== right.bbox.south ||
    left.bbox.east !== right.bbox.east ||
    left.bbox.north !== right.bbox.north ||
    left.bbox.crs !== right.bbox.crs
  ) {
    throw DomainError.createValidation("Raster alignment mismatch");
  }
}

export function assertPixelBudget(width: number, height: number, maxPixels: number): void {
  if (width * height > maxPixels) {
    throw DomainError.createValidation("Raster exceeds the pixel budget");
  }
}

export function combineMasks(masks: Uint8Array[]): Uint8Array {
  const first = masks[0];
  if (!first) return new Uint8Array();
  const combined = new Uint8Array(first.length);
  for (let index = 0; index < first.length; index += 1) {
    combined[index] = masks.every((mask) => mask[index] === 1) ? 1 : 0;
  }
  return combined;
}
