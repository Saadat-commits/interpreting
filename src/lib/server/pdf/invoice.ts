import QRCode from "qrcode";
import { site } from "@/config/site";
import { availabilityConfig } from "@/config/availability";
import { de } from "@/lib/i18n/de";
import { formatAddress } from "@/lib/address";
import type { Booking, Invoice } from "@/lib/types";
import { formatEuro } from "../billing";
import { A4, C, createDoc, drawMark, drawQr, girih, roundRect, safe, text } from "./common";

const tz = availabilityConfig.timezone;
const M = 48;

function fmtDate(key: string) {
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}

function fmtDay(b: Booking) {
  return new Intl.DateTimeFormat("de-DE", { timeZone: tz, weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(b.start));
}

function fmtTime(b: Booking) {
  const f = new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  return `${f.format(new Date(b.start))} – ${f.format(new Date(b.end))} Uhr`;
}

/** EPC-QR-Code („GiroCode“): Banking-Apps übernehmen Empfänger, IBAN, Betrag und Verwendungszweck. */
function epcPayload(invoice: Invoice) {
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    site.bank.bic.replace(/\s/g, ""),
    site.bank.holder.slice(0, 70),
    site.bank.iban.replace(/\s/g, ""),
    `EUR${(invoice.grossCents / 100).toFixed(2)}`,
    "",
    "",
    `Rechnung ${invoice.number}`,
  ].join("\n");
}

