import type { CatalogItem } from "../../../domain/src/index.js";

export type StacSearchQuery = {
  collection: string;
  bbox: readonly [number, number, number, number];
  start: string;
  end: string;
  pageSize: number;
  maxPages: number;
};

export type StacCatalog = {
  search(query: StacSearchQuery): Promise<CatalogItem[]>;
};
