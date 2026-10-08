import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createOfflineAoiStyle } from "../apps/web/src/offline-map-style.js";

describe("The offline AOI map style", () => {
  it("provides a MapLibre v8 background style without remote assets", () => {
    const style = createOfflineAoiStyle();

    expect(style.version).toBe(8);
    expect(style.layers.some((layer) => layer.type === "background")).toBe(true);
    expect(style).not.toHaveProperty("glyphs");
    expect(style).not.toHaveProperty("sprite");
    expect(JSON.stringify(style)).not.toMatch(/https?:/i);
    expect(Object.keys(style.sources)).toEqual([]);
  });

  it("keeps the web source tree free of demotiles.maplibre.org", () => {
    const sources = listTypeScriptSources("apps/web/src");

    for (const path of sources) {
      const content = readFileSync(path, "utf8");
      expect(content, path).not.toContain("demotiles.maplibre.org");
    }
  });
});

function listTypeScriptSources(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      files.push(...listTypeScriptSources(path));
      continue;
    }
    if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      files.push(path);
    }
  }
  return files.sort();
}
