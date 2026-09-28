/**
 * Kleine, abhängigkeitsfreie Zeitzonen-Helfer auf Basis von Intl.
 * Alle Termine werden in UTC gespeichert und in Europe/Berlin angezeigt.
 */

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string) {
  let f = dtfCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    dtfCache.set(timeZone, f);
  }
  return f;
}

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = So
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const p = Object.fromEntries(partsFormatter(timeZone).formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    weekday: WEEKDAYS.indexOf(p.weekday),
  };
}

/** Offset der Zeitzone zu UTC in Minuten für einen Zeitpunkt */
function offsetMinutes(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}

/** Ortszeit (Wanduhr) in einer Zeitzone → UTC-Date */
export function zonedToUtc(dateKey: string, time: string, timeZone: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let off = offsetMinutes(new Date(guess), timeZone);
  let result = guess - off * 60000;
  // Zweiter Durchlauf für Tage mit Zeitumstellung
  const off2 = offsetMinutes(new Date(result), timeZone);
  if (off2 !== off) {
    off = off2;
    result = guess - off * 60000;
  }
  return new Date(result);
}

export function dateKeyOf(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function timeOf(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

/** Kalenderarithmetik auf reinen Datumsschlüsseln (ohne Zeitzonenfallen) */
export function addDaysToKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function weekdayOfKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
