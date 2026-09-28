import { availabilityConfig } from "@/config/availability";
import type { Booking, CalendarLink, TimeInterval } from "@/lib/types";
import { getStore } from "../store";
import { GoogleCalendarProvider } from "./google";

/**
 * Kalender-Schnittstelle.
 *
 * Heute: Belegung ergibt sich aus den gespeicherten Buchungen („local“).
 * Später: Google Kalender liefert zusätzlich private/andere Termine als belegt
 * und bekommt jede bestätigte Buchung als Ereignis eingetragen.
 */
export interface CalendarProvider {
  id: CalendarLink["provider"];
  /** Belegte Zeiträume im Intervall (bereits inkl. Puffer) */
  getBusy(from: Date, to: Date): Promise<TimeInterval[]>;
  /** Trägt eine bestätigte Buchung ein; gibt die Verknüpfung zurück */
  createEvent(booking: Booking): Promise<CalendarLink>;
}

export function bookingToBusy(b: Pick<Booking, "start" | "end" | "service">): TimeInterval {
  const buffer = availabilityConfig.bufferMinutes[b.service] * 60000;
  return { start: new Date(new Date(b.start).getTime() - buffer), end: new Date(new Date(b.end).getTime() + buffer) };
}

/** Blockiert eine Buchung den Kalender? Unbestätigte Reservierungen nur bis zum Ablauf der Haltefrist. */
export function blocksCalendar(b: Booking, now = new Date()) {
  if (b.status === "cancelled") return false;
  if (b.status === "pending") return !!b.verification && new Date(b.verification.expiresAt) > now;
  return true;
}

class LocalCalendarProvider implements CalendarProvider {
  id = "local" as const;
  async getBusy(from: Date, to: Date) {
    const bookings = await getStore().listBookings({ from, to });
    return bookings.filter((b) => blocksCalendar(b)).map(bookingToBusy);
  }
  async createEvent(): Promise<CalendarLink> {
    return { provider: "local", syncStatus: "not_synced" };
  }
}

/** Kombiniert lokale Buchungen mit (optional) Google Kalender. */
class CompositeCalendar implements CalendarProvider {
  id: CalendarLink["provider"];
  constructor(private local: CalendarProvider, private remote?: CalendarProvider) {
    this.id = remote ? remote.id : local.id;
  }
  async getBusy(from: Date, to: Date) {
    const [a, b] = await Promise.all([this.local.getBusy(from, to), this.remote?.getBusy(from, to) ?? []]);
    return [...a, ...b];
  }
  async createEvent(booking: Booking) {
    if (!this.remote) return this.local.createEvent(booking);
    try {
      return await this.remote.createEvent(booking);
    } catch (e) {
      return { provider: this.remote.id, syncStatus: "failed" as const, lastError: String(e) };
    }
  }
}

export function getCalendar(): CalendarProvider {
  const google = GoogleCalendarProvider.fromEnv();
  return new CompositeCalendar(new LocalCalendarProvider(), google ?? undefined);
}
