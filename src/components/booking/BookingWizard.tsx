"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { availabilityConfig } from "@/config/availability";
import { site } from "@/config/site";
import { detectCategory, isValidAddress } from "@/lib/address";
import { emailRe, isPhone } from "@/lib/validators";
import type { Dictionary } from "@/lib/i18n";
import { intlLocale } from "@/lib/i18n";
import type { AppointmentCategory, Language, Locale, PostalAddress, ServiceType } from "@/lib/types";
import { IconAlert, IconArrow, IconCalendar, IconCheck, IconPhone, IconPin } from "../icons";
import { AddressField } from "./AddressField";
import { CheckEmail, formatWhen, type PendingBooking } from "./BookingDone";
import { CalendarPicker } from "./CalendarPicker";

type T = Dictionary;

const STORAGE_KEY = "inbg.contact.v2";

interface Remembered {
  contact: { name: string; email: string; phone: string };
  billingAddress?: PostalAddress | null;
  language?: Language;
}

function readRemembered(): Remembered | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Remembered) : null;
  } catch {
    return null;
  }
}

function writeRemembered(r: Remembered) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  } catch {
    /* Speicher nicht verfügbar – kein Problem */
  }
}

/**
 * Buchung in zwei Schritten:
 *  1. Wie (Telefon / vor Ort) · Sprache · Termin
 *  2. Adresse · Name · E-Mail · Telefon → Absenden
 * Alles Weitere (Einrichtung, Anlass, Rückrufnummer, Klient:in) wird automatisch abgeleitet.
 */
