import Anthropic from "@anthropic-ai/sdk";
import { availabilityConfig } from "@/config/availability";
import { site } from "@/config/site";
import { computeMonth, isValidDuration } from "@/lib/availability";
import { formatAddress } from "@/lib/address";
import { bookingRequestSchema } from "@/lib/booking-schema";
import { citiesForPostalCode } from "@/lib/postal";
import { dateKeyOf, zonedToUtc } from "@/lib/time";
import type { Locale, PostalAddress } from "@/lib/types";
import { createBooking } from "./booking-service";
import { getCalendar } from "./calendar";

/**
 * KI-Hilfe: beantwortet Fragen zu den Leistungen und bucht auf Wunsch einen Termin.
 * Die Buchung läuft über denselben Weg wie das Formular – also mit E-Mail-Bestätigung
 * (Double-Opt-in), danach Kalendereintrag und Rechnung.
 */

const MODEL = "claude-opus-5";
const TZ = availabilityConfig.timezone;

type Msg = Anthropic.Beta.BetaMessageParam;

const SYSTEM = `Du bist die freundliche Online-Hilfe von „${site.brand}“ (${site.website}).

Über das Angebot:
- Ich (der Inhaber, selbst aus Afghanistan) dolmetsche Dari, Farsi (Persisch) und Paschtu ⇄ Deutsch.
- Vor Ort: persönliche Begleitung in Fürth und ca. ${site.serviceRadiusKm} km Umkreis (z. B. ${site.serviceArea.join(", ")}).
- Telefonisch: in ganz Deutschland, rund um die Uhr – als Telefontermin oder „jetzt sofort anrufen“ (Abrechnung pro Minute).
- Typische Termine: Jugendamt (Hilfeplan- und Elterngespräche), Jobcenter und Agentur für Arbeit, Arztbegleitung, Schule und Kita (Anmeldung, Elterngespräche), Behörden (Ausländerbehörde, Bürgeramt, Sozialamt, BAMF), Gericht, Anwalt, Polizei, Beratungsstellen (Caritas, Diakonie, AWO), Wohnungsbesichtigungen und Alltag.
- Einrichtungen (Jugendamt, Caritas, Behörden …) buchen oft für ihre Klient:innen. Dann geht die Rechnung an die Einrichtung, mit dem Namen der Person, für die gedolmetscht wurde.
- Ablauf einer Buchung: Nach der Buchung kommt eine E-Mail mit Bestätigungslink. Erst nach dem Klick ist der Termin fest; dann kommen Terminbestätigung, Rechnung (PDF) und AGB per E-Mail, und der Termin steht im Kalender.
- Kontakt: Telefon ${site.phone}, E-Mail ${site.email}.

Regeln:
- Antworte in der Sprache der Person (Deutsch, Dari/Farsi oder Paschtu). Kurz, warm, klar – höchstens 4 kurze Sätze pro Antwort, keine Markdown-Überschriften.
- Nenne keine Preise. Bei Preisfragen: Abrechnung mindestens 1 Stunde, danach minutengenau; den genauen Betrag zeigt die Rechnung, oder kurz anrufen.
- Rechtliche oder medizinische Beratung gibst du nicht – du vermittelst nur Termine und Informationen.
- Wenn jemand buchen möchte: frage nur, was noch fehlt, möglichst mehreres in einer Nachricht, und frage nie zweimal nach etwas, das schon gesagt wurde.
  Benötigt: vor Ort oder Telefon (oder sofort) · Sprache · privat oder für eine Einrichtung · Datum/Uhrzeit (prüfe sie mit check_availability und schlage freie Zeiten vor) · ungefähre Dauer (30, 60, 90, 120 Minuten oder länger) · bei vor Ort die Terminadresse (Straße, Hausnummer, PLZ) · Vor- und Nachname, Telefon, E-Mail · bei Einrichtungen: Name der Einrichtung und Name der Klientin/des Klienten · Rechnungsadresse nur, wenn sie von der Terminadresse abweicht oder bei Telefonterminen.
- Bevor du create_booking aufrufst, fasse die Angaben in 2–3 Zeilen zusammen und frage „Soll ich so buchen?“. Buche erst nach einem klaren Ja.
- Nach der Buchung: Sag deutlich, dass jetzt eine E-Mail kommt und der Link darin geklickt werden muss.
- Alle Uhrzeiten sind deutsche Zeit (Europe/Berlin).`;

