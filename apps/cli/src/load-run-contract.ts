import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { DomainError, createRunContract, type RunContract, type RunContractInput } from "../../../packages/domain/src/index.js";

type RunFile = {
  question?: string;
  before?: { start?: string; end?: string };
  after?: { start?: string; end?: string };
  max_cloud_cover?: number;
  index?: string;
  change_threshold?: number;
  success_condition?: string;
  limitations?: string[];
  source_license?: string;
  units?: string;
};

type GeoJsonPolygon = {
  features?: Array<{
    geometry?: { type?: string; coordinates?: number[][][] };
  }>;
};

export function loadRunContract(yamlPath: string, aoiPath: string): RunContract {
  const file = parse(readFileSync(yamlPath, "utf8")) as RunFile;
  if (file.index !== "ndvi") {
    throw DomainError.createValidation("Only the NDVI index is supported");
  }
  const input: RunContractInput = {
    question: requiredText(file.question, "question"),
    aoi: boundingBoxFromGeoJson(aoiPath),
    before: {
      start: requiredText(file.before?.start, "before.start"),
      end: requiredText(file.before?.end, "before.end"),
    },
    after: {
      start: requiredText(file.after?.start, "after.start"),
      end: requiredText(file.after?.end, "after.end"),
    },
    successCondition: requiredText(file.success_condition, "success_condition"),
    limitations: file.limitations ?? [],
    sourceLicense: requiredText(file.source_license, "source_license"),
    units: requiredText(file.units, "units"),
    maxCloudCoverPercent: file.max_cloud_cover ?? 20,
    index: "ndvi",
    changeThreshold: file.change_threshold ?? 0.2,
  };
  return createRunContract(input);
}

function requiredText(value: string | undefined, field: string): string {
  if (!value) throw DomainError.createValidation(`Missing ${field}`);
  return value;
}

function boundingBoxFromGeoJson(aoiPath: string): RunContractInput["aoi"] {
  const collection = JSON.parse(readFileSync(aoiPath, "utf8")) as GeoJsonPolygon;
  const ring = collection.features?.[0]?.geometry;
  if (ring?.type !== "Polygon" || !ring.coordinates?.[0]?.length) {
    throw DomainError.createValidation("AOI GeoJSON must contain a polygon");
  }
  const longitudes = ring.coordinates[0].map((position) => position[0]!);
  const latitudes = ring.coordinates[0].map((position) => position[1]!);
  return {
    west: Math.min(...longitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    north: Math.max(...latitudes),
    crs: "EPSG:4326",
  };
}
