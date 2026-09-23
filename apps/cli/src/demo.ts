import { normalizedDifference } from "../../../packages/domain/src/index.js";

export function formatKernelDemo(): string {
  const result = normalizedDifference(new Float32Array([3, 0]), new Float32Array([1, 0]));
  return `normalized difference: ${result[0]}\nmasked zero total: ${result[1]}`;
}