const tools: Anthropic.Beta.BetaTool[] = [
  {
    name: "check_availability",
    description:
      "Liefert freie Startzeiten aus dem echten Kalender. Nutze das, bevor du eine Uhrzeit vorschlägst oder bestätigst. Gibt pro Tag die freien Startzeiten (deutsche Zeit) zurück.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string", enum: ["onsite", "phone"] },
        duration_minutes: { type: "integer", description: "30, 60, 90, 120, 180 (Telefon) bzw. bis 240 (vor Ort)" },
        date_from: { type: "string", description: "YYYY-MM-DD; ohne Angabe ab heute" },
        days: { type: "integer", description: "Wie viele Tage ab date_from (1–14), Standard 7" },
      },
      required: ["service", "duration_minutes"],
      additionalProperties: false,
    },
  },
  {
    name: "create_booking",
    description:
      "Legt die Buchung an und schickt der Person eine E-Mail mit Bestätigungslink. Erst nach ausdrücklicher Zustimmung aufrufen.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string", enum: ["onsite", "phone"] },
        instant_call: { type: "boolean", description: "true = jetzt sofort anrufen (nur Telefon, keine Uhrzeit nötig)" },
        language: { type: "string", enum: ["dari", "farsi", "pashto"] },
        category: { type: "string", enum: ["medical", "school", "youth_office", "authority", "counseling", "other"] },
        booker_type: { type: "string", enum: ["private", "organisation"] },
        organisation_name: { type: "string" },
        client_name: { type: "string", description: "Bei Einrichtungen: Person, für die gedolmetscht wird" },
        date: { type: "string", description: "YYYY-MM-DD (deutsche Zeit)" },
        time: { type: "string", description: "HH:MM (deutsche Zeit)" },
        duration_minutes: { type: "integer" },
        appointment_address: { $ref: "#/$defs/address" },
        appointment_place_name: { type: "string", description: "z. B. „Jugendamt Fürth“, „Praxis Dr. …“" },
        billing_address: { $ref: "#/$defs/address" },
        contact_name: { type: "string", description: "Vor- und Nachname der buchenden Person (bei Einrichtungen: Sachbearbeiter:in)" },
        email: { type: "string" },
        phone: { type: "string" },
        notes: { type: "string" },
      },
      required: ["service", "language", "category", "booker_type", "duration_minutes", "contact_name", "email", "phone"],
      additionalProperties: false,
      $defs: {
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
            house_number: { type: "string" },
            postal_code: { type: "string" },
            city: { type: "string" },
          },
          required: ["street", "house_number", "postal_code"],
          additionalProperties: false,
        },
      },
    },
  },
];

type AddrIn = { street: string; house_number: string; postal_code: string; city?: string };

function toAddress(a: AddrIn | undefined, placeName?: string): PostalAddress | undefined {
  if (!a) return undefined;
  const city = a.city?.trim() || citiesForPostalCode(a.postal_code.trim())[0] || "";
  const out: PostalAddress = {
    label: "",
    street: a.street.trim(),
    houseNumber: a.house_number.trim(),
    postalCode: a.postal_code.trim(),
    city,
    country: "DE",
    placeName: placeName?.trim() || undefined,
    source: "manual",
  };
  out.label = formatAddress(out);
  return out;
}

async function checkAvailability(input: { service: "onsite" | "phone"; duration_minutes: number; date_from?: string; days?: number }) {
  if (!isValidDuration(input.service, input.duration_minutes)) {
    return { error: `Ungültige Dauer. Möglich: ${availabilityConfig.durations[input.service].join(", ")} Minuten` };
  }
  const fromKey = /^\d{4}-\d{2}-\d{2}$/.test(input.date_from ?? "") ? input.date_from! : dateKeyOf(new Date(), TZ);
  const days = Math.min(14, Math.max(1, input.days ?? 7));
  const start = zonedToUtc(fromKey, "00:00", TZ);
  const end = new Date(start.getTime() + (days + 1) * 86400000);
  const busy = await getCalendar().getBusy(new Date(start.getTime() - 86400000), new Date(end.getTime() + 86400000));
  const months = new Set<string>();
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) months.add(dateKeyOf(new Date(t), TZ).slice(0, 7));
  const out: Record<string, string[]> = {};
  for (const m of months) {
    const [y, mo] = m.split("-").map(Number);
    for (const d of computeMonth({ service: input.service, durationMinutes: input.duration_minutes, year: y, month: mo, busy })) {
      if (d.date < fromKey || Object.keys(out).length >= days) continue;
      const free = d.slots.filter((s) => s.available).map((s) => s.time);
      if (free.length) out[d.date] = free.length > 16 ? [...free.slice(0, 16), "…"] : free;
    }
  }
  return Object.keys(out).length ? { timezone: TZ, free: out } : { timezone: TZ, free: {}, note: "Keine freien Zeiten in diesem Zeitraum" };
}

