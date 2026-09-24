import type { RasterBand } from "../../../domain/src/index.js";

export type RasterReader = {
  readBand(path: string, scale: number, offset: number): Promise<RasterBand>;
  digest(path: string): Promise<string>;
};
