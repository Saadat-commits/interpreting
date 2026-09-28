import { de, type Dictionary } from "./de";
import { fa } from "./fa";
import type { Locale } from "../types";

export const locales: Locale[] = ["de", "fa"];
export const defaultLocale: Locale = "de";

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "de" || v === "fa";
}

export function getDictionary(locale: Locale): Dictionary {
  return locale === "fa" ? fa : de;
}

export function dirOf(locale: Locale) {
  return locale === "fa" ? "rtl" : "ltr";
}

/** Intl-Locale für Datums-/Zeitformatierung (Persisch mit persischen Ziffern, gregorianischer Kalender) */
export function intlLocale(locale: Locale) {
  return locale === "fa" ? "fa-IR-u-ca-gregory" : "de-DE";
}

export type { Dictionary };