async function doCreateBooking(input: Record<string, unknown>, locale: Locale, baseUrl: string) {
  const i = input as {
    service: "onsite" | "phone";
    instant_call?: boolean;
    language: "dari" | "farsi" | "pashto";
    category: "medical" | "school" | "youth_office" | "authority" | "counseling" | "other";
    booker_type: "private" | "organisation";
    organisation_name?: string;
    client_name?: string;
    date?: string;
    time?: string;
    duration_minutes: number;
    appointment_address?: AddrIn;
    appointment_place_name?: string;
    billing_address?: AddrIn;
    contact_name: string;
    email: string;
    phone: string;
    notes?: string;
  };
  const instant = i.service === "phone" && !!i.instant_call;
  if (!instant && (!i.date || !i.time)) return { error: "Datum und Uhrzeit fehlen" };
  const start = instant ? new Date() : zonedToUtc(i.date!, i.time!, TZ);
  const place = toAddress(i.appointment_address, i.appointment_place_name);
  const billing = toAddress(i.billing_address);
  const org = i.booker_type === "organisation";
  const parsed = bookingRequestSchema.safeParse({
    locale,
    service: i.service,
    language: i.language,
    category: i.category,
    durationMinutes: instant ? 60 : i.duration_minutes,
    start: start.toISOString(),
    bookerType: i.booker_type,
    organisation: org ? { name: i.organisation_name ?? "", caseWorker: i.contact_name } : undefined,
    clientName: org ? i.client_name ?? "" : i.contact_name,
    onsite: i.service === "onsite" && place ? { address: place, institution: place.placeName || (org ? i.organisation_name : undefined) } : undefined,
    phoneSession: i.service === "phone" ? { callNumber: i.phone, mode: instant ? "instant" : "scheduled" } : undefined,
    contact: { name: i.contact_name, organisation: org ? i.organisation_name : undefined, email: i.email, phone: i.phone },
    billingSameAsAppointment: i.service === "onsite" && !billing,
    billingAddress: billing,
    billingRecipient: org ? i.organisation_name : i.contact_name,
    notes: [i.notes, "Gebucht über die KI-Hilfe"].filter(Boolean).join(" · "),
    acceptTerms: true,
  });
  if (!parsed.success) {
    return { error: "Angaben unvollständig oder ungültig", fields: parsed.error.issues.map((x) => x.path.join(".") || x.message) };
  }
  const result = await createBooking(parsed.data, baseUrl);
  if (!result.ok) return { error: result.error === "slot_taken" ? "Diese Zeit ist leider schon vergeben – bitte eine andere freie Zeit vorschlagen." : result.error };
  return {
    ok: true,
    status: "pending_email_confirmation",
    email: result.booking.contact.email,
    message: "Buchung angelegt. Die Person muss jetzt den Link in der E-Mail anklicken; erst dann ist der Termin fest.",
  };
}

export interface AssistantResult {
  messages: Msg[];
  reply: string;
  booked?: { email: string };
}

export async function runAssistant(history: Msg[], userText: string, locale: Locale, baseUrl: string): Promise<AssistantResult> {
  const client = new Anthropic();
  const messages: Msg[] = [...history, { role: "user", content: userText }];
  const today = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());
  let booked: AssistantResult["booked"];

  for (let round = 0; round < 6; round++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Jetzt: ${today} (Europe/Berlin). Seite in Sprache: ${locale === "fa" ? "Persisch" : "Deutsch"}.` },
      ],
      tools,
      messages,
    });
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "refusal") {
      return { messages, reply: locale === "fa" ? `لطفاً مستقیم تماس بگیرید: ${site.phone}` : `Dazu kann ich leider nichts sagen – rufen Sie gern direkt an: ${site.phone}` };
    }
    const calls = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || calls.length === 0) {
      const reply = response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { messages, reply, booked };
    }

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const call of calls) {
      let out: unknown;
      try {
        if (call.name === "check_availability") out = await checkAvailability(call.input as Parameters<typeof checkAvailability>[0]);
        else if (call.name === "create_booking") {
          out = await doCreateBooking(call.input as Record<string, unknown>, locale, baseUrl);
          if ((out as { ok?: boolean }).ok) booked = { email: (out as { email: string }).email };
        } else out = { error: "unknown_tool" };
      } catch (e) {
        console.error("[assistant tool]", call.name, e);
        out = { error: "Technischer Fehler – bitte Formular oder Telefon nutzen" };
      }
      const isError = typeof out === "object" && out !== null && "error" in out;
      results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(out), is_error: isError || undefined });
    }
    messages.push({ role: "user", content: results });
  }
  return { messages, reply: locale === "fa" ? `لطفاً تماس بگیرید: ${site.phone}` : `Bitte rufen Sie kurz an: ${site.phone}`, booked };
}
