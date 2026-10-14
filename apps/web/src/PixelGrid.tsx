import { differenceColor, legendColors, ndviColor } from "./grid-colors.js";

interface Props {
  title: string;
  kind: "ndvi" | "difference";
  values: number[];
  valid: number[];
  width: number;
}

export function PixelGrid(props: Props) {
  const colorFor = props.kind === "ndvi" ? ndviColor : differenceColor;
  const maskedCount = props.valid.filter((flag) => flag !== 1).length;
  return (
    <section className="pixel-grid">
      <h2>{props.title}</h2>
      <div
        className="heatmap"
        role="img"
        aria-label={`${props.title}: ${props.values.length} pixels, ${maskedCount} masked.`}
        style={{ gridTemplateColumns: `repeat(${props.width}, 1fr)` }}
      >
        {props.values.map((value, index) => {
          const masked = props.valid[index] !== 1 || Number.isNaN(value);
          return (
            <span
              key={`${props.title}-${index}`}
              className={masked ? "heat-cell masked" : "heat-cell"}
              style={masked ? undefined : { background: colorFor(value) }}
              title={`${cellName(index, props.width)}: ${masked ? "masked" : value.toFixed(2)}`}
            />
          );
        })}
      </div>
      <Legend kind={props.kind} />
    </section>
  );
}

function Legend(props: { kind: Props["kind"] }) {
  return (
    <p className="legend">
      {props.kind === "ndvi" ? (
        <>
          <Swatch color={legendColors.ndviLow} label="low NDVI" />
          <Swatch color={legendColors.ndviHigh} label="high NDVI" />
        </>
      ) : (
        <>
          <Swatch color={legendColors.loss} label="loss" />
          <Swatch color={legendColors.neutral} label="0" />
          <Swatch color={legendColors.gain} label="gain" />
        </>
      )}
      <span className="legend-item">
        <span className="swatch masked" aria-hidden="true" />
        masked
      </span>
    </p>
  );
}

function Swatch(props: { color: string; label: string }) {
  return (
    <span className="legend-item">
      <span className="swatch" style={{ background: props.color }} aria-hidden="true" />
      {props.label}
    </span>
  );
}

export function cellName(index: number, width: number): string {
  return `row ${Math.floor(index / width) + 1}, column ${(index % width) + 1}`;
}
