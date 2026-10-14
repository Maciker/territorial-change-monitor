import { DomainError } from "./domain-error.js";
import type { BoundingBox, RunContract } from "./run-contract.js";

const minimumAoiCoveragePercent = 90;

export type SceneBandName = "red" | "nir" | "scl";

export type SceneBand = {
  name: SceneBandName;
  href: string;
  scale: number;
  offset: number;
  /** NoData code in raw source units, as declared by the catalog. */
  noData?: number;
};

export type CatalogItem = {
  id: string;
  datetime: string;
  processingLevel: string;
  cloudCoverPercent: number;
  bbox: BoundingBox;
  href: string;
  bands: SceneBand[];
};

export type Scene = CatalogItem & {
  acquiredAt: string;
  aoiCoveragePercent: number;
};

export type ScenePair = {
  before: Scene;
  after: Scene;
};

export function selectComparableScenes(contract: RunContract, items: CatalogItem[]): ScenePair {
  const before = chooseScene(contract, items, contract.before.start, contract.before.end);
  const after = chooseScene(contract, items, contract.after.start, contract.after.end);
  return { before, after };
}

export function intersectionCoveragePercent(aoi: BoundingBox, other: BoundingBox): number {
  const west = Math.max(aoi.west, other.west);
  const south = Math.max(aoi.south, other.south);
  const east = Math.min(aoi.east, other.east);
  const north = Math.min(aoi.north, other.north);
  if (west >= east || south >= north) return 0;
  const overlap = (east - west) * (north - south);
  const aoiArea = (aoi.east - aoi.west) * (aoi.north - aoi.south);
  return aoiArea === 0 ? 0 : (overlap / aoiArea) * 100;
}

function chooseScene(contract: RunContract, items: CatalogItem[], start: string, end: string): Scene {
  const candidates = items
    .map((item) => toScene(contract, item))
    .filter((scene) => qualifies(contract, scene, start, end))
    .sort(compareScenes);
  const selected = candidates[0];
  if (!selected) {
    throw DomainError.createValidation("Insufficient coverage to select a comparable scene pair");
  }
  return selected;
}

function toScene(contract: RunContract, item: CatalogItem): Scene {
  return {
    ...item,
    acquiredAt: item.datetime,
    aoiCoveragePercent: intersectionCoveragePercent(contract.aoi, item.bbox),
  };
}

function qualifies(contract: RunContract, scene: Scene, start: string, end: string): boolean {
  const acquired = scene.acquiredAt.slice(0, 10);
  return (
    acquired >= start &&
    acquired <= end &&
    scene.cloudCoverPercent <= contract.maxCloudCoverPercent &&
    scene.aoiCoveragePercent >= minimumAoiCoveragePercent &&
    hasBand(scene, "red") &&
    hasBand(scene, "nir")
  );
}

function hasBand(scene: Scene, name: SceneBandName): boolean {
  return scene.bands.some((band) => band.name === name);
}

function compareScenes(left: Scene, right: Scene): number {
  return (
    left.cloudCoverPercent - right.cloudCoverPercent ||
    right.aoiCoveragePercent - left.aoiCoveragePercent ||
    left.acquiredAt.localeCompare(right.acquiredAt) ||
    left.id.localeCompare(right.id)
  );
}
