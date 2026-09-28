import type { Booking, ChatMessage, Invoice } from "@/lib/types";
import { JsonFileStore } from "./json-file-store";

/**
 * Persistenz-Schnittstelle. Aktuell als JSON-Datei umgesetzt (ideal für den
 * geschützten Vorab-Betrieb auf einem Server). Für den Livebetrieb kann hier
 * ohne Änderungen an der restlichen Anwendung eine Datenbank (z. B. Postgres)
 * eingehängt werden.
 */
export interface Store {
  listBookings(filter?: { from?: Date; to?: Date; includeCancelled?: boolean }): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | null>;
  findBooking(pred: (b: Booking) => boolean): Promise<Booking | null>;
  /** Legt eine Buchung atomar an – `guard` wird innerhalb der Sperre ausgeführt (Doppelbuchungsschutz). */
  createBooking(
    build: (seq: number) => Booking,
    guard?: (existing: Booking[]) => boolean,
  ): Promise<Booking | null>;
  updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | null>;
  createInvoice(build: (seq: number) => Invoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | null>;
  addChatMessage(msg: ChatMessage): Promise<void>;
}

let instance: Store | null = null;

export function getStore(): Store {
  if (!instance) instance = new JsonFileStore(process.env.DATA_DIR || "./data");
  return instance;
}
