import { describe, expect, it } from "vitest";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import {
  viewFromRunArtifacts,
  type RunRecord,
  type StoredDifferencePayload,
} from "../packages/application/src/index.js";

describe("The viewer run artifacts", () => {
  it("maps a complete run and difference payload to a ready view with matching NDVI, mask, acquisition and status", () => {
    const record = completeRecord();
    const difference = differencePayload();

    const view = viewFromRunArtifacts(record, difference, navarreExampleContract);

    expect(view.kind).toBe("ready");
    if (view.kind !== "ready") return;
    expect(view.beforeNdvi).toEqual([0.5, Number.NaN]);
    expect(view.afterNdvi).toEqual([0, 0.5]);
    expect(view.difference).toEqual([-0.5, Number.NaN]);
    expect(view.valid).toEqual([1, 0]);
    expect(view.bbox).toEqual(navarreExampleContract.aoi);
    expect(view.metadata.acquiredBefore).toBe("2024-06-12T10:55:00Z");
    expect(view.metadata.acquiredAfter).toBe("2025-06-11T10:55:00Z");
    expect(view.metadata.beforeId).toBe("S2A_20240612_NAVARRE");
    expect(view.metadata.afterId).toBe("S2A_20250611_NAVARRE");
    expect(view.metadata.threshold).toBe(0.2);
    expect(view.metadata.validCoverage).toBe(0.5);
    expect(view.report).toContain("1 candidate");
  });
});

function completeRecord(): RunRecord {
  return {
    status: "complete",
    completedStages: ["validate", "select", "read", "difference", "review"],
    cacheKey: "test-key",
    cacheHit: false,
    beforeId: "S2A_20240612_NAVARRE",
    afterId: "S2A_20250611_NAVARRE",
    acquiredBefore: "2024-06-12T10:55:00Z",
    acquiredAfter: "2025-06-11T10:55:00Z",
    validCoverage: 0.5,
    review: {
      threshold: 0.2,
      sign: "afterMinusBefore",
      minimumRegionPixels: 1,
      candidateFlags: Uint8Array.from([1, 0]),
      candidateCount: 1,
      candidateAreaKm2: 0.01,
      limitations: ["Spectral change is not evidence of cause."],
    },
  };
}

function differencePayload(): StoredDifferencePayload {
  return {
    beforeNdvi: [0.5, null],
    afterNdvi: [0, 0.5],
    difference: [-0.5, null],
    valid: [1, 0],
    validCoverage: 0.5,
    provenance: {
      beforeId: "S2A_20240612_NAVARRE",
      afterId: "S2A_20250611_NAVARRE",
      beforeRedHash: "a",
      afterRedHash: "b",
      units: "NDVI difference",
      softwareVersion: "0.1.0",
      changeThreshold: 0.2,
    },
  };
}
