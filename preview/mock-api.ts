/**
 * Demo-Modus: beantwortet die API-Aufrufe der Website direkt im Browser.
 * Verfügbarkeit nutzt dieselbe Logik wie der Server; Buchungen werden nicht gespeichert.
 */
import { computeMonth } from "@/lib/availability";
import { MOCK_ADDRESSES } from "@/lib/server/places";
import type { PostalAddress, TimeInterval } from "@/lib/types";
import { citiesForPostalCode } from "@/lib/postal";
import { CALENDAR_BUSY } from "./calendar-snapshot";
import { DEMO_STREETS, rankStreets } from "@/lib/streets";

const extra: PostalAddress[] = [
  { label: "Königstorgraben 11, 90402 Nürnberg", street: "Königstorgraben", houseNumber: "11", postalCode: "90402", city: "Nürnberg", country: "DE", placeName: "Kinderarztpraxis am Königstor", source: "mock" },
  { label: "Bielingplatz 1, 90419 Nürnberg", street: "Bielingplatz", houseNumber: "1", postalCode: "90419", city: "Nürnberg", country: "DE", placeName: "Grundschule Bielingplatz", source: "mock" },
  { label: "Innerer Laufer Platz 3, 90403 Nürnberg", street: "Innerer Laufer Platz", houseNumber: "3", postalCode: "90403", city: "Nürnberg", country: "DE", placeName: "Ausländerbehörde Nürnberg", source: "mock" },
];
const addresses = [...MOCK_ADDRESSES, ...extra];

// Belegte Zeiten = echter Google Kalender (Momentaufnahme)
function demoBusy(): TimeInterval[] {
  return CALENDAR_BUSY;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 41;
const pending = new Map<string, { reference: string; start: string; end: string; email: string; location?: string; instant?: boolean }>();

export function installMockApi() {
  const real = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, location.href);
    const path = url.pathname.replace(/^.*\/api\//, "/api/");
    if (!path.startsWith("/api/")) return real(input, init);

    if (path === "/api/availability") {
      await wait(250);
      const service = url.searchParams.get("service") as "phone" | "onsite";
      const [y, m] = (url.searchParams.get("month") ?? "").split("-").map(Number);
      const days = computeMonth({ service, durationMinutes: Number(url.searchParams.get("duration")), year: y, month: m, busy: demoBusy() });
      return json({ days });
    }
    if (path === "/api/places") {
      await wait(180);
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      const hits = addresses.filter((a) => words.every((w) => `${a.placeName ?? ""} ${a.label}`.toLowerCase().includes(w)));
      const list = hits.slice(0, 6);
      return json({
        suggestions: list.map((a, i) => ({
          id: `demo-${i}-${a.label}`,
          title: a.placeName ?? a.label.split(", ")[0],
          subtitle: a.placeName ? a.label : a.label.split(", ")[1],
          address: a,
        })),
      });
    }
    if (path === "/api/bookings") {
      await wait(900);
      const body = JSON.parse(String(init?.body ?? "{}"));
      const start = new Date(body.start);
      const end = new Date(start.getTime() + body.durationMinutes * 60000);
      const token = `demo${++seq}`;
      const location = body.onsite ? [body.onsite.institution, body.onsite.address?.label].filter(Boolean).join(", ") : undefined;
      pending.set(token, { reference: `T-${start.getFullYear()}-${String(seq).padStart(4, "0")}`, start: start.toISOString(), end: end.toISOString(), email: body.contact?.email, location, instant: body.phoneSession?.mode === "instant" });
      const holdUntil = new Date(Date.now() + 60 * 60000).toISOString();
      return json({ id: token, status: "pending", email: body.contact?.email, start: start.toISOString(), end: end.toISOString(), holdUntil, demoToken: token }, 201);
    }
    if (path === "/api/bookings/verify") {
      await wait(1100);
      const { token } = JSON.parse(String(init?.body ?? "{}"));
      const b = pending.get(token);
      return b ? json(b) : json({ error: "invalid" }, 404);
    }
    if (path === "/api/bookings/resend") {
      await wait(600);
      return json({ ok: true });
    }
    if (path === "/api/plz") {
      await wait(120);
      return json({ cities: citiesForPostalCode(url.searchParams.get("code") ?? "") });
    }
    if (path === "/api/streets") {
      await wait(90);
      const plz = url.searchParams.get("plz") ?? "";
      const all = [...(DEMO_STREETS[plz] ?? []), ...addresses.filter((a) => a.postalCode === plz).map((a) => a.street)];
      return json({ streets: rankStreets(all, url.searchParams.get("q") ?? "", 6) });
    }
    if (path === "/api/assistant") {
      await wait(900);
      const body = JSON.parse(String(init?.body ?? "{}")) as { input: string; locale: "de" | "fa"; messages: unknown[] };
      return json({ reply: demoAssistant(body.input, body.locale), messages: [...body.messages, { role: "user", content: body.input }] });
    }
    if (path === "/api/chat") {
      await wait(500);
      return json({ ok: true });
    }
    return json({ error: "not_found" }, 404);
  };
}

