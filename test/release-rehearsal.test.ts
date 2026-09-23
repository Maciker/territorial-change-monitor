import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import { executeChangeRun, formatChangeReport, rasterLimits, stacSearchBounds } from "../packages/application/src/index.js";
import { FilesystemRunStore } from "../apps/cli/src/filesystem-run-store.js";
import { FixtureStacAdapter } from "../apps/cli/src/fixture-stac-adapter.js";
import { GeotiffRasterAdapter } from "../apps/cli/src/geotiff-raster-adapter.js";

describe("The fixture release rehearsal", () => {
  it("reproduces the Navarre example without paid services", async () => {
    const directory = mkdtempSync(join(tmpdir(), "rehearsal-"));
    const started = performance.now();
    const record = await executeChangeRun({
      contract: navarreExampleContract,
      catalog: FixtureStacAdapter.fromFile("test/fixtures/stac/navarre-items.json"),
      reader: new GeotiffRasterAdapter(),
      store: new FilesystemRunStore(directory),
      signal: AbortSignal.timeout(stacSearchBounds.timeoutMs * 4),
    });
    const report = formatChangeReport({
      contract: navarreExampleContract,
      beforeId: record.beforeId ?? "",
      afterId: record.afterId ?? "",
      candidateCount: record.review?.candidateCount ?? 0,
      validCoverage: record.validCoverage ?? 0,
      threshold: record.review?.threshold ?? 0,
      acquiredBefore: record.acquiredBefore ?? "",
      acquiredAfter: record.acquiredAfter ?? "",
    });
    writeFileSync(join(directory, "report.txt"), report);

    expect(record.status).toBe("complete");
    expect(record.review?.candidateCount).toBe(1);
    expect(report).toContain("not evidence of cause");
    expect(report).toContain(record.acquiredBefore ?? "missing-acquisition");
    expect(performance.now() - started).toBeLessThan(10_000);
    expect(process.memoryUsage().heapUsed).toBeLessThan(256 * 1024 * 1024);
    expect(rasterLimits.maxPixels).toBeLessThanOrEqual(10_000);
    expect(stacSearchBounds.retryCap).toBeGreaterThan(0);
  });
});
