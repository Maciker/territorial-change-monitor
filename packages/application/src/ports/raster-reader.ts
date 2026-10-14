import type { BandReadOptions, RasterBand } from "../../../domain/src/index.js";

export type RasterReader = {
  readBand(path: string, options: BandReadOptions): Promise<RasterBand>;
  digest(path: string): Promise<string>;
};
