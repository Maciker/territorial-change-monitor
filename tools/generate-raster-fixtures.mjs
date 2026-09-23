import { mkdirSync } from "node:fs";
import { writeGeotiff } from "../dist/apps/cli/src/write-geotiff.js";

const bbox = { west: -1.76, south: 42.8, east: -1.75, north: 42.81, crs: "EPSG:4326" };
mkdirSync("test/fixtures/rasters", { recursive: true });
writeGeotiff("test/fixtures/rasters/before-red.tif", [1000, 1000, 0, 2000], 2, 2, bbox, 32);
writeGeotiff("test/fixtures/rasters/before-nir.tif", [3000, 1000, 0, 2000], 2, 2, bbox, 32);
writeGeotiff("test/fixtures/rasters/before-scl.tif", [4, 4, 4, 4], 2, 2, bbox, 8);
writeGeotiff("test/fixtures/rasters/after-red.tif", [1000, 1000, 0, 1000], 2, 2, bbox, 32);
writeGeotiff("test/fixtures/rasters/after-nir.tif", [1000, 3000, 0, 1000], 2, 2, bbox, 32);
writeGeotiff("test/fixtures/rasters/after-scl.tif", [4, 9, 4, 4], 2, 2, bbox, 8);
writeGeotiff("test/fixtures/rasters/misaligned-red.tif", [1, 1, 1, 1, 1, 1], 3, 2, bbox, 32);
console.log("raster fixtures written");
