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

// Synthetic 20x20 demo scene (raw Sentinel-2-like DN, scale 0.0001). Not Earth observation data.
const side = 20;
const vegetation = { red: 500, nir: 3000 }; // NDVI ~0.71
const seasonalVegetation = { red: 550, nir: 2900 }; // NDVI ~0.68, below the 0.20 threshold
const bareSoil = { red: 1500, nir: 1800 }; // NDVI ~0.09
const stressedVegetation = { red: 900, nir: 2500 }; // NDVI ~0.47

const within = (row, column, rows, columns) =>
  row >= rows[0] && row <= rows[1] && column >= columns[0] && column <= columns[1];
const isLossPatch = (row, column) => within(row, column, [4, 8], [3, 8]);
const isGainPatch = (row, column) => within(row, column, [13, 16], [12, 16]);
const isCloud = (row, column) => within(row, column, [2, 6], [13, 18]);
const isIsolatedLoss = (row, column) => row === 18 && column === 2;
const isNoDataColumn = (_row, column) => column === side - 1;

function scene(pick) {
  const red = [];
  const nir = [];
  const scl = [];
  for (let row = 0; row < side; row += 1) {
    for (let column = 0; column < side; column += 1) {
      const pixel = pick(row, column);
      red.push(pixel.red);
      nir.push(pixel.nir);
      scl.push(pixel.scl ?? 4);
    }
  }
  return { red, nir, scl };
}

const before = scene((row, column) => {
  if (isNoDataColumn(row, column)) return { red: 0, nir: 0 };
  if (isGainPatch(row, column)) return bareSoil;
  return vegetation;
});
const after = scene((row, column) => {
  if (isCloud(row, column)) return { ...bareSoil, scl: 9 };
  if (isLossPatch(row, column)) return bareSoil;
  if (isGainPatch(row, column)) return vegetation;
  if (isIsolatedLoss(row, column)) return stressedVegetation;
  return seasonalVegetation;
});

const demoDirectory = "data/fixtures/navarre-demo";
mkdirSync(demoDirectory, { recursive: true });
for (const [name, bands] of Object.entries({ before, after })) {
  writeGeotiff(`${demoDirectory}/${name}-red.tif`, bands.red, side, side, bbox, 32, 0);
  writeGeotiff(`${demoDirectory}/${name}-nir.tif`, bands.nir, side, side, bbox, 32, 0);
  writeGeotiff(`${demoDirectory}/${name}-scl.tif`, bands.scl, side, side, bbox, 8, 0);
}
console.log("demo fixtures written");
