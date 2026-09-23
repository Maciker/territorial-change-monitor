import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import { executeChangeRun } from "../packages/application/src/index.js";
import { FixtureStacAdapter } from "../apps/cli/src/fixture-stac-adapter.js";
import { FilesystemRunStore } from "../apps/cli/src/filesystem-run-store.js";
import { GeotiffRasterAdapter } from "../apps/cli/src/geotiff-raster-adapter.js";

describe("The bounded change run", () => {
  it("completes stages and writes a finished record", async () => {
    const directory = mkdtempSync(join(tmpdir(), "change-run-"));
    const store = new FilesystemRunStore(directory);

    const record = await executeChangeRun({
      contract: navarreExampleContract,
      catalog: FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"),
      reader: new GeotiffRasterAdapter(),
      store,
    });

    expect(record.status).toBe("complete");
    expect(record.completedStages).toEqual(["validate", "select", "read", "difference", "review"]);
    expect(JSON.parse(readFileSync(join(directory, "run.json"), "utf8")).status).toBe("complete");
  });

  it("marks an interrupted run incomplete and resumes from cache", async () => {
    const directory = mkdtempSync(join(tmpdir(), "change-run-"));
    const store = new FilesystemRunStore(directory);
    const catalog = FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json");
    const reader = new GeotiffRasterAdapter();
    const controller = new AbortController();
    controller.abort();

    const cancelled = await executeChangeRun({
      contract: navarreExampleContract,
      catalog,
      reader,
      store,
      signal: controller.signal,
    });
    expect(cancelled.status).toBe("cancelled");
    expect(JSON.parse(readFileSync(join(directory, "run.json"), "utf8")).status).toBe("incomplete");

    const resumed = await executeChangeRun({
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

    const changed = await executeChangeRun({
      contract: { ...navarreExampleContract, changeThreshold: 0.4 },
      catalog,
      reader,
      store,
    });

    expect(changed.cacheHit).toBe(false);
    expect(changed.review?.threshold).toBe(0.4);
  });
});
