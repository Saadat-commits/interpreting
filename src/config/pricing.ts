/**
 * PREISE – ausschließlich serverseitig verwendet (Rechnungs-PDF).
 * Diese Datei darf nie in Client-Komponenten importiert werden:
 * Auf der Website und in den Formularen werden keine Preise angezeigt.
 *
 * TODO: Beispielwerte – vor dem Livegang durch die echten Honorare ersetzen.
 */
import type { ServiceType } from "@/lib/types";

export const pricing = {
  currency: "EUR" as const,
  /** Kleinunternehmerregelung § 19 UStG → keine Umsatzsteuer ausweisen */
  smallBusiness: false,
  vatRate: 0.19,
  paymentTermDays: 14,
  services: {
    phone: {
      label: "Telefonisches Dolmetschen",
      /** Netto-Honorar je angefangene Abrechnungseinheit */
      unitMinutes: 15,
      unitPriceCents: 1500, // 15,00 € je 15 Min. (= 60 €/Std.)
      minimumMinutes: 30,
      flatFees: [] as { label: string; cents: number }[],
    },
    onsite: {
      label: "Dolmetschen mit persönlicher Begleitung vor Ort",
      unitMinutes: 30,
      unitPriceCents: 3750, // 37,50 € je 30 Min. (= 75 €/Std.)
      minimumMinutes: 60,
      flatFees: [{ label: "Anfahrtspauschale", cents: 2500 }],
    },
  } satisfies Record<
    ServiceType,
    { label: string; unitMinutes: number; unitPriceCents: number; minimumMinutes: number; flatFees: { label: string; cents: number }[] }
  >,
};
