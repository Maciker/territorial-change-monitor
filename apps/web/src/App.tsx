import { useEffect, useState } from "react";
import { navarreExampleContract } from "../../../packages/domain/src/index.js";
import { createRunView, type RunView } from "../../../packages/application/src/index.js";
import { ChangeMap } from "./ChangeMap.js";
import { PixelGrid } from "./PixelGrid.js";
import { ReportPanel } from "./ReportPanel.js";

interface Fixture {
  status: "complete" | "failed";
  error?: string;
  question: string;
  limitations: string[];
  beforeId: string;
  afterId: string;
  candidateCount: number;
  validCoverage: number;
  threshold: number;
  bbox: { west: number; south: number; east: number; north: number; crs: string };
  beforeNdvi: Array<number | null>;
  afterNdvi: Array<number | null>;
  difference: Array<number | null>;
  valid: number[];
  acquiredBefore: string;
  acquiredAfter: string;
}

export function App() {
  const [view, setView] = useState<RunView>({ kind: "failed", message: "Loading run" });

  useEffect(() => {
    void loadFixture().then(setView);
  }, []);

  if (view.kind !== "ready") {
    return (
      <main>
        <section className="banner" role="alert" tabIndex={0}>
          {view.message}
        </section>
      </main>
    );
  }

  return (
    <main>
      <ReportPanel report={view.report} metadata={view.metadata} />
      <ChangeMap bbox={view.bbox} />
      <PixelGrid title="Before NDVI" values={view.beforeNdvi} valid={view.valid} />
      <PixelGrid title="After NDVI" values={view.afterNdvi} valid={view.valid} />
      <PixelGrid title="Difference and validity mask" values={view.difference} valid={view.valid} />
    </main>
  );
}

async function loadFixture(): Promise<RunView> {
  const response = await fetch("/run.fixture.json");
  const fixture = (await response.json()) as Fixture;
  if (fixture.status === "failed") return createRunView({ status: "failed", error: fixture.error });
  return createRunView({
    status: "complete",
    contract: {
      ...navarreExampleContract,
      question: fixture.question,
      limitations: fixture.limitations,
    },
    beforeId: fixture.beforeId,
    afterId: fixture.afterId,
    candidateCount: fixture.candidateCount,
    validCoverage: fixture.validCoverage,
    threshold: fixture.threshold,
    bbox: fixture.bbox,
    beforeNdvi: numbers(fixture.beforeNdvi),
    afterNdvi: numbers(fixture.afterNdvi),
    difference: numbers(fixture.difference),
    valid: fixture.valid,
  });
}

function numbers(values: Array<number | null>): number[] {
  return values.map((value) => value ?? Number.NaN);
}
