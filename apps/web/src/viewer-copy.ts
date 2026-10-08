export function aoiMapCaption(crs: string): string {
  return `AOI polygon in ${crs}. Map is context only — not the geometry of candidate pixels. NDVI values are the synthetic 2×2 fixture shown in the grids.`;
}

export const syntheticFixtureNote =
  "NDVI grids show the synthetic 2×2 fixture rasters, not Earth observation pixels.";
