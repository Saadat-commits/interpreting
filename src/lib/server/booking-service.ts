import { availabilityConfig } from "@/config/availability";
import { isSlotAvailable, isValidDuration } from "@/lib/availability";
import type { BookingRequest } from "@/lib/booking-schema";
import type { Booking } from "@/lib/types";
import { buildInvoice } from "./billing";
import { bookingToBusy, getCalendar } from "./calendar";
import { notifyOwnerOfBooking, sendBookingConfirmation } from "./mail";
import { getPaymentProvider } from "./payments";
import { renderAgbPdf } from "./pdf/agb";
import { renderInvoicePdf } from "./pdf/invoice";
import { getStore } from "./store";

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: "invalid_duration" | "slot_taken" };

export async function createBooking(req: BookingRequest): Promise<CreateBookingResult> {
  if (!isValidDuration(req.service, req.durationMinutes)) return { ok: false, error: "invalid_duration" };

  const start = new Date(req.start);
  const end = new Date(start.getTime() + req.durationMinutes * 60000);
  const calendar = getCalendar();
  const dayFrom = new Date(start.getTime() - 24 * 3600000);
  const dayTo = new Date(end.getTime() + 24 * 3600000);

  // Externe Belegung (z. B. Google) vorab laden; lokale Buchungen werden innerhalb der Sperre geprüft.
  const externalBusy = (await calendar.getBusy(dayFrom, dayTo)).filter(Boolean);

  const store = getStore();
  const now = new Date().toISOString();
  const billing = req.service === "onsite" && req.billingSameAsAppointment ? req.onsite!.address : req.billingAddress!;

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
      acceptedTermsAt: now,
      createdAt: now,
      updatedAt: now,
    }),
    (existing) => {
      const busy = [...externalBusy, ...existing.map(bookingToBusy)];
      return isSlotAvailable(req.service, req.durationMinutes, start.toISOString(), busy);
    },
  );

  if (!booking) return { ok: false, error: "slot_taken" };
  return { ok: true, booking: await confirmBooking(booking) };
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
