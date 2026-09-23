import { DomainError, type RunContract } from "../../domain/src/index.js";
import { computeNdviDifference } from "./compute-ndvi-difference.js";
import type { RasterReader } from "./ports/raster-reader.js";
import { readAlignedRasters } from "./read-aligned-rasters.js";
import { reviewDifference } from "./review-change.js";
import { selectScenes } from "./select-scenes.js";
import type { StacCatalog } from "./ports/stac-catalog.js";
import type { RunRecord, RunStore } from "./ports/run-store.js";

export async function executeChangeRun(options: {
  contract: RunContract;
  catalog: StacCatalog;
  reader: RasterReader;
  store: RunStore;
  signal?: AbortSignal;
}): Promise<RunRecord> {
  const cacheKey = options.store.cacheKey({
    contract: options.contract,
    version: "0.1.0",
  });
  const cached = options.store.read(cacheKey);
  if (cached?.status === "complete") {
    return { ...cached, cacheHit: true };
  }
  const record: RunRecord = {
    status: "incomplete",
    completedStages: [],
    cacheKey,
    cacheHit: false,
  };
  try {
    abortIfNeeded(options.signal, options.store, record);
    record.completedStages.push("validate");
    abortIfNeeded(options.signal, options.store, record);
    const pair = await selectScenes(options.contract, options.catalog);
    record.completedStages.push("select");
    abortIfNeeded(options.signal, options.store, record);
    const rasters = await readAlignedRasters(pair, options.reader);
    record.completedStages.push("read");
    abortIfNeeded(options.signal, options.store, record);
    const difference = computeNdviDifference(options.contract, pair, rasters);
    record.completedStages.push("difference");
    abortIfNeeded(options.signal, options.store, record);
    record.review = reviewDifference(options.contract, rasters, difference);
    record.completedStages.push("review");
    record.status = "complete";
    options.store.writeAtomic(record);
    return record;
  } catch (error) {
    if (record.status === "cancelled") return record;
    record.status = "failed";
    record.error = error instanceof Error ? error.message : "Run failed";
    options.store.writeIncomplete(record);
    throw error;
  }
}

function abortIfNeeded(signal: AbortSignal | undefined, store: RunStore, record: RunRecord): void {
  if (!signal?.aborted) return;
  record.status = "cancelled";
  record.error = "Run cancelled";
  store.writeIncomplete(record);
  throw DomainError.create("Run cancelled");
}
