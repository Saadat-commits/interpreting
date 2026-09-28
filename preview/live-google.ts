/**
 * Vorschau: echte Verbindung zu Google Kalender und Gmail über die claude.ai-Connectoren
 * der Person, die die Vorschau öffnet (Artifact-Capability „mcp“).
 *
 * - Freie/belegte Zeiten kommen live aus dem Google Kalender.
 * - Nach der E-Mail-Bestätigung wird der Termin in den Kalender eingetragen
 *   und eine Bestätigungs-E-Mail über Gmail verschickt.
 * Ohne Connector (z. B. lokal oder für andere Betrachter) fällt die Vorschau auf die
 * Momentaufnahme zurück. Die echte Website nutzt dafür ihr eigenes Google-Dienstkonto.
 */
import type { TimeInterval } from "@/lib/types";

const CAL = "Google Calendar";
const MAIL = "Gmail";
const TZ = "Europe/Berlin";

type McpNs = {
  callTool: (server: string, tool: string, input?: unknown, options?: unknown) => Promise<{ payload?: unknown }>;
};

let mcpPromise: Promise<McpNs | null> | null = null;
function getMcp(): Promise<McpNs | null> {
  if (!mcpPromise) {
    const c = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
    mcpPromise = c?.use ? (c.use("mcp") as Promise<McpNs | null>).catch(() => null) : Promise.resolve(null);
  }
  return mcpPromise;
}

/** Zustand für die Anzeige („Live aus Google Kalender“ oder Grund, warum nicht) */
export let liveStatus: "unknown" | "live" | "unavailable" = "unknown";
export let liveError = "";

