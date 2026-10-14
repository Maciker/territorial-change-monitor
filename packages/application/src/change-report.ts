import { excludedSclClasses, type BoundingBox, type ChangeSign, type RunContract } from "../../domain/src/index.js";
import type { DifferenceProvenance } from "./compute-ndvi-difference.js";
import type { RunRecord } from "./ports/run-store.js";
import { stacSearchBounds } from "./select-scenes.js";

export type ReportInput = {
  contract: RunContract;
  beforeId: string;
  afterId: string;
  candidateCount: number;
  gainCount?: number;
  lossCount?: number;
  validCoverage: number;
  threshold: number;
  acquiredBefore: string;
  acquiredAfter: string;
  provenance?: ReportProvenance;
};

export type ReportProvenance = {
  collection: string;
  processingLevelBefore: string;
  processingLevelAfter: string;
  sourceHashes: Record<string, string>;
  softwareVersion: string;
};

/** Report provenance from a run record, empty when the record predates provenance fields. */
export function reportProvenance(record: RunRecord): { provenance?: ReportProvenance } {
  if (!record.sourceHashes || !record.processingLevelBefore || !record.processingLevelAfter || !record.softwareVersion) {
    return {};
  }
  return {
    provenance: {
      collection: stacSearchBounds.collection,
      processingLevelBefore: record.processingLevelBefore,
      processingLevelAfter: record.processingLevelAfter,
      sourceHashes: record.sourceHashes,
      softwareVersion: record.softwareVersion,
    },
  };
}

const causalLimitation = "Spectral change is not evidence of cause.";

export type RunView =
  | {
      kind: "ready";
      report: string;
      bbox: BoundingBox;
      beforeNdvi: number[];
      afterNdvi: number[];
      difference: number[];
      valid: number[];
      metadata: {
        beforeId: string;
        afterId: string;
        threshold: number;
        validCoverage: number;
        acquiredBefore: string;
        acquiredAfter: string;
        minimumRegionPixels: number;
        changeSign: ChangeSign;
      };
    }
  | { kind: "failed"; message: string }
  | { kind: "insufficient"; message: string };

export function formatChangeReport(input: ReportInput): string {
  return [
    `Question: ${input.contract.question}`,
    `Method: Sentinel-2 L2A NDVI difference (after - before) on the shared validity mask; a pixel is a candidate when |after - before| >= ${input.threshold}, so gains and losses both count.`,
    `Evidence: ${input.beforeId} acquired ${input.acquiredBefore} compared with ${input.afterId} acquired ${input.acquiredAfter}; ${input.candidateCount} candidate pixels${directionText(input)} at threshold ${input.threshold}; valid-pixel coverage ${input.validCoverage}.`,
    ...provenanceLines(input),
    `Limitations: ${limitationsText(input.contract.limitations)}`,
  ].join("\n");
}

function provenanceLines(input: ReportInput): string[] {
  const provenance = input.provenance;
  const lines = [
    `Masking: NoData and Sentinel-2 SCL classes ${excludedSclClasses.join(", ")} are excluded; no resampling or reprojection is applied.`,
  ];
  if (!provenance) return lines;
  const hashes = Object.entries(provenance.sourceHashes)
    .map(([source, hash]) => `${source} sha256:${hash}`)
    .join("; ");
  return [
    `Collection: ${provenance.collection}; processing level ${provenance.processingLevelBefore} / ${provenance.processingLevelAfter}; license ${input.contract.sourceLicense}; software ${provenance.softwareVersion}.`,
    ...lines,
    `Sources: ${hashes}.`,
  ];
}

function limitationsText(limitations: readonly string[]): string {
  const all = limitations.includes(causalLimitation) ? limitations : [...limitations, causalLimitation];
  return all.join(" ");
}

function directionText(input: ReportInput): string {
  if (input.gainCount === undefined || input.lossCount === undefined) return "";
  return ` (${input.gainCount} gain, ${input.lossCount} loss)`;
}

