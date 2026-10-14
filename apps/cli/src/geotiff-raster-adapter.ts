import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { fromArrayBuffer } from "geotiff";
import {
  DomainError,
  applyScaleOffset,
  assertPixelBudget,
  rawValidData,
  type BandReadOptions,
  type RasterBand,
} from "../../../packages/domain/src/index.js";
import { rasterLimits, type RasterReader } from "../../../packages/application/src/index.js";

export class GeotiffRasterAdapter implements RasterReader {
  async digest(path: string): Promise<string> {
    return createHash("sha256").update(readBounded(path)).digest("hex");
  }

  async readBand(path: string, options: BandReadOptions): Promise<RasterBand> {
    const bytes = readBounded(path);
    const image = await (await fromArrayBuffer(Uint8Array.from(bytes).buffer)).getImage();
    const width = image.getWidth();
    const height = image.getHeight();
    assertPixelBudget(width, height, rasterLimits.maxPixels);
    const crs = readEpsg(image.getGeoKeys() as { GeographicTypeGeoKey?: number; ProjectedCSTypeGeoKey?: number });
    const bounds = image.getBoundingBox();
    const west = bounds[0];
    const south = bounds[1];
    const east = bounds[2];
    const north = bounds[3];
    if (west === undefined || south === undefined || east === undefined || north === undefined) {
      throw DomainError.createValidation("Raster bounding box is incomplete");
    }
    const rasters = await image.readRasters();
    const raw = Float32Array.from(rasters[0] as ArrayLike<number>);
    const noData = resolveNoData(image.getGDALNoData() ?? undefined, options.noData, path);
    return {
      width,
      height,
      bbox: { west, south, east, north, crs },
      crs,
      values: applyScaleOffset(raw, options.scale, options.offset),
      noData,
      validData: rawValidData(raw, noData),
      hash: createHash("sha256").update(bytes).digest("hex"),
    };
  }
}

function readBounded(path: string): Buffer {
  const size = statSync(path).size;
  if (size > rasterLimits.maxBytes) {
    throw DomainError.createValidation("Raster exceeds the download budget");
  }
  return readFileSync(path);
}

function readEpsg(keys: { GeographicTypeGeoKey?: number; ProjectedCSTypeGeoKey?: number }): string {
  const code = keys.GeographicTypeGeoKey ?? keys.ProjectedCSTypeGeoKey;
  if (code === 4326) return "EPSG:4326";
  throw DomainError.createValidation(`Unsupported reprojection: raster CRS ${code ?? "unknown"} must already match`);
}

function resolveNoData(recorded: number | undefined, declared: number | undefined, path: string): number | undefined {
  if (recorded !== undefined && declared !== undefined && recorded !== declared) {
    throw DomainError.createValidation(`NoData mismatch for ${path}: file records ${recorded}, catalog declares ${declared}`);
  }
  return recorded ?? declared;
}
