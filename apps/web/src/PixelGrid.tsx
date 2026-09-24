interface Props {
  title: string;
  values: number[];
  valid: number[];
}

export function PixelGrid(props: Props) {
  return (
    <section>
      <h2>{props.title}</h2>
      <div className="grid" role="list">
        {props.values.map((value, index) => (
          <div
            key={`${props.title}-${index}`}
            className="cell"
            role="listitem"
            tabIndex={0}
            style={{ background: colorFor(value, props.valid[index] === 1) }}
          >
            {props.valid[index] === 1 && !Number.isNaN(value) ? value.toFixed(2) : "mask"}
          </div>
        ))}
      </div>
      <p className="legend">
        <span className="cell" style={{ background: "#2166ac" }}>
          loss
        </span>
        <span className="cell" style={{ background: "#f7f7f7", color: "#111" }}>
          0
        </span>
        <span className="cell" style={{ background: "#b2182b" }}>
          gain
        </span>
        <span className="cell" style={{ background: "#666" }}>
          mask
        </span>
      </p>
    </section>
  );
}

function colorFor(value: number, valid: boolean): string {
  if (!valid || Number.isNaN(value)) return "#666";
  if (value < 0) return "#2166ac";
  if (value > 0) return "#b2182b";
  return "#777";
}
