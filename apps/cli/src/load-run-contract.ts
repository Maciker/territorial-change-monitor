import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { DomainError, createRunContract, type RunContract, type RunContractInput } from "../../../packages/domain/src/index.js";

type RunFile = Record<string, unknown>;

type GeoJsonPolygon = {
  features?: Array<{
    geometry?: { type?: string; coordinates?: number[][][] };
  }>;
};

export function loadRunContract(yamlPath: string, aoiPath: string): RunContract {
  const parsed: unknown = parse(readFileSync(yamlPath, "utf8"));
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw DomainError.createValidation("Run file must be a YAML mapping");
  }
  const file = parsed as RunFile;
  if (file.index !== "ndvi") {
    throw DomainError.createValidation("Only the NDVI index is supported");
  }
  const before = window(file.before, "before");
  const after = window(file.after, "after");
  const input: RunContractInput = {
    question: requiredText(file.question, "question"),
    aoi: boundingBoxFromGeoJson(aoiPath),
    before,
    after,
    successCondition: requiredText(file.success_condition, "success_condition"),
    limitations: textList(file.limitations, "limitations"),
    sourceLicense: requiredText(file.source_license, "source_license"),
    units: requiredText(file.units, "units"),
    maxCloudCoverPercent: optionalNumber(file.max_cloud_cover, "max_cloud_cover", 20),
    index: "ndvi",
    changeThreshold: optionalNumber(file.change_threshold, "change_threshold", 0.2),
    changeSign: changeSign(file.change_sign),
    minimumRegionPixels: optionalNumber(file.minimum_region_pixels, "minimum_region_pixels", 1),
  };
  return createRunContract(input);
}

function window(value: unknown, field: string): { start: string; end: string } {
  const entry = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  return {
    start: requiredText(entry.start, `${field}.start`),
    end: requiredText(entry.end, `${field}.end`),
  };
}

function changeSign(value: unknown): "afterMinusBefore" {
  if (value === undefined || value === "afterMinusBefore") return "afterMinusBefore";
  throw DomainError.createValidation("Unsupported change sign");
}

function requiredText(value: unknown, field: string): string {
  if (value === undefined || value === null || value === "") throw DomainError.createValidation(`Missing ${field}`);
  if (typeof value !== "string") throw DomainError.createValidation(`${field} must be text`);
  return value;
}

function optionalNumber(value: unknown, field: string, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number") throw DomainError.createValidation(`${field} must be a number`);
  return value;
}

function textList(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw DomainError.createValidation(`${field} must be a list of text`);
  }
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
