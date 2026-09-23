import type { ChangeReview } from "../../../domain/src/index.js";

export type RunStage = "validate" | "select" | "read" | "difference" | "review";

export type RunRecord = {
  status: "complete" | "incomplete" | "cancelled" | "failed";
  completedStages: RunStage[];
  cacheKey: string;
  cacheHit: boolean;
  error?: string;
  review?: ChangeReview;
  validCoverage?: number;
  beforeId?: string;
  afterId?: string;
  acquiredBefore?: string;
  acquiredAfter?: string;
  sourceHashes?: Record<string, string>;
};

export type RunStore = {
  cacheKey(parts: unknown): string;
  read(cacheKey: string): RunRecord | undefined;
  writeAtomic(record: RunRecord): void;
  writeIncomplete(record: RunRecord): void;
};
