import { site } from "@/config/site";
import { availabilityConfig } from "@/config/availability";
import { de } from "@/lib/i18n/de";
import { formatAddress } from "@/lib/address";
import type { Booking, Invoice } from "@/lib/types";
import { formatEuro } from "../billing";
import { A4, C, M, createDoc, drawMark, safe, text, wrap } from "./common";

const tz = availabilityConfig.timezone;

function fmtDate(key: string) {
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}

function fmtTimeRange(b: Booking) {
  const f = new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  const day = new Intl.DateTimeFormat("de-DE", { timeZone: tz, weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return `${day.format(new Date(b.start))}, ${f.format(new Date(b.start))} – ${f.format(new Date(b.end))} Uhr`;
}

export async function renderInvoicePdf(invoice: Invoice, booking: Booking): Promise<Uint8Array> {
  const { doc, fonts } = await createDoc(`Rechnung ${invoice.number}`);
  const { regular: R, semibold: S, bold: B } = fonts;
  const page = doc.addPage([A4.w, A4.h]);
  const right = A4.w - M;
  const width = right - M;

  // Kopf: dezente Akzentleiste + Marke
  page.drawRectangle({ x: 0, y: A4.h - 6, width: A4.w, height: 6, color: C.brand });
  let y = A4.h - 70;
  drawMark(page, M, y - 4, 30);
  text(page, B, site.brand, M + 42, y + 12, 15);
  text(page, R, `${site.brandTagline} · Persisch · Dari · Paschtu ↔ Deutsch`, M + 42, y - 2, 8.5, C.muted);
  text(page, B, "RECHNUNG", right, y + 12, 15, C.brand, "right");
  text(page, S, invoice.number, right, y - 2, 9.5, C.soft, "right");

  // Absenderzeile + Empfänger
  y -= 70;
  text(page, R, `${site.brand} · ${site.street} · ${site.postalCode} ${site.city}`, M, y, 7.5, C.muted);
  page.drawLine({ start: { x: M, y: y - 4 }, end: { x: M + 240, y: y - 4 }, thickness: 0.5, color: C.line });
  y -= 22;
  const a = invoice.recipient.address;
  const recipient = [invoice.recipient.organisation, invoice.recipient.name, `${a.street} ${a.houseNumber}`, `${a.postalCode} ${a.city}`].filter(
    Boolean,
  ) as string[];
  recipient.forEach((l, i) => text(page, i === 0 ? S : R, l, M, y - i * 14, 10.5));

  // Meta-Tabelle rechts
  const meta: [string, string][] = [
    ["Rechnungsnummer", invoice.number],
    ["Rechnungsdatum", fmtDate(invoice.issueDate)],
    ["Leistungsdatum", fmtDate(invoice.serviceDate)],
    ["Buchungsnummer", booking.reference],
    ["Zahlbar bis", fmtDate(invoice.dueDate)],
  ];
  const mx = right - 190;
  meta.forEach(([k, v], i) => {
    text(page, R, k, mx, y - i * 15, 8.5, C.muted);
    text(page, S, v, right, y - i * 15, 9, C.ink, "right");
  });

  // Anrede
  y -= 100;
  text(page, B, `Vielen Dank für Ihr Vertrauen, ${booking.contact.name}.`, M, y, 13);
  y -= 18;
  for (const l of wrap(R, "Wir freuen uns, Sie unterstützen zu dürfen. Nachfolgend finden Sie die Einzelheiten Ihres Termins sowie die Abrechnung unserer Leistung.", 9.5, width)) {
    text(page, R, l, M, y, 9.5, C.soft);
    y -= 14;
  }

  // Termindetails
  y -= 10;
  const details: [string, string][] = [
    ["Leistung", booking.service === "phone" ? "Telefonisches Dolmetschen" : "Persönliche Begleitung vor Ort"],
    ["Sprache", `${de.languages[booking.language]} ↔ Deutsch`],
    ["Termin", fmtTimeRange(booking)],
    ["Anlass", de.categories[booking.category]],
    ["Klient:in", booking.clientName],
  ];
  if (booking.onsite) {
    details.push(["Ort", [booking.onsite.institution, formatAddress(booking.onsite.address)].filter(Boolean).join(", ")]);
    if (booking.onsite.caseWorker) details.push(["Ansprechpartner:in", booking.onsite.caseWorker]);
  }
  const rowH = 15;
  const boxH = details.length * rowH + 22;
  page.drawRectangle({ x: M, y: y - boxH, width, height: boxH, borderColor: C.line, borderWidth: 0.8 });
  let dy = y - 18;
  for (const [k, v] of details) {
    text(page, R, k, M + 14, dy, 8.5, C.muted);
    text(page, S, safe(S, v).slice(0, 95), M + 130, dy, 9, C.ink);
    dy -= rowH;
  }
  y -= boxH + 34;

  // ---------- Abrechnung ----------
  text(page, B, "Abrechnung", M, y, 12, C.brand);
  y -= 16;
  const cols = { pos: M + 12, qty: right - 190, unit: right - 100, total: right - 12 };
  page.drawRectangle({ x: M, y: y - 8, width, height: 22, color: C.brandSoft });
  text(page, S, "Position", cols.pos, y, 8.5, C.soft);
  text(page, S, "Menge", cols.qty, y, 8.5, C.soft, "right");
  text(page, S, "Einzelpreis", cols.unit, y, 8.5, C.soft, "right");
  text(page, S, "Betrag", cols.total, y, 8.5, C.soft, "right");
  y -= 28;
  for (const line of invoice.lines) {
    text(page, S, line.description, cols.pos, y, 9.5);
    text(page, R, `${line.quantity} × ${line.unit}`, cols.qty, y, 9, C.soft, "right");
    text(page, R, formatEuro(line.unitPriceCents), cols.unit, y, 9, C.soft, "right");
    text(page, S, formatEuro(line.totalCents), cols.total, y, 9.5, C.ink, "right");
    if (line.detail) {
      y -= 12;
      text(page, R, line.detail, cols.pos, y, 8, C.muted);
    }
    y -= 12;
    page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.5, color: C.line });
    y -= 16;
  }

  const sx = right - 230;
  const sum = (label: string, value: string, bold = false) => {
    text(page, bold ? S : R, label, sx, y, 9.5, bold ? C.ink : C.soft);
    text(page, bold ? S : R, value, cols.total, y, 9.5, C.ink, "right");
    y -= 16;
  };
  sum("Zwischensumme (netto)", formatEuro(invoice.netCents));
  if (!invoice.smallBusiness) sum(`zzgl. ${Math.round(invoice.vatRate * 100)} % USt.`, formatEuro(invoice.vatCents));
  y -= 4;
  page.drawRectangle({ x: sx - 12, y: y - 10, width: right - sx + 12, height: 28, color: C.brand });
  text(page, B, "Gesamtbetrag", sx, y, 11, C.white);
  text(page, B, formatEuro(invoice.grossCents), cols.total, y, 12, C.white, "right");
  y -= 34;
  if (invoice.smallBusiness) {
    text(page, R, "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.", sx - 12, y, 8, C.muted);
    y -= 14;
  }

  // Zahlungsinformationen
  y -= 16;
  text(page, B, "Zahlung", M, y, 10.5);
  y -= 15;
  const payText = `Bitte überweisen Sie den Gesamtbetrag bis zum ${fmtDate(invoice.dueDate)} unter Angabe der Rechnungsnummer ${invoice.number} auf das folgende Konto:`;
  for (const l of wrap(R, payText, 9, width)) {
    text(page, R, l, M, y, 9, C.soft);
    y -= 13;
  }
  y -= 4;
  const bank: [string, string][] = [
    ["Kontoinhaber:in", site.bank.holder],
    ["IBAN", site.bank.iban],
    ["BIC", `${site.bank.bic} · ${site.bank.name}`],
    ["Verwendungszweck", invoice.number],
  ];
  for (const [k, v] of bank) {
    text(page, R, k, M, y, 8.5, C.muted);
    text(page, S, v, M + 110, y, 9);
    y -= 13;
  }
  if (invoice.payment.checkoutUrl) {
    y -= 4;
    text(page, S, `Online bezahlen: ${invoice.payment.checkoutUrl}`, M, y, 9, C.brand);
  }

  // Fußzeile
  const fy = 60;
  page.drawLine({ start: { x: M, y: fy + 34 }, end: { x: right, y: fy + 34 }, thickness: 0.5, color: C.line });
  const col = width / 3;
  const foot = [
    [site.brand, site.owner, `${site.street}, ${site.postalCode} ${site.city}`],
    [`Tel. ${site.phone}`, site.email, site.website],
    [`Steuernummer ${site.taxNumber}`, site.vatId ? `USt-IdNr. ${site.vatId}` : "", `IBAN ${site.bank.iban}`],
  ];
  foot.forEach((lines, i) =>
    lines.filter(Boolean).forEach((l, j) => text(page, R, l, M + i * col, fy + 20 - j * 11, 7.5, C.muted)),
  );
  text(page, R, "Es gelten unsere Allgemeinen Geschäftsbedingungen.", M, fy - 20, 7, C.muted);

  return doc.save();
}
