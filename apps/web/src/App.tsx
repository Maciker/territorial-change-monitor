import { useEffect, useState } from "react";
import { navarreExampleContract } from "../../../packages/domain/src/index.js";
import { viewFromFixture, type RunView, type StoredRunFixture } from "../../../packages/application/src/index.js";
import { ChangeMap } from "./ChangeMap.js";
import { PixelGrid } from "./PixelGrid.js";
import { ReportPanel } from "./ReportPanel.js";

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
  const fixture = (await response.json()) as StoredRunFixture;
  return viewFromFixture(fixture, navarreExampleContract);
}
