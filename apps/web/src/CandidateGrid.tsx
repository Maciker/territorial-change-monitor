interface Props {
  beforeNdvi: number[];
  afterNdvi: number[];
  difference: number[];
  valid: number[];
  candidateFlags: Uint8Array | number[];
}

export function CandidateGrid(props: Props) {
  return (
    <section className="candidate-grid" aria-labelledby="candidate-grid-heading">
      <h2 id="candidate-grid-heading">Per-cell candidate reading</h2>
      <div className="grid" role="list">
        {props.difference.map((_value, index) => (
          <div
            key={`candidate-cell-${index}`}
            className="cell candidate-cell"
            role="listitem"
            tabIndex={0}
          >
            {cellText(props, index)}
          </div>
        ))}
      </div>
    </section>
  );
}

function cellText(props: Props, index: number): string {
  const before = formatValue(props.beforeNdvi[index]);
  const after = formatValue(props.afterNdvi[index]);
  const difference = formatValue(props.difference[index]);
  const maskState = props.valid[index] === 1 ? "valid" : "mask";
  const candidateState = props.candidateFlags[index] === 1 ? "candidate" : "not-candidate";
  return `before ${before}, after ${after}, difference ${difference}, ${maskState}, ${candidateState}`;
}

function formatValue(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "NaN";
  return value.toFixed(2);
}
