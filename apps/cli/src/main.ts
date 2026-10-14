import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { executeChangeRun, formatChangeReport, reportProvenance, reviewDifference } from "../../../packages/application/src/index.js";
import { formatKernelDemo } from "./demo.js";
import { FilesystemRunStore } from "./filesystem-run-store.js";
import { GeotiffRasterAdapter } from "./geotiff-raster-adapter.js";
import { demoCatalog, loadExampleContract, runFixturePipeline } from "./fixture-pipeline.js";
import { writeDifferenceGeotiff, writeDifferenceResult } from "./write-difference-result.js";
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
    catalog: demoCatalog(),
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
        ...reportProvenance(record),
        reviewLimitations: record.review.limitations,
      }),
    );
  }
  const verdict = record.coverageVerdict ? `; coverage ${record.coverageVerdict}` : "";
  console.log(`Run ${record.status}; stages: ${record.completedStages.join(",")}${verdict}`);
} else if (command === "demo") {
  console.log(formatKernelDemo());
} else {
  console.error("Supported commands: demo, validate, select, read, difference, review, run");
  process.exitCode = 1;
}
