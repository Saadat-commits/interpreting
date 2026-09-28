/**
 * Demo-Modus: beantwortet die API-Aufrufe der Website direkt im Browser.
 * Verfügbarkeit nutzt dieselbe Logik wie der Server; Buchungen werden nicht gespeichert.
 */
import { computeMonth } from "@/lib/availability";
import { MOCK_ADDRESSES } from "@/lib/server/places";
import type { PostalAddress, TimeInterval } from "@/lib/types";
import { zonedToUtc } from "@/lib/time";

const extra: PostalAddress[] = [
  { label: "Königstorgraben 11, 90402 Nürnberg", street: "Königstorgraben", houseNumber: "11", postalCode: "90402", city: "Nürnberg", country: "DE", placeName: "Kinderarztpraxis am Königstor", source: "mock" },
  { label: "Bielingplatz 1, 90419 Nürnberg", street: "Bielingplatz", houseNumber: "1", postalCode: "90419", city: "Nürnberg", country: "DE", placeName: "Grundschule Bielingplatz", source: "mock" },
  { label: "Innerer Laufer Platz 3, 90403 Nürnberg", street: "Innerer Laufer Platz", houseNumber: "3", postalCode: "90403", city: "Nürnberg", country: "DE", placeName: "Ausländerbehörde Nürnberg", source: "mock" },
];
const addresses = [...MOCK_ADDRESSES, ...extra];

// Einige Beispiel-Belegungen, damit rote (belegte) Zeiten sichtbar sind
function demoBusy(year: number, month: number): TimeInterval[] {
  const out: TimeInterval[] = [];
  for (let d = 1; d <= 31; d += 1) {
    if (d % 3 === 0) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const start = zonedToUtc(key, d % 2 ? "09:00" : "13:30", "Europe/Berlin");
      out.push({ start, end: new Date(start.getTime() + 150 * 60000) });
    }
    if (d % 7 === 4) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      out.push({ start: zonedToUtc(key, "07:00", "Europe/Berlin"), end: zonedToUtc(key, "19:00", "Europe/Berlin") });
    }
  }
  return out;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 41;
const pending = new Map<string, { reference: string; start: string; end: string; email: string; location?: string }>();

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
      const days = computeMonth({ service, durationMinutes: Number(url.searchParams.get("duration")), year: y, month: m, busy: demoBusy(y, m) });
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
      pending.set(token, { reference: `T-${start.getFullYear()}-${String(seq).padStart(4, "0")}`, start: start.toISOString(), end: end.toISOString(), email: body.contact?.email, location });
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
    if (path === "/api/chat") {
      await wait(500);
      return json({ ok: true });
    }
    return json({ error: "not_found" }, 404);
  };
}
