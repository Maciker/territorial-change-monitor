interface Props {
  originalThreshold: number;
  explorationThreshold: number;
  candidateCount: number;
  candidateAreaKm2: number;
  onExplorationThresholdChange: (value: number) => void;
}

export function ExplorationPanel(props: Props) {
  return (
    <section className="exploration" aria-labelledby="exploration-heading">
      <h2 id="exploration-heading">Threshold exploration</h2>
      <p className="exploration-label">
        Synthetic 2×2 fixture. Candidate results are not a cause claim.
      </p>
      <p>
        Original registered threshold: {props.originalThreshold}
      </p>
      <label htmlFor="exploration-threshold">Exploration threshold</label>
      <input
        id="exploration-threshold"
        type="number"
        min={0}
        max={1}
        step={0.05}
        value={props.explorationThreshold}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) {
            props.onExplorationThresholdChange(next);
          }
        }}
      />
      <p>
        Scenario candidates: {props.candidateCount}; area km²: {props.candidateAreaKm2.toFixed(4)}
      </p>
    </section>
  );
}
