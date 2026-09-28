import { describe, expect, it } from "vitest";
import { computeMonth, isSlotAvailable } from "./availability";
import { zonedToUtc } from "./time";
import { holidaysFor } from "./holidays";

// Montag, 5. Oktober 2026, 08:00 Berlin
const now = zonedToUtc("2026-10-05", "08:00", "Europe/Berlin");

describe("computeMonth", () => {
  it("vor Ort: Wochenenden und Feiertage geschlossen", () => {
    const days = computeMonth({ service: "onsite", durationMinutes: 60, year: 2026, month: 10, busy: [], now });
    expect(days.find((d) => d.date === "2026-10-10")?.state).toBe("closed"); // Samstag
    expect(days.find((d) => d.date === "2026-10-03")?.state).toBe("closed"); // Feiertag + Vergangenheit
    expect(days.find((d) => d.date === "2026-10-06")?.state).toBe("available");
  });

  it("Telefon: rund um die Uhr, auch am Wochenende und nachts", () => {
    const days = computeMonth({ service: "phone", durationMinutes: 60, year: 2026, month: 10, busy: [], now });
    const sat = days.find((d) => d.date === "2026-10-10")!;
    expect(sat.state).toBe("available");
    expect(sat.slots.some((s) => s.time === "02:00")).toBe(true);
    expect(sat.slots.at(-1)?.time).toBe("23:00");
  });

  it("beachtet Mindestvorlauf", () => {
    const days = computeMonth({ service: "onsite", durationMinutes: 60, year: 2026, month: 10, busy: [], now });
    const today = days.find((d) => d.date === "2026-10-05")!;
    expect(today.state).toBe("closed");
  });

  it("blockiert belegte Zeiten inkl. Puffer", () => {
    const start = zonedToUtc("2026-10-07", "10:00", "Europe/Berlin");
    const busy = [{ start, end: new Date(start.getTime() + 3600000) }];
    const day = computeMonth({ service: "phone", durationMinutes: 60, year: 2026, month: 10, busy, now }).find((d) => d.date === "2026-10-07")!;
    const slot = (t: string) => day.slots.find((s) => s.time === t)!;
    expect(slot("10:00").available).toBe(false);
    expect(slot("09:00").available).toBe(false); // Puffer 15 Min.
    expect(slot("08:30").available).toBe(true);
    expect(slot("11:30").available).toBe(true);
  });

  it("isSlotAvailable lehnt Zeiten außerhalb des Rasters ab", () => {
    const ok = zonedToUtc("2026-10-07", "09:00", "Europe/Berlin").toISOString();
    const odd = zonedToUtc("2026-10-07", "09:10", "Europe/Berlin").toISOString();
    expect(isSlotAvailable("phone", 60, ok, [], now)).toBe(true);
    expect(isSlotAvailable("phone", 60, odd, [], now)).toBe(false);
  });

  it("rechnet Sommer-/Winterzeit korrekt um", () => {
    expect(zonedToUtc("2026-07-01", "10:00", "Europe/Berlin").toISOString()).toBe("2026-07-01T08:00:00.000Z");
    expect(zonedToUtc("2026-12-01", "10:00", "Europe/Berlin").toISOString()).toBe("2026-12-01T09:00:00.000Z");
  });
});

describe("holidays", () => {
  it("kennt bewegliche Feiertage", () => {
    const h = holidaysFor(2026, "BY");
    expect(h.has("2026-04-03")).toBe(true); // Karfreitag
    expect(h.has("2026-06-04")).toBe(true); // Fronleichnam
  });
});
