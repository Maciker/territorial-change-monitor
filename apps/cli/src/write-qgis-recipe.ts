import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RunContract } from "../../../packages/domain/src/index.js";

export function writeQgisRecipe(directory: string, contract: RunContract): string {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "qgis-viewing-recipe.md");
  writeFileSync(
    path,
    [
      "# QGIS viewing recipe",
      "",
      "Use the QGIS desktop GUI only.",
      "",
      "1. Add `ndvi-difference.tif` from this directory (Layer > Add Raster Layer). Masked pixels are NoData.",
      "2. Optionally add the source GeoTIFFs listed in `run.json` (`sourceHashes`) with relative paths from the repository root.",
      `3. Style the difference with a diverging ramp centered at 0. A pixel is a candidate when |after - before| >= ${contract.changeThreshold}; gains and losses both count.`,
      "4. Keep the validity mask visible so masked clouds and NoData stay excluded from counts.",
      "5. Do not interpret candidate pixels as a cause of land-use change.",
      "",
    ].join("\n"),
  );
  return path;
}
