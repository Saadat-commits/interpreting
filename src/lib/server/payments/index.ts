import type { Booking, Invoice, PaymentInfo, PaymentProviderId } from "@/lib/types";

/**
 * Zahlungs-Schnittstelle.
 *
 * Heute: „invoice“ – Zahlung per Überweisung laut PDF-Rechnung.
 * Später: Stripe bzw. Revolut erzeugen einen Checkout-Link, der in der
 * Bestätigungsmail und auf der Rechnung erscheint; Webhooks setzen
 * PaymentInfo.status auf „paid“.
 */
export interface PaymentProvider {
  id: PaymentProviderId;
  /** Wird nach der Rechnungserstellung aufgerufen */
  prepare(booking: Booking, invoice: Invoice): Promise<PaymentInfo>;
}

class InvoicePayment implements PaymentProvider {
  id = "invoice" as const;
  async prepare(_booking: Booking, invoice: Invoice): Promise<PaymentInfo> {
    return { provider: "invoice", status: "unpaid", amountCents: invoice.grossCents, currency: "EUR" };
  }
}

/** Platzhalter für Stripe/Revolut – Aktivierung über PAYMENT_PROVIDER. */
class NotYetConnected implements PaymentProvider {
  constructor(public id: PaymentProviderId) {}
  async prepare(_booking: Booking, invoice: Invoice): Promise<PaymentInfo> {
    // Bis zur Anbindung wird auf Rechnung abgerechnet.
    return { provider: "invoice", status: "unpaid", amountCents: invoice.grossCents, currency: "EUR" };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const id = process.env.PAYMENT_PROVIDER as PaymentProviderId | undefined;
  if (id === "stripe" || id === "revolut") return new NotYetConnected(id);
  return new InvoicePayment();
}
