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
