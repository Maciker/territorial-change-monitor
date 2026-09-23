import { describe, expect, it } from "vitest";
import { navarreExampleContract, selectComparableScenes } from "../packages/domain/src/index.js";
import type { CatalogItem } from "../packages/domain/src/index.js";

const navarreBbox = navarreExampleContract.aoi;

function item(overrides: Partial<CatalogItem> & Pick<CatalogItem, "id" | "datetime">): CatalogItem {
  return {
    processingLevel: "L2A",
    cloudCoverPercent: 5,
    bbox: navarreBbox,
    href: `https://example.test/items/${overrides.id}`,
    bands: [
      { name: "red", href: "https://example.test/red.tif", scale: 0.0001, offset: 0 },
      { name: "nir", href: "https://example.test/nir.tif", scale: 0.0001, offset: 0 },
    ],
    ...overrides,
  };
}

describe("The comparable scene pair", () => {
  it("selects the lowest-cloud covering scene in each window", () => {
    const pair = selectComparableScenes(navarreExampleContract, [
      item({ id: "cloudy-before", datetime: "2024-06-10T10:00:00Z", cloudCoverPercent: 18 }),
      item({ id: "clear-before", datetime: "2024-06-12T10:00:00Z", cloudCoverPercent: 4 }),
      item({ id: "clear-after", datetime: "2025-06-11T10:00:00Z", cloudCoverPercent: 6 }),
    ]);

    expect(pair.before.id).toBe("clear-before");
    expect(pair.after.id).toBe("clear-after");
    expect(pair.before.aoiCoveragePercent).toBeGreaterThan(90);
    expect(pair.before.bands[0]?.scale).toBe(0.0001);
  });

  it("reports insufficient coverage when no pair qualifies", () => {
    expect(() =>
      selectComparableScenes(navarreExampleContract, [
        item({ id: "outside", datetime: "2023-06-10T10:00:00Z" }),
      ]),
    ).toThrow(/insufficient coverage/i);
  });

  it("ignores items missing red or near-infrared assets", () => {
    expect(() =>
      selectComparableScenes(navarreExampleContract, [
        item({
          id: "no-nir",
          datetime: "2024-06-10T10:00:00Z",
          bands: [{ name: "red", href: "https://example.test/red.tif", scale: 0.0001, offset: 0 }],
        }),
        item({ id: "after", datetime: "2025-06-11T10:00:00Z" }),
      ]),
    ).toThrow(/insufficient coverage/i);
  });

  it("tie-breaks equal cloud and coverage by acquisition time then identifier", () => {
    const pair = selectComparableScenes(navarreExampleContract, [
      item({ id: "b-later", datetime: "2024-06-20T10:00:00Z", cloudCoverPercent: 3 }),
      item({ id: "a-earlier", datetime: "2024-06-10T10:00:00Z", cloudCoverPercent: 3 }),
      item({ id: "after", datetime: "2025-06-11T10:00:00Z" }),
    ]);

    expect(pair.before.id).toBe("a-earlier");
  });
});
