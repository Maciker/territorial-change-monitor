import { useEffect, useRef } from "react";
import { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { BoundingBox } from "../../../packages/domain/src/index.js";

interface Props {
  bbox: BoundingBox;
}

export function ChangeMap(props: Props) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const map = new Map({
      container: container.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [(props.bbox.west + props.bbox.east) / 2, (props.bbox.south + props.bbox.north) / 2],
      zoom: 12,
    });
    map.on("load", () => {
      map.addSource("aoi", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [props.bbox.west, props.bbox.south],
                [props.bbox.east, props.bbox.south],
                [props.bbox.east, props.bbox.north],
                [props.bbox.west, props.bbox.north],
                [props.bbox.west, props.bbox.south],
              ],
            ],
          },
        },
      });
      map.addLayer({ id: "aoi-fill", type: "fill", source: "aoi", paint: { "fill-color": "#d73027", "fill-opacity": 0.25 } });
      map.addLayer({ id: "aoi-line", type: "line", source: "aoi", paint: { "line-color": "#67001f", "line-width": 2 } });
    });
    return () => map.remove();
  }, [props.bbox]);

  return <div ref={container} style={{ minHeight: "240px" }} role="img" aria-label="Area of interest map" />;
}
