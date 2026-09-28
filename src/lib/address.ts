import type { AppointmentCategory, PostalAddress } from "./types";

export type AddressProblem = "street" | "houseNumber" | "postalCode" | "city" | "country";

/** Prüft eine ausgewählte bzw. manuell eingegebene Adresse auf Vollständigkeit. */
export function addressProblems(a: Partial<PostalAddress> | null | undefined): AddressProblem[] {
  if (!a) return ["street", "houseNumber", "postalCode", "city"];
  const problems: AddressProblem[] = [];
  if (!a.street || a.street.trim().length < 2) problems.push("street");
  if (!a.houseNumber || !/^\d+[\s\-/]*[a-zA-Z]?(\s*[-/]\s*\d+[a-zA-Z]?)?$/.test(a.houseNumber.trim())) problems.push("houseNumber");
  const country = (a.country || "DE").toUpperCase();
  if (country === "DE") {
    if (!a.postalCode || !/^\d{5}$/.test(a.postalCode.trim())) problems.push("postalCode");
  } else if (!a.postalCode || a.postalCode.trim().length < 3) problems.push("postalCode");
  if (!a.city || a.city.trim().length < 2) problems.push("city");
  return problems;
}

export function isValidAddress(a: Partial<PostalAddress> | null | undefined): a is PostalAddress {
  return addressProblems(a).length === 0;
}

export function formatAddress(a: Pick<PostalAddress, "street" | "houseNumber" | "postalCode" | "city">) {
  return `${a.street} ${a.houseNumber}, ${a.postalCode} ${a.city}`;
}

/** Leitet aus dem Namen einer Einrichtung die Terminart ab (z. B. „Jugendamt …“). */
export function detectCategory(text: string | undefined): AppointmentCategory | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/jugendamt|kinder- und jugend|jugendhilfe|asd\b|allgemeiner sozialdienst/.test(t)) return "youth_office";
  if (/schule|gymnasium|kita|kindergarten|kindertages|hort|realschule|mittelschule|grundschule/.test(t)) return "school";
  if (/klinik|krankenhaus|praxis|arzt|ärzt|zahnarzt|klinikum|medizin|therap|mvz|hospital|apotheke/.test(t)) return "medical";
  if (/beratung|caritas|diakonie|awo|frauenhaus|migrationsdienst|psychosozial/.test(t)) return "counseling";
  if (/amt|behörde|jobcenter|agentur für arbeit|rathaus|bürgeramt|ausländer|landratsamt|gericht|polizei|sozialamt|standesamt|finanzamt|bamf/.test(t)) return "authority";
  return null;
}

/** Korrigiert häufige Schreibweisen: „Luisenstraß“ / „Luisenstr.“ → „Luisenstraße“ */
export function normalizeStreet(s: string) {
  let t = s.trim().replace(/\s+/g, " ");
  t = t.replace(/(str|straß|strasse|straße|str\.)$/i, (m) => (m[0] === "S" ? "Straße" : "straße"));
  t = t.replace(/\b(str|straß|strasse|str\.)(?=\s|$)/gi, (m) => (m[0] === "S" ? "Straße" : "straße"));
  t = t.replace(/(\S)(Straße)$/, "$1straße");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function titleCase(s: string) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Erkennt frei getippte Adressen, z. B.
 *   „Luisenstraß 3 90762 Fürth“, „Hauptstr. 12a, 90402 Nürnberg“, „90402 Nürnberg, Königstraße 5“.
 * Gibt die erkannten Teile zurück (auch unvollständig), damit nichts erneut getippt werden muss.
 */
export function parseFreeAddress(input: string): Omit<PostalAddress, "label" | "source" | "country"> | null {
  const text = input.replace(/\s+/g, " ").trim();
  if (text.length < 4) return null;
  const plzMatch = text.match(/\b(\d{5})\b\s*([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß .()\-/]*?)?(?=,|$|\s\d)/);
  let rest = text;
  let postalCode = "";
  let city = "";
  if (plzMatch) {
    postalCode = plzMatch[1];
    city = (plzMatch[2] ?? "").replace(/[,\s]+$/, "").trim();
    rest = (text.slice(0, plzMatch.index) + " " + text.slice(plzMatch.index! + plzMatch[0].length)).replace(/,/g, " ").trim();
  } else {
    rest = text.replace(/,/g, " ");
  }
  const streetMatch = rest.match(/^(.*?[A-Za-zÄÖÜäöüß.])\s*(\d+\s*[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)\s*(.*)$/);
  let street = "";
  let houseNumber = "";
  if (streetMatch) {
    street = normalizeStreet(streetMatch[1]);
    houseNumber = streetMatch[2].replace(/\s+/g, "");
    if (!city && streetMatch[3]) city = streetMatch[3];
  } else if (rest) {
    street = normalizeStreet(rest);
  }
  if (!street && !postalCode) return null;
  return { street, houseNumber, postalCode, city: city ? titleCase(city) : "" };
}
