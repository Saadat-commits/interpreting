import data from "@/data/plz.json";

/**
 * Deutsche Postleitzahlen → Orte (Quelle: OpenStreetMap-Mitwirkende, ODbL,
 * aufbereitet von suche-postleitzahl.org / npm „postleitzahlen“).
 */
let index: Map<string, string[]> | null = null;

function load() {
  if (!index) {
    const cities = (data as { c: string[]; p: string }).c;
    index = new Map(
      (data as { p: string }).p.split(";").map((row) => {
        const [plz, ids] = row.split(":");
        return [plz, ids.split(".").map((i) => cities[Number(i)])];
      }),
    );
  }
  return index;
}

/** Alle Orte zu einer PLZ (meist genau einer) */
export function citiesForPostalCode(plz: string): string[] {
  return /^\d{5}$/.test(plz) ? load().get(plz) ?? [] : [];
}

export function cityForPostalCode(plz: string): string | null {
  return citiesForPostalCode(plz)[0] ?? null;
}
