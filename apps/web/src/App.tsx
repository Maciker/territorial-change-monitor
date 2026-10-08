import { useEffect, useState } from "react";
import { navarreExampleContract } from "../../../packages/domain/src/index.js";
import {
  viewFromRunArtifacts,
  type RunRecord,
  type RunView,
  type StoredDifferencePayload,
} from "../../../packages/application/src/index.js";
import { ChangeMap } from "./ChangeMap.js";
import { PixelGrid } from "./PixelGrid.js";
import { ReportPanel } from "./ReportPanel.js";

export function App() {
  const [view, setView] = useState<RunView>({ kind: "failed", message: "Loading run" });

  useEffect(() => {
    void loadRunArtifacts().then(setView);
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

async function loadRunArtifacts(): Promise<RunView> {
  try {
    const [runResponse, differenceResponse] = await Promise.all([
      fetch("/run.json"),
      fetch("/ndvi-difference.json"),
    ]);
    const record = runResponse.ok ? ((await runResponse.json()) as RunRecord) : undefined;
    const difference = differenceResponse.ok
      ? ((await differenceResponse.json()) as StoredDifferencePayload)
      : undefined;
    return viewFromRunArtifacts(record, difference, navarreExampleContract);
  } catch {
    return viewFromRunArtifacts(undefined, undefined, navarreExampleContract);
  }
}