/** Vorschau: einfache Beispielantworten. Live antwortet Claude und bucht direkt im Chat. */
function demoAssistant(q: string, locale: "de" | "fa") {
  const t = q.toLowerCase();
  const fa = locale === "fa" || /[\u0600-\u06FF]/.test(q);
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  if (has("biet", "leistung", "was mach", "خدمات", "چه"))
    return fa
      ? "دری، فارسی و پشتو ⇄ آلمانی. حضوری در فورت و حدود ۵۰ کیلومتر اطراف (نورنبرگ، ارلانگن، بامبرگ …) – مثلاً Jugendamt، Jobcenter، داکتر، مکتب و ادارات. تلفنی در سراسر آلمان، شبانه‌روزی."
      : "Ich dolmetsche Dari, Farsi und Paschtu ⇄ Deutsch. Vor Ort in Fürth und ca. 50 km Umkreis (Nürnberg, Erlangen, Bamberg …) – z. B. Jugendamt, Jobcenter, Arzt, Schule und Behörden. Telefonisch in ganz Deutschland, rund um die Uhr.";
  if (has("wo ", "einsatz", "wohin", "کجا", "bamberg", "erlangen"))
    return fa
      ? "حضوری: فورت، نورنبرگ، ارلانگن، بامبرگ، شواباخ، فورشهایم، آنسباخ – حدود ۵۰ کیلومتر. تلفنی: سراسر آلمان."
      : "Vor Ort: Fürth, Nürnberg, Erlangen, Bamberg, Schwabach, Forchheim, Ansbach – ca. 50 km um Fürth. Telefonisch: ganz Deutschland.";
  if (has("kost", "preis", "€", "euro", "قیمت", "هزینه"))
    return fa
      ? "حداقل ۱ ساعت محاسبه می‌شود، بعد از آن دقیقه‌ای. مبلغ دقیق در صورت‌حساب است."
      : "Abgerechnet wird mindestens 1 Stunde, danach minutengenau. Den genauen Betrag sehen Sie auf der Rechnung – oder rufen Sie kurz an.";
  if (has("buch", "termin", "وقت", "رزرو"))
    return fa
      ? "با کمال میل! حضوری یا تلفنی؟ به کدام زبان؟ و چه روزی مناسب است؟ (در پیش‌نمایش: نسخهٔ اصلی همین‌جا در چت وقت را ثبت می‌کند.)"
      : "Gern! Vor Ort oder am Telefon, in welcher Sprache und an welchem Tag? (Vorschau: Auf der echten Website bucht die KI den Termin direkt hier im Chat – mit E-Mail-Bestätigung.)";
  return fa
    ? "در پیش‌نمایش فقط پاسخ‌های نمونه دارم. در سایت اصلی دستیار به همهٔ سؤالات جواب می‌دهد و وقت می‌گیرد."
    : "In der Vorschau habe ich nur Beispielantworten. Auf der echten Website beantwortet die KI jede Frage und bucht auch direkt Termine.";
}
