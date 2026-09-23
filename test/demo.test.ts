import { describe, expect, it } from "vitest";
import { formatKernelDemo } from "../apps/cli/src/demo.js";

describe("The kernel demonstration", () => {
  it("reports the known normalized difference and masks a zero total", () => {
    const report = formatKernelDemo();

    expect(report).toContain("0.5");
    expect(report).toMatch(/NaN/);
  });
});
