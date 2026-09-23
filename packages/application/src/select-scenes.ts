import { selectComparableScenes, type RunContract, type ScenePair } from "../../domain/src/index.js";
import type { StacCatalog } from "./ports/stac-catalog.js";

export const stacSearchBounds = {
  collection: "sentinel-2-l2a",
  pageSize: 10,
  maxPages: 3,
  timeoutMs: 4000,
  retryCap: 2,
} as const;

export async function selectScenes(contract: RunContract, catalog: StacCatalog): Promise<ScenePair> {
  const bbox = [contract.aoi.west, contract.aoi.south, contract.aoi.east, contract.aoi.north] as const;
  const before = await catalog.search({
    collection: stacSearchBounds.collection,
    bbox,
    start: contract.before.start,
    end: contract.before.end,
    pageSize: stacSearchBounds.pageSize,
    maxPages: stacSearchBounds.maxPages,
  });
  const after = await catalog.search({
    collection: stacSearchBounds.collection,
    bbox,
    start: contract.after.start,
    end: contract.after.end,
    pageSize: stacSearchBounds.pageSize,
    maxPages: stacSearchBounds.maxPages,
  });
  return selectComparableScenes(contract, [...before, ...after]);
}
