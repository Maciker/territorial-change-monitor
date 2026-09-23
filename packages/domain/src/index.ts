export function normalizedDifference(first: Float32Array, second: Float32Array): Float32Array {
  if (first.length !== second.length) throw new Error("Raster bands must have equal length");
  return first.map((value, index) => {
    const other = second[index]!;
    const total = Math.fround(value + other);
    return total === 0 ? Number.NaN : Math.fround(value - other) / total;
  });
}
