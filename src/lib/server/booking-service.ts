import { createHash, randomBytes } from "node:crypto";
import { availabilityConfig } from "@/config/availability";
import { formatAddress } from "@/lib/address";
import { isSlotAvailable, isValidDuration } from "@/lib/availability";
import type { BookingRequest } from "@/lib/booking-schema";
import type { Booking } from "@/lib/types";
import { buildInvoice } from "./billing";
import { blocksCalendar, bookingToBusy, getCalendar } from "./calendar";
import { notifyOwnerOfBooking, sendBookingConfirmation, sendVerificationEmail } from "./mail";
import { getPaymentProvider } from "./payments";
import { renderAgbPdf } from "./pdf/agb";
import { renderInvoicePdf } from "./pdf/invoice";
import { getStore } from "./store";

export type CreateBookingResult =
  | { ok: true; booking: Booking; token: string }
  | { ok: false; error: "invalid_duration" | "slot_taken" };

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const newToken = () => randomBytes(24).toString("base64url");
const holdUntil = () => new Date(Date.now() + availabilityConfig.confirmationHoldMinutes * 60000).toISOString();

export function verifyLink(baseUrl: string, locale: string, token: string) {
  return `${baseUrl.replace(/\/$/, "")}/${locale}/termin/bestaetigen?t=${encodeURIComponent(token)}`;
}

async function busyAround(start: Date, end: Date, excludeId?: string) {
  const from = new Date(start.getTime() - 24 * 3600000);
  const to = new Date(end.getTime() + 24 * 3600000);
  const busy = await getCalendar().getBusy(from, to);
  if (!excludeId) return busy;
  // Eigene (abgelaufene) Reservierung nicht gegen sich selbst prüfen
  const own = await getStore().getBooking(excludeId);
  if (!own) return busy;
  const ownBusy = bookingToBusy(own);
  return busy.filter((b) => !(b.start.getTime() === ownBusy.start.getTime() && b.end.getTime() === ownBusy.end.getTime()));
}

/**
 * Schritt 1: Termin reservieren und Bestätigungslink per E-Mail senden.
 * Der Termin ist für `confirmationHoldMinutes` blockiert, aber noch nicht verbindlich.
 */
export async function createBooking(req: BookingRequest, baseUrl: string): Promise<CreateBookingResult> {
  if (!isValidDuration(req.service, req.durationMinutes)) return { ok: false, error: "invalid_duration" };

  const start = new Date(req.start);
  const end = new Date(start.getTime() + req.durationMinutes * 60000);
  const calendar = getCalendar();
  const externalBusy = calendar.id === "local" ? [] : await calendar.getBusy(new Date(start.getTime() - 86400000), new Date(end.getTime() + 86400000));

  const store = getStore();
  const now = new Date().toISOString();
  const token = newToken();
  const billing = req.service === "onsite" && req.billingSameAsAppointment ? req.onsite!.address : req.billingAddress;

  const booking = await store.createBooking(
    (seq) => ({
      id: `bk_${crypto.randomUUID()}`,
      reference: `T-${start.getUTCFullYear()}-${String(seq).padStart(4, "0")}`,
      status: "pending",
      locale: req.locale,
      service: req.service,
      language: req.language,
      category: req.category,
      durationMinutes: req.durationMinutes,
      start: start.toISOString(),
      end: end.toISOString(),
      timezone: availabilityConfig.timezone,
      clientName: req.clientName,
      onsite: req.service === "onsite" ? req.onsite : undefined,
      phoneSession: req.service === "phone" ? req.phoneSession : undefined,
      contact: req.contact,
      billingSameAsAppointment: req.service === "onsite" && req.billingSameAsAppointment,
      billingAddress: billing,
      notes: req.notes || undefined,
      calendar: { provider: calendar.id, syncStatus: "not_synced" },
      payment: { provider: "invoice", status: "unpaid" },
      verification: { tokenHash: hashToken(token), expiresAt: holdUntil(), sentAt: now },
      acceptedTermsAt: now,
      createdAt: now,
      updatedAt: now,
    }),
    (existing) => {
      const busy = [...externalBusy, ...existing.filter((b) => blocksCalendar(b)).map(bookingToBusy)];
      return isSlotAvailable(req.service, req.durationMinutes, start.toISOString(), busy);
    },
  );

  if (!booking) return { ok: false, error: "slot_taken" };
  try {
    await sendVerificationEmail(booking, verifyLink(baseUrl, booking.locale, token));
  } catch (e) {
    console.error("[mail:verify]", e);
  }
  return { ok: true, booking, token };
}

