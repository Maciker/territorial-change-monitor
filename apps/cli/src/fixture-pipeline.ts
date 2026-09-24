import { computeNdviDifference, readAlignedRasters, selectScenes } from "../../../packages/application/src/index.js";
import type { AlignedRasterPair, NdviDifferenceResult } from "../../../packages/application/src/index.js";
import type { RunContract, ScenePair } from "../../../packages/domain/src/index.js";
import { FixtureStacAdapter } from "./fixture-stac-adapter.js";
import { GeotiffRasterAdapter } from "./geotiff-raster-adapter.js";
import { loadRunContract } from "./load-run-contract.js";

export function loadExampleContract(): RunContract {
  return loadRunContract("config/run.example.yml", "config/aoi.example.geojson");
}

export function fixtureCatalog(): FixtureStacAdapter {
  return FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json");
}

export async function runFixturePipeline(): Promise<{
  contract: RunContract;
  pair: ScenePair;
  rasters: AlignedRasterPair;
  result: NdviDifferenceResult;
}> {
  const contract = loadExampleContract();
  const pair = await selectScenes(contract, fixtureCatalog());
  const rasters = await readAlignedRasters(pair, new GeotiffRasterAdapter());
  const result = computeNdviDifference(contract, pair, rasters);
  return { contract, pair, rasters, result };
}
