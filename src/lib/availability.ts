import { availabilityConfig } from "@/config/availability";
import { holidaysFor } from "./holidays";
import {
  addDaysToKey,
  dateKeyOf,
  daysInMonth,
  fromMinutes,
  pad,
  toMinutes,
  weekdayOfKey,
  zonedToUtc,
} from "./time";
import type { ServiceType, TimeInterval } from "./types";

export interface SlotInfo {
  time: string; // "09:30" Ortszeit
  start: string; // ISO UTC
  available: boolean;
}

export interface DayInfo {
  date: string; // YYYY-MM-DD
  /** closed = Wochenende/Feiertag/außerhalb Zeitraum; full = Arbeitstag ohne freie Slots */
  state: "available" | "full" | "closed";
  slots: SlotInfo[];
}

export interface AvailabilityInput {
  service: ServiceType;
  durationMinutes: number;
  year: number;
  month: number; // 1-12
  /** Bereits belegte Zeiten (inkl. eigener Puffer) */
  busy: TimeInterval[];
  now?: Date;
  config?: typeof availabilityConfig;
}

export function isValidDuration(service: ServiceType, minutes: number, config = availabilityConfig) {
  return config.durations[service].includes(minutes);
}

function overlaps(a: TimeInterval, b: TimeInterval) {
  return a.start < b.end && b.start < a.end;
}

/** Berechnet für einen Monat alle Tage mit ihren Startzeiten und deren Verfügbarkeit. */
export function computeMonth(input: AvailabilityInput): DayInfo[] {
  const cfg = input.config ?? availabilityConfig;
  const now = input.now ?? new Date();
  const tz = cfg.timezone;
  const earliest = new Date(now.getTime() + cfg.minLeadMinutes[input.service] * 60000);
  const todayKey = dateKeyOf(now, tz);
  const lastKey = addDaysToKey(todayKey, cfg.horizonDays);
  const holidays = holidaysFor(input.year, cfg.holidayRegion);
  const blocked = new Set(cfg.blockedDates);
  const buffer = cfg.bufferMinutes[input.service] * 60000;
  const duration = input.durationMinutes;

  const days: DayInfo[] = [];
  for (let d = 1; d <= daysInMonth(input.year, input.month); d++) {
    const key = `${input.year}-${pad(input.month)}-${pad(d)}`;
    const ranges = cfg.weeklyHours[weekdayOfKey(key)] ?? [];
    if (key < todayKey || key > lastKey || holidays.has(key) || blocked.has(key) || ranges.length === 0) {
      days.push({ date: key, state: "closed", slots: [] });
      continue;
    }

    const slots: SlotInfo[] = [];
    for (const r of ranges) {
      const open = toMinutes(r.from);
      const close = toMinutes(r.to);
      for (let m = open; m + duration <= close; m += cfg.slotStepMinutes) {
        const time = fromMinutes(m);
        const start = zonedToUtc(key, time, tz);
        const end = new Date(start.getTime() + duration * 60000);
        const padded = { start: new Date(start.getTime() - buffer), end: new Date(end.getTime() + buffer) };
        // Zeiten vor dem Mindestvorlauf werden gar nicht erst angezeigt
        if (start < earliest) continue;
        const available = !input.busy.some((b) => overlaps(padded, b));
        slots.push({ time, start: start.toISOString(), available });
      }
    }

    // Tage ohne verbleibende Startzeiten (z. B. heute nach Vorlauf) gelten als geschlossen
    const state = slots.some((s) => s.available) ? "available" : slots.length ? "full" : "closed";
    days.push({ date: key, state, slots: state === "closed" ? [] : slots });
  }
  return days;
}

/** Prüft serverseitig, ob ein konkreter Start noch frei ist (Schutz vor Doppelbuchung). */
export function isSlotAvailable(
  service: ServiceType,
  durationMinutes: number,
  startIso: string,
  busy: TimeInterval[],
  now = new Date(),
) {
  const tz = availabilityConfig.timezone;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return false;
  const key = dateKeyOf(start, tz);
  const [y, m] = key.split("-").map(Number);
  const day = computeMonth({ service, durationMinutes, year: y, month: m, busy, now }).find((d) => d.date === key);
  return !!day?.slots.some((s) => s.start === start.toISOString() && s.available);
}
