import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { NdviDifferenceResult } from "../../../packages/application/src/index.js";
import { writeGeotiff } from "./write-geotiff.js";

export function writeDifferenceResult(directory: string, result: NdviDifferenceResult): string {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "ndvi-difference.json");
  writeFileSync(
    path,
    JSON.stringify({
      width: result.width,
      height: result.height,
      beforeNdvi: Array.from(result.beforeNdvi),
      afterNdvi: Array.from(result.afterNdvi),
      difference: Array.from(result.difference),
      valid: Array.from(result.valid),
      validCoverage: result.validCoverage,
      provenance: result.provenance,
    }),
  );
  return path;
}

export function writeDifferenceGeotiff(directory: string, result: NdviDifferenceResult): string {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "ndvi-difference.tif");
  writeGeotiff(path, result.difference, result.width, result.height, result.bbox, 32, Number.NaN);
  return path;
}
