import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { executeChangeRun, formatChangeReport, reviewDifference } from "../../../packages/application/src/index.js";
import { formatKernelDemo } from "./demo.js";
import { FilesystemRunStore } from "./filesystem-run-store.js";
import { GeotiffRasterAdapter } from "./geotiff-raster-adapter.js";
import { fixtureCatalog, loadExampleContract, runFixturePipeline } from "./fixture-pipeline.js";
import { writeDifferenceGeotiff, writeDifferenceResult } from "./write-difference-result.js";
import { writeGeotiff } from "./write-geotiff.js";
import { writeQgisRecipe } from "./write-qgis-recipe.js";
import { writeRunViewerArtifacts } from "./write-run-viewer-artifacts.js";

const command = process.argv[2] ?? "demo";

if (command === "validate") {
  const contract = loadExampleContract();
  console.log(`Run contract is valid for ${contract.aoi.crs} (${contract.units}).`);
} else if (command === "select") {
  const pipeline = await runFixturePipeline();
  console.log(`${pipeline.pair.before.id} -> ${pipeline.pair.after.id}`);
} else if (command === "read") {
  const pipeline = await runFixturePipeline();
  const valid = pipeline.rasters.before.valid.filter((flag) => flag === 1).length;
  console.log(`Read ${pipeline.rasters.before.red.width}x${pipeline.rasters.before.red.height} rasters with ${valid} valid before pixels.`);
} else if (command === "difference") {
  const pipeline = await runFixturePipeline();
  const path = writeDifferenceResult("outputs/fixture-run", pipeline.result);
  console.log(`Wrote ${path} with coverage ${pipeline.result.validCoverage}`);
} else if (command === "review") {
  const pipeline = await runFixturePipeline();
  const review = reviewDifference(pipeline.contract, pipeline.rasters, pipeline.result);
  writeDifferenceResult("outputs/fixture-run", pipeline.result);
  writeDifferenceGeotiff("outputs/fixture-run", pipeline.result);
  const recipe = writeQgisRecipe("outputs/fixture-run", pipeline.contract);
  console.log(`Candidates: ${review.candidateCount}; recipe: ${recipe}`);
} else if (command === "run") {
  const contract = loadExampleContract();
  const { record, difference } = await executeChangeRun({
    contract,
    catalog: fixtureCatalog(),
    reader: new GeotiffRasterAdapter(),
    store: new FilesystemRunStore("outputs/fixture-run"),
    signal: AbortSignal.timeout(30_000),
  });
  writeRunViewerArtifacts("outputs/fixture-run", difference);
  if (difference) writeDifferenceGeotiff("outputs/fixture-run", difference);
  writeQgisRecipe("outputs/fixture-run", contract);
  if (record.review) {
    writeFileSync(
      join("outputs/fixture-run", "report.txt"),
      formatChangeReport({
        contract,
        beforeId: record.beforeId ?? "unknown",
        afterId: record.afterId ?? "unknown",
        candidateCount: record.review.candidateCount,
        gainCount: record.review.gainCount,
        lossCount: record.review.lossCount,
        validCoverage: record.validCoverage ?? 0,
        threshold: record.review.threshold,
        acquiredBefore: record.acquiredBefore ?? "",
        acquiredAfter: record.acquiredAfter ?? "",
      }),
    );
  }
  console.log(`Run ${record.status}; stages: ${record.completedStages.join(",")}`);
} else if (command === "fixtures") {
  writeGeotiff("test/fixtures/rasters/before-red.tif", [1000, 1000, 0, 2000], 2, 2, loadExampleContract().aoi, 32);
  console.log("Raster fixtures refreshed.");
} else if (command === "demo") {
  console.log(formatKernelDemo());
} else {
  console.error("Supported commands: demo, validate, select, read, difference, review, run, fixtures");
  process.exitCode = 1;
}
