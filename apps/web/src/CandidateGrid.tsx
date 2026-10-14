import { differenceColor } from "./grid-colors.js";
import { cellName } from "./PixelGrid.js";

interface Props {
  difference: number[];
  valid: number[];
  candidateFlags: Uint8Array | number[];
  width: number;
}

export function CandidateGrid(props: Props) {
  const candidates = props.difference
    .map((value, index) => ({ value, index }))
    .filter(({ index }) => props.candidateFlags[index] === 1);
  return (
    <section className="candidate-grid" aria-labelledby="candidate-grid-heading">
      <h2 id="candidate-grid-heading">Candidate pixels at the exploration threshold</h2>
      <div
        className="heatmap"
        role="img"
        aria-label={`${candidates.length} candidate pixels outlined over the NDVI difference.`}
        style={{ gridTemplateColumns: `repeat(${props.width}, 1fr)` }}
      >
        {props.difference.map((value, index) => {
          const masked = props.valid[index] !== 1 || Number.isNaN(value);
          const candidate = props.candidateFlags[index] === 1;
          const className = ["heat-cell", masked ? "masked" : "", candidate ? "candidate" : ""].join(" ").trim();
          const state = masked ? "masked" : `difference ${value.toFixed(2)}${candidate ? ", candidate" : ""}`;
          return (
            <span
              key={`candidate-cell-${index}`}
              className={className}
              style={masked ? undefined : { background: differenceColor(value) }}
              title={`${cellName(index, props.width)}: ${state}`}
            />
          );
        })}
      </div>
      <p className="legend">
        <span className="legend-item">
          <span className="swatch candidate" aria-hidden="true" />
          candidate (outlined)
        </span>
      </p>
      <details>
        <summary>Candidate table ({candidates.length})</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Pixel</th>
              <th scope="col">after − before</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map(({ value, index }) => (
              <tr key={`candidate-row-${index}`}>
                <td>{cellName(index, props.width)}</td>
                <td>{value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
