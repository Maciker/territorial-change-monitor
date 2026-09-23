import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { computeNdviDifference, executeChangeRun, formatChangeReport, readAlignedRasters, reviewDifference, selectScenes } from "../../../packages/application/src/index.js";
import { formatKernelDemo } from "./demo.js";
import { FilesystemRunStore } from "./filesystem-run-store.js";
import { FixtureStacAdapter } from "./fixture-stac-adapter.js";
import { GeotiffRasterAdapter } from "./geotiff-raster-adapter.js";
import { loadRunContract } from "./load-run-contract.js";
import { writeDifferenceResult } from "./write-difference-result.js";
import { writeGeotiff } from "./write-geotiff.js";
import { writeQgisRecipe } from "./write-qgis-recipe.js";

const command = process.argv[2] ?? "demo";

if (command === "validate") {
  const contract = loadRunContract("config/run.example.yml", "config/aoi.example.geojson");
  console.log(`Run contract is valid for ${contract.aoi.crs} (${contract.units}).`);
} else if (command === "select") {
  const contract = loadRunContract("config/run.example.yml", "config/aoi.example.geojson");
  const pair = await selectScenes(contract, FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"));
  console.log(`${pair.before.id} -> ${pair.after.id}`);
} else if (command === "read") {
  const contract = loadRunContract("config/run.example.yml", "config/aoi.example.geojson");
  const pair = await selectScenes(contract, FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"));
  const rasters = await readAlignedRasters(pair, new GeotiffRasterAdapter());
  const valid = rasters.before.valid.filter((flag) => flag === 1).length;
  console.log(`Read ${rasters.before.red.width}x${rasters.before.red.height} rasters with ${valid} valid before pixels.`);
} else if (command === "difference") {
  const contract = loadRunContract("config/run.example.yml", "config/aoi.example.geojson");
  const pair = await selectScenes(contract, FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"));
  const rasters = await readAlignedRasters(pair, new GeotiffRasterAdapter());
  const result = computeNdviDifference(contract, pair, rasters);
  const path = writeDifferenceResult("outputs/fixture-run", result);
  console.log(`Wrote ${path} with coverage ${result.validCoverage}`);
} else if (command === "review") {
  const contract = loadRunContract("config/run.example.yml", "config/aoi.example.geojson");
  const pair = await selectScenes(contract, FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"));
  const rasters = await readAlignedRasters(pair, new GeotiffRasterAdapter());
  const result = computeNdviDifference(contract, pair, rasters);
  const review = reviewDifference(contract, rasters, result);
  writeDifferenceResult("outputs/fixture-run", result);
  const recipe = writeQgisRecipe("outputs/fixture-run");
  console.log(`Candidates: ${review.candidateCount}; recipe: ${recipe}`);
} else if (command === "run") {
  const contract = loadRunContract("config/run.example.yml", "config/aoi.example.geojson");
  const record = await executeChangeRun({
    contract,
    catalog: FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"),
    reader: new GeotiffRasterAdapter(),
    store: new FilesystemRunStore("outputs/fixture-run"),
    signal: AbortSignal.timeout(30_000),
  });
  if (record.review) {
    writeFileSync(
      join("outputs/fixture-run", "report.txt"),
      formatChangeReport({
        contract,
        beforeId: record.beforeId ?? "unknown",
        afterId: record.afterId ?? "unknown",
        candidateCount: record.review.candidateCount,
        validCoverage: record.validCoverage ?? 0,
        threshold: record.review.threshold,
      }),
    );
  }
  console.log(`Run ${record.status}; stages: ${record.completedStages.join(",")}`);
} else if (command === "fixtures") {
  const bbox = loadRunContract("config/run.example.yml", "config/aoi.example.geojson").aoi;
  writeGeotiff("test/fixtures/rasters/before-red.tif", [1000, 1000, 0, 2000], 2, 2, bbox, 32);
  console.log("Raster fixtures refreshed.");
} else if (command === "demo") {
  console.log(formatKernelDemo());
} else {
  console.error("Supported commands: demo, validate, select, read, difference, review, run, fixtures");
  process.exitCode = 1;
}
