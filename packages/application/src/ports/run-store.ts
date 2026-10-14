import type { ChangeReview, RunContract } from "../../../domain/src/index.js";

export type RunStage = "validate" | "select" | "read" | "difference" | "review";

export type RunRecord = {
  status: "complete" | "incomplete" | "cancelled" | "failed";
  completedStages: RunStage[];
  cacheKey: string;
  cacheHit: boolean;
  /** The contract the run was executed with, so viewers never substitute another. */
  contract?: RunContract;
  error?: string;
  review?: ChangeReview;
  validCoverage?: number;
  coverageVerdict?: "sufficient" | "insufficient";
  beforeId?: string;
  afterId?: string;
  acquiredBefore?: string;
  acquiredAfter?: string;
  processingLevelBefore?: string;
  processingLevelAfter?: string;
  softwareVersion?: string;
  sourceHashes?: Record<string, string>;
};

export type RunStore = {
  cacheKey(parts: unknown): string;
  read(cacheKey: string): RunRecord | undefined;
  writeAtomic(record: RunRecord): void;
  writeIncomplete(record: RunRecord): void;
};