type GEvent = {
  status?: string;
  transparency?: string;
  availability?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

function berlinMidnight(dateKey: string): Date {
  // Mitternacht in Berlin: Offset über Intl bestimmen (Sommer-/Winterzeit)
  const probe = new Date(`${dateKey}T12:00:00Z`);
  const tzName = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" }).formatToParts(probe).find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const h = Number(tzName.replace("GMT", "")) || 1;
  return new Date(`${dateKey}T00:00:00${h >= 0 ? "+" : "-"}${String(Math.abs(h)).padStart(2, "0")}:00`);
}

function toInterval(e: GEvent): TimeInterval | null {
  if (e.status === "cancelled" || e.transparency === "transparent" || e.availability === "AVAILABILITY_FREE") return null;
  if (e.start?.dateTime && e.end?.dateTime) return { start: new Date(e.start.dateTime), end: new Date(e.end.dateTime) };
  if (e.start?.date && e.end?.date) return { start: berlinMidnight(e.start.date.slice(0, 10)), end: berlinMidnight(e.end.date.slice(0, 10)) };
  return null;
}

const cache = new Map<string, Promise<TimeInterval[] | null>>();

/** Belegte Zeiten live aus dem Google Kalender; `null`, wenn keine Verbindung möglich ist */
export function liveBusy(from: Date, to: Date): Promise<TimeInterval[] | null> {
  const key = `${from.toISOString()}|${to.toISOString()}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        const mcp = await getMcp();
        if (!mcp) {
          liveStatus = "unavailable";
          return null;
        }
        try {
          const out: TimeInterval[] = [];
          let pageToken: string | undefined;
          for (let i = 0; i < 5; i++) {
            const res = await mcp.callTool(CAL, "list_events", {
              startTime: from.toISOString(),
              endTime: to.toISOString(),
              timeZone: TZ,
              orderBy: "startTime",
              pageSize: 250,
              ...(pageToken ? { pageToken } : {}),
            });
            const p = (res.payload ?? {}) as { events?: GEvent[]; nextPageToken?: string };
            for (const e of p.events ?? []) {
              const iv = toInterval(e);
              if (iv) out.push(iv);
            }
            pageToken = p.nextPageToken;
            if (!pageToken) break;
          }
          liveStatus = "live";
          return out;
        } catch (e) {
          liveStatus = "unavailable";
          liveError = (e as { code?: string }).code ?? "error";
          cache.delete(key); // später erneut versuchen
          return null;
        }
      })(),
    );
  }
  return cache.get(key)!;
}

export interface LiveBooking {
  reference: string;
  start: string;
  end: string;
  email: string;
  location?: string;
  instant?: boolean;
  service: "onsite" | "phone";
  languageLabel: string;
  contactName: string;
  phone: string;
  clientName?: string;
  organisation?: string;
}

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** Nach der Bestätigung: Kalendereintrag + Bestätigungs-E-Mail. Liefert, was geklappt hat. */
export async function liveConfirm(b: LiveBooking): Promise<{ calendar: boolean; email: boolean }> {
  const mcp = await getMcp();
  if (!mcp) return { calendar: false, email: false };
  const who = b.organisation ? `${b.organisation} – für ${b.clientName ?? ""}` : b.contactName;
  const title = `${b.service === "onsite" ? "📍" : "📞"} Dolmetschen ${b.languageLabel} – ${who}`;
  const lines = [
    `Buchung ${b.reference} (über die Website-Vorschau)`,
    `${b.service === "onsite" ? "Vor Ort" : b.instant ? "Sofort-Anruf" : "Telefontermin"} · ${b.languageLabel} ⇄ Deutsch`,
    "",
    `Kontakt: ${b.contactName}`,
    `Telefon: ${b.phone}`,
    `E-Mail: ${b.email}`,
    b.organisation ? `Einrichtung: ${b.organisation}` : "",
    b.clientName && b.organisation ? `Klient:in: ${b.clientName}` : "",
    b.location ? `Ort: ${b.location}` : "",
  ].filter((l, i) => l !== "" || i === 2);

  let calendar = false;
  try {
    await mcp.callTool(CAL, "create_event", {
      summary: title,
      startTime: b.start,
      endTime: b.end,
      timeZone: TZ,
      location: b.location,
      description: lines.join("\n"),
      colorId: "10",
      overrideReminders: [{ method: "popup", minutes: b.service === "onsite" ? 90 : 15 }],
    });
    calendar = true;
    cache.clear(); // Kalender neu laden, damit die Zeit jetzt als belegt erscheint
  } catch {
    calendar = false;
  }

  let email = false;
  try {
    const when = b.instant ? "Jetzt – bitte rufen Sie an" : `${fmt(b.start)} Uhr`;
    const html = `<div style="font-family:Arial,sans-serif;color:#10281c;max-width:560px">
<div style="border-top:4px solid #1F7049;padding:20px 0 6px"><strong style="font-size:18px">Interpreting NBG</strong></div>
<h1 style="font-size:22px;margin:12px 0">Ihr Termin ist bestätigt</h1>
<p>Guten Tag ${b.contactName},<br>vielen Dank für Ihre Buchung. Hier sind Ihre Angaben:</p>
<table style="border-collapse:collapse;width:100%;font-size:15px">
<tr><td style="padding:8px;border-bottom:1px solid #e4eae6;color:#5b6b62">Buchung</td><td style="padding:8px;border-bottom:1px solid #e4eae6"><b>${b.reference}</b></td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #e4eae6;color:#5b6b62">Termin</td><td style="padding:8px;border-bottom:1px solid #e4eae6"><b>${when}</b></td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #e4eae6;color:#5b6b62">Art</td><td style="padding:8px;border-bottom:1px solid #e4eae6">${lines[1]}</td></tr>
${b.location ? `<tr><td style="padding:8px;border-bottom:1px solid #e4eae6;color:#5b6b62">Ort</td><td style="padding:8px;border-bottom:1px solid #e4eae6">${b.location}</td></tr>` : ""}
</table>
<p style="margin-top:16px">Die Rechnung erhalten Sie als PDF per E-Mail. Bei Fragen antworten Sie einfach auf diese E-Mail.</p>
<p style="color:#5b6b62;font-size:12px">Hinweis: Diese E-Mail wurde aus der Website-Vorschau zum Testen verschickt.</p>
</div>`;
    await mcp.callTool(MAIL, "send_message", {
      to: [b.email],
      subject: `Terminbestätigung ${b.reference} – Interpreting NBG (Test aus der Vorschau)`,
      htmlBody: html,
      body: `Ihr Termin ist bestätigt.\nBuchung: ${b.reference}\nTermin: ${when}\n${b.location ? `Ort: ${b.location}\n` : ""}`,
    });
    email = true;
  } catch {
    email = false;
  }
  return { calendar, email };
}
