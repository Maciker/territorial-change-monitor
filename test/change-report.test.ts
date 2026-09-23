import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import { createRunView, formatChangeReport } from "../packages/application/src/index.js";

describe("The change report", () => {
  it("explains the question, method, evidence and limitations without causal claims", () => {
    const report = formatChangeReport({
      contract: navarreExampleContract,
      beforeId: "S2A_20240612_NAVARRE",
      afterId: "S2A_20250611_NAVARRE",
      candidateCount: 1,
      validCoverage: 0.5,
      threshold: 0.2,
    });

    expect(report).toContain(navarreExampleContract.question);
    expect(report).toContain("NDVI");
    expect(report).toContain("S2A_20240612_NAVARRE");
    expect(report).toContain("not evidence of cause");
    expect(report).not.toMatch(/caused|deforestation|illegal/i);
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
      }).kind,
    ).toBe("insufficient");
  });
});
