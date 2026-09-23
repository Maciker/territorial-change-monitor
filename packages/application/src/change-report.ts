import type { BoundingBox, RunContract } from "../../domain/src/index.js";

export type ReportInput = {
  contract: RunContract;
  beforeId: string;
  afterId: string;
  candidateCount: number;
  validCoverage: number;
  threshold: number;
};

export type RunView =
  | {
      kind: "ready";
      report: string;
      bbox: BoundingBox;
      beforeNdvi: number[];
      afterNdvi: number[];
      difference: number[];
      valid: number[];
      metadata: { beforeId: string; afterId: string; threshold: number; validCoverage: number };
    }
  | { kind: "failed"; message: string }
  | { kind: "insufficient"; message: string };

export function formatChangeReport(input: ReportInput): string {
  return [
    `Question: ${input.contract.question}`,
    "Method: Sentinel-2 L2A NDVI, after minus before, on the shared validity mask.",
    `Evidence: ${input.beforeId} compared with ${input.afterId}; ${input.candidateCount} candidate pixels at threshold ${input.threshold}; valid-pixel coverage ${input.validCoverage}.`,
    `Limitations: ${input.contract.limitations.join(" ")} Spectral change is not evidence of cause.`,
  ].join("\n");
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
    },
  };
}
