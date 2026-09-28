import { googleAccessToken, SCOPES } from "../google-auth";
import { availabilityConfig } from "@/config/availability";
import { de } from "@/lib/i18n/de";
import { formatAddress } from "@/lib/address";
import type { Booking, CalendarLink, TimeInterval } from "@/lib/types";
import type { CalendarProvider } from "./index";

/**
 * Google Kalender über ein Dienstkonto (Service Account).
 *
 *  - getBusy():     liest belegte Zeiten (auch private Termine) → diese Zeiten sind auf der Website nicht buchbar
 *  - createEvent(): trägt jede bestätigte Buchung mit allen Details in den Kalender ein
 *
 * Anmeldung über das gemeinsame Google-Dienstkonto (siehe google-auth.ts).
 */
export class GoogleCalendarProvider implements CalendarProvider {
  id = "google" as const;

  private constructor(private calendarId: string) {}

  static fromEnv(): GoogleCalendarProvider | null {
    const id = process.env.GOOGLE_CALENDAR_ID || process.env.GOOGLE_DELEGATED_USER;
    const configured = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!id || !configured || process.env.GOOGLE_CALENDAR_ENABLED === "false") return null;
    return new GoogleCalendarProvider(id);
  }

  private accessToken() {
    return googleAccessToken(SCOPES.calendar);
  }

  private async api<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await this.accessToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Google Kalender (${res.status}): ${await res.text()}`);
    return (await res.json()) as T;
  }

  async getBusy(from: Date, to: Date): Promise<TimeInterval[]> {
    const data = await this.api<{ calendars: Record<string, { busy?: { start: string; end: string }[] }> }>("/freeBusy", {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: availabilityConfig.timezone,
      items: [{ id: this.calendarId }],
    });
    return (data.calendars[this.calendarId]?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
  }

  async createEvent(b: Booking): Promise<CalendarLink> {
    const onsite = b.service === "onsite" && b.onsite;
    const place = onsite ? [b.onsite!.institution, formatAddress(b.onsite!.address)].filter(Boolean).join(", ") : undefined;
    const lines = [
      `Buchung ${b.reference}`,
      `${onsite ? "Vor-Ort-Begleitung" : "Telefonisch"} · ${de.languages[b.language]} ↔ Deutsch · ${de.categories[b.category]}`,
      "",
      `Kund:in: ${b.contact.name}`,
      `Telefon: ${b.contact.phone}`,
      `E-Mail: ${b.contact.email}`,
      b.phoneSession ? `Anrufen unter: ${b.phoneSession.callNumber}` : "",
      b.notes ? `\nHinweis: ${b.notes}` : "",
    ].filter((l) => l !== "");
    const event = await this.api<{ id: string }>(`/calendars/${encodeURIComponent(this.calendarId)}/events`, {
      summary: `${onsite ? "📍" : "📞"} Dolmetschen ${de.languages[b.language]} – ${b.contact.name}`,
      location: place,
      description: lines.join("\n"),
      start: { dateTime: b.start, timeZone: availabilityConfig.timezone },
      end: { dateTime: b.end, timeZone: availabilityConfig.timezone },
      colorId: "10",
      extendedProperties: { private: { bookingId: b.id, reference: b.reference } },
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: onsite ? 90 : 30 }] },
    });
    return { provider: "google", calendarId: this.calendarId, externalEventId: event.id, syncStatus: "synced", syncedAt: new Date().toISOString() };
  }
}
