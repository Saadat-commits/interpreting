import type { Booking, CalendarLink, TimeInterval } from "@/lib/types";
import type { CalendarProvider } from "./index";

/**
 * VORBEREITET – noch nicht aktiv.
 *
 * Aktivierung später über Umgebungsvariablen:
 *   GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY
 * Umsetzung: freebusy.query für getBusy(), events.insert für createEvent().
 * Die Buchung speichert calendarId + externalEventId (siehe Booking.calendar),
 * damit Änderungen/Stornos später synchronisiert werden können.
 */
export class GoogleCalendarProvider implements CalendarProvider {
  id = "google" as const;

  private constructor(private calendarId: string) {}

  static fromEnv(): GoogleCalendarProvider | null {
    if (process.env.GOOGLE_CALENDAR_ENABLED !== "true") return null;
    const id = process.env.GOOGLE_CALENDAR_ID;
    return id ? new GoogleCalendarProvider(id) : null;
  }

  async getBusy(_from: Date, _to: Date): Promise<TimeInterval[]> {
    throw new Error(`Google Kalender (${this.calendarId}) ist noch nicht angebunden.`);
  }

  async createEvent(_booking: Booking): Promise<CalendarLink> {
    throw new Error(`Google Kalender (${this.calendarId}) ist noch nicht angebunden.`);
  }
}
