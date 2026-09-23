import { readFileSync } from "node:fs";
import type { CatalogItem } from "../../../packages/domain/src/index.js";
import type { StacCatalog, StacSearchQuery } from "../../../packages/application/src/index.js";

export class FixtureStacAdapter implements StacCatalog {
  constructor(private readonly items: CatalogItem[]) {}

  static fromFile(path: string): FixtureStacAdapter {
    const items = JSON.parse(readFileSync(path, "utf8")) as CatalogItem[];
    return new FixtureStacAdapter(items);
  }

  async search(query: StacSearchQuery): Promise<CatalogItem[]> {
    const matching = this.items.filter((item) => {
      const day = item.datetime.slice(0, 10);
      return day >= query.start && day <= query.end;
    });
    return matching.slice(0, query.pageSize * query.maxPages);
  }
}
