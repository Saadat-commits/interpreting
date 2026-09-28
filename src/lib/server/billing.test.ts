import { describe, expect, it } from "vitest";
import { calculateLines } from "./billing";

describe("billing", () => {
  it("rechnet Mindestdauer und Anfahrt ab", () => {
    const lines = calculateLines({ service: "onsite", durationMinutes: 60, language: "dari", category: "youth_office" });
    expect(lines).toHaveLength(2);
    expect(lines[0].quantity).toBe(2);
  });
  it("telefonisch: angefangene Einheiten", () => {
    const [l] = calculateLines({ service: "phone", durationMinutes: 30, language: "farsi", category: "medical" });
    expect(l.quantity).toBe(2);
  });
});
