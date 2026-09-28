import { describe, expect, it } from "vitest";
import { DEMO_STREETS, rankStreets } from "./streets";

describe("Straßenvorschläge nach PLZ", () => {
  it("findet Straßen am Wortanfang zuerst", () => {
    expect(rankStreets(DEMO_STREETS["90402"], "kön")[0]).toBe("Königstraße");
    expect(rankStreets(DEMO_STREETS["90402"], "kön")).toContain("Königstorgraben");
  });
  it("versteht „str.“ und ß/ss", () => {
    expect(rankStreets(DEMO_STREETS["90402"], "Konigstrasse")).toEqual([]);
    expect(rankStreets(DEMO_STREETS["90402"], "Königstr.")).toEqual(["Königstraße"]);
    expect(rankStreets(DEMO_STREETS["90443"], "dietzstrasse")).toEqual(["Dietzstraße"]);
  });
  it("findet auch Teilwörter", () => {
    expect(rankStreets(DEMO_STREETS["90443"], "wagner")).toEqual(["Richard-Wagner-Platz"]);
  });
});
