import { describe, expect, it } from "vitest";
import { aoiMapCaption, syntheticFixtureNote } from "../apps/web/src/viewer-copy.js";

describe("The viewer copy", () => {
  it("names the real grid size of the synthetic fixture", () => {
    expect(aoiMapCaption("EPSG:4326", 20, 20)).toContain("synthetic 20×20 fixture");
    expect(syntheticFixtureNote(20, 20)).toContain("synthetic 20×20 fixture");
    expect(syntheticFixtureNote(20, 20)).toContain("not Earth observation pixels");
  });
});
