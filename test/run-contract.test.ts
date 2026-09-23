import { describe, expect, it } from "vitest";
import { createRunContract, navarreExampleContract } from "../packages/domain/src/index.js";

describe("The run contract", () => {
  it("accepts the frozen Navarre example", () => {
    const contract = createRunContract(navarreExampleContract);

    expect(contract.question).toContain("Navarre");
    expect(contract.aoi.crs).toBe("EPSG:4326");
    expect(contract.sourceLicense).toContain("Copernicus");
    expect(contract.units).toBe("dimensionless NDVI difference");
    expect(contract.outputManifest.fields).toEqual([
      "question",
      "crs",
      "units",
      "sourceLicense",
      "before",
      "after",
      "limitations",
    ]);
  });

  it("rejects an inverted area of interest", () => {
    expect(() =>
      createRunContract({
        ...navarreExampleContract,
        aoi: { ...navarreExampleContract.aoi, west: -1.75, east: -1.76 },
      }),
    ).toThrow(/inverted/);
  });

  it("rejects an unsupported CRS", () => {
    expect(() =>
      createRunContract({
        ...navarreExampleContract,
        aoi: { ...navarreExampleContract.aoi, crs: "EPSG:3857" },
      }),
    ).toThrow(/unsupported CRS/i);
  });

  it("rejects an unbounded area of interest", () => {
    expect(() =>
      createRunContract({
        ...navarreExampleContract,
        aoi: { west: -8, south: 36, east: 3, north: 44, crs: "EPSG:4326" },
      }),
    ).toThrow(/unbounded/i);
  });

  it("rejects inverted observation windows", () => {
    expect(() =>
      createRunContract({
        ...navarreExampleContract,
        before: { start: "2025-06-01", end: "2025-06-30" },
        after: { start: "2024-06-01", end: "2024-06-30" },
      }),
    ).toThrow(/observation/i);
  });
});
