import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DomainError } from "../../../packages/domain/src/index.js";
import type { RunRecord, RunStore } from "../../../packages/application/src/index.js";

const maxDirectoryBytes = 10_000_000;

export class FilesystemRunStore implements RunStore {
  constructor(private readonly directory: string) {
    mkdirSync(directory, { recursive: true });
  }

  cacheKey(parts: unknown): string {
    return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
  }

  read(cacheKey: string): RunRecord | undefined {
    try {
      const record = JSON.parse(readFileSync(join(this.directory, "run.json"), "utf8")) as RunRecord;
      if (record.cacheKey !== cacheKey || record.status !== "complete") return undefined;
      if (record.review) record.review = { ...record.review, candidateFlags: Uint8Array.from(record.review.candidateFlags) };
      return record;
    } catch {
      return undefined;
    }
  }

  writeAtomic(record: RunRecord): void {
    this.assertDiskBudget();
    const target = join(this.directory, "run.json");
    const temporary = `${target}.tmp`;
    writeFileSync(temporary, JSON.stringify(record, typedArraysAsLists, 2));
    renameSync(temporary, target);
  }

  writeIncomplete(record: RunRecord): void {
    this.writeAtomic({ ...record, status: record.status === "cancelled" ? "incomplete" : record.status });
  }

  private assertDiskBudget(): void {
    const used = readdirSync(this.directory).reduce((total, name) => total + statSync(join(this.directory, name)).size, 0);
    if (used > maxDirectoryBytes) {
      throw DomainError.createValidation("Run directory exceeds the disk budget");
    }
  }
}

function typedArraysAsLists(_key: string, value: unknown): unknown {
  return ArrayBuffer.isView(value) ? Array.from(value as Uint8Array) : value;
}
