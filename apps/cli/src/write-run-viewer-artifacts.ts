import type { NdviDifferenceResult } from "../../../packages/application/src/index.js";
import { writeDifferenceResult } from "./write-difference-result.js";

export function writeRunViewerArtifacts(
  directory: string,
  difference: NdviDifferenceResult | undefined,
): string | undefined {
  if (difference === undefined) return undefined;
  return writeDifferenceResult(directory, difference);
}
