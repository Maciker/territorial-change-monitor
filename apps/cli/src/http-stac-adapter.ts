import { DomainError } from "../../../packages/domain/src/index.js";
import type { CatalogItem, SceneBand } from "../../../packages/domain/src/index.js";
import type { StacCatalog, StacSearchQuery } from "../../../packages/application/src/index.js";

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

type StacFeature = {
  id?: string;
  bbox?: number[];
  properties?: {
    datetime?: string;
    "eo:cloud_cover"?: number;
    "s2:product_type"?: string;
  };
  assets?: Record<string, { href?: string; "raster:scale"?: number; "raster:offset"?: number }>;
  links?: Array<{ rel?: string; href?: string }>;
};

type StacPage = {
  features?: StacFeature[];
  links?: Array<{ rel?: string; href?: string }>;
};

export class HttpStacAdapter implements StacCatalog {
  constructor(
    private readonly endpoint: string,
    private readonly fetchFn: FetchLike,
    private readonly timeoutMs: number,
    private readonly retryCap: number,
  ) {}

  async search(query: StacSearchQuery): Promise<CatalogItem[]> {
    const items: CatalogItem[] = [];
    let url: string | undefined = this.endpoint;
    let body: string | undefined = JSON.stringify({
      collections: [query.collection],
      bbox: query.bbox,
      datetime: `${query.start}T00:00:00Z/${query.end}T23:59:59Z`,
      limit: query.pageSize,
    });
    for (let page = 0; page < query.maxPages && url; page += 1) {
      const payload = await this.fetchPage(url, body);
      items.push(...(payload.features ?? []).map(toCatalogItem));
      url = payload.links?.find((link) => link.rel === "next")?.href;
      body = undefined;
    }
    return items;
  }

  private async fetchPage(url: string, body: string | undefined): Promise<StacPage> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.retryCap; attempt += 1) {
      try {
        const response = await this.fetchFn(url, {
          method: body ? "POST" : "GET",
          headers: { "content-type": "application/json" },
          ...(body ? { body } : {}),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) throw new Error(`STAC search failed with ${response.status}`);
        return (await response.json()) as StacPage;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("STAC search failed");
      }
    }
    throw DomainError.create(`STAC search exhausted retries: ${lastError?.message ?? "unknown error"}`);
  }
}

function toCatalogItem(feature: StacFeature): CatalogItem {
  const bbox = feature.bbox ?? [0, 0, 0, 0];
  return {
    id: feature.id ?? "unknown",
    datetime: feature.properties?.datetime ?? "",
    processingLevel: feature.properties?.["s2:product_type"] ?? "L2A",
    cloudCoverPercent: feature.properties?.["eo:cloud_cover"] ?? 100,
    bbox: {
      west: bbox[0] ?? 0,
      south: bbox[1] ?? 0,
      east: bbox[2] ?? 0,
      north: bbox[3] ?? 0,
      crs: "EPSG:4326",
    },
    href: feature.links?.find((link) => link.rel === "self")?.href ?? "",
    bands: [
      band("red", feature.assets?.B04),
      band("nir", feature.assets?.B08),
      band("scl", feature.assets?.SCL),
    ].filter((value): value is SceneBand => value !== undefined),
  };
}

function band(
  name: SceneBand["name"],
  asset: { href?: string; "raster:scale"?: number; "raster:offset"?: number } | undefined,
): SceneBand | undefined {
  if (!asset?.href) return undefined;
  return {
    name,
    href: asset.href,
    scale: asset["raster:scale"] ?? 0.0001,
    offset: asset["raster:offset"] ?? 0,
  };
}
