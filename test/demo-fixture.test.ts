import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { executeChangeRun } from "../packages/application/src/index.js";
import { FilesystemRunStore } from "../apps/cli/src/filesystem-run-store.js";
import { demoCatalog, loadExampleContract } from "../apps/cli/src/fixture-pipeline.js";
import { GeotiffRasterAdapter } from "../apps/cli/src/geotiff-raster-adapter.js";

const side = 20;
const cell = (row: number, column: number) => row * side + column;

describe("The synthetic 20x20 demo fixture", () => {
  it("flags the loss and gain patches, keeps the isolated pixel and masks cloud and NoData", async () => {
    const { record, difference } = await executeChangeRun({
      contract: loadExampleContract(),
      catalog: demoCatalog(),
      reader: new GeotiffRasterAdapter(),
      store: new FilesystemRunStore(mkdtempSync(join(tmpdir(), "demo-run-"))),
    });

    expect(record.status).toBe("complete");
    expect(difference?.width).toBe(side);
    expect(difference?.height).toBe(side);
    expect(record.review?.lossCount).toBe(31);
    expect(record.review?.gainCount).toBe(20);
    expect(record.validCoverage).toBeCloseTo(350 / 400);
    expect(record.coverageVerdict).toBe("sufficient");
    const flags = record.review!.candidateFlags;
    expect(flags[cell(4, 3)]).toBe(1);
    expect(flags[cell(14, 14)]).toBe(1);
    expect(flags[cell(18, 2)]).toBe(1);
    expect(flags[cell(4, 15)]).toBe(0);
    expect(difference?.valid[cell(4, 15)]).toBe(0);
    expect(difference?.valid[cell(10, 19)]).toBe(0);
    expect(flags[cell(10, 10)]).toBe(0);
  });
});
