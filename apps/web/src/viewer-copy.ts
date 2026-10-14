export function aoiMapCaption(crs: string, width: number, height: number): string {
  return `AOI polygon in ${crs}. Map is context only — not the geometry of candidate pixels. NDVI values are the synthetic ${width}×${height} fixture shown in the grids.`;
}

export function syntheticFixtureNote(width: number, height: number): string {
  return `NDVI grids show the synthetic ${width}×${height} fixture rasters, not Earth observation pixels.`;
}
