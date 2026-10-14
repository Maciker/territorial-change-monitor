import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const recordScript = resolve("tools/qa/record-qa-run.mjs");

function recordRun(reviewerModel: string, implementerModel: string) {
  const directory = mkdtempSync(join(tmpdir(), "qa-record-"));
  const context = join(directory, "qa-context.json");
  const output = join(directory, "qa-review.json");
  const manifest = join(directory, "qa-run.json");
  writeFileSync(context, JSON.stringify({ inputPath: "input.md", inputSha256: "a".repeat(64), headSha: "b".repeat(40) }));
  writeFileSync(output, JSON.stringify({ decision: "pass" }));
  execFileSync(
    process.execPath,
    [recordScript, "--context", context, "--output", output, "--manifest", manifest, "--reviewer-model", reviewerModel, "--implementer-model", implementerModel],
    { cwd: directory, stdio: "pipe" },
  );
  return JSON.parse(readFileSync(manifest, "utf8")) as Record<string, unknown>;
}

describe("The QA run record", () => {
  it("labels distinct model identities as declared by the operator, not verified", () => {
    const manifest = recordRun("reviewer-model", "implementer-model");

    expect(manifest.modelDistinct).toBe(true);
    expect(manifest.modelVerification).toBe("declared");
    expect(manifest.identitySource).toBe("operator-declared");
  });

  it("refuses equal identities", () => {
    expect(() => recordRun("same-model", "same-model")).toThrow();
  });
});
