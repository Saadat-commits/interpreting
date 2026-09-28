import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
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

function getTransport(): { t: Transporter; mode: "smtp" | "outbox" } {
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

async function send(to: string, subject: string, html: string, textBody: string, attachments: Attachment[] = [], replyTo?: string) {
  const { t, mode } = getTransport();
  const info = await t.sendMail({
    from: process.env.MAIL_FROM || `${site.brand} <${site.email}>`,
    to,
    replyTo,
    subject,
    html,
    text: textBody,
    attachments,
  });
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

function detailRows(b: Booking, locale: "de" | "fa") {
  const d = locale === "fa" ? fa : de;
  const rows: [string, string][] = [
    [d.booking.review.service, `${b.service === "phone" ? d.booking.service.phone.title : d.booking.service.onsite.title} · ${d.languages[b.language]}`],
    [d.booking.review.when, when(b, locale)],
  ];
  if (b.onsite) rows.push([d.booking.review.where, [b.onsite.institution, formatAddress(b.onsite.address)].filter(Boolean).join(", ")]);
  if (b.phoneSession) rows.push([d.booking.details.callNumber, b.phoneSession.callNumber]);
  rows.push([d.booking.review.client, b.clientName]);
  if (b.onsite?.caseWorker) rows.push([d.booking.details.caseWorker, b.onsite.caseWorker]);
  return rows;
}

function layout(inner: string, dir: "ltr" | "rtl" = "ltr") {
  const font = dir === "rtl" ? "Vazirmatn, Tahoma, Arial, sans-serif" : "Manrope, Segoe UI, Helvetica, Arial, sans-serif";
  return `<!doctype html><html dir="${dir}"><body style="margin:0;background:#F4F7F5;font-family:${font};color:#13201A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F5;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E4EAE6">
<tr><td style="height:6px;background:#1F7049"></td></tr>
<tr><td style="padding:28px 32px 8px"><div style="font-weight:700;font-size:17px">${esc(site.brand)}</div><div style="font-size:12px;color:#6B7A73">${esc(site.brandTagline)}</div></td></tr>
<tr><td style="padding:8px 32px 32px">${inner}</td></tr>
<tr><td style="padding:18px 32px;background:#FBFCFB;border-top:1px solid #E4EAE6;font-size:12px;color:#6B7A73">
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
  await send(b.contact.email, subject, layout(html), textBody);
}

export async function sendBookingConfirmation(b: Booking, invoice: Invoice, invoicePdf: Uint8Array, agbPdf: Uint8Array) {
  const first = b.contact.name.split(" ")[0];
  let html = `<h1 style="font-size:22px;margin:12px 0 8px">Vielen Dank, ${esc(first)}!</h1>
<p style="font-size:15px;line-height:1.6;color:#3B4A43;margin:0">Ihr Termin ist bestätigt. Wir freuen uns sehr, dass Sie uns Ihr Vertrauen schenken – und sorgen dafür, dass im Gespräch jedes Wort ankommt.</p>
${table(detailRows(b, "de"), "ltr")}
<p style="font-size:14px;line-height:1.6;color:#3B4A43">Ihre Rechnung <b>${esc(invoice.number)}</b> sowie unsere AGB finden Sie als PDF im Anhang. Buchungsnummer: <b>${esc(b.reference)}</b>.</p>
<p style="font-size:14px;line-height:1.6;color:#3B4A43">Sie möchten etwas ändern oder haben eine Frage? Antworten Sie einfach auf diese E-Mail oder rufen Sie uns an: <a href="${site.phoneHref}" style="color:#1F7049">${esc(site.phone)}</a>.</p>
<p style="font-size:14px;line-height:1.6;color:#3B4A43;margin-top:22px">Herzliche Grüße<br><b>${esc(site.owner)}</b><br>${esc(site.brand)}</p>`;
  let subject = `Terminbestätigung ${b.reference} – vielen Dank!`;

  if (b.locale === "fa") {
    const faBlock = `<div dir="rtl" style="text-align:right;border-top:1px solid #E4EAE6;margin-top:26px;padding-top:18px;font-family:Vazirmatn,Tahoma,sans-serif">
<h2 style="font-size:19px;margin:0 0 8px">از اعتماد شما صمیمانه سپاسگزاریم!</h2>
<p style="font-size:15px;line-height:1.9;color:#3B4A43;margin:0">قرار شما تأیید شد. خوشحالیم که در کنار شما هستیم و مطمئن می‌شویم که هر کلمه درست منتقل شود. صورت‌حساب و شرایط عمومی به‌صورت PDF پیوست شده است.</p>
${table(detailRows(b, "fa"), "rtl")}</div>`;
    html += faBlock;
    subject = `Terminbestätigung ${b.reference} · تأیید قرار`;
  }

  const textBody = [
    `Vielen Dank, ${first}!`,
    "",
    "Ihr Termin ist bestätigt.",
    ...detailRows(b, "de").map(([k, v]) => `${k}: ${v}`),
    "",
    `Rechnung ${invoice.number} und AGB im Anhang. Buchungsnummer: ${b.reference}`,
    "",
    `Herzliche Grüße, ${site.owner} – ${site.brand}`,
  ].join("\n");

  await send(b.contact.email, subject, layout(html), textBody, [
    { filename: `Rechnung-${invoice.number}.pdf`, content: Buffer.from(invoicePdf), contentType: "application/pdf" },
    { filename: "AGB.pdf", content: Buffer.from(agbPdf), contentType: "application/pdf" },
  ]);
}

export async function notifyOwnerOfBooking(b: Booking, invoice: Invoice, invoicePdf: Uint8Array) {
  const to = process.env.OWNER_EMAIL || site.email;
  const rows = [
    ...detailRows(b, "de"),
    ["Auftraggeber:in", [b.contact.name, b.contact.organisation].filter(Boolean).join(" · ")] as [string, string],
    ["Kontakt", `${b.contact.email} · ${b.contact.phone}`] as [string, string],
    ["Rechnung", invoice.number] as [string, string],
  ];
  if (b.notes) rows.push(["Hinweise", b.notes]);
  await send(
    to,
    `Neue Buchung ${b.reference}: ${when(b, "de")}`,
    layout(`<h1 style="font-size:20px">Neue Buchung ${esc(b.reference)}</h1>${table(rows, "ltr")}`),
    rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
    [{ filename: `Rechnung-${invoice.number}.pdf`, content: Buffer.from(invoicePdf), contentType: "application/pdf" }],
    b.contact.email,
  );
}

export async function notifyOwnerOfChat(m: ChatMessage) {
  const to = process.env.OWNER_EMAIL || site.email;
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
  );
}
