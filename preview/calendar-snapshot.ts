/**
 * Belegte Zeiten aus dem Google Kalender von saadat@interpreting-nbg.de
 * (Stand 28.09.2026, nur Zeiten – keine Titel). Die Vorschau zeigt damit genau
 * die Tage, die im echten Kalender frei sind. Die Live-Website fragt den Kalender
 * dagegen bei jedem Aufruf direkt ab (Google freeBusy).
 */
import type { TimeInterval } from "@/lib/types";

const ranges: [string, string][] = [
  // Arbeit
  ["2026-09-28T08:00:00+02:00", "2026-09-28T16:30:00+02:00"],
  ["2026-09-29T08:00:00+02:00", "2026-09-29T16:30:00+02:00"],
  ["2026-09-30T08:00:00+02:00", "2026-09-30T16:30:00+02:00"],
  // ganztägige Einträge
  ["2026-10-01T00:00:00+02:00", "2026-10-02T00:00:00+02:00"],
  ["2026-10-02T00:00:00+02:00", "2026-10-03T00:00:00+02:00"],
  // Einzeltermine
  ["2026-10-04T16:00:00+02:00", "2026-10-04T17:00:00+02:00"],
  ["2026-10-14T15:00:00+02:00", "2026-10-14T17:00:00+02:00"],
  ["2026-11-20T09:00:00+01:00", "2026-11-20T10:00:00+01:00"],
];

// Serientermin Di/Do/Fr 19–21 Uhr (bis Jahresende, außer 25.12.)
const seriesDays = [
  "09-29", "10-01", "10-02", "10-06", "10-08", "10-09", "10-13", "10-15", "10-16", "10-20", "10-22", "10-23", "10-27", "10-29", "10-30",
  "11-03", "11-05", "11-06", "11-10", "11-12", "11-13", "11-17", "11-19", "11-20", "11-24", "11-26", "11-27",
  "12-01", "12-03", "12-04", "12-08", "12-10", "12-11", "12-15", "12-17", "12-18", "12-22", "12-24", "12-29", "12-31",
];
for (const d of seriesDays) {
  const off = d >= "10-25" ? "+01:00" : "+02:00";
  ranges.push([`2026-${d}T19:00:00${off}`, `2026-${d}T21:00:00${off}`]);
}

export const CALENDAR_BUSY: TimeInterval[] = ranges.map(([s, e]) => ({ start: new Date(s), end: new Date(e) }));
