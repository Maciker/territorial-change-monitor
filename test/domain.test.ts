import { describe, expect, it } from "vitest";
import { normalizedDifference } from "../packages/domain/src/index.js";
describe("The normalized difference", () => {
  it("calculates the index and masks a zero total", () => {
    const result = normalizedDifference(new Float32Array([3, 0]), new Float32Array([1, 0]));
    expect(result[0]).toBe(0.5);
    expect(result[1]).toBeNaN();
  });
});
