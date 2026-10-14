import { useEffect, useState } from "react";
import { navarreExampleContract } from "../../../packages/domain/src/index.js";
import {
  exploreCandidateScenario,
  viewFromRunArtifacts,
  type RunRecord,
  type RunView,
  type StoredDifferencePayload,
} from "../../../packages/application/src/index.js";
import { CandidateGrid } from "./CandidateGrid.js";
import { ChangeMap } from "./ChangeMap.js";
import { ExplorationPanel } from "./ExplorationPanel.js";
import { PixelGrid } from "./PixelGrid.js";
import { ReportPanel } from "./ReportPanel.js";
import { syntheticFixtureNote } from "./viewer-copy.js";

type ReadyView = Extract<RunView, { kind: "ready" }>;

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

  return <ReadyRunView view={view} />;
}

function ReadyRunView(props: { view: ReadyView }) {
  const [explorationThreshold, setExplorationThreshold] = useState(props.view.metadata.threshold);

  useEffect(() => {
    setExplorationThreshold(props.view.metadata.threshold);
  }, [props.view]);

  const side = squareGridSide(props.view.valid.length);
  const scenario = exploreCandidateScenario({
    difference: props.view.difference,
    valid: props.view.valid,
    width: side,
    height: side,
    bbox: props.view.bbox,
    explorationThreshold,
    sign: props.view.metadata.changeSign,
    minimumRegionPixels: props.view.metadata.minimumRegionPixels,
  });

  return (
    <main>
      <ReportPanel report={props.view.report} metadata={props.view.metadata} />
      <ExplorationPanel
        originalThreshold={props.view.metadata.threshold}
        explorationThreshold={explorationThreshold}
        candidateCount={scenario.candidateCount}
        candidateAreaKm2={scenario.candidateAreaKm2}
        onExplorationThresholdChange={setExplorationThreshold}
      />
      <CandidateGrid
        beforeNdvi={props.view.beforeNdvi}
        afterNdvi={props.view.afterNdvi}
        difference={props.view.difference}
        valid={props.view.valid}
        candidateFlags={scenario.candidateFlags}
      />
      <ChangeMap bbox={props.view.bbox} />
      <p className="fixture-note">{syntheticFixtureNote}</p>
      <PixelGrid title="Before NDVI" values={props.view.beforeNdvi} valid={props.view.valid} />
      <PixelGrid title="After NDVI" values={props.view.afterNdvi} valid={props.view.valid} />
      <PixelGrid title="Difference and validity mask" values={props.view.difference} valid={props.view.valid} />
    </main>
  );
}

function squareGridSide(length: number): number {
  const side = Math.sqrt(length);
  return Number.isInteger(side) ? side : 2;
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
