import {
  DomainError,
  assertPixelBudget,
  assertSameGrid,
  combineMasks,
  validityMask,
  type RasterBand,
  type Scene,
  type ScenePair,
} from "../../domain/src/index.js";
import type { RasterReader } from "./ports/raster-reader.js";

export const rasterLimits = {
  maxPixels: 10_000,
  maxBytes: 1_000_000,
} as const;

export type MaskedSceneRasters = {
  red: RasterBand;
  nir: RasterBand;
  valid: Uint8Array;
};

export type AlignedRasterPair = {
  before: MaskedSceneRasters;
  after: MaskedSceneRasters;
};

export async function readAlignedRasters(pair: ScenePair, reader: RasterReader): Promise<AlignedRasterPair> {
  const before = await readScene(pair.before, reader);
  const after = await readScene(pair.after, reader);
  assertSameGrid(before.red, after.red);
  assertSameGrid(before.nir, after.nir);
  return { before, after };
}

async function readScene(scene: Scene, reader: RasterReader): Promise<MaskedSceneRasters> {
  const redMeta = requiredBand(scene, "red");
  const nirMeta = requiredBand(scene, "nir");
  const sclMeta = scene.bands.find((band) => band.name === "scl");
  const red = await reader.readBand(redMeta.href, redMeta.scale, redMeta.offset);
  const nir = await reader.readBand(nirMeta.href, nirMeta.scale, nirMeta.offset);
  const scl = sclMeta ? await reader.readBand(sclMeta.href, sclMeta.scale, sclMeta.offset) : undefined;
  assertPixelBudget(red.width, red.height, rasterLimits.maxPixels);
  assertSameGrid(red, nir);
  if (scl) assertSameGrid(red, scl);
  const valid = combineMasks([
    validityMask(red.values, red.noData, scl?.values),
    validityMask(nir.values, nir.noData, scl?.values),
  ]);
  return { red, nir, valid };
}

function requiredBand(scene: Scene, name: "red" | "nir") {
  const band = scene.bands.find((entry) => entry.name === name);
  if (!band) throw DomainError.createValidation(`Scene ${scene.id} is missing ${name}`);
  return band;
}
