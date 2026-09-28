"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/config/site";
import type { Dictionary } from "@/lib/i18n";
import { intlLocale } from "@/lib/i18n";
import { starPath } from "@/lib/star";
import type { Locale } from "@/lib/types";
import { IconAlert, IconArrow, IconCalendar, IconCheck, IconMail, IconPhone } from "../icons";

type T = Dictionary;

const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

export interface ConfirmedBooking {
  reference: string;
  start: string;
  end: string;
  email: string;
  location?: string;
  /** Sofort-Anruf: statt Termin wird die Telefonnummer groß angezeigt */
  instant?: boolean;
}

export interface PendingBooking {
  id: string;
  email: string;
  start: string;
  end: string;
  holdUntil?: string;
  /** Nur im Demo-Modus: Link, der sonst per E-Mail kommt */
  demoToken?: string;
}

export function formatWhen(locale: Locale, iso: string, endIso?: string) {
  const lc = intlLocale(locale);
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat(lc, { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat(lc, { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time.format(d)}${endIso ? ` – ${time.format(new Date(endIso))}` : ""}${locale === "de" ? " Uhr" : ""}`;
}

function Envelope() {
  return (
    <div className="perspective mx-auto w-40">
      <svg viewBox="0 0 160 120" className="w-full animate-float drop-shadow-[0_24px_30px_rgba(16,40,28,.22)]" aria-hidden="true">
        <defs>
          <linearGradient id="env-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2C8A5D" />
            <stop offset="1" stopColor="#154831" />
          </linearGradient>
        </defs>
        <rect x="10" y="30" width="140" height="84" rx="12" fill="url(#env-b)" />
        <rect x="22" y="8" width="116" height="80" rx="8" fill="#fff" />
        <path d={starPath(80, 40, 16, 0.64)} fill="none" stroke="#2C8A5D" strokeWidth="2" strokeLinejoin="round" />
        <rect x="46" y="64" width="68" height="5" rx="2.5" fill="#D9EEE1" />
        <rect x="56" y="74" width="48" height="5" rx="2.5" fill="#D9EEE1" />
        <path d="M10 44 L80 88 L150 44 V104 a10 10 0 0 1-10 10 H20 a10 10 0 0 1-10-10Z" fill="#1F7049" />
        <path d="M10 108 L64 74 M150 108 L96 74" stroke="#103827" strokeOpacity=".35" strokeWidth="2" />
        <circle cx="132" cy="30" r="14" fill="#fff" stroke="#D9EEE1" strokeWidth="2" />
        <path d="m125 30 5 5 9-10" stroke="#1F7049" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Nach dem Absenden: Bitte E-Mail bestätigen (Double-Opt-in) */
export function CheckEmail({ t, locale, pending, onChangeEmail }: { t: T; locale: Locale; pending: PendingBooking; onChangeEmail: () => void }) {
  const v = t.booking.verify;
  const [resent, setResent] = useState<"idle" | "sending" | "done">("idle");
  const time = pending.holdUntil
    ? new Intl.DateTimeFormat(intlLocale(locale), { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }).format(new Date(pending.holdUntil))
    : "";
  const resend = async () => {
    setResent("sending");
    try {
      await fetch("/api/bookings/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pending.id }) });
    } finally {
      setResent("done");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-6 text-center shadow-deep animate-fade-up sm:p-12">
      <div className="bg-girih pointer-events-none absolute inset-0 opacity-60 mask-fade-b" aria-hidden="true" />
      <div className="relative">
        <Envelope />
        <h2 className="mx-auto mt-6 max-w-xl text-2xl font-bold sm:text-3xl">{v.checkTitle}</h2>
        <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink-soft">
          {v.checkText.split("{email}")[0]}
          <b className="text-ink" dir="ltr">
            {pending.email}
          </b>
          {v.checkText.split("{email}")[1]}
        </p>
        <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">
          <IconCalendar size={16} /> {formatWhen(locale, pending.start, pending.end)}
        </p>
        {time && <p className="mt-3 text-sm text-ink-muted">{v.holdNote.replace("{time}", time)}</p>}


        {DEMO && pending.demoToken && (
          <div className="mx-auto mt-10 max-w-md text-start" dir="ltr">
            <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-ink-muted">{v.demoTitle}</div>
            <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-lift" style={{ transform: "perspective(900px) rotateX(4deg)" }}>
              <div className="h-1.5 bg-brand-600" />
              <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-2.5 text-xs text-ink-muted">
                <IconMail size={14} /> {site.email} → {pending.email}
              </div>
              <div className="bg-white px-5 py-5">
                <div className="text-sm font-bold text-ink">{site.brand}</div>
                <div className="mt-3 text-lg font-bold text-ink">{v.demoHello}</div>
                <div className="mt-1 text-sm text-ink-muted">{formatWhen("de", pending.start, pending.end)}</div>
                <Link href={`/${locale}/termin/bestaetigen?t=${pending.demoToken}`} className="btn-primary mt-4 !py-3 text-sm">
                  {v.demoButton} <IconArrow size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="btn-ghost !py-3 text-sm" onClick={resend} disabled={resent !== "idle"}>
            {resent === "done" ? (
              <>
                <IconCheck size={16} className="text-brand-600" /> {v.resent}
              </>
            ) : (
              v.resend
            )}
          </button>
          <button type="button" className="px-4 py-3 text-sm font-semibold text-brand-700 hover:underline" onClick={onChangeEmail}>
            {v.wrongEmail}
          </button>
        </div>
        <p className="mt-4 text-xs text-ink-muted">{v.spam}</p>
      </div>
    </div>
  );
}

/** Verbindlich gebucht */
export function SuccessCard({ t, locale, booking }: { t: T; locale: Locale; booking: ConfirmedBooking }) {
  const s = t.booking.success;
  const ics = useMemo(() => {
    const f = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Interpreting NBG//Buchung//DE",
      "BEGIN:VEVENT",
      `UID:${booking.reference}@interpreting-nbg.de`,
      `DTSTAMP:${f(new Date().toISOString())}`,
      `DTSTART:${f(booking.start)}`,
      `DTEND:${f(booking.end)}`,
      `SUMMARY:Dolmetschtermin ${booking.reference} (${site.brand})`,
      `LOCATION:${(booking.location ?? "Telefon").replace(/,/g, "\\,")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
  }, [booking]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-6 text-center shadow-deep animate-fade-up sm:p-14">
      <div className="bg-girih pointer-events-none absolute inset-0 opacity-70 mask-fade-b" aria-hidden="true" />
      <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-white shadow-lift ring-8 ring-brand-50">
        <IconCheck size={38} strokeWidth={2.4} />
      </div>
      <h2 className="relative mx-auto mt-8 max-w-xl text-3xl font-bold sm:text-4xl">{s.title}</h2>
      <p className="relative mx-auto mt-4 max-w-lg text-lg leading-relaxed text-ink-soft">
        {s.text.split("{email}")[0]}
        <b dir="ltr">{booking.email}</b>
        {s.text.split("{email}")[1]}
      </p>
      <div className="relative mx-auto mt-8 inline-flex flex-col gap-1 rounded-2xl border border-line bg-paper px-6 py-4 text-start">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted rtl:tracking-normal">{s.reference}</span>
        <span className="text-xl font-bold tracking-wide text-brand-700" dir="ltr">
          {booking.reference}
        </span>
        {!booking.instant && <span className="text-sm text-ink-soft">{formatWhen(locale, booking.start, booking.end)}</span>}
        {booking.location && (
          <span className="text-sm text-ink-muted" dir="ltr">
            {booking.location}
          </span>
        )}
      </div>
      {booking.instant && (
        <a href={site.phoneHref} className="btn-primary relative mx-auto mt-8 !px-8 !py-5 !text-lg" dir="ltr">
          <IconPhone size={22} /> {site.phone}
        </a>
      )}
      <div className="relative mt-9 flex flex-wrap justify-center gap-3">
        {DEMO ? (
          <a href="beispiel-rechnung.pdf" target="_blank" rel="noopener" className="btn-primary">
            <IconMail size={18} /> {s.sampleInvoice}
          </a>
        ) : (
          <a href={ics} download={`${booking.reference}.ics`} className="btn-primary">
            <IconCalendar size={18} /> {s.addToCalendar}
          </a>
        )}
        <Link href={`/${locale}`} className="btn-ghost">
          {s.home}
        </Link>
      </div>
    </div>
  );
}

/** Seite hinter dem E-Mail-Link: bestätigt den Termin */
export function VerifyBooking({ t, locale, token }: { t: T; locale: Locale; token: string }) {
  const v = t.booking.verify;
  const [state, setState] = useState<{ kind: "loading" } | { kind: "ok"; booking: ConfirmedBooking } | { kind: "invalid" | "taken" }>({ kind: "loading" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    fetch("/api/bookings/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (res) => {
        if (res.ok) setState({ kind: "ok", booking: await res.json() });
        else setState({ kind: res.status === 409 ? "taken" : "invalid" });
      })
      .catch(() => setState({ kind: "invalid" }));
  }, [token]);

  if (state.kind === "ok") return <SuccessCard t={t} locale={locale} booking={state.booking} />;
  if (state.kind === "loading") {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-[2rem] border border-line bg-white p-10 text-center shadow-lift">
        <div>
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          <p className="mt-5 text-lg font-semibold text-ink">{v.verifying}</p>
        </div>
      </div>
    );
  }
  const taken = state.kind === "taken";
  return (
    <div className="rounded-[2rem] border border-line bg-white p-8 text-center shadow-lift sm:p-12">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700">
        <IconAlert size={30} />
      </div>
      <h2 className="mx-auto mt-6 max-w-lg text-2xl font-bold">{taken ? v.takenTitle : v.invalidTitle}</h2>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">{taken ? v.takenText : v.invalidText}</p>
      <Link href={`/${locale}/termin`} className="btn-primary mt-8">
        {v.bookAgain} <IconArrow size={18} />
      </Link>
    </div>
  );
}
