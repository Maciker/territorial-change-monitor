import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { fromArrayBuffer } from "geotiff";
import { DomainError, applyScaleOffset, assertPixelBudget, type RasterBand } from "../../../packages/domain/src/index.js";
import { rasterLimits, type RasterReader } from "../../../packages/application/src/index.js";

export class GeotiffRasterAdapter implements RasterReader {
  async readBand(path: string, scale: number, offset: number): Promise<RasterBand> {
    const size = statSync(path).size;
    if (size > rasterLimits.maxBytes) {
      throw DomainError.createValidation("Raster exceeds the download budget");
    }
    const bytes = readFileSync(path);
    const image = await (await fromArrayBuffer(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))).getImage();
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
    return {
      width,
      height,
      bbox: { west, south, east, north, crs },
      crs,
      values: applyScaleOffset(raw, scale, offset),
      noData: 0,
      hash: createHash("sha256").update(bytes).digest("hex"),
    };
  }
}

function readEpsg(keys: { GeographicTypeGeoKey?: number; ProjectedCSTypeGeoKey?: number }): string {
  const code = keys.GeographicTypeGeoKey ?? keys.ProjectedCSTypeGeoKey;
  if (code === 4326) return "EPSG:4326";
  throw DomainError.createValidation(`Unsupported reprojection: raster CRS ${code ?? "unknown"} must already match`);
}
