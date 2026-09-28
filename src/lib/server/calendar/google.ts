import { createSign } from "node:crypto";
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
 * Einrichtung (einmalig): Dienstkonto in der Google Cloud Console anlegen, Kalender-API aktivieren,
 * den Kalender (z. B. saadat@interpreting-nbg.de) mit der Dienstkonto-Adresse teilen
 * („Änderungen an Terminen vornehmen“) und die Umgebungsvariablen setzen:
 *   GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY
 */
export class GoogleCalendarProvider implements CalendarProvider {
  id = "google" as const;
  private token: { value: string; exp: number } | null = null;

  private constructor(
    private calendarId: string,
    private clientEmail: string,
    private privateKey: string,
  ) {}

  static fromEnv(): GoogleCalendarProvider | null {
    const id = process.env.GOOGLE_CALENDAR_ID;
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!id || !email || !key || process.env.GOOGLE_CALENDAR_ENABLED === "false") return null;
    // In Umgebungsvariablen werden Zeilenumbrüche oft als „\n“ gespeichert
    return new GoogleCalendarProvider(id, email, key.replace(/\\n/g, "\n"));
  }

  private async accessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (this.token && this.token.exp - 60 > now) return this.token.value;
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
      iss: this.clientEmail,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })}`;
    const signature = createSign("RSA-SHA256").update(unsigned).sign(this.privateKey).toString("base64url");
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Google-Anmeldung fehlgeschlagen (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: data.access_token, exp: now + data.expires_in };
    return data.access_token;
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
