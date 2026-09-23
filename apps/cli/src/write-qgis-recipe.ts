import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function writeQgisRecipe(directory: string): string {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "qgis-viewing-recipe.md");
  writeFileSync(
    path,
    [
      "# QGIS viewing recipe",
      "",
      "Use the QGIS desktop GUI only.",
      "",
      "1. Open QGIS and add `ndvi-difference.json` as a delimited or JSON table if you need pixel values.",
      "2. Add the before/after GeoTIFF fixtures from `test/fixtures/rasters/` with relative paths from the repository root.",
      "3. Style the difference with a diverging ramp centered at 0. The predeclared threshold is 0.20 (after minus before).",
      "4. Keep the validity mask visible so masked clouds and NoData stay excluded from counts.",
      "5. Do not interpret candidate pixels as a cause of land-use change.",
      "",
    ].join("\n"),
  );
  return path;
}
