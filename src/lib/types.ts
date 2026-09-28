/**
 * Datenmodell der Plattform.
 *
 * Bewusst so geschnitten, dass die spätere Google-Kalender-Anbindung
 * (Booking.calendar) und die Zahlungsintegration Stripe/Revolut
 * (Booking.payment, Invoice.payment) ohne Migration ergänzt werden können.
 */

export type Locale = "de" | "fa";

export type ServiceType = "phone" | "onsite";

export type Language = "dari" | "farsi" | "pashto";

export type AppointmentCategory =
  | "medical"
  | "school"
  | "youth_office"
  | "authority"
  | "counseling"
  | "other";

export type AddressSource = "google" | "photon" | "manual" | "mock";

export interface PostalAddress {
  /** Einzeilige, formatierte Darstellung */
  label: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string; // ISO-3166-1 alpha-2, z. B. "DE"
  /** Name der Einrichtung, falls ein Ort (POI) gewählt wurde, z. B. „Jugendamt Nürnberg“ */
  placeName?: string;
  lat?: number;
  lon?: number;
  source: AddressSource;
  /** ID beim Anbieter (Google place_id / OSM-ID) */
  providerId?: string;
}

export interface ContactPerson {
  name: string;
  organisation?: string;
  email: string;
  phone: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

/* ---------- Vorbereitet: Kalender ---------- */

export type CalendarProviderId = "local" | "google";

export interface CalendarLink {
  provider: CalendarProviderId;
  /** Google: calendarId, in dem der Termin angelegt wurde */
  calendarId?: string;
  /** Google: eventId des angelegten Termins */
  externalEventId?: string;
  syncStatus: "not_synced" | "synced" | "failed";
  syncedAt?: string;
  lastError?: string;
}

/* ---------- Vorbereitet: Zahlung ---------- */

export type PaymentProviderId = "invoice" | "stripe" | "revolut";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "failed";

export interface PaymentInfo {
  /** „invoice“ = klassische Überweisung auf Rechnung (aktueller Stand) */
  provider: PaymentProviderId;
  status: PaymentStatus;
  /** Stripe: PaymentIntent/Checkout-Session-ID, Revolut: Order-ID */
  externalId?: string;
  /** Link zur Online-Zahlung (Checkout), sobald integriert */
  checkoutUrl?: string;
  paidAt?: string;
  amountCents?: number;
  currency?: "EUR";
}

export interface Booking {
  id: string;
  /** Menschlich lesbare Referenz, z. B. „T-2026-0007“ */
  reference: string;
  status: BookingStatus;
  locale: Locale;

  service: ServiceType;
  language: Language;
  category: AppointmentCategory;
  durationMinutes: number;
  /** ISO-8601 in UTC */
  start: string;
  end: string;
  timezone: string;

  /** Person, für die gedolmetscht wird */
  clientName: string;

  onsite?: {
    address: PostalAddress;
    institution?: string;
    caseWorker?: string;
  };
  phoneSession?: {
    /** Unter dieser Nummer wird zum Termin angerufen */
    callNumber: string;
  };

  contact: ContactPerson;
  billingSameAsAppointment: boolean;
  /** Bei telefonischen Terminen optional (Rechnung dann an Name + E-Mail) */
  billingAddress?: PostalAddress;
  notes?: string;

  invoiceId?: string;
  calendar: CalendarLink;
  payment: PaymentInfo;

  /** Double-Opt-in: Buchung wird erst nach Klick auf den E-Mail-Link verbindlich */
  verification?: {
    tokenHash: string;
    expiresAt: string;
    sentAt: string;
    verifiedAt?: string;
  };

  acceptedTermsAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  description: string;
  detail?: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  totalCents: number;
}

export interface Invoice {
  id: string;
  number: string;
  bookingId: string;
  issueDate: string; // YYYY-MM-DD
  serviceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  recipient: { name: string; organisation?: string; address?: PostalAddress; email: string };
  lines: InvoiceLine[];
  netCents: number;
  vatRate: number; // 0.19 oder 0 (Kleinunternehmer)
  vatCents: number;
  grossCents: number;
  currency: "EUR";
  smallBusiness: boolean;
  payment: PaymentInfo;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  name?: string;
  contact?: string;
  message: string;
  locale: Locale;
  page?: string;
  createdAt: string;
}

export interface TimeInterval {
  start: Date;
  end: Date;
}
