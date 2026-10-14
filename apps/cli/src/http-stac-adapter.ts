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
  assets?: Record<string, StacAsset>;
  links?: Array<{ rel?: string; href?: string }>;
};

type StacAsset = {
  href?: string;
  "raster:scale"?: number;
  "raster:offset"?: number;
  "raster:bands"?: Array<{ scale?: number; offset?: number; nodata?: number }>;
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
      let response: Response;
      try {
        response = await this.fetchFn(url, {
          method: body ? "POST" : "GET",
          headers: { "content-type": "application/json" },
          ...(body ? { body } : {}),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("STAC search failed");
        continue;
      }
      if (response.ok) return (await response.json()) as StacPage;
      if (!isRetryable(response.status)) {
        throw DomainError.create(`STAC search failed with ${response.status}`);
      }
      lastError = new Error(`STAC search failed with ${response.status}`);
    }
    throw DomainError.create(`STAC search exhausted retries: ${lastError?.message ?? "unknown error"}`);
  }
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function toCatalogItem(feature: StacFeature): CatalogItem {
  const id = feature.id;
  if (!id) throw DomainError.createValidation("STAC feature is missing id");
  const bbox = feature.bbox;
  if (!bbox || bbox.length < 4) throw DomainError.createValidation(`STAC feature ${id} is missing bbox`);
  const datetime = feature.properties?.datetime;
  if (!datetime) throw DomainError.createValidation(`STAC feature ${id} is missing datetime`);
  return {
    id,
    datetime,
    processingLevel: feature.properties?.["s2:product_type"] ?? "L2A",
    // A missing cloud cover is treated as fully cloudy so the scene never qualifies.
    cloudCoverPercent: feature.properties?.["eo:cloud_cover"] ?? 100,
    bbox: { west: bbox[0]!, south: bbox[1]!, east: bbox[2]!, north: bbox[3]!, crs: "EPSG:4326" },
    href: feature.links?.find((link) => link.rel === "self")?.href ?? "",
    bands: [
      band("red", feature.assets?.B04),
      band("nir", feature.assets?.B08),
      band("scl", feature.assets?.SCL),
    ].filter((value): value is SceneBand => value !== undefined),
  };
}

function band(name: SceneBand["name"], asset: StacAsset | undefined): SceneBand | undefined {
  if (!asset?.href) return undefined;
  const raster = asset["raster:bands"]?.[0];
  const noData = raster?.nodata;
  const isClassMap = name === "scl";
  const defaultScale = isClassMap ? 1 : 0.0001;
  return {
    name,
    href: asset.href,
    scale: isClassMap ? 1 : (raster?.scale ?? asset["raster:scale"] ?? defaultScale),
    offset: isClassMap ? 0 : (raster?.offset ?? asset["raster:offset"] ?? 0),
    ...(noData === undefined ? {} : { noData }),
  };
}
