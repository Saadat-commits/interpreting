import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { delegatedUser, gmailSendRaw, googleConfigured } from "./google-auth";
import { site } from "@/config/site";
import { availabilityConfig } from "@/config/availability";
import { de } from "@/lib/i18n/de";
import { fa } from "@/lib/i18n/fa";
import { formatAddress } from "@/lib/address";
import type { Booking, ChatMessage, Invoice } from "@/lib/types";

interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

let transporter: Transporter | null = null;

function getTransport(): { t: Transporter; mode: "smtp" | "outbox" | "gmail" } {
  // Bevorzugt: Versand über Gmail-API mit dem Google-Dienstkonto (kein App-Passwort nötig)
  if (googleConfigured() && delegatedUser()) {
    transporter ??= nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "windows" });
    return { t: transporter, mode: "gmail" };
  }
  if (process.env.SMTP_HOST) {
    transporter ??= nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    return { t: transporter, mode: "smtp" };
  }
  // Ohne SMTP-Konfiguration: Mails werden als .eml im Datenordner abgelegt (Vorschau/Entwicklung)
  transporter ??= nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
  return { t: transporter, mode: "outbox" };
}

async function send(to: string, subject: string, html: string, textBody: string, attachments: Attachment[] = [], replyTo?: string, labels: string[] = []) {
  const { t, mode } = getTransport();
  const info = await t.sendMail({
    from: process.env.MAIL_FROM || `${site.brand} <${delegatedUser() ?? site.email}>`,
    to,
    replyTo,
    subject,
    html,
    text: textBody,
    attachments,
  });
  if (mode === "gmail") {
    await gmailSendRaw((info as unknown as { message: Buffer }).message, labels.map((l) => `Interpreting/${l}`));
    return;
  }
  if (mode === "outbox") {
    const dir = path.join(process.env.DATA_DIR || "./data", "outbox");
    await fs.mkdir(dir, { recursive: true });
    const name = `${new Date().toISOString().replace(/[:.]/g, "-")}-${to.replace(/[^a-z0-9@.]/gi, "_")}.eml`;
    await fs.writeFile(path.join(dir, name), (info as unknown as { message: Buffer }).message);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function when(b: Booking, locale: "de" | "fa") {
  const l = locale === "fa" ? "fa-IR-u-ca-gregory" : "de-DE";
  const tz = availabilityConfig.timezone;
  const day = new Intl.DateTimeFormat(l, { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(b.start));
  const t = new Intl.DateTimeFormat(l, { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  return `${day}, ${t.format(new Date(b.start))} – ${t.format(new Date(b.end))}${locale === "de" ? " Uhr" : ""}`;
}

/** Anzeigename der buchenden Person bzw. Einrichtung */
function bookerLine(b: Booking) {
  return b.bookerType === "organisation" && b.organisation
    ? `${b.organisation.name}${b.organisation.caseWorker ? ` · ${b.organisation.caseWorker}` : ""}`
    : b.contact.name;
}

function detailRows(b: Booking, locale: "de" | "fa") {
  const d = locale === "fa" ? fa : de;
  const instant = b.phoneSession?.mode === "instant";
  const rows: [string, string][] = [
    [d.booking.review.service, `${b.service === "phone" ? d.booking.service.phone.title : d.booking.service.onsite.title} · ${d.languages[b.language]}`],
    [d.booking.review.when, instant ? (locale === "fa" ? "همین حالا" : "Sofort – Sie rufen uns an") : when(b, locale)],
  ];
  if (b.onsite) rows.push([d.booking.review.where, [b.onsite.institution, formatAddress(b.onsite.address)].filter(Boolean).join(", ")]);
  if (b.bookerType === "organisation") {
    rows.push([locale === "fa" ? "سازمان" : "Einrichtung", bookerLine(b)]);
    rows.push([d.booking.review.client, b.clientName]);
  }
  return rows;
}

function layout(inner: string, dir: "ltr" | "rtl" = "ltr") {
  const font = dir === "rtl" ? "Vazirmatn, Tahoma, Arial, sans-serif" : "Manrope, Segoe UI, Helvetica, Arial, sans-serif";
  return `<!doctype html><html dir="${dir}"><body style="margin:0;background:#FFFFFF;font-family:${font};color:#13201A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E4EAE6">
<tr><td style="height:6px;background:#1F7049"></td></tr>
<tr><td style="padding:28px 32px 8px"><div style="font-weight:700;font-size:17px">${esc(site.brand)}</div><div style="font-size:12px;color:#6B7A73">${esc(site.brandTagline)}</div></td></tr>
<tr><td style="padding:8px 32px 32px">${inner}</td></tr>
<tr><td style="padding:18px 32px;background:#FFFFFF;border-top:1px solid #E4EAE6;font-size:12px;color:#6B7A73">
${esc(site.brand)} · ${esc(site.street)} · ${esc(site.postalCode)} ${esc(site.city)}<br>${esc(site.phone)} · ${esc(site.email)}</td></tr>
</table></td></tr></table></body></html>`;
}

function table(rows: [string, string][], dir: "ltr" | "rtl") {
  const align = dir === "rtl" ? "right" : "left";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4EAE6;border-radius:12px;margin:18px 0">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:10px 14px;font-size:12px;color:#6B7A73;text-align:${align};width:38%;border-bottom:1px solid #F0F3F1">${esc(k)}</td><td style="padding:10px 14px;font-size:14px;text-align:${align};border-bottom:1px solid #F0F3F1"><b>${esc(v)}</b></td></tr>`,
  )
  .join("")}</table>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 10px"><tr><td style="border-radius:999px;background:#1F7049">
<a href="${esc(href)}" style="display:inline-block;padding:15px 30px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;
}

/** Double-Opt-in: Bitte um Bestätigung der E-Mail-Adresse, erst danach ist der Termin verbindlich. */
export async function sendVerificationEmail(b: Booking, link: string) {
  const first = b.contact.name.split(" ")[0];
  const until = new Intl.DateTimeFormat("de-DE", { timeZone: availabilityConfig.timezone, hour: "2-digit", minute: "2-digit" }).format(
    new Date(b.verification!.expiresAt),
  );
  let html = `<h1 style="font-size:22px;margin:12px 0 8px">Bitte bestätigen Sie Ihren Termin, ${esc(first)}</h1>
<p style="font-size:15px;line-height:1.6;color:#3B4A43;margin:0">Nur noch ein Klick: Bestätigen Sie Ihre E-Mail-Adresse, damit wir Ihren Termin verbindlich eintragen können. Wir halten ihn bis <b>${until} Uhr</b> für Sie frei.</p>
${button(link, "Termin jetzt bestätigen")}
${table(detailRows(b, "de"), "ltr")}
<p style="font-size:13px;line-height:1.6;color:#6B7A73">Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br><a href="${esc(link)}" style="color:#1F7049;word-break:break-all">${esc(link)}</a></p>
<p style="font-size:13px;line-height:1.6;color:#6B7A73">Sie haben nichts gebucht? Dann ignorieren Sie diese E-Mail einfach – die Reservierung verfällt automatisch.</p>`;
  let subject = `Bitte bestätigen: Ihr Termin am ${new Intl.DateTimeFormat("de-DE", { timeZone: availabilityConfig.timezone, day: "2-digit", month: "2-digit" }).format(new Date(b.start))}`;
  if (b.locale === "fa") {
    html += `<div dir="rtl" style="text-align:right;border-top:1px solid #E4EAE6;margin-top:24px;padding-top:18px;font-family:Vazirmatn,Tahoma,sans-serif">
<h2 style="font-size:19px;margin:0 0 8px">لطفاً قرار خود را تأیید کنید</h2>
<p style="font-size:15px;line-height:1.9;color:#3B4A43;margin:0">فقط یک کلیک مانده است: با تأیید ایمیل، قرار شما قطعی ثبت می‌شود. این زمان تا ساعت ${until} برای شما نگه داشته می‌شود.</p>
${button(link, "تأیید قرار")}</div>`;
    subject += " · تأیید قرار";
  }
  const textBody = `Bitte bestätigen Sie Ihren Termin:\n${link}\n\n${detailRows(b, "de").map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nReserviert bis ${until} Uhr.`;
  await send(b.contact.email, subject, layout(html), textBody, [], undefined, ["Kunden-E-Mails"]);
}

function mapsLink(b: Booking) {
  return b.onsite ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(b.onsite.address))}` : null;
}

function icsFile(b: Booking) {
  const f = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const loc = b.onsite ? formatAddress(b.onsite.address).replace(/,/g, "\\,") : "Telefon";
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Interpreting NBG//Buchung//DE", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${b.reference}@interpreting-nbg.de`, `DTSTAMP:${f(new Date().toISOString())}`, `DTSTART:${f(b.start)}`, `DTEND:${f(b.end)}`,
    `SUMMARY:Dolmetschtermin (${site.brand})`, `LOCATION:${loc}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

function infoCard(icon: string, title: string, body: string) {
  return `<td valign="top" style="width:50%;padding:6px"><div style="border:1px solid #E4EAE6;border-radius:12px;padding:14px 16px">
<div style="font-size:18px">${icon}</div><div style="font-size:12px;color:#6B7A73;margin-top:4px">${esc(title)}</div><div style="font-size:14px;font-weight:700;margin-top:2px">${body}</div></div></td>`;
}

/** Zweite E-Mail nach der Bestätigung: Dank, alle Details, Links, Rechnung (PDF), AGB und Kalenderdatei */
export async function sendBookingConfirmation(b: Booking, invoice: Invoice | null, invoicePdf: Uint8Array | null, agbPdf: Uint8Array) {
  const first = b.contact.name.split(" ")[0];
  const instant = b.phoneSession?.mode === "instant";
  const maps = mapsLink(b);
  const intro = instant
    ? "Ihre Anfrage ist bestätigt. Rufen Sie uns jetzt einfach an – wir dolmetschen sofort. Abgerechnet wird nach Minuten; die Rechnung erhalten Sie nach dem Gespräch per E-Mail."
    : "Ihr Termin ist verbindlich gebucht. Wir freuen uns sehr, dass Sie uns Ihr Vertrauen schenken – und sorgen dafür, dass im Gespräch jedes Wort ankommt.";
  const cards = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px -6px"><tr>
${infoCard("📅", instant ? "Wann" : "Termin", esc(instant ? "Jetzt sofort" : when(b, "de")))}
${infoCard(b.onsite ? "📍" : "📞", b.onsite ? "Ort" : "Telefonisch", b.onsite ? `${esc([b.onsite.institution, formatAddress(b.onsite.address)].filter(Boolean).join(", "))}${maps ? `<br><a href="${maps}" style="color:#1F7049;font-weight:600">In Google Maps öffnen →</a>` : ""}` : `<a href="${site.phoneHref}" style="color:#1F7049">${esc(site.phone)}</a>`)}
</tr></table>`;
  let html = `<h1 style="font-size:24px;margin:12px 0 8px">Vielen Dank, ${esc(first)}! 🌿</h1>
<p style="font-size:15px;line-height:1.7;color:#3B4A43;margin:0">${intro}</p>
${cards}
${table(detailRows(b, "de"), "ltr")}
${instant ? button(site.phoneHref, `Jetzt anrufen: ${site.phone}`) : ""}
<p style="font-size:14px;line-height:1.7;color:#3B4A43">${invoice ? `Im Anhang: Ihre Rechnung <b>${esc(invoice.number)}</b> (PDF), unsere AGB und eine Kalenderdatei für Ihr Handy.` : "Im Anhang finden Sie unsere AGB."} Buchungsnummer: <b>${esc(b.reference)}</b>.</p>
<p style="font-size:14px;line-height:1.7;color:#3B4A43">Etwas ändern oder eine Frage? Antworten Sie einfach auf diese E-Mail oder rufen Sie an: <a href="${site.phoneHref}" style="color:#1F7049;font-weight:600">${esc(site.phone)}</a></p>
<p style="font-size:14px;line-height:1.7;color:#3B4A43;margin-top:22px">Herzliche Grüße<br><b>${esc(site.owner)}</b><br>${esc(site.brand)} · <a href="https://${site.website}" style="color:#1F7049">${esc(site.website)}</a></p>`;
  let subject = instant ? `Bestätigt – rufen Sie uns jetzt an (${b.reference})` : `Ihr Termin ist gebucht – vielen Dank! (${b.reference})`;
  if (b.locale === "fa") {
    html += `<div dir="rtl" style="text-align:right;border-top:1px solid #E4EAE6;margin-top:26px;padding-top:18px;font-family:Vazirmatn,Tahoma,sans-serif">
<h2 style="font-size:19px;margin:0 0 8px">از اعتماد شما صمیمانه سپاسگزاریم!</h2>
<p style="font-size:15px;line-height:1.9;color:#3B4A43;margin:0">${instant ? "درخواست شما تأیید شد. همین حالا با ما تماس بگیرید." : "قرار شما قطعی ثبت شد."} صورت‌حساب و شرایط عمومی پیوست شده است.</p>
${table(detailRows(b, "fa"), "rtl")}</div>`;
    subject += " · تأیید شد";
  }
  const textBody = [`Vielen Dank, ${first}!`, "", intro, ...detailRows(b, "de").map(([k, v]) => `${k}: ${v}`), maps ? `Google Maps: ${maps}` : "", "", `Buchungsnummer: ${b.reference}`, `Telefon: ${site.phone}`, "", `Herzliche Grüße, ${site.owner} – ${site.brand}`].join("\n");
  const attachments: Attachment[] = [];
  if (invoice && invoicePdf) attachments.push({ filename: `Rechnung-${invoice.number}.pdf`, content: Buffer.from(invoicePdf), contentType: "application/pdf" });
  attachments.push({ filename: "AGB.pdf", content: Buffer.from(agbPdf), contentType: "application/pdf" });
  if (!instant) attachments.push({ filename: "Termin.ics", content: Buffer.from(icsFile(b)), contentType: "text/calendar" });
  await send(b.contact.email, subject, layout(html), textBody, attachments, undefined, ["Kunden-E-Mails"]);
}

export async function notifyOwnerOfBooking(b: Booking, invoice: Invoice | null, invoicePdf: Uint8Array | null) {
  const to = process.env.OWNER_EMAIL || delegatedUser() || site.email;
  const rows = [
    ...detailRows(b, "de"),
    ["Gebucht von", bookerLine(b)] as [string, string],
    ["Kontakt", `${b.contact.name} · ${b.contact.email} · ${b.contact.phone}`] as [string, string],
    ["Rechnung an", [b.billingRecipient, b.billingAddress ? formatAddress(b.billingAddress) : ""].filter(Boolean).join(", ") || "—"] as [string, string],
    ["Rechnung", invoice ? invoice.number : "folgt nach dem Gespräch (Minuten)"] as [string, string],
  ];
  if (b.notes) rows.push(["Hinweise", b.notes]);
  await send(
    to,
    `✅ Neue Buchung ${b.reference}: ${b.phoneSession?.mode === "instant" ? "Sofort-Anruf" : when(b, "de")} – ${bookerLine(b)}`,
    layout(`<h1 style="font-size:20px">Neue Buchung ${esc(b.reference)}</h1>${table(rows, "ltr")}`),
    rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
    invoice && invoicePdf ? [{ filename: `Rechnung-${invoice.number}.pdf`, content: Buffer.from(invoicePdf), contentType: "application/pdf" }] : [],
    b.contact.email,
    invoice ? ["Buchungen", "Rechnungen"] : ["Buchungen"],
  );
}

export async function notifyOwnerOfChat(m: ChatMessage) {
  const to = process.env.OWNER_EMAIL || delegatedUser() || site.email;
  const rows: [string, string][] = [
    ["Name", m.name || "—"],
    ["Kontakt", m.contact || "—"],
    ["Sprache", m.locale === "fa" ? "Persisch" : "Deutsch"],
    ["Seite", m.page || "—"],
  ];
  const replyTo = m.contact && m.contact.includes("@") ? m.contact : undefined;
  await send(
    to,
    `Chat-Nachricht von ${m.name || "Besucher:in"}`,
    layout(`${table(rows, "ltr")}<p style="white-space:pre-wrap;font-size:15px;line-height:1.6">${esc(m.message)}</p>`),
    `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${m.message}`,
    [],
    replyTo,
    ["Anfragen"],
  );
}
