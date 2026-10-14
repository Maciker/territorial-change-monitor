import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  it.each([
    ["change_threshold: 0.20", 'change_threshold: "0.20"', /change_threshold must be a number/],
    ["max_cloud_cover: 20", 'max_cloud_cover: "20"', /max_cloud_cover must be a number/],
    ["minimum_region_pixels: 1", 'minimum_region_pixels: "1"', /minimum_region_pixels must be a number/],
    ["question: Where", "question: 42 # Where", /question must be text/],
  ])("reject a mistyped field (%s)", (original, replacement, message) => {
    const yamlPath = writeRunFile(readFileSync("config/run.example.yml", "utf8").replace(original, replacement));

    expect(() => loadRunContract(yamlPath, "config/aoi.example.geojson")).toThrow(message);
  });

  it("reject limitations that are not a list of text", () => {
    const yamlPath = writeRunFile(
      readFileSync("config/run.example.yml", "utf8").replace(/limitations:\n( {2}- .*\n)+/, "limitations: not-a-list\n"),
    );

    expect(() => loadRunContract(yamlPath, "config/aoi.example.geojson")).toThrow(/limitations must be a list of text/);
  });
});

function writeRunFile(text: string): string {
  const path = join(mkdtempSync(join(tmpdir(), "run-file-")), "run.yml");
  writeFileSync(path, text);
  return path;
}
