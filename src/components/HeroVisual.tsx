"use client";

import { useRef, type PointerEvent } from "react";
import { starPath } from "@/lib/star";
import type { Dictionary } from "@/lib/i18n";
import { IconCalendar, IconCheck, IconPhone, IconPin } from "./icons";

/**
 * Mehrschichtige Hero-Illustration mit leichter 3D-Neigung bei Mausbewegung.
 * Motiv: zwei Sprachen, die sich über eine „Brücke“ mit Girih-Stern verbinden.
 */
export function HeroVisual({ t, locale }: { t: Dictionary["hero"]; locale: "de" | "fa" }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  const day = new Date();
  day.setDate(day.getDate() + ((8 - day.getDay()) % 7 || 7) + 1); // nächster Dienstag
  const dateLabel = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-gregory" : "de-DE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(day);

  return (
    <div className="perspective relative mx-auto w-full max-w-[540px]" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div
        ref={ref}
        className="preserve-3d relative aspect-[5/5.2] transition-transform duration-300 ease-out"
        style={{ transform: "rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))" }}
        dir="ltr"
      >
        {/* Ebene 1: Spitzbogen (Iwan-Motiv) mit Girih-Muster */}
        <svg viewBox="0 0 400 420" className="absolute inset-x-[4%] top-0 h-[96%] w-[92%] drop-shadow-[0_30px_40px_rgba(16,40,28,.16)]" aria-hidden="true">
          <defs>
            <linearGradient id="hv-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset=".55" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#FFFFFF" />
            </linearGradient>
            <linearGradient id="hv-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2C8A5D" stopOpacity=".18" />
              <stop offset="1" stopColor="#2C8A5D" stopOpacity="0" />
            </linearGradient>
            <clipPath id="hv-clip">
              <path d="M30 420 V190 C30 105 110 45 200 10 C290 45 370 105 370 190 V420 Z" />
            </clipPath>
            <pattern id="hv-girih" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d={starPath(24, 24, 13, 0.64)} fill="none" stroke="#1F7049" strokeOpacity=".13" />
            </pattern>
          </defs>
          <path d="M14 420 V186 C14 96 102 30 200 -6 C298 30 386 96 386 186 V420" fill="none" stroke="#B3DCC3" strokeOpacity=".7" />
          <path d="M30 420 V190 C30 105 110 45 200 10 C290 45 370 105 370 190 V420 Z" fill="#fff" stroke="#82C29E" strokeWidth="1.5" />
          <g clipPath="url(#hv-clip)">
            <rect width="400" height="420" fill="url(#hv-girih)" />
            <path d={starPath(200, 150, 118, 0.7)} fill="url(#hv-g)" stroke="#2C8A5D" strokeOpacity=".22" strokeWidth="1.2" />
            <path d={starPath(200, 150, 74, 0.7)} fill="none" stroke="#2C8A5D" strokeOpacity=".2" />
            <circle cx="200" cy="150" r="30" fill="#fff" stroke="#2C8A5D" strokeOpacity=".25" />
            <path d="M60 330 C 120 250, 280 250, 340 330" fill="none" stroke="#1F7049" strokeOpacity=".3" strokeWidth="1.5" strokeDasharray="3 6" />
          </g>
        </svg>
        <div className="absolute left-1/2 top-[34.5%] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white shadow-lift">
          <svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
            <path d={starPath(20, 20, 13, 0.62)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Ebene 1b: laufendes Telefonat (Wellenform) */}
        <div className="absolute bottom-[3%] left-[10%] w-[52%]" style={{ transform: "translateZ(50px)" }}>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/95 px-3.5 py-3 shadow-lift backdrop-blur">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
              <IconPhone size={17} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" />
            </span>
            <div className="flex h-7 flex-1 items-center gap-[3px]" aria-hidden="true">
              {[5, 11, 18, 9, 22, 14, 26, 12, 19, 8, 15, 24, 10, 17, 7, 13, 20, 9, 6].map((h, i) => (
                <span key={i} className="w-[3px] animate-float rounded-full bg-brand-400/80" style={{ height: h, animationDuration: `${2 + (i % 5) * 0.4}s`, animationDelay: `${-i * 0.2}s` }} />
              ))}
            </div>
            <span className="text-xs font-semibold tabular-nums text-ink-muted">12:48</span>
          </div>
        </div>

        {/* Ebene 2: Sprechblasen */}
        <div className="absolute left-0 top-[46%] w-[58%] animate-float" style={{ transform: "translateZ(40px)" }}>
          <div className="rounded-2xl rounded-bl-md border border-line bg-white/95 px-4 py-3 shadow-lift backdrop-blur" lang="de">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Deutsch</div>
            <div className="text-[15px] font-semibold text-ink">{t.bubbleDe}</div>
          </div>
        </div>
        <div className="absolute right-0 top-[61%] w-[58%] animate-float-slow" style={{ transform: "translateZ(60px)", animationDelay: "-2s" }}>
          <div className="rounded-2xl rounded-br-md border border-brand-700 bg-brand-600 px-4 py-3 text-right text-white shadow-lift" dir="rtl" lang="fa">
            <div className="mb-1 font-fa text-[11px] font-bold text-brand-100">فارسی · دری · پښتو</div>
            <div className="font-fa text-[16px] font-semibold">{t.bubbleFa}</div>
          </div>
        </div>

        {/* Ebene 3: Terminkarte */}
        <div className="absolute right-[-2%] top-[8%] w-[54%] sm:right-[-6%]" style={{ transform: "translateZ(90px)" }} dir={locale === "fa" ? "rtl" : "ltr"}>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-deep">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted rtl:tracking-normal">{t.cardTitle}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                <IconCheck size={12} strokeWidth={2.4} /> {t.cardStatus}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <IconCalendar size={20} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-ink" suppressHydrationWarning>{dateLabel}</div>
                <div className="text-xs text-ink-muted">
                  <span dir="ltr">10:00 – 11:00</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-xs text-ink-soft">
              <IconPin size={14} className="text-brand-600" /> {t.cardService}
            </div>
          </div>
        </div>

        {/* Ebene 4: Chip telefonisch */}
        <div className="absolute left-[2%] top-[14%] animate-float-slow" style={{ transform: "translateZ(70px)", animationDelay: "-4s" }}>
          <div className="flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pe-4 ps-1.5 shadow-lift" dir={locale === "fa" ? "rtl" : "ltr"}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white">
              <IconPhone size={16} />
            </span>
            <span className="text-xs font-semibold text-ink">{t.trust[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
