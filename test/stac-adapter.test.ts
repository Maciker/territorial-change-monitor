import { describe, expect, it } from "vitest";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import { selectScenes, stacSearchBounds } from "../packages/application/src/index.js";
import { FixtureStacAdapter } from "../apps/cli/src/fixture-stac-adapter.js";
import { HttpStacAdapter } from "../apps/cli/src/http-stac-adapter.js";
import type { CatalogItem } from "../packages/domain/src/index.js";

describe("The STAC adapters", () => {
  it("select a recorded fixture pair for the Navarre contract", async () => {
    const catalog = FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json");

    const pair = await selectScenes(navarreExampleContract, catalog);

    expect(pair.before.id).toBe("S2A_20240612_NAVARRE");
    expect(pair.after.id).toBe("S2A_20250611_NAVARRE");
    expect(pair.before.processingLevel).toBe("L2A");
    expect(pair.before.href).toContain("S2A_20240612_NAVARRE");
  });

  it("stop fixture pagination at the declared page bound", async () => {
    const items = Array.from({ length: 25 }, (_, index) => ({
      id: `item-${String(index).padStart(2, "0")}`,
      datetime: "2024-06-10T10:00:00Z",
      processingLevel: "L2A",
      cloudCoverPercent: 1,
      bbox: navarreExampleContract.aoi,
      href: `https://example.test/${index}`,
      bands: [],
    })) as CatalogItem[];
    const catalog = new FixtureStacAdapter(items);

    const page = await catalog.search({
      collection: "sentinel-2-l2a",
      bbox: [-1.76, 42.8, -1.75, 42.81],
      start: "2024-06-01",
      end: "2024-06-30",
      pageSize: 10,
      maxPages: 2,
    });

    expect(page).toHaveLength(20);
  });

  it("retry transient HTTP failures up to the cap and then stop", async () => {
    let attempts = 0;
    const adapter = new HttpStacAdapter(
      "https://example.test/search",
      async () => {
        attempts += 1;
        throw new Error("network down");
      },
      stacSearchBounds.timeoutMs,
      stacSearchBounds.retryCap,
    );

    await expect(
      adapter.search({
        collection: "sentinel-2-l2a",
        bbox: [-1.76, 42.8, -1.75, 42.81],
        start: "2024-06-01",
        end: "2024-06-30",
        pageSize: 10,
        maxPages: 1,
      }),
    ).rejects.toThrow(/exhausted retries/i);
    expect(attempts).toBe(stacSearchBounds.retryCap + 1);
  });

  it("parse a STAC page into typed scenes with scale and offset", async () => {
    const adapter = new HttpStacAdapter(
      "https://example.test/search",
      async () =>
        new Response(
          JSON.stringify({
            features: [
              {
                id: "http-before",
                bbox: [-1.77, 42.79, -1.74, 42.82],
                properties: {
                  datetime: "2024-06-12T10:55:00Z",
                  "eo:cloud_cover": 4,
                  "s2:product_type": "S2MSI2A",
                },
                assets: {
                  B04: { href: "https://example.test/red.tif", "raster:scale": 0.0001, "raster:offset": 0 },
                  B08: { href: "https://example.test/nir.tif", "raster:scale": 0.0001, "raster:offset": 0 },
                },
                links: [{ rel: "self", href: "https://example.test/items/http-before" }],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      stacSearchBounds.timeoutMs,
      stacSearchBounds.retryCap,
    );

    const items = await adapter.search({
      collection: "sentinel-2-l2a",
      bbox: [-1.76, 42.8, -1.75, 42.81],
      start: "2024-06-01",
      end: "2024-06-30",
      pageSize: 10,
      maxPages: 1,
    });

    expect(items[0]?.id).toBe("http-before");
    expect(items[0]?.bands).toEqual([
      { name: "red", href: "https://example.test/red.tif", scale: 0.0001, offset: 0 },
      { name: "nir", href: "https://example.test/nir.tif", scale: 0.0001, offset: 0 },
    ]);
  });

  it("defaults SCL to class-map scale when raster:bands is missing", async () => {
    const adapter = adapterReturning({
      features: [
        feature({
          B04: { href: "https://example.test/red.tif" },
          B08: { href: "https://example.test/nir.tif" },
          SCL: { href: "https://example.test/scl.tif" },
        }),
      ],
    });

    const items = await adapter.search(query());

    expect(items[0]?.bands).toEqual([
      { name: "red", href: "https://example.test/red.tif", scale: 0.0001, offset: 0 },
      { name: "nir", href: "https://example.test/nir.tif", scale: 0.0001, offset: 0 },
      { name: "scl", href: "https://example.test/scl.tif", scale: 1, offset: 0 },
    ]);
  });

  it("read scale, offset and NoData from the STAC raster extension", async () => {
    const adapter = adapterReturning({
      features: [
        feature({
          B04: { href: "https://example.test/red.tif", "raster:bands": [{ scale: 0.0001, offset: -0.1, nodata: 0 }] },
          B08: { href: "https://example.test/nir.tif", "raster:bands": [{ scale: 0.0001, offset: -0.1, nodata: 0 }] },
        }),
      ],
    });

    const items = await adapter.search(query());

    expect(items[0]?.bands).toEqual([
      { name: "red", href: "https://example.test/red.tif", scale: 0.0001, offset: -0.1, noData: 0 },
      { name: "nir", href: "https://example.test/nir.tif", scale: 0.0001, offset: -0.1, noData: 0 },
    ]);
  });

  it.each(["id", "bbox", "datetime"])("reject a feature without %s instead of inventing one", async (field) => {
    const incomplete = feature({ B04: { href: "https://example.test/red.tif" } }) as Record<string, unknown>;
    if (field === "datetime") incomplete.properties = { "eo:cloud_cover": 4 };
    else delete incomplete[field];
    const adapter = adapterReturning({ features: [incomplete] });

    await expect(adapter.search(query())).rejects.toThrow(new RegExp(`missing ${field}`, "i"));
  });

  it("do not retry a client error other than rate limiting", async () => {
    let attempts = 0;
    const adapter = new HttpStacAdapter(
      "https://example.test/search",
      async () => {
        attempts += 1;
        return new Response("bad request", { status: 400 });
      },
      stacSearchBounds.timeoutMs,
      stacSearchBounds.retryCap,
    );

    await expect(adapter.search(query())).rejects.toThrow(/400/);
    expect(attempts).toBe(1);
  });
});

function query() {
  return {
    collection: "sentinel-2-l2a",
    bbox: [-1.76, 42.8, -1.75, 42.81] as const,
    start: "2024-06-01",
    end: "2024-06-30",
    pageSize: 10,
    maxPages: 1,
  };
}

function feature(assets: Record<string, unknown>) {
  return {
    id: "http-before",
    bbox: [-1.77, 42.79, -1.74, 42.82],
    properties: { datetime: "2024-06-12T10:55:00Z", "eo:cloud_cover": 4, "s2:product_type": "S2MSI2A" },
    assets,
  };
}

function adapterReturning(page: unknown): HttpStacAdapter {
  return new HttpStacAdapter(
    "https://example.test/search",
    async () => new Response(JSON.stringify(page), { status: 200, headers: { "content-type": "application/json" } }),
    stacSearchBounds.timeoutMs,
    stacSearchBounds.retryCap,
  );
}
