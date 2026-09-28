/**
 * PREISE – ausschließlich serverseitig (Rechnungs-PDF). Nie in Client-Komponenten importieren.
 *
 * Regel (Vorgabe): Abgerechnet wird mindestens eine Stunde – auch bei 30 Minuten.
 * Jede weitere Minute über 60 Minuten kostet 1,50 €.
 *
 * TODO: Preis für die erste Stunde (vor Ort / telefonisch) und Anfahrt eintragen.
 */
import type { ServiceType } from "@/lib/types";

export const pricing = {
  currency: "EUR" as const,
  /** Kleinunternehmerregelung § 19 UStG → keine Umsatzsteuer ausweisen */
  smallBusiness: false,
  vatRate: 0.19,
  paymentTermDays: 14,
  includedMinutes: 60,
  perExtraMinuteCents: 150,
  services: {
    onsite: {
      label: "Dolmetschen mit persönlicher Begleitung vor Ort",
      firstHourCents: 7500, // TODO: Beispielwert
      flatFees: [{ label: "Anfahrtspauschale", cents: 2500 }], // TODO: Beispielwert
    },
    phone: {
      label: "Telefonisches Dolmetschen",
      firstHourCents: 6000, // TODO: Beispielwert
      flatFees: [] as { label: string; cents: number }[],
    },
  } satisfies Record<ServiceType, { label: string; firstHourCents: number; flatFees: { label: string; cents: number }[] }>,
};
