import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import { executeChangeRun, softwareVersion } from "../packages/application/src/index.js";
import { FixtureStacAdapter } from "../apps/cli/src/fixture-stac-adapter.js";
import { FilesystemRunStore } from "../apps/cli/src/filesystem-run-store.js";
import { GeotiffRasterAdapter } from "../apps/cli/src/geotiff-raster-adapter.js";
import { writeGeotiff } from "../apps/cli/src/write-geotiff.js";
import { writeRunViewerArtifacts } from "../apps/cli/src/write-run-viewer-artifacts.js";

describe("The bounded change run", () => {
  it("completes stages and writes a finished record", async () => {
    const directory = mkdtempSync(join(tmpdir(), "change-run-"));
    const store = new FilesystemRunStore(directory);

    const { record } = await executeChangeRun({
      contract: navarreExampleContract,
      catalog: FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"),
      reader: new GeotiffRasterAdapter(),
      store,
    });

    expect(record.status).toBe("complete");
    expect(record.completedStages).toEqual(["validate", "select", "read", "difference", "review"]);
    expect(record.coverageVerdict).toBe("sufficient");
    expect(JSON.parse(readFileSync(join(directory, "run.json"), "utf8")).status).toBe("complete");
  });

  it("records the effective contract with the run", async () => {
    const directory = mkdtempSync(join(tmpdir(), "change-run-"));
    const contract = { ...navarreExampleContract, question: "Which pixels changed in this rehearsal?" };

    await executeChangeRun({
      contract,
      catalog: FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"),
      reader: new GeotiffRasterAdapter(),
      store: new FilesystemRunStore(directory),
    });

    const stored = JSON.parse(readFileSync(join(directory, "run.json"), "utf8")) as { contract: typeof contract };
    expect(stored.contract).toEqual(contract);
    expect(stored).toMatchObject({ processingLevelBefore: "L2A", processingLevelAfter: "L2A", softwareVersion });
  });

  it("stores NDVI difference beside the finished run record for the local viewer", async () => {
    const directory = mkdtempSync(join(tmpdir(), "change-run-"));
    const store = new FilesystemRunStore(directory);

    const result = await executeChangeRun({
      contract: navarreExampleContract,
      catalog: FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"),
      reader: new GeotiffRasterAdapter(),
      store,
    });
    const differencePath = writeRunViewerArtifacts(directory, result.difference);
    const run = JSON.parse(readFileSync(join(directory, "run.json"), "utf8")) as {
      status: string;
      validCoverage: number;
      acquiredBefore: string;
    };
    const stored = JSON.parse(readFileSync(differencePath!, "utf8")) as {
      validCoverage: number;
      beforeNdvi: number[];
      valid: number[];
    };

    expect(result.record.status).toBe("complete");
    expect(result.difference).toBeDefined();
    expect(differencePath).toBe(join(directory, "ndvi-difference.json"));
    expect(run.status).toBe("complete");
    expect(run.validCoverage).toBe(result.record.validCoverage);
    expect(run.acquiredBefore).toBe(result.record.acquiredBefore);
    expect(stored.validCoverage).toBe(result.record.validCoverage);
    expect(stored.beforeNdvi).toHaveLength(result.difference!.beforeNdvi.length);
    expect(stored.valid).toEqual(Array.from(result.difference!.valid));
  });

  it("marks an interrupted run incomplete and resumes from cache", async () => {
    const directory = mkdtempSync(join(tmpdir(), "change-run-"));
    const store = new FilesystemRunStore(directory);
    const catalog = FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json");
    const reader = new GeotiffRasterAdapter();
    const controller = new AbortController();
    controller.abort();

    const { record: cancelled } = await executeChangeRun({
      contract: navarreExampleContract,
      catalog,
      reader,
      store,
      signal: controller.signal,
    });
    expect(cancelled.status).toBe("cancelled");
    expect(JSON.parse(readFileSync(join(directory, "run.json"), "utf8")).status).toBe("incomplete");

    const { record: resumed } = await executeChangeRun({
      contract: navarreExampleContract,
      catalog,
      reader,
      store,
    });
    expect(resumed.status).toBe("complete");
  });

  it("does not reuse cache when a parameter changes", async () => {
    const directory = mkdtempSync(join(tmpdir(), "change-run-"));
    const store = new FilesystemRunStore(directory);
    const catalog = FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json");
    const reader = new GeotiffRasterAdapter();
    await executeChangeRun({ contract: navarreExampleContract, catalog, reader, store });

    const { record: changed } = await executeChangeRun({
      contract: { ...navarreExampleContract, changeThreshold: 0.4 },
      catalog,
      reader,
      store,
    });

    expect(changed.cacheHit).toBe(false);
    expect(changed.review?.threshold).toBe(0.4);
  });

  it("reuses a completed run only when source hashes still match", async () => {
    const directory = mkdtempSync(join(tmpdir(), "change-run-"));
    const rasters = join(directory, "rasters");
    cpSync("test/fixtures/rasters", rasters, { recursive: true });
    const items = JSON.parse(readFileSync("test/fixtures/stac/navarre-items.json", "utf8")) as Array<{
      bands: Array<{ href: string }>;
    }>;
    for (const item of items) {
      item.bands = item.bands.map((band) => ({ ...band, href: join(rasters, basename(band.href)) }));
    }
    const catalogPath = join(directory, "items.json");
    writeFileSync(catalogPath, JSON.stringify(items));
    const store = new FilesystemRunStore(join(directory, "output"));
    const catalog = FixtureStacAdapter.fromFile(catalogPath);
    const reader = new GeotiffRasterAdapter();
    const input = { contract: navarreExampleContract, catalog, reader, store };

    const { record: first } = await executeChangeRun(input);
    const { record: second } = await executeChangeRun(input);
    writeGeotiff(join(rasters, "before-red.tif"), [1200, 1000, 0, 2000], 2, 2, navarreExampleContract.aoi, 32);
    const { record: third } = await executeChangeRun(input);

    expect(second.cacheHit).toBe(true);
    expect(second.sourceHashes).toEqual(first.sourceHashes);
    expect(third.cacheHit).toBe(false);
    expect(third.sourceHashes?.[join(rasters, "before-red.tif")]).not.toBe(
      first.sourceHashes?.[join(rasters, "before-red.tif")],
    );
  });

  it("rejects a run directory that exceeds the disk budget", () => {
    const directory = mkdtempSync(join(tmpdir(), "change-run-"));
    writeFileSync(join(directory, "blob"), Buffer.alloc(10_000_001));
    const store = new FilesystemRunStore(directory);

    expect(() =>
      store.writeAtomic({
        status: "complete",
        completedStages: [],
        cacheKey: "budget",
        cacheHit: false,
      }),
    ).toThrow(/disk budget/i);
  });
});
