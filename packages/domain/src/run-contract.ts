import { DomainError } from "./domain-error.js";

const supportedAoiCrs = "EPSG:4326";
const maxAoiAreaKm2 = 25;
const earthRadiusKm = 6371;

export type BoundingBox = {
  west: number;
  south: number;
  east: number;
  north: number;
  crs: string;
};

export type ObservationWindow = {
  start: string;
  end: string;
};

export type OutputManifestSchema = {
  fields: readonly string[];
};

export type RunContractInput = {
  question: string;
  aoi: BoundingBox;
  before: ObservationWindow;
  after: ObservationWindow;
  successCondition: string;
  limitations: readonly string[];
  sourceLicense: string;
  units: string;
  maxCloudCoverPercent: number;
  index: "ndvi";
  changeThreshold: number;
};

export type RunContract = RunContractInput & {
  outputManifest: OutputManifestSchema;
};

const navarreExampleInput: RunContractInput = {
  question: "Where did the land-surface spectral signal change between June 2024 and June 2025 in the example Navarre AOI?",
  aoi: { west: -1.76, south: 42.8, east: -1.75, north: 42.81, crs: supportedAoiCrs },
  before: { start: "2024-06-01", end: "2024-06-30" },
  after: { start: "2025-06-01", end: "2025-06-30" },
  successCondition: "Candidate change is flagged only on valid pixels using a predeclared NDVI difference threshold.",
  limitations: [
    "Spectral change is not evidence of cause.",
    "Seasonality and residual clouds can produce false positives.",
  ],
  sourceLicense: "Sentinel-2 Copernicus Open Access",
  units: "dimensionless NDVI difference",
  maxCloudCoverPercent: 20,
  index: "ndvi",
  changeThreshold: 0.2,
};

const outputManifest: OutputManifestSchema = {
  fields: ["question", "crs", "units", "sourceLicense", "before", "after", "limitations"],
};

export function createRunContract(input: RunContractInput): RunContract {
  if (input.aoi.west >= input.aoi.east || input.aoi.south >= input.aoi.north) {
    throw DomainError.createValidation("Area of interest is inverted");
  }
  if (input.aoi.crs !== supportedAoiCrs) {
    throw DomainError.createValidation(`Unsupported CRS: ${input.aoi.crs}`);
  }
  if (aoiAreaKm2(input.aoi) > maxAoiAreaKm2) {
    throw DomainError.createValidation("Area of interest is unbounded for this MVP");
  }
  const beforeStart = parseIsoDate(input.before.start);
  const beforeEnd = parseIsoDate(input.before.end);
  const afterStart = parseIsoDate(input.after.start);
  const afterEnd = parseIsoDate(input.after.end);
  if (beforeStart > beforeEnd || afterStart > afterEnd || beforeEnd >= afterStart) {
    throw DomainError.createValidation("Observation windows are inverted or overlapping backwards");
  }
  if (input.maxCloudCoverPercent < 0 || input.maxCloudCoverPercent > 100) {
    throw DomainError.createValidation("Cloud cover percent is outside 0-100");
  }
  return { ...input, outputManifest };
}

export const navarreExampleContract = createRunContract(navarreExampleInput);

function parseIsoDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw DomainError.createValidation(`Invalid observation date: ${value}`);
  }
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(timestamp)) {
    throw DomainError.createValidation(`Invalid observation date: ${value}`);
  }
  return timestamp;
}

export function aoiAreaKm2(aoi: BoundingBox): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const meanLatitude = (aoi.south + aoi.north) / 2;
  const widthKm = toRadians(aoi.east - aoi.west) * Math.cos(toRadians(meanLatitude)) * earthRadiusKm;
  const heightKm = toRadians(aoi.north - aoi.south) * earthRadiusKm;
  return Math.abs(widthKm * heightKm);
}