export async function renderInvoicePdf(invoice: Invoice, booking: Booking): Promise<Uint8Array> {
  const { doc, fonts } = await createDoc(`Rechnung ${invoice.number}`);
  const { regular: R, semibold: S, bold: B } = fonts;
  const page = doc.addPage([A4.w, A4.h]);
  const right = A4.w - M;
  const width = right - M;
  const label = (str: string, x: number, y: number, align: "left" | "right" = "left") => text(page, S, str.toUpperCase(), x, y, 7, C.muted, align);

  /* ---------- Kopfbereich mit Girih-Muster ---------- */
  const bandH = 120;
  page.drawRectangle({ x: 0, y: A4.h - bandH, width: A4.w, height: bandH, color: C.brandSoft });
  girih(page, -10, A4.h - bandH + 6, A4.w + 20, bandH, 30, C.brand, 0.1);
  page.drawRectangle({ x: 0, y: A4.h - 5, width: A4.w, height: 5, color: C.brand });

  let y = A4.h - 62;
  roundRect(page, M - 6, y - 14, 250, 50, 12, { fill: C.white, opacity: 0.92 });
  drawMark(page, M + 4, y - 4, 30);
  text(page, B, site.brand, M + 44, y + 13, 15);
  text(page, R, "Dolmetschen & Begleitung · Persisch · Dari · Paschtu", M + 44, y - 1, 7.5, C.muted);

  roundRect(page, right - 176, y - 26, 182, 62, 12, { fill: C.white, opacity: 0.95 });
  label("Rechnung", right - 8, y + 18, "right");
  text(page, B, invoice.number, right - 8, y - 2, 17, C.brand, "right");
  text(page, R, `vom ${fmtDate(invoice.issueDate)}`, right - 8, y - 16, 8.5, C.soft, "right");

  /* ---------- Empfänger + Eckdaten ---------- */
  y = A4.h - bandH - 26;
  const colW = (width - 16) / 2;
  const cardH = 76;
  roundRect(page, M, y - cardH, colW, cardH, 12, { stroke: C.line });
  label("Rechnung an", M + 16, y - 20);
  const a = invoice.recipient.address;
  const recipient = [invoice.recipient.organisation, invoice.recipient.name, `${a.street} ${a.houseNumber}`, `${a.postalCode} ${a.city}`].filter(Boolean) as string[];
  recipient.slice(0, 4).forEach((l, i) => text(page, i === 0 ? S : R, l, M + 16, y - 34 - i * 12, 9.5));

  const mx = M + colW + 16;
  roundRect(page, mx, y - cardH, colW, cardH, 12, { stroke: C.line });
  const meta: [string, string][] = [
    ["Leistungsdatum", fmtDate(invoice.serviceDate)],
    ["Buchungsnummer", booking.reference],
    ["Zahlbar bis", fmtDate(invoice.dueDate)],
  ];
  meta.forEach(([k, v], i) => {
    const ry = y - 22 - i * 19;
    text(page, R, k, mx + 16, ry, 8.5, C.muted);
    text(page, S, v, mx + colW - 16, ry, 9.5, C.ink, "right");
    if (i < meta.length - 1) page.drawLine({ start: { x: mx + 16, y: ry - 9 }, end: { x: mx + colW - 16, y: ry - 9 }, thickness: 0.5, color: C.line });
  });

  /* ---------- Dank ---------- */
  y -= cardH + 30;
  text(page, B, `Vielen Dank für Ihr Vertrauen, ${booking.contact.name}.`, M, y, 13.5);
  y -= 15;
  text(page, R, "Es ist uns eine Freude, Sie zu begleiten. Hier finden Sie alle Einzelheiten auf einen Blick.", M, y, 9.5, C.soft);

  /* ---------- Termin ---------- */
  y -= 16;
  const details: [string, string][] = [
    ["Leistung", booking.service === "phone" ? "Telefonisches Dolmetschen" : "Persönliche Begleitung vor Ort"],
    ["Sprache", `${de.languages[booking.language]} – Deutsch`],
    ["Datum", fmtDay(booking)],
    ["Uhrzeit", fmtTime(booking)],
    ["Anlass", de.categories[booking.category]],
    ["Klient:in", booking.clientName],
  ];
  if (booking.onsite) {
    details.push(["Ort", [booking.onsite.institution, formatAddress(booking.onsite.address)].filter(Boolean).join(", ")]);
    if (booking.onsite.caseWorker) details.push(["Ansprechpartner:in", booking.onsite.caseWorker]);
  } else if (booking.phoneSession) details.push(["Rufnummer", booking.phoneSession.callNumber]);

  const short = details.filter(([k]) => k !== "Ort");
  const place = details.find(([k]) => k === "Ort");
  const rows = Math.ceil(short.length / 2) + (place ? 1 : 0);
  const detH = 36 + rows * 26;
  roundRect(page, M, y - detH, width, detH, 14, { fill: C.brandSoft });
  label("Ihr Termin", M + 18, y - 18);
  const half = (width - 36) / 2;
  const cell = (k: string, v: string, x: number, row: number, max: number) => {
    const ry = y - 44 - row * 26;
    text(page, R, k, x, ry + 9, 7.5, C.muted);
    text(page, S, safe(S, v).slice(0, max), x, ry - 3, 9.5, C.ink);
  };
  short.forEach(([k, v], i) => cell(k, v, M + 18 + (i % 2) * half, Math.floor(i / 2), 44));
  if (place) cell(place[0], place[1], M + 18, rows - 1, 95);
  y -= detH + 26;

  /* ---------- Abrechnung ---------- */
  text(page, B, "Abrechnung", M, y, 13, C.ink);
  page.drawLine({ start: { x: M, y: y - 7 }, end: { x: M + 28, y: y - 7 }, thickness: 2, color: C.brand });
  y -= 28;
  const cols = { pos: M + 14, qty: right - 196, unit: right - 106, total: right - 14 };
  roundRect(page, M, y - 8, width, 24, 8, { fill: C.brandSoft });
  text(page, S, "Position", cols.pos, y, 8, C.soft);
  text(page, S, "Menge", cols.qty, y, 8, C.soft, "right");
  text(page, S, "Einzelpreis", cols.unit, y, 8, C.soft, "right");
  text(page, S, "Betrag", cols.total, y, 8, C.soft, "right");
  y -= 24;
  for (const line of invoice.lines) {
    text(page, S, line.description, cols.pos, y, 9.5);
    text(page, R, `${line.quantity} × ${line.unit}`, cols.qty, y, 9, C.soft, "right");
    text(page, R, formatEuro(line.unitPriceCents), cols.unit, y, 9, C.soft, "right");
    text(page, S, formatEuro(line.totalCents), cols.total, y, 9.5, C.ink, "right");
    if (line.detail) {
      y -= 12;
      text(page, R, line.detail.replace("↔", "–"), cols.pos, y, 7.5, C.muted);
    }
    y -= 12;
    page.drawLine({ start: { x: M + 8, y }, end: { x: right - 8, y }, thickness: 0.5, color: C.line });
    y -= 15;
  }

  const sx = right - 236;
  const sum = (lbl: string, value: string) => {
    text(page, R, lbl, sx + 14, y, 9.5, C.soft);
    text(page, R, value, cols.total, y, 9.5, C.ink, "right");
    y -= 15;
  };
  sum("Zwischensumme (netto)", formatEuro(invoice.netCents));
  if (!invoice.smallBusiness) sum(`zzgl. ${Math.round(invoice.vatRate * 100)} % USt.`, formatEuro(invoice.vatCents));
  y -= 10;
  roundRect(page, sx, y - 12, right - sx, 32, 12, { fill: C.brand });
  text(page, B, "Gesamtbetrag", sx + 14, y, 11, C.white);
  text(page, B, formatEuro(invoice.grossCents), cols.total, y, 13, C.white, "right");
  y -= 26;
  if (invoice.smallBusiness) {
    text(page, R, "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.", sx, y, 7.5, C.muted);
    y -= 12;
  }

  /* ---------- Zahlung mit GiroCode ---------- */
  y -= 8;
  const payH = 100;
  roundRect(page, M, y - payH, width, payH, 14, { stroke: C.line });
  label("Zahlung", M + 18, y - 20);
  const payText = `Bitte überweisen Sie ${formatEuro(invoice.grossCents)} bis zum ${fmtDate(invoice.dueDate)}.`;
  text(page, S, payText, M + 18, y - 34, 9.5, C.ink);
  const bank: [string, string][] = [
    ["Empfänger", site.bank.holder],
    ["IBAN", site.bank.iban],
    ["BIC", `${site.bank.bic} · ${site.bank.name}`],
    ["Verwendungszweck", invoice.number],
  ];
  bank.forEach(([k, v], i) => {
    text(page, R, k, M + 18, y - 52 - i * 12, 8, C.muted);
    text(page, S, v, M + 110, y - 52 - i * 12, 8.5);
  });
  const qrSize = 70;
  const qx = right - qrSize - 18;
  const qy = y - payH + 15;
  try {
    const qr = QRCode.create(epcPayload(invoice), { errorCorrectionLevel: "M" });
    roundRect(page, qx - 6, qy - 6, qrSize + 12, qrSize + 12, 8, { fill: C.white, stroke: C.line });
    drawQr(page, qr.modules, qx, qy, qrSize);
    text(page, R, "Mit der Banking-App scannen", qx - 10, qy + qrSize / 2 + 4, 7.5, C.muted, "right");
    text(page, S, "GiroCode", qx - 10, qy + qrSize / 2 - 8, 8, C.brand, "right");
  } catch {
    /* ohne QR-Code weiter */
  }
  if (invoice.payment.checkoutUrl) text(page, S, `Online bezahlen: ${invoice.payment.checkoutUrl}`, M + 18, y - payH - 14, 8.5, C.brand);

  /* ---------- Fußzeile ---------- */
  const fy = 30;
  girih(page, -10, 0, A4.w + 20, 16, 22, C.brand, 0.08);
  page.drawLine({ start: { x: M, y: fy + 28 }, end: { x: right, y: fy + 28 }, thickness: 0.5, color: C.line });
  const col = width / 3;
  const foot = [
    [site.brand, site.owner, `${site.street}, ${site.postalCode} ${site.city}`],
    [`Tel. ${site.phone}`, site.email, site.website],
    [`Steuernummer ${site.taxNumber}`, site.vatId ? `USt-IdNr. ${site.vatId}` : "Es gelten unsere AGB.", `IBAN ${site.bank.iban}`],
  ];
  foot.forEach((lines, i) => lines.filter(Boolean).forEach((l, j) => text(page, R, l, M + i * col, fy + 16 - j * 10, 7, C.muted)));

  return doc.save();
}