export type VerifyResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: "invalid" | "slot_taken" };

/** Schritt 2: Klick auf den E-Mail-Link → Termin verbindlich buchen, Rechnung + Bestätigung senden. */
export async function verifyBooking(token: string): Promise<VerifyResult> {
  const hash = hashToken(token);
  const booking = await getStore().findBookingByTokenHash(hash);
  if (!booking || booking.status === "cancelled") return { ok: false, error: "invalid" };
  if (booking.status === "confirmed" || booking.status === "completed") return { ok: true, booking };

  // Haltefrist abgelaufen: nur bestätigen, wenn die Zeit noch frei ist
  if (new Date(booking.verification!.expiresAt) <= new Date()) {
    const busy = await busyAround(new Date(booking.start), new Date(booking.end), booking.id);
    if (!isSlotAvailable(booking.service, booking.durationMinutes, booking.start, busy)) {
      await getStore().updateBooking(booking.id, { status: "cancelled" });
      return { ok: false, error: "slot_taken" };
    }
  }
  const verified = await getStore().updateBooking(booking.id, {
    verification: { ...booking.verification!, verifiedAt: new Date().toISOString() },
  });
  return { ok: true, booking: await confirmBooking(verified ?? booking) };
}

/** Bestätigungslink erneut senden (neuer Link, neue Haltefrist, sofern der Termin noch frei ist). */
export async function resendVerification(bookingId: string, baseUrl: string) {
  const booking = await getStore().getBooking(bookingId);
  if (!booking || booking.status !== "pending") return false;
  const token = newToken();
  const updated = await getStore().updateBooking(booking.id, {
    verification: { tokenHash: hashToken(token), expiresAt: holdUntil(), sentAt: new Date().toISOString() },
  });
  await sendVerificationEmail(updated ?? booking, verifyLink(baseUrl, booking.locale, token));
  return true;
}

/**
 * Terminbestätigung: Rechnung erzeugen, Zahlung vorbereiten, Kalender eintragen
 * und Bestätigungsmail (mit Rechnung + AGB) versenden.
 */
export async function confirmBooking(booking: Booking): Promise<Booking> {
  const store = getStore();
  const invoiceDraft = await store.createInvoice((seq) => buildInvoice(booking, seq));
  const payment = await getPaymentProvider().prepare(booking, invoiceDraft);
  const invoice = { ...invoiceDraft, payment };
  const calendarLink = await getCalendar().createEvent(booking);

  const confirmed =
    (await store.updateBooking(booking.id, {
      status: "confirmed",
      invoiceId: invoice.id,
      payment,
      calendar: calendarLink,
    })) ?? booking;

  const [invoicePdf, agbPdf] = await Promise.all([renderInvoicePdf(invoice, confirmed), renderAgbPdf()]);
  const results = await Promise.allSettled([
    sendBookingConfirmation(confirmed, invoice, invoicePdf, agbPdf),
    notifyOwnerOfBooking(confirmed, invoice, invoicePdf),
  ]);
  for (const r of results) if (r.status === "rejected") console.error("[mail]", r.reason);
  return confirmed;
}

/** Öffentliche, preisfreie Sicht auf eine Buchung (für Bestätigungsseite) */
export function publicBooking(b: Booking) {
  return {
    reference: b.reference,
    start: b.start,
    end: b.end,
    email: b.contact.email,
    service: b.service,
    location: b.onsite ? [b.onsite.institution, formatAddress(b.onsite.address)].filter(Boolean).join(", ") : undefined,
  };
}
