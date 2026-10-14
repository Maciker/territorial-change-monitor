import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { excludedSclClasses, navarreExampleContract } from "../packages/domain/src/index.js";
import { createRunView, formatChangeReport, viewFromFixture, type StoredRunFixture } from "../packages/application/src/index.js";

describe("The change report", () => {
  it("explains the question, method, evidence and limitations without causal claims", () => {
    const report = formatChangeReport({
      contract: navarreExampleContract,
      beforeId: "S2A_20240612_NAVARRE",
      afterId: "S2A_20250611_NAVARRE",
      candidateCount: 1,
      validCoverage: 0.5,
      threshold: 0.2,
      acquiredBefore: "2024-06-12T10:55:00Z",
      acquiredAfter: "2025-06-11T10:55:00Z",
    });

    expect(report).toContain(navarreExampleContract.question);
    expect(report).toContain("NDVI");
    expect(report).toContain("S2A_20240612_NAVARRE");
    expect(report).toContain("2024-06-12T10:55:00Z");
    expect(report).toContain("2025-06-11T10:55:00Z");
    expect(report).toContain("not evidence of cause");
    expect(report).not.toMatch(/caused|deforestation|illegal/i);
  });

  it("states that the threshold applies to gains and losses and splits the candidates", () => {
    const report = formatChangeReport({
      contract: navarreExampleContract,
      beforeId: "S2A_20240612_NAVARRE",
      afterId: "S2A_20250611_NAVARRE",
      candidateCount: 1,
      gainCount: 0,
      lossCount: 1,
      validCoverage: 0.5,
      threshold: 0.2,
      acquiredBefore: "2024-06-12T10:55:00Z",
      acquiredAfter: "2025-06-11T10:55:00Z",
    });

    expect(report).toContain("|after - before| >= 0.2");
    expect(report).toContain("gains and losses");
    expect(report).toContain("0 gain, 1 loss");
  });

  it("cites collection, processing level, licence, mask classes and source hashes", () => {
    const report = formatChangeReport({
      contract: navarreExampleContract,
      beforeId: "S2A_20240612_NAVARRE",
      afterId: "S2A_20250611_NAVARRE",
      candidateCount: 1,
      validCoverage: 0.5,
      threshold: 0.2,
      acquiredBefore: "2024-06-12T10:55:00Z",
      acquiredAfter: "2025-06-11T10:55:00Z",
      provenance: {
        collection: "sentinel-2-l2a",
        processingLevelBefore: "L2A",
        processingLevelAfter: "L2A",
        sourceHashes: { "before-red.tif": "a".repeat(64), "after-red.tif": "b".repeat(64) },
        softwareVersion: "9.9.9",
      },
    });

    expect(report).toContain("Collection: sentinel-2-l2a");
    expect(report).toContain("processing level L2A / L2A");
    expect(report).toContain(navarreExampleContract.sourceLicense);
    expect(report).toContain(`SCL classes ${excludedSclClasses.join(", ")}`);
    expect(report).toContain(`before-red.tif sha256:${"a".repeat(64)}`);
    expect(report).toContain("software 9.9.9");
  });

  it("states the causal limitation once", () => {
    const report = formatChangeReport({
      contract: navarreExampleContract,
      beforeId: "a",
      afterId: "b",
      candidateCount: 0,
      validCoverage: 1,
      threshold: 0.2,
      acquiredBefore: "2024-06-12T10:55:00Z",
      acquiredAfter: "2025-06-11T10:55:00Z",
    });

    expect(report.match(/not evidence of cause/g)).toHaveLength(1);
  });

  it("exposes failed and insufficient-data views", () => {
    expect(createRunView({ status: "failed", error: "disk budget" }).kind).toBe("failed");
    const fixture = JSON.parse(readFileSync("apps/web/public/run.fixture.json", "utf8")) as { validCoverage: number };
    expect(fixture.validCoverage).toBe(0.5);
    expect(
      createRunView({
        status: "complete",
        validCoverage: 0.05,
        contract: navarreExampleContract,
        beforeId: "a",
        afterId: "b",
        candidateCount: 0,
        threshold: 0.2,
        bbox: navarreExampleContract.aoi,
        beforeNdvi: [0],
        afterNdvi: [0],
        difference: [0],
        valid: [0],
        acquiredBefore: "2024-06-12T10:55:00Z",
        acquiredAfter: "2025-06-11T10:55:00Z",
      }).kind,
    ).toBe("insufficient");
  });

  it("shows fixture acquisition times on the ready view", () => {
    const fixture = JSON.parse(readFileSync("apps/web/public/run.fixture.json", "utf8")) as StoredRunFixture;

    const view = viewFromFixture(fixture, navarreExampleContract);

    expect(view.kind).toBe("ready");
    if (view.kind !== "ready") return;
    expect(view.report).toContain(fixture.acquiredBefore);
    expect(view.metadata.acquiredAfter).toBe(fixture.acquiredAfter);
  });
});
