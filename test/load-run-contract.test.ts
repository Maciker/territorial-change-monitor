import { describe, expect, it } from "vitest";
import { loadRunContract } from "../apps/cli/src/load-run-contract.js";

describe("The run contract files", () => {
  it("load the frozen Navarre example", () => {
    const contract = loadRunContract("config/run.example.yml", "config/aoi.example.geojson");

    expect(contract.aoi.west).toBeCloseTo(-1.76);
    expect(contract.aoi.north).toBeCloseTo(42.81);
    expect(contract.before.start).toBe("2024-06-01");
    expect(contract.after.start).toBe("2025-06-01");
  });

  it("reject a GeoJSON file without a polygon", () => {
    expect(() => loadRunContract("config/run.example.yml", "package.json")).toThrow(/polygon/);
  });
});
