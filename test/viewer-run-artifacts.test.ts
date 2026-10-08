import { describe, expect, it } from "vitest";
import { navarreExampleContract } from "../packages/domain/src/index.js";
import {
  viewFromRunArtifacts,
  type RunRecord,
  type StoredDifferencePayload,
} from "../packages/application/src/index.js";

describe("The viewer run artifacts", () => {
  it("shows a ready review taking acquisition from the run record and NDVI mask from the difference", () => {
    const record = {
      ...completeRecord(),
      beforeId: "FROM-RECORD-BEFORE",
      afterId: "FROM-RECORD-AFTER",
      acquiredBefore: "2020-01-01T00:00:00Z",
      acquiredAfter: "2021-01-01T00:00:00Z",
      review: {
        ...completeRecord().review!,
        candidateCount: 2,
        threshold: 0.35,
      },
    };
    const difference = {
      ...differencePayload(),
      beforeNdvi: [0.9, null],
      afterNdvi: [0.1, 0.8],
      difference: [-0.8, null],
      valid: [1, 0],
      validCoverage: 0.75,
      provenance: {
        ...differencePayload().provenance,
        beforeId: "FROM-DIFF-BEFORE",
        afterId: "FROM-DIFF-AFTER",
        changeThreshold: 0.99,
      },
    };

    const view = viewFromRunArtifacts(record, difference, navarreExampleContract);

    expect(view.kind).toBe("ready");
    if (view.kind !== "ready") return;
    expect(view.beforeNdvi).toEqual([0.9, Number.NaN]);
    expect(view.afterNdvi).toEqual([0.1, 0.8]);
    expect(view.difference).toEqual([-0.8, Number.NaN]);
    expect(view.valid).toEqual([1, 0]);
    expect(view.bbox).toEqual(navarreExampleContract.aoi);
    expect(view.metadata.acquiredBefore).toBe("2020-01-01T00:00:00Z");
    expect(view.metadata.acquiredAfter).toBe("2021-01-01T00:00:00Z");
    expect(view.metadata.beforeId).toBe("FROM-RECORD-BEFORE");
    expect(view.metadata.afterId).toBe("FROM-RECORD-AFTER");
    expect(view.metadata.threshold).toBe(0.35);
    expect(view.metadata.validCoverage).toBe(0.75);
    expect(view.report).toContain("2 candidate");
    expect(view.report).not.toContain("FROM-DIFF-BEFORE");
  });

  it("surfaces incomplete and cancelled runs as failed instead of ready", () => {
    const incomplete = viewFromRunArtifacts(
      { ...completeRecord(), status: "incomplete" },
      differencePayload(),
      navarreExampleContract,
    );
    const cancelled = viewFromRunArtifacts(
      { ...completeRecord(), status: "cancelled" },
      differencePayload(),
      navarreExampleContract,
    );

    expect(incomplete.kind).toBe("failed");
    if (incomplete.kind === "failed") expect(incomplete.message).toMatch(/incomplete/i);
    expect(cancelled.kind).toBe("failed");
    if (cancelled.kind === "failed") expect(cancelled.message).toMatch(/incomplete/i);
  });

  it("surfaces a failed run with the recorded error", () => {
    const view = viewFromRunArtifacts(
      { ...completeRecord(), status: "failed", error: "disk budget exceeded" },
      differencePayload(),
      navarreExampleContract,
    );

    expect(view.kind).toBe("failed");
    if (view.kind === "failed") expect(view.message).toContain("disk budget exceeded");
  });

  it("treats missing run or difference artifacts as unfinished output", () => {
    const missingRun = viewFromRunArtifacts(undefined, differencePayload(), navarreExampleContract);
    const missingDifference = viewFromRunArtifacts(completeRecord(), undefined, navarreExampleContract);

    expect(missingRun.kind).toBe("failed");
    if (missingRun.kind === "failed") expect(missingRun.message).toMatch(/missing|incomplete/i);
    expect(missingDifference.kind).toBe("failed");
    if (missingDifference.kind === "failed") expect(missingDifference.message).toMatch(/missing|incomplete/i);
  });

  it("marks low valid coverage as insufficient for review", () => {
    const view = viewFromRunArtifacts(
      completeRecord(),
      { ...differencePayload(), validCoverage: 0.05 },
      navarreExampleContract,
    );

    expect(view.kind).toBe("insufficient");
    if (view.kind === "insufficient") {
      expect(view.message).toMatch(/insufficient valid pixels/i);
    }
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
