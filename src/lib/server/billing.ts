import { pricing } from "@/config/pricing";
import { availabilityConfig } from "@/config/availability";
import { de } from "@/lib/i18n/de";
import { addDaysToKey, dateKeyOf } from "@/lib/time";
import type { Booking, Invoice, InvoiceLine } from "@/lib/types";

export function calculateLines(booking: Pick<Booking, "service" | "durationMinutes" | "language" | "category">): InvoiceLine[] {
  const p = pricing.services[booking.service];
  const billedMinutes = Math.max(booking.durationMinutes, p.minimumMinutes);
  const units = Math.ceil(billedMinutes / p.unitMinutes);
  const lines: InvoiceLine[] = [
    {
      description: p.label,
      detail: `${de.languages[booking.language]} ↔ Deutsch · ${de.categories[booking.category]} · ${billedMinutes} Min.`,
      quantity: units,
      unit: `je ${p.unitMinutes} Min.`,
      unitPriceCents: p.unitPriceCents,
      totalCents: units * p.unitPriceCents,
    },
  ];
  for (const fee of p.flatFees) {
    lines.push({ description: fee.label, quantity: 1, unit: "pauschal", unitPriceCents: fee.cents, totalCents: fee.cents });
  }
  return lines;
}

export function buildInvoice(booking: Booking, seq: number, now = new Date()): Invoice {
  const tz = availabilityConfig.timezone;
  const lines = calculateLines(booking);
  const netCents = lines.reduce((s, l) => s + l.totalCents, 0);
  const vatRate = pricing.smallBusiness ? 0 : pricing.vatRate;
  const vatCents = Math.round(netCents * vatRate);
  const issueDate = dateKeyOf(now, tz);
  const year = issueDate.slice(0, 4);
  return {
    id: `inv_${crypto.randomUUID()}`,
    number: `RE-${year}-${String(seq).padStart(4, "0")}`,
    bookingId: booking.id,
    issueDate,
    serviceDate: dateKeyOf(new Date(booking.start), tz),
    dueDate: addDaysToKey(issueDate, pricing.paymentTermDays),
    recipient: {
      name: booking.contact.name,
      organisation: booking.contact.organisation,
      address: booking.billingAddress,
      email: booking.contact.email,
    },
    lines,
    netCents,
    vatRate,
    vatCents,
    grossCents: netCents + vatCents,
    currency: "EUR",
    smallBusiness: pricing.smallBusiness,
    payment: { provider: "invoice", status: "unpaid", amountCents: netCents + vatCents, currency: "EUR" },
    createdAt: now.toISOString(),
  };
}

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
