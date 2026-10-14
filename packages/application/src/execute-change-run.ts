import { DomainError, type RunContract, type ScenePair } from "../../domain/src/index.js";
import { coverageVerdict } from "./change-report.js";
import { computeNdviDifference, type NdviDifferenceResult } from "./compute-ndvi-difference.js";
import type { RasterReader } from "./ports/raster-reader.js";
import { readAlignedRasters } from "./read-aligned-rasters.js";
import { reviewDifference } from "./review-change.js";
import { selectScenes } from "./select-scenes.js";
import type { StacCatalog } from "./ports/stac-catalog.js";
import type { RunRecord, RunStore } from "./ports/run-store.js";
import { softwareVersion } from "./version.js";

export type ChangeRunResult = {
  record: RunRecord;
  difference?: NdviDifferenceResult;
};

export async function executeChangeRun(options: {
  contract: RunContract;
  catalog: StacCatalog;
  reader: RasterReader;
  store: RunStore;
  signal?: AbortSignal;
}): Promise<ChangeRunResult> {
  const record: RunRecord = {
    status: "incomplete",
    completedStages: [],
    cacheKey: options.store.cacheKey({ contract: options.contract, version: softwareVersion }),
    cacheHit: false,
    contract: options.contract,
    softwareVersion,
  };
  try {
    abortIfNeeded(options.signal, options.store, record);
    record.completedStages.push("validate");
    abortIfNeeded(options.signal, options.store, record);
    const pair = await selectScenes(options.contract, options.catalog);
    record.completedStages.push("select");
    record.beforeId = pair.before.id;
    record.afterId = pair.after.id;
    record.acquiredBefore = pair.before.acquiredAt;
    record.acquiredAfter = pair.after.acquiredAt;
    record.processingLevelBefore = pair.before.processingLevel;
    record.processingLevelAfter = pair.after.processingLevel;
    const sourceHashes = await digestPair(pair, options.reader);
    record.sourceHashes = sourceHashes;
    record.cacheKey = options.store.cacheKey({
      contract: options.contract,
      version: softwareVersion,
      sourceHashes,
    });
    const cached = options.store.read(record.cacheKey);
    if (cached?.status === "complete" && sameHashes(cached.sourceHashes, sourceHashes)) {
      return { record: { ...cached, cacheHit: true } };
    }
    abortIfNeeded(options.signal, options.store, record);
    const rasters = await readAlignedRasters(pair, options.reader);
    record.completedStages.push("read");
    abortIfNeeded(options.signal, options.store, record);
    const difference = computeNdviDifference(options.contract, pair, rasters);
    record.completedStages.push("difference");
    record.validCoverage = difference.validCoverage;
    record.coverageVerdict = coverageVerdict(difference.validCoverage);
    abortIfNeeded(options.signal, options.store, record);
    record.review = reviewDifference(options.contract, rasters, difference);
    record.completedStages.push("review");
    record.status = "complete";
    options.store.writeAtomic(record);
    return { record, difference };
  } catch (error) {
    if (record.status === "cancelled") return { record };
    record.status = "failed";
    record.error = error instanceof Error ? error.message : "Run failed";
    options.store.writeIncomplete(record);
    throw error;
  }
}

async function digestPair(pair: ScenePair, reader: RasterReader): Promise<Record<string, string>> {
  const hrefs = [...new Set([...pair.before.bands, ...pair.after.bands].map((band) => band.href))].sort();
  const sourceHashes: Record<string, string> = {};
  for (const href of hrefs) {
    sourceHashes[href] = await reader.digest(href);
  }
  return sourceHashes;
}

function sameHashes(stored: Record<string, string> | undefined, current: Record<string, string>): boolean {
  if (!stored) return false;
  const storedKeys = Object.keys(stored).sort();
  const currentKeys = Object.keys(current).sort();
  if (storedKeys.length !== currentKeys.length) return false;
  return storedKeys.every((key, index) => key === currentKeys[index] && stored[key] === current[key]);
}

function abortIfNeeded(signal: AbortSignal | undefined, store: RunStore, record: RunRecord): void {
  if (!signal?.aborted) return;
  record.status = "cancelled";
  record.error = "Run cancelled";
  store.writeIncomplete(record);
  throw DomainError.create("Run cancelled");
}
