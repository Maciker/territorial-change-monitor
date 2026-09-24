import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { NdviDifferenceResult } from "../../../packages/application/src/index.js";

export function writeDifferenceResult(directory: string, result: NdviDifferenceResult): string {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "ndvi-difference.json");
  writeFileSync(
    path,
    JSON.stringify({
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
