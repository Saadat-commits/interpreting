/** Erzeugt Beispiel-PDFs (Rechnung + AGB) für die Vorschau – mit erfundenen Beispieldaten. */
import { writeFileSync } from "node:fs";
import { buildInvoice } from "@/lib/server/billing";
import { renderInvoicePdf } from "@/lib/server/pdf/invoice";
import { renderAgbPdf } from "@/lib/server/pdf/agb";
import { zonedToUtc } from "@/lib/time";
import type { Booking } from "@/lib/types";

const out = process.argv[2] ?? "preview/dist";
const start = zonedToUtc("2026-10-14", "10:00", "Europe/Berlin");
const now = new Date().toISOString();
const address = { label: "Dietzstraße 4, 90443 Nürnberg", street: "Dietzstraße", houseNumber: "4", postalCode: "90443", city: "Nürnberg", country: "DE", source: "mock" as const };
const booking: Booking = {
  id: "bk_demo",
  reference: "T-2026-0042",
  status: "confirmed",
  locale: "de",
  service: "onsite",
  language: "dari",
  category: "youth_office",
  durationMinutes: 60,
  start: start.toISOString(),
  end: new Date(start.getTime() + 3600000).toISOString(),
  timezone: "Europe/Berlin",
  clientName: "Beispiel Klientin",
  onsite: { address: { ...address, placeName: "Jugendamt Nürnberg" }, institution: "Jugendamt Nürnberg", caseWorker: "Frau Beispiel" },
  contact: { name: "Max Mustermann", email: "max@example.org", phone: "0911 000000" },
  billingSameAsAppointment: true,
  billingAddress: address,
  calendar: { provider: "local", syncStatus: "not_synced" },
  payment: { provider: "invoice", status: "unpaid" },
  acceptedTermsAt: now,
  createdAt: now,
  updatedAt: now,
};
const invoice = buildInvoice(booking, 42, new Date("2026-10-14T12:00:00Z"));
writeFileSync(`${out}/beispiel-rechnung.pdf`, await renderInvoicePdf(invoice, booking));
writeFileSync(`${out}/agb.pdf`, await renderAgbPdf());
console.log("PDFs geschrieben:", out);
