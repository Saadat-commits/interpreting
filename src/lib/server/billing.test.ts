import { describe, expect, it } from "vitest";
import { calculateLines } from "./billing";
import { pricing } from "@/config/pricing";

const base = { language: "dari" as const, category: "youth_office" as const };

describe("Abrechnung: mindestens 1 Stunde, danach 1,50 € je Minute", () => {
  it("30 Minuten → volle Stunde", () => {
    const lines = calculateLines({ ...base, service: "phone", durationMinutes: 30 });
    expect(lines).toHaveLength(1);
    expect(lines[0].totalCents).toBe(pricing.services.phone.firstHourCents);
  });
  it("2 Stunden → Stunde + 60 × 1,50 €", () => {
    const lines = calculateLines({ ...base, service: "phone", durationMinutes: 120 });
    expect(lines[1]).toMatchObject({ quantity: 60, unitPriceCents: 150, totalCents: 9000 });
  });
  it("vor Ort mit Anfahrtspauschale", () => {
    const lines = calculateLines({ ...base, service: "onsite", durationMinutes: 90 });
    expect(lines.map((l) => l.totalCents)).toEqual([pricing.services.onsite.firstHourCents, 4500, 2500]);
  });
});
