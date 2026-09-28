/** Postleitzahl → Ort für die Region Nürnberg/Fürth/Erlangen und große Städte (ergänzt fehlende Orte). */
const RANGES: [number, number, string][] = [
  [90402, 90491, "Nürnberg"],
  [90762, 90768, "Fürth"],
  [91052, 91058, "Erlangen"],
  [90513, 90513, "Zirndorf"],
  [90522, 90522, "Oberasbach"],
  [90537, 90537, "Feucht"],
  [90547, 90547, "Stein"],
  [90552, 90552, "Röthenbach an der Pegnitz"],
  [90556, 90556, "Cadolzburg"],
  [90571, 90571, "Schwaig bei Nürnberg"],
  [90574, 90574, "Roßtal"],
  [91126, 91126, "Schwabach"],
  [91207, 91207, "Lauf an der Pegnitz"],
  [91074, 91074, "Herzogenaurach"],
  [10115, 14199, "Berlin"],
  [20095, 22769, "Hamburg"],
  [80331, 81929, "München"],
  [50667, 51149, "Köln"],
  [60306, 60599, "Frankfurt am Main"],
  [70173, 70629, "Stuttgart"],
  [93047, 93059, "Regensburg"],
  [97070, 97084, "Würzburg"],
  [86150, 86199, "Augsburg"],
];

export function cityForPostalCode(plz: string): string | null {
  if (!/^\d{5}$/.test(plz)) return null;
  const n = Number(plz);
  return RANGES.find(([a, b]) => n >= a && n <= b)?.[2] ?? null;
}