export function BookingWizard({
  locale,
  t,
  initialService,
  initialCategory,
}: {
  locale: Locale;
  t: T;
  initialService?: ServiceType;
  initialCategory?: AppointmentCategory;
}) {
  const s = t.booking.simple;
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [service, setService] = useState<ServiceType | null>(initialService ?? null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [duration, setDuration] = useState(60);
  const [start, setStart] = useState<string | null>(null);
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  const [address, setAddress] = useState<PostalAddress | null>(null);
  const [billingSame, setBillingSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState<PostalAddress | null>(null);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState(false);
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Wiederkehrende Kund:innen: Daten vom letzten Mal vorausfüllen
  useEffect(() => {
    const r = readRemembered();
    if (!r) return;
    setContact((c) => ({ ...c, ...r.contact }));
    if (r.language) setLanguage(r.language);
    if (r.billingAddress && isValidAddress(r.billingAddress)) setBillingAddress(r.billingAddress);
  }, []);

  // Telefonisch: gespeicherte Adresse direkt als Rechnungsadresse nutzen
  useEffect(() => {
    if (service === "phone" && !address && billingAddress) setAddress(billingAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  useEffect(() => {
    if (!service) return;
    const options = availabilityConfig.durations[service];
    if (!options.includes(duration)) setDuration(options.includes(60) ? 60 : options[0]);
    setStart(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  /* ---------------- Prüfung ---------------- */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!isValidAddress(address)) e.address = t.booking.addressField.missing;
    if (service === "onsite" && !billingSame && !isValidAddress(billingAddress)) e.billing = t.booking.addressField.missing;
    if (contact.name.trim().length < 2) e.name = t.booking.errors.name;
    if (!emailRe.test(contact.email.trim())) e.email = t.booking.errors.email;
    if (!isPhone(contact.phone)) e.phone = t.booking.errors.phone;
    return e;
  }, [address, service, billingSame, billingAddress, contact, t]);

  const step1Valid = !!service && !!language && !!start;
  const step2Valid = Object.keys(errors).length === 0;
  const err = (k: string) => (touched[k] ? errors[k] : undefined);
  const touch = (k: string) => () => setTouched((x) => ({ ...x, [k]: true }));

  /* ---------------- Absenden ---------------- */
  const submit = async () => {
    if (!step2Valid || !service || !language || !start || !address) return;
    setSubmitting(true);
    setSubmitError(null);
    const onsite = service === "onsite";
    const category: AppointmentCategory = detectCategory(address.placeName) ?? initialCategory ?? "other";
    const payload = {
      locale,
      service,
      language,
      category,
      durationMinutes: duration,
      start,
      clientName: contact.name.trim(),
      onsite: onsite ? { address, institution: address.placeName || undefined } : undefined,
      phoneSession: onsite ? undefined : { callNumber: contact.phone.trim() },
      contact: { name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() },
      billingSameAsAppointment: onsite && billingSame,
      billingAddress: onsite ? (billingSame ? undefined : billingAddress) : address,
      notes: notes.trim() || undefined,
      acceptTerms: true,
      website: honeypot,
    };
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.status === 409) {
        setSlotError(true);
        setStart(null);
        setCalendarRefresh((n) => n + 1);
        setStep(0);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setPending(await res.json());
      writeRemembered({
        contact: { ...contact },
        billingAddress: onsite ? (billingSame ? address : billingAddress) : address,
        language,
      });
      setStep(2);
    } catch {
      setSubmitError(t.booking.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  const lc = intlLocale(locale);
  const fmtDuration = (m: number) => (m < 60 ? `${m.toLocaleString(lc)} ${t.common.minutes}` : `${(m / 60).toLocaleString(lc)} ${t.common.hours}`);
  const endOf = (iso: string) => new Date(new Date(iso).getTime() + duration * 60000).toISOString();

  if (step === 2 && pending) {
    return <CheckEmail t={t} locale={locale} pending={pending} onChangeEmail={() => (setPending(null), setStep(1))} />;
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <Progress labels={[s.step1, s.step2]} current={step} onBack={() => setStep(0)} />

      <div className="mt-6 rounded-[2rem] border border-line bg-white p-5 shadow-lift sm:p-8 lg:p-10">
        {/* ================= Schritt 1: Termin ================= */}
        {step === 0 && (
          <div className="animate-fade-up space-y-9">
            <Block label={s.how}>
              <div className="grid grid-cols-2 gap-3">
                {(["phone", "onsite"] as const).map((k) => {
                  const Icon = k === "phone" ? IconPhone : IconPin;
                  const active = service === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setService(k)}
                      aria-pressed={active}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition-all duration-300 sm:p-5 ${
                        active ? "border-brand-500 bg-white shadow-[0_0_0_4px_rgba(44,138,93,.14)]" : "border-line bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
                      }`}
                    >
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${active ? "bg-brand-600 text-white" : "bg-white text-brand-700 ring-1 ring-brand-100"}`}>
                        <Icon size={22} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold leading-tight sm:text-base">{t.booking.service[k].title}</span>
                        <span className="mt-0.5 hidden text-[13px] leading-snug text-ink-muted sm:block">{t.booking.service[k].text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Block>

            <Block label={s.language}>
              <div className="flex flex-wrap gap-2.5">
                {(["dari", "farsi", "pashto"] as const).map((l) => (
                  <Chip key={l} active={language === l} onClick={() => setLanguage(l)}>
                    {t.languages[l]}
                  </Chip>
                ))}
              </div>
            </Block>

            <Block
              label={s.when}
              aside={
                service && (
                  <label className="flex items-center gap-2 text-sm text-ink-muted">
                    {s.duration}
                    <select
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand-400"
                      value={duration}
                      onChange={(e) => (setDuration(Number(e.target.value)), setStart(null))}
                    >
                      {availabilityConfig.durations[service].map((m) => (
                        <option key={m} value={m}>
                          {fmtDuration(m)}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              }
            >
              {slotError && (
                <div className="mb-4 flex items-start gap-3 rounded-2xl border border-busy-line bg-white px-4 py-3 text-sm text-busy" role="alert">
                  <IconAlert size={18} className="mt-0.5 shrink-0" /> {t.booking.errors.slotTaken}
                </div>
              )}
              {service ? (
                <CalendarPicker
                  service={service}
                  duration={duration}
                  selected={start}
                  onSelect={(x) => (setStart(x), setSlotError(false))}
                  t={t.booking.calendar}
                  locale={locale}
                  refreshKey={calendarRefresh}
                />
              ) : (
                <div className="grid min-h-[140px] place-items-center rounded-3xl border border-dashed border-line text-center text-sm text-ink-muted">{s.pickFirst}</div>
              )}
            </Block>
          </div>
        )}

        {/* ================= Schritt 2: Ihre Daten ================= */}
        {step === 1 && service && start && (
          <div className="animate-fade-up space-y-8">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex w-full items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-start shadow-soft transition hover:border-brand-200"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                <IconCalendar size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-ink">{formatWhen(locale, start, endOf(start))}</span>
                <span className="block text-sm text-ink-muted">
                  {t.booking.service[service].title} · {language && t.languages[language]}
                </span>
              </span>
              <span className="text-sm font-semibold text-brand-700">{t.common.edit}</span>
            </button>

            <div>
              <AddressField
                label={service === "onsite" ? s.addressOnsite : s.addressPhone}
                placeholder={t.booking.details.addressPlaceholder}
                value={address}
                onChange={setAddress}
                t={t.booking.addressField}
                locale={locale}
              />
              {service === "onsite" && (
                <label className="mt-4 flex cursor-pointer items-center gap-3">
                  <input type="checkbox" className="peer sr-only" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-line bg-white text-white transition peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/25">
                    <IconCheck size={14} strokeWidth={3} />
                  </span>
                  <span className="text-[15px] text-ink-soft">{t.booking.details.billingSame}</span>
                </label>
              )}
              {service === "onsite" && !billingSame && (
                <div className="mt-5 animate-fade-up">
                  <AddressField
                    label={t.booking.details.billingAddress}
                    placeholder={t.booking.details.addressPlaceholder}
                    value={billingAddress}
                    onChange={setBillingAddress}
                    t={t.booking.addressField}
                    locale={locale}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Field label={s.name} error={err("name")}>
                <input className={`field ${err("name") ? "field-invalid" : ""}`} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} onBlur={touch("name")} autoComplete="name" />
              </Field>
              <Field label={s.email} error={err("email")}>
                <input className={`field ${err("email") ? "field-invalid" : ""}`} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} onBlur={touch("email")} type="email" inputMode="email" autoComplete="email" dir="ltr" />
              </Field>
              <Field label={s.phone} error={err("phone")}>
                <input className={`field ${err("phone") ? "field-invalid" : ""}`} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} onBlur={touch("phone")} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="0911 …" />
              </Field>
            </div>

            {showNotes ? (
              <Field label={t.booking.details.notes}>
                <textarea className="field min-h-[88px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.booking.details.notesPlaceholder} autoFocus />
              </Field>
            ) : (
              <button type="button" onClick={() => setShowNotes(true)} className="text-sm font-semibold text-brand-700 hover:underline">
                {s.addNote}
              </button>
            )}
            <input tabIndex={-1} autoComplete="off" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} aria-hidden="true" />

            {submitError && (
              <div className="flex items-start gap-3 rounded-2xl border border-busy-line bg-white px-4 py-3 text-sm text-busy" role="alert">
                <IconAlert size={18} className="mt-0.5 shrink-0" /> {submitError}
              </div>
            )}
          </div>
        )}

        {/* ================= Aktion ================= */}
        <div className="mt-9 border-t border-line pt-6">
          {step === 0 ? (
            <button type="button" className="btn-primary w-full !py-4 !text-base sm:w-auto sm:float-end sm:!px-10" disabled={!step1Valid} onClick={() => setStep(1)}>
              {s.next} <IconArrow size={18} />
            </button>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] leading-relaxed text-ink-muted sm:max-w-sm">
                {s.terms1}{" "}
                <a href={site.agbUrl} target="_blank" rel="noopener" className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2">
                  {s.termsLink}
                </a>{" "}
                {s.terms2}{" "}
                <a href={`/${locale}/datenschutz`} target="_blank" rel="noopener" className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2">
                  {s.privacyLink}
                </a>
                {s.terms3}
              </p>
              <button type="button" className="btn-primary w-full !py-4 !text-base sm:w-auto sm:!px-10" onClick={submit} disabled={!step2Valid || submitting}>
                {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <IconCheck size={18} strokeWidth={2.4} />}
                {submitting ? t.booking.review.submitting : s.submit}
              </button>
            </div>
          )}
          <div className="clear-both" />
          {step === 0 && !step1Valid && <p className="mt-3 text-center text-[13px] text-ink-muted sm:text-end">{s.hint1}</p>}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {s.questions}{" "}
        <a href={site.phoneHref} className="font-semibold text-brand-700" dir="ltr">
          {site.phone}
        </a>
      </p>
    </div>
  );
}

/* ================= Hilfskomponenten ================= */

function Progress({ labels, current, onBack }: { labels: string[]; current: number; onBack: () => void }) {
  return (
    <ol className="mx-auto flex max-w-md items-center gap-3">
      {labels.map((l, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={l} className="flex flex-1 items-center gap-3">
            <button type="button" disabled={!done} onClick={onBack} className="flex items-center gap-2.5 disabled:cursor-default">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-all duration-500 ${
                  active ? "bg-brand-600 text-white shadow-lift ring-4 ring-brand-100" : done ? "bg-white text-brand-700 ring-1 ring-brand-200" : "bg-white text-ink-faint ring-1 ring-line"
                }`}
              >
                {done ? <IconCheck size={16} strokeWidth={2.6} /> : i + 1}
              </span>
              <span className={`whitespace-nowrap text-sm font-semibold ${active ? "text-ink" : done ? "text-brand-700" : "text-ink-faint"}`}>{l}</span>
            </button>
            {i < labels.length - 1 && (
              <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-line">
                <span className={`block h-full origin-left rounded-full bg-brand-400 transition-transform duration-700 rtl:origin-right ${done ? "scale-x-100" : "scale-x-0"}`} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Block({ label, aside, children }: { label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">{label}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[15px] font-semibold transition-all duration-200 ${
        active ? "border-brand-600 bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgba(31,112,73,.8)]" : "border-line bg-white text-ink-soft hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-800"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block min-w-0">
      <span className="field-label">{label}</span>
      {children}
      {error && (
        <span className="field-error" role="alert">
          <IconAlert size={16} className="mt-px shrink-0" /> {error}
        </span>
      )}
    </label>
  );
}
