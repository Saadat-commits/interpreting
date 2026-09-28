import type { ServiceType } from "@/lib/types";

/** Wochentag: 0 = Sonntag … 6 = Samstag. Zeiten in Ortszeit (Europe/Berlin). */
export type WeeklyHours = Record<number, { from: string; to: string }[]>;

export const availabilityConfig = {
  timezone: "Europe/Berlin",
  weeklyHours: {
    0: [],
    1: [{ from: "08:00", to: "18:00" }],
    2: [{ from: "08:00", to: "18:00" }],
    3: [{ from: "08:00", to: "18:00" }],
    4: [{ from: "08:00", to: "18:00" }],
    5: [{ from: "08:00", to: "16:00" }],
    6: [],
  } as WeeklyHours,
  /** Raster, in dem Startzeiten angeboten werden */
  slotStepMinutes: 30,
  /** Wie weit im Voraus gebucht werden kann */
  horizonDays: 90,
  /** Mindestvorlauf je Leistung */
  minLeadMinutes: { phone: 120, onsite: 24 * 60 } satisfies Record<ServiceType, number>,
  /** Puffer vor/nach Terminen (z. B. Anfahrt bei Vor-Ort-Terminen) */
  bufferMinutes: { phone: 15, onsite: 45 } satisfies Record<ServiceType, number>,
  /** Wählbare voraussichtliche Dauer in Minuten */
  durations: { phone: [30, 60, 90, 120], onsite: [60, 120, 180, 240] } satisfies Record<ServiceType, number[]>,
  /** Gesetzliche Feiertage: bundesweit + Bayern (Nürnberg) */
  holidayRegion: "BY" as const,
  /** Zusätzliche gesperrte Tage (Urlaub etc.), Format YYYY-MM-DD */
  blockedDates: [] as string[],
};
