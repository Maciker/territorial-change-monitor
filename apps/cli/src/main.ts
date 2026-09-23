import { readAlignedRasters, selectScenes } from "../../../packages/application/src/index.js";
import { formatKernelDemo } from "./demo.js";
import { FixtureStacAdapter } from "./fixture-stac-adapter.js";
import { GeotiffRasterAdapter } from "./geotiff-raster-adapter.js";
import { loadRunContract } from "./load-run-contract.js";

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
} else if (command === "demo") {
  console.log(formatKernelDemo());
} else {
  console.error("Supported commands: demo, validate, select, read");
  process.exitCode = 1;
}
