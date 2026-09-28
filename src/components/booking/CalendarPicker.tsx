"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayInfo } from "@/lib/availability";
import type { Dictionary } from "@/lib/i18n";
import { intlLocale } from "@/lib/i18n";
import { pad, weekdayOfKey } from "@/lib/time";
import type { Locale, ServiceType } from "@/lib/types";
import { IconChevron, IconClock } from "../icons";

type T = Dictionary["booking"]["calendar"];

function berlinToday() {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });
  return f.format(new Date()); // YYYY-MM-DD
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function CalendarPicker({
  service,
  duration,
  selected,
  onSelect,
  t,
  locale,
  refreshKey,
}: {
  service: ServiceType;
  duration: number;
  selected: string | null;
  onSelect: (startIso: string | null) => void;
  t: T;
  locale: Locale;
  refreshKey: number;
}) {
  const today = berlinToday();
  const firstMonth = today.slice(0, 7);
  const [month, setMonth] = useState(selected ? selected.slice(0, 7) : firstMonth);
  const [days, setDays] = useState<DayInfo[] | null>(null);
  const [error, setError] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const [autoAdvanced, setAutoAdvanced] = useState(0);
  const lastMonth = shiftMonth(firstMonth, 3);

  const load = useCallback(async () => {
    setError(false);
    setDays(null);
    try {
      const res = await fetch(`/api/availability?service=${service}&duration=${duration}&month=${month}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { days: DayInfo[] };
      setDays(data.days);
    } catch {
      setError(true);
    }
  }, [service, duration, month]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Automatisch: ersten freien Tag wählen bzw. zum nächsten Monat mit freien Terminen springen
  useEffect(() => {
    if (!days) return;
    const selectedDay = selected ? days.find((d) => d.slots.some((s) => s.start === selected)) : null;
    if (selectedDay) {
      setDay(selectedDay.date);
      if (!selectedDay.slots.find((s) => s.start === selected)?.available) onSelect(null);
      return;
    }
    if (day && days.some((d) => d.date === day && d.state === "available")) return;
    const first = days.find((d) => d.state === "available");
    if (first) setDay(first.date);
    else if (autoAdvanced < 2 && month < lastMonth) {
      setAutoAdvanced((n) => n + 1);
      setMonth(shiftMonth(month, 1));
    } else setDay(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const lc = intlLocale(locale);
  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return new Intl.DateTimeFormat(lc, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
  }, [month, lc]);

  const dayNum = (key: string) => Number(key.slice(8)).toLocaleString(lc);
  const leading = days ? (weekdayOfKey(days[0].date) + 6) % 7 : 0; // Montag zuerst
  const dayInfo = days?.find((d) => d.date === day);
  const fmtDay = (key: string) =>
    new Intl.DateTimeFormat(lc, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
  const fmtTime = (time: string) => (locale === "fa" ? time.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) : time);

  // Schnellste Option: der nächste freie Termin mit einem Tipp
  const nextFree = useMemo(() => {
    for (const d of days ?? []) {
      const slot = d.slots.find((x) => x.available);
      if (slot) return { day: d.date, slot };
    }
    return null;
  }, [days]);

  return (
    <div>
    {nextFree && !selected && (
      <button
        type="button"
        onClick={() => (setDay(nextFree.day), onSelect(nextFree.slot.start))}
        className="group mb-4 flex w-full items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3.5 text-start shadow-soft transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lift"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
          <IconClock size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-brand-700">{t.nextFree}</span>
          <span className="block text-[15px] font-bold text-ink">
            {fmtDay(nextFree.day)} · {fmtTime(nextFree.slot.time)}
          </span>
        </span>
        <span className="hidden shrink-0 rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white transition group-hover:bg-brand-700 sm:inline">{t.take}</span>
        <IconChevron size={20} className="shrink-0 text-brand-600 sm:hidden rtl:rotate-180" />
      </button>
    )}
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      {/* Monatsansicht */}
      <div className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft transition hover:border-brand-200 hover:bg-brand-50 disabled:opacity-30"
            onClick={() => setMonth(shiftMonth(month, -1))}
            disabled={month <= firstMonth}
            aria-label={t.prev}
          >
            <IconChevron size={18} className="rotate-180 rtl:rotate-0" />
          </button>
          <div className="text-lg font-bold capitalize" aria-live="polite">
            {monthLabel}
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft transition hover:border-brand-200 hover:bg-brand-50 disabled:opacity-30"
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={month >= lastMonth}
            aria-label={t.next}
          >
            <IconChevron size={18} className="rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-ink-muted">
          {t.weekdays.map((w) => (
            <div key={w} className="pb-2">
              {w}
            </div>
          ))}
        </div>

        {error ? (
          <div className="grid min-h-[260px] place-items-center text-center">
            <div>
              <p className="text-sm text-ink-soft">{t.loadError}</p>
              <button type="button" onClick={load} className="btn-ghost mt-4 !py-2 text-sm">
                {t.retry}
              </button>
            </div>
          </div>
        ) : !days ? (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5" role="grid">
            {Array.from({ length: leading }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {days.map((d) => {
              const isPast = d.date < today;
              const isSel = d.date === day;
              const base = "relative aspect-square rounded-xl text-[15px] font-semibold transition-all duration-200";
              if (d.state === "available") {
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setDay(d.date)}
                    aria-pressed={isSel}
                    aria-label={`${fmtDay(d.date)} – ${t.legendFree}`}
                    className={`${base} ${
                      isSel
                        ? "bg-brand-600 text-white shadow-lift ring-4 ring-brand-100"
                        : "border border-brand-200 bg-brand-50 text-brand-800 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-soft"
                    }`}
                  >
                    {dayNum(d.date)}
                    {!isSel && <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-500" />}
                  </button>
                );
              }
              if (isPast) {
                return (
                  <div key={d.date} className={`${base} grid place-items-center text-ink-faint/60`} aria-hidden="true">
                    {dayNum(d.date)}
                  </div>
                );
              }
              return (
                <div
                  key={d.date}
                  className={`${base} grid cursor-not-allowed place-items-center border border-busy-line/60 bg-busy-bg/70 text-busy/70`}
                  aria-label={`${fmtDay(d.date)} – ${t.legendBusy}`}
                  aria-disabled="true"
                  title={t.legendBusy}
                >
                  <span className="line-through decoration-busy/40">{dayNum(d.date)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-line pt-4 text-xs font-medium text-ink-soft">
          <span className="inline-flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-[5px] border border-brand-300 bg-brand-100" /> {t.legendFree}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-[5px] border border-busy-line bg-busy-bg" /> {t.legendBusy}
          </span>
        </div>
      </div>

      {/* Uhrzeiten */}
      <div className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
        {day && dayInfo ? (
          <>
            <div className="text-lg font-bold">{fmtDay(day)}</div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
              <IconClock size={14} /> {t.timeNote}
            </p>
            {dayInfo.slots.some((s) => s.available) ? (
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                {dayInfo.slots.map((s) =>
                  s.available ? (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => onSelect(s.start)}
                      aria-pressed={selected === s.start}
                      className={`rounded-xl py-2.5 text-[15px] font-semibold transition-all duration-200 ${
                        selected === s.start
                          ? "bg-brand-600 text-white shadow-lift ring-4 ring-brand-100"
                          : "border border-brand-200 bg-brand-50 text-brand-800 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-soft"
                      }`}
                    >
                      {fmtTime(s.time)}
                    </button>
                  ) : (
                    <span
                      key={s.start}
                      className="cursor-not-allowed rounded-xl border border-busy-line/60 bg-busy-bg/70 py-2.5 text-center text-[15px] font-medium text-busy/60 line-through decoration-busy/30"
                      aria-disabled="true"
                      title={t.legendBusy}
                    >
                      {fmtTime(s.time)}
                    </span>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-6 text-sm text-ink-muted">{t.noSlots}</p>
            )}
          </>
        ) : (
          <div className="grid h-full min-h-[200px] place-items-center text-center text-sm text-ink-muted">{days ? t.pickDay : ""}</div>
        )}
      </div>
    </div>
    </div>
  );
}