export function createRunView(
  input:
    | { status: "failed"; error?: string }
    | (ReportInput & {
        status: "complete";
        bbox: BoundingBox;
        beforeNdvi: number[];
        afterNdvi: number[];
        difference: number[];
        valid: number[];
      }),
): RunView {
  if (input.status === "failed") {
    return { kind: "failed", message: input.error ?? "The run failed." };
  }
  if (input.validCoverage < 0.2) {
    return { kind: "insufficient", message: "Insufficient valid pixels to review candidate change." };
  }
  return {
    kind: "ready",
    report: formatChangeReport(input),
    bbox: input.bbox,
    beforeNdvi: input.beforeNdvi,
    afterNdvi: input.afterNdvi,
    difference: input.difference,
    valid: input.valid,
    metadata: {
      beforeId: input.beforeId,
      afterId: input.afterId,
      threshold: input.threshold,
      validCoverage: input.validCoverage,
      acquiredBefore: input.acquiredBefore,
      acquiredAfter: input.acquiredAfter,
      minimumRegionPixels: input.contract.minimumRegionPixels,
      changeSign: input.contract.changeSign,
    },
  };
}

export type StoredRunFixture = {
  status: "complete" | "failed";
  error?: string;
  question: string;
  limitations: readonly string[];
  beforeId: string;
  afterId: string;
  candidateCount: number;
  validCoverage: number;
  threshold: number;
  bbox: BoundingBox;
  beforeNdvi: Array<number | null>;
  afterNdvi: Array<number | null>;
  difference: Array<number | null>;
  valid: number[];
  acquiredBefore: string;
  acquiredAfter: string;
};

export function viewFromFixture(fixture: StoredRunFixture, contract: RunContract): RunView {
  if (fixture.status === "failed") {
    return fixture.error === undefined
      ? createRunView({ status: "failed" })
      : createRunView({ status: "failed", error: fixture.error });
  }
  return createRunView({
    status: "complete",
    contract: { ...contract, question: fixture.question, limitations: fixture.limitations },
    beforeId: fixture.beforeId,
    afterId: fixture.afterId,
    candidateCount: fixture.candidateCount,
    validCoverage: fixture.validCoverage,
    threshold: fixture.threshold,
    bbox: fixture.bbox,
    beforeNdvi: fixture.beforeNdvi.map((value) => value ?? Number.NaN),
    afterNdvi: fixture.afterNdvi.map((value) => value ?? Number.NaN),
    difference: fixture.difference.map((value) => value ?? Number.NaN),
    valid: fixture.valid,
    acquiredBefore: fixture.acquiredBefore,
    acquiredAfter: fixture.acquiredAfter,
  });
}

export type StoredDifferencePayload = {
  beforeNdvi: Array<number | null>;
  afterNdvi: Array<number | null>;
  difference: Array<number | null>;
  valid: number[];
  validCoverage: number;
  provenance: DifferenceProvenance;
};

export function viewFromRunArtifacts(
  record: RunRecord | undefined,
  difference: StoredDifferencePayload | undefined,
  contract: RunContract,
): RunView {
  if (record === undefined) {
    return createRunView({
      status: "failed",
      error: "Missing or incomplete run artifacts.",
    });
  }
  if (record.status === "incomplete" || record.status === "cancelled") {
    return createRunView({
      status: "failed",
      error: "The run is incomplete and cannot be shown as a finished result.",
    });
  }
  if (record.status === "failed") {
    return record.error === undefined
      ? createRunView({ status: "failed" })
      : createRunView({ status: "failed", error: record.error });
  }
  if (difference === undefined) {
    return createRunView({
      status: "failed",
      error: "Missing or incomplete run artifacts.",
    });
  }
  const effectiveContract = record.contract ?? contract;
  return createRunView({
    status: "complete",
    contract: effectiveContract,
    beforeId: record.beforeId ?? difference.provenance.beforeId,
    afterId: record.afterId ?? difference.provenance.afterId,
    candidateCount: record.review?.candidateCount ?? 0,
    ...(record.review ? { gainCount: record.review.gainCount, lossCount: record.review.lossCount } : {}),
    ...reportProvenance(record),
    validCoverage: difference.validCoverage,
    threshold: record.review?.threshold ?? difference.provenance.changeThreshold,
    bbox: effectiveContract.aoi,
    beforeNdvi: difference.beforeNdvi.map((value) => value ?? Number.NaN),
    afterNdvi: difference.afterNdvi.map((value) => value ?? Number.NaN),
    difference: difference.difference.map((value) => value ?? Number.NaN),
    valid: difference.valid,
    acquiredBefore: record.acquiredBefore ?? "",
    acquiredAfter: record.acquiredAfter ?? "",
  });
}
