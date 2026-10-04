import type { Booking, ChatMessage, Invoice, ServiceRequest } from "@/lib/types";
import { JsonFileStore } from "./json-file-store";
import { PostgresStore } from "./postgres-store";

/**
 * Persistenz-Schnittstelle.
 *  - DATABASE_URL gesetzt → Postgres (z. B. Supabase) – nötig für Hosting wie Vercel
 *  - sonst JSON-Datei in DATA_DIR – ideal für Entwicklung oder einen eigenen Server
 */
export interface Store {
  listBookings(filter?: { from?: Date; to?: Date; includeCancelled?: boolean }): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | null>;
  findBookingByTokenHash(hash: string): Promise<Booking | null>;
  /** Legt eine Buchung atomar an – `guard` wird innerhalb der Sperre ausgeführt (Doppelbuchungsschutz). */
  createBooking(
    build: (seq: number) => Booking,
    guard?: (existing: Booking[]) => boolean,
  ): Promise<Booking | null>;
  updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | null>;
  createInvoice(build: (seq: number) => Invoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | null>;
  addChatMessage(msg: ChatMessage): Promise<void>;
  /** Legt eine Leistungsanfrage mit fortlaufender Nummer an */
  createServiceRequest(build: (seq: number) => ServiceRequest): Promise<ServiceRequest>;
}

let instance: Store | null = null;

export function getStore(): Store {
  if (!instance) {
    instance = process.env.DATABASE_URL ? new PostgresStore(process.env.DATABASE_URL) : new JsonFileStore(process.env.DATA_DIR || "./data");
  }
  return instance;
}
