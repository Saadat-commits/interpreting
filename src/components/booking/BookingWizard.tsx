"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { availabilityConfig } from "@/config/availability";
import { site } from "@/config/site";
import { detectCategory, formatAddress, isValidAddress } from "@/lib/address";
import { emailRe, isPhone } from "@/lib/validators";
import type { Dictionary } from "@/lib/i18n";
import { intlLocale } from "@/lib/i18n";
import type { AppointmentCategory, Language, Locale, PostalAddress, ServiceType } from "@/lib/types";
import { IconAlert, IconArrow, IconCalendar, IconCheck, IconPhone, IconPin, categoryIcons } from "../icons";
import { AddressField } from "./AddressField";
import { CalendarPicker } from "./CalendarPicker";

type T = Dictionary;

const STORAGE_KEY = "inbg.contact.v1";

interface Remembered {
  contact: { name: string; organisation: string; email: string; phone: string };
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

export function BookingWizard({ locale, t, initialService }: { locale: Locale; t: T; initialService?: ServiceType }) {
  const b = t.booking;
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ServiceType | null>(initialService ?? null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [category, setCategory] = useState<AppointmentCategory | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [start, setStart] = useState<string | null>(null);
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  const [clientName, setClientName] = useState("");
  const [onsiteAddress, setOnsiteAddress] = useState<PostalAddress | null>(null);
  const [institution, setInstitution] = useState("");
  const [institutionAuto, setInstitutionAuto] = useState(false);
  const [caseWorker, setCaseWorker] = useState("");
  const [callNumber, setCallNumber] = useState("");
  const [callNumberEdited, setCallNumberEdited] = useState(false);
  const [contact, setContact] = useState({ name: "", organisation: "", email: "", phone: "" });
  const [billingSame, setBillingSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState<PostalAddress | null>(null);
  const [notes, setNotes] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [remembered, setRemembered] = useState(false);
  const [categoryAuto, setCategoryAuto] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState(false);
  const [result, setResult] = useState<{ reference: string; start: string; end: string; email: string } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Wiederkehrende Kund:innen: Kontaktdaten vorausfüllen
  useEffect(() => {
    const r = readRemembered();
    if (!r) return;
    setContact((c) => ({ ...c, ...r.contact }));
    if (r.billingAddress && isValidAddress(r.billingAddress)) setBillingAddress(r.billingAddress);
    if (r.language) setLanguage(r.language);
    setRemembered(true);
  }, []);

  // Bei telefonischer Leistung: Rufnummer automatisch aus Kontakt übernehmen
  useEffect(() => {
    if (!callNumberEdited) setCallNumber(contact.phone);
  }, [contact.phone, callNumberEdited]);

  // Adresse gewählt → Einrichtung und Terminart automatisch erkennen
  useEffect(() => {
    if (!onsiteAddress?.placeName) return;
    if (!institution || institutionAuto) {
      setInstitution(onsiteAddress.placeName);
      setInstitutionAuto(true);
    }
    const detected = detectCategory(onsiteAddress.placeName);
    if (detected && (!category || category === "other")) {
      setCategory(detected);
      setCategoryAuto(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onsiteAddress]);

  // Dauer an Leistung anpassen
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

  /* ---------------- Validierung ---------------- */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (clientName.trim().length < 2) e.clientName = b.errors.name;
    if (service === "onsite" && !isValidAddress(onsiteAddress)) e.onsiteAddress = t.booking.addressField.pick;
    if (service === "phone" && !isPhone(callNumber)) e.callNumber = b.errors.phone;
    if (contact.name.trim().length < 2) e.contactName = b.errors.name;
    if (!emailRe.test(contact.email.trim())) e.email = b.errors.email;
    if (!isPhone(contact.phone)) e.phone = b.errors.phone;
    const needsBilling = service === "phone" || !billingSame;
    if (needsBilling && !isValidAddress(billingAddress)) e.billingAddress = t.booking.addressField.pick;
    return e;
  }, [clientName, service, onsiteAddress, callNumber, contact, billingSame, billingAddress, b, t]);

  const stepValid = [
    !!service && !!language && !!category && !!duration,
    !!start,
    Object.keys(errors).length === 0,
    acceptTerms,
  ];

  const showErr = (k: string) => (touched[k] || attempted) && errors[k];
  const touch = (k: string) => () => setTouched((s) => ({ ...s, [k]: true }));

  const next = () => {
    if (!stepValid[step]) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    setStep((s) => s + 1);
  };

  /* ---------------- Absenden ---------------- */
  const submit = async () => {
    if (!acceptTerms) {
      setAttempted(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const billing = service === "onsite" && billingSame ? undefined : billingAddress ?? undefined;
    const payload = {
      locale,
      service,
      language,
      category,
      durationMinutes: duration,
      start,
      clientName: clientName.trim(),
      onsite:
        service === "onsite"
          ? { address: onsiteAddress, institution: institution.trim() || undefined, caseWorker: caseWorker.trim() || undefined }
          : undefined,
      phoneSession: service === "phone" ? { callNumber: callNumber.trim() } : undefined,
      contact: {
        name: contact.name.trim(),
        organisation: contact.organisation.trim() || undefined,
        email: contact.email.trim(),
        phone: contact.phone.trim(),
      },
      billingSameAsAppointment: service === "onsite" && billingSame,
      billingAddress: billing,
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
        setStep(1);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setResult(await res.json());
      writeRemembered({
        contact: { ...contact },
        billingAddress: service === "onsite" && billingSame ? onsiteAddress : billingAddress,
        language: language ?? undefined,
      });
      setStep(4);
    } catch {
      setSubmitError(b.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Formatierung ---------------- */
  const lc = intlLocale(locale);
  const fmtWhen = (iso: string, endIso?: string) => {
    const d = new Date(iso);
    const day = new Intl.DateTimeFormat(lc, { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
    const time = new Intl.DateTimeFormat(lc, { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
    return `${day} · ${time.format(d)}${endIso ? ` – ${time.format(new Date(endIso))}` : ""}${locale === "de" ? " Uhr" : ""}`;
  };
  const fmtDuration = (m: number) =>
    m < 60 ? `${m.toLocaleString(lc)} ${t.common.minutes}` : `${(m / 60).toLocaleString(lc)} ${t.common.hours}`;
  const endOf = (iso: string) => new Date(new Date(iso).getTime() + duration * 60000).toISOString();

  /* ---------------- Erfolg ---------------- */
  if (step === 4 && result) {
    return <Success t={t} locale={locale} result={result} when={fmtWhen(result.start, result.end)} service={service!} address={onsiteAddress} institution={institution} />;
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <Stepper steps={b.steps} current={step} onJump={(i) => i < step && setStep(i)} />

      <div className="mt-8 rounded-[2rem] border border-line bg-white/80 p-5 shadow-lift backdrop-blur sm:p-8 lg:p-10">
        {/* ---------- Schritt 1: Leistung ---------- */}
        {step === 0 && (
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold sm:text-3xl">{b.service.title}</h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {(["phone", "onsite"] as const).map((s) => {
                const Icon = s === "phone" ? IconPhone : IconPin;
                const active = service === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setService(s)}
                    aria-pressed={active}
                    className={`group relative flex items-start gap-4 rounded-3xl border p-6 text-start transition-all duration-300 ${
                      active ? "border-brand-500 bg-brand-50/70 shadow-[0_0_0_4px_rgba(44,138,93,.12)]" : "border-line bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                    }`}
                  >
                    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition ${active ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"}`}>
                      <Icon size={26} />
                    </span>
                    <span>
                      <span className="block text-lg font-bold">{b.service[s].title}</span>
                      <span className="mt-1 block text-[15px] leading-relaxed text-ink-muted">{b.service[s].text}</span>
                    </span>
                    <span className={`absolute end-5 top-5 grid h-6 w-6 place-items-center rounded-full border-2 transition ${active ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>
                      {active && <IconCheck size={14} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <Group label={b.service.language} error={attempted && !language}>
              {(["dari", "farsi", "pashto"] as const).map((l) => (
                <Chip key={l} active={language === l} onClick={() => setLanguage(l)}>
                  {t.languages[l]}
                </Chip>
              ))}
            </Group>

            <Group label={b.service.category} error={attempted && !category}>
              {(Object.keys(t.categories) as AppointmentCategory[]).map((c) => {
                const Icon = categoryIcons[c];
                return (
                  <Chip key={c} active={category === c} onClick={() => (setCategory(c), setCategoryAuto(false))}>
                    <Icon size={17} /> {t.categories[c]}
                  </Chip>
                );
              })}
            </Group>

            {service && (
              <Group label={b.service.duration}>
                {availabilityConfig.durations[service].map((m) => (
                  <Chip key={m} active={duration === m} onClick={() => (setDuration(m), setStart(null))}>
                    {fmtDuration(m)}
                  </Chip>
                ))}
              </Group>
            )}
          </div>
        )}

        {/* ---------- Schritt 2: Termin ---------- */}
        {step === 1 && service && (
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold sm:text-3xl">{b.calendar.title}</h2>
            <p className="mt-2 text-ink-muted">
              {b.service[service].title} · {language && t.languages[language]} · {fmtDuration(duration)}
            </p>
            {slotError && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-busy-line bg-busy-bg px-4 py-3 text-sm text-busy" role="alert">
                <IconAlert size={18} className="mt-0.5 shrink-0" /> {b.errors.slotTaken}
              </div>
            )}
            <div className="mt-7">
              <CalendarPicker
                service={service}
                duration={duration}
                selected={start}
                onSelect={(s) => (setStart(s), setSlotError(false))}
                t={b.calendar}
                locale={locale}
                refreshKey={calendarRefresh}
              />
            </div>
            {start && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-brand-50 px-5 py-4 text-[15px] font-semibold text-brand-800">
                <IconCalendar size={20} /> {b.calendar.selected}: {fmtWhen(start, endOf(start))}
              </div>
            )}
          </div>
        )}

        {/* ---------- Schritt 3: Angaben ---------- */}
        {step === 2 && service && (
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold sm:text-3xl">{b.details.title}</h2>
            {remembered && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-800">
                <IconCheck size={16} strokeWidth={2.4} /> {b.details.remembered}
              </p>
            )}

            <div className="mt-8 grid gap-10">
              {/* Terminort / Anruf */}
              <Section title={service === "onsite" ? b.details.appointment : b.service.phone.title}>
                <div className="grid gap-5 sm:grid-cols-2">
                  {service === "onsite" && (
                    <>
                      <div className="sm:col-span-2">
                        <AddressField
                          label={b.details.address}
                          placeholder={b.details.addressPlaceholder}
                          value={onsiteAddress}
                          onChange={(a) => (setOnsiteAddress(a), setTouched((s) => ({ ...s, onsiteAddress: true })))}
                          t={b.addressField}
                          locale={locale}
                          autoFocus
                        />
                        {attempted && errors.onsiteAddress && <ErrorText>{errors.onsiteAddress}</ErrorText>}
                      </div>
                      <Field label={b.details.institution} optional={t.common.optional} badge={institutionAuto && institution ? b.details.autoFilled : undefined}>
                        <input
                          className="field"
                          value={institution}
                          onChange={(e) => (setInstitution(e.target.value), setInstitutionAuto(false))}
                          placeholder={b.details.institutionPlaceholder}
                          autoComplete="organization"
                        />
                      </Field>
                      <Field label={b.details.caseWorker} optional={t.common.optional}>
                        <input className="field" value={caseWorker} onChange={(e) => setCaseWorker(e.target.value)} placeholder={b.details.caseWorkerPlaceholder} />
                      </Field>
                      {categoryAuto && category && (
                        <p className="-mt-2 flex items-center gap-2 text-sm text-ink-muted sm:col-span-2">
                          <IconCheck size={15} className="text-brand-600" /> {b.service.category}: <b className="text-ink">{t.categories[category]}</b> · {b.details.autoFilled}
                        </p>
                      )}
                    </>
                  )}
                  <Field label={b.details.clientName} hint={b.details.clientHint} error={showErr("clientName")}>
                    <input className={`field ${showErr("clientName") ? "field-invalid" : ""}`} value={clientName} onChange={(e) => setClientName(e.target.value)} onBlur={touch("clientName")} autoComplete="off" />
                  </Field>
                  {service === "phone" && (
                    <Field
                      label={b.details.callNumber}
                      hint={b.details.callHint}
                      error={showErr("callNumber")}
                      badge={!callNumberEdited && callNumber ? b.details.autoFilled : undefined}
                    >
                      <input
                        className={`field ${showErr("callNumber") ? "field-invalid" : ""}`}
                        value={callNumber}
                        onChange={(e) => (setCallNumber(e.target.value), setCallNumberEdited(true))}
                        onBlur={touch("callNumber")}
                        type="tel"
                        inputMode="tel"
                        dir="ltr"
                        placeholder="+49 …"
                      />
                    </Field>
                  )}
                </div>
              </Section>

              {/* Kontakt */}
              <Section title={b.details.contactTitle}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={b.details.contactName} error={showErr("contactName")}>
                    <input className={`field ${showErr("contactName") ? "field-invalid" : ""}`} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} onBlur={touch("contactName")} autoComplete="name" />
                  </Field>
                  <Field label={b.details.organisation} optional={t.common.optional}>
                    <input className="field" value={contact.organisation} onChange={(e) => setContact({ ...contact, organisation: e.target.value })} placeholder={b.details.organisationPlaceholder} autoComplete="organization" />
                  </Field>
                  <Field label={b.details.email} error={showErr("email")}>
                    <input className={`field ${showErr("email") ? "field-invalid" : ""}`} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} onBlur={touch("email")} type="email" inputMode="email" autoComplete="email" dir="ltr" />
                  </Field>
                  <Field label={b.details.phone} error={showErr("phone")}>
                    <input className={`field ${showErr("phone") ? "field-invalid" : ""}`} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} onBlur={touch("phone")} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="+49 …" />
                  </Field>
                </div>
              </Section>

              {/* Rechnung */}
              <Section title={b.details.billingTitle}>
                {service === "onsite" && (
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3.5 transition hover:border-brand-200">
                    <input type="checkbox" className="peer sr-only" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-line bg-white text-white transition peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/25">
                      <IconCheck size={14} strokeWidth={3} />
                    </span>
                    <span className="text-[15px] font-semibold">{b.details.billingSame}</span>
                  </label>
                )}
                {(service === "phone" || !billingSame) && (
                  <div className={service === "onsite" ? "mt-5 animate-fade-up" : ""}>
                    <AddressField
                      label={b.details.billingAddress}
                      placeholder={b.details.addressPlaceholder}
                      value={billingAddress}
                      onChange={setBillingAddress}
                      t={b.addressField}
                      locale={locale}
                    />
                    {attempted && errors.billingAddress && <ErrorText>{errors.billingAddress}</ErrorText>}
                  </div>
                )}
              </Section>

              <Field label={b.details.notes} optional={t.common.optional}>
                <textarea className="field min-h-[96px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={b.details.notesPlaceholder} />
              </Field>
              <input tabIndex={-1} autoComplete="off" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} aria-hidden="true" />
            </div>
          </div>
        )}

        {/* ---------- Schritt 4: Prüfen ---------- */}
        {step === 3 && service && start && (
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold sm:text-3xl">{b.review.title}</h2>
            <dl className="mt-7 divide-y divide-line overflow-hidden rounded-3xl border border-line">
              <ReviewRow label={b.review.service} onEdit={() => setStep(0)} editLabel={t.common.edit}>
                {b.service[service].title} · {language && t.languages[language]} · {category && t.categories[category]}
              </ReviewRow>
              <ReviewRow label={b.review.when} onEdit={() => setStep(1)} editLabel={t.common.edit}>
                {fmtWhen(start, endOf(start))}
              </ReviewRow>
              {service === "onsite" && onsiteAddress ? (
                <ReviewRow label={b.review.where} onEdit={() => setStep(2)} editLabel={t.common.edit}>
                  <span dir="ltr">
                    {institution && <b>{institution}, </b>}
                    {formatAddress(onsiteAddress)}
                    {caseWorker && ` · ${caseWorker}`}
                  </span>
                </ReviewRow>
              ) : (
                <ReviewRow label={b.details.callNumber} onEdit={() => setStep(2)} editLabel={t.common.edit}>
                  <span dir="ltr">{callNumber}</span>
                </ReviewRow>
              )}
              <ReviewRow label={b.review.client} onEdit={() => setStep(2)} editLabel={t.common.edit}>
                {clientName}
              </ReviewRow>
              <ReviewRow label={b.review.contact} onEdit={() => setStep(2)} editLabel={t.common.edit}>
                {contact.name}
                {contact.organisation && ` · ${contact.organisation}`}
                <br />
                <span className="text-ink-muted" dir="ltr">
                  {contact.email} · {contact.phone}
                </span>
              </ReviewRow>
              <ReviewRow label={b.review.billing} onEdit={() => setStep(2)} editLabel={t.common.edit}>
                {service === "onsite" && billingSame ? (
                  <span className="text-ink-muted">{b.review.sameAsAppointment}</span>
                ) : (
                  billingAddress && <span dir="ltr">{formatAddress(billingAddress)}</span>
                )}
              </ReviewRow>
            </dl>

            <p className="mt-5 text-sm text-ink-muted">{b.review.invoiceNote}</p>

            <label className={`mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${attempted && !acceptTerms ? "border-busy/50 bg-busy-bg/40" : "border-line bg-paper hover:border-brand-200"}`}>
              <input type="checkbox" className="peer sr-only" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-line bg-white text-white transition peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/25">
                <IconCheck size={14} strokeWidth={3} />
              </span>
              <span className="text-[15px] leading-relaxed text-ink-soft">
                {b.review.terms1}{" "}
                <a href="/agb.pdf" target="_blank" rel="noopener" className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2">
                  {b.review.termsLink}
                </a>{" "}
                {b.review.terms2}{" "}
                <a href={`/${locale}/datenschutz`} target="_blank" rel="noopener" className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2">
                  {b.review.privacyLink}
                </a>{" "}
                {b.review.terms3}
              </span>
            </label>
            {attempted && !acceptTerms && <ErrorText>{b.errors.terms}</ErrorText>}
            {submitError && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-busy-line bg-busy-bg px-4 py-3 text-sm text-busy" role="alert">
                <IconAlert size={18} className="mt-0.5 shrink-0" /> {submitError}
              </div>
            )}
          </div>
        )}

        {/* ---------- Navigation ---------- */}
        <div className="mt-10 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          {step > 0 ? (
            <button type="button" className="btn-ghost" onClick={() => (setAttempted(false), setStep((s) => s - 1))}>
              <IconArrow size={18} className="rotate-180" /> {t.common.back}
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <button type="button" className="btn-primary !px-8" onClick={next} disabled={!stepValid[step]}>
                {t.common.next} <IconArrow size={18} />
              </button>
            </div>
          ) : (
            <button type="button" className="btn-primary !px-8" onClick={submit} disabled={submitting}>
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> {b.review.submitting}
                </>
              ) : (
                <>
                  <IconCheck size={18} strokeWidth={2.4} /> {b.review.submit}
                </>
              )}
            </button>
          )}
        </div>
        {step === 2 && Object.keys(touched).length > 0 && Object.keys(errors).length > 0 && (
          <p className="mt-3 flex items-center justify-end gap-1.5 text-end text-sm text-ink-muted" aria-live="polite">
            <IconAlert size={15} className="shrink-0" /> {Object.values(errors)[0]}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {t.chat.subtitle}{" "}
        <a href={site.phoneHref} className="font-semibold text-brand-700" dir="ltr">
          {site.phone}
        </a>
      </p>
    </div>
  );
}

/* ================= Hilfskomponenten ================= */

function Stepper({ steps, current, onJump }: { steps: string[]; current: number; onJump: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={!done}
              className="flex items-center gap-2.5 disabled:cursor-default"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-all duration-500 ${
                  active ? "bg-brand-600 text-white shadow-lift ring-4 ring-brand-100" : done ? "bg-brand-100 text-brand-700" : "border border-line bg-white text-ink-faint"
                }`}
              >
                {done ? <IconCheck size={16} strokeWidth={2.6} /> : i + 1}
              </span>
              <span className={`hidden text-sm font-semibold sm:inline ${active ? "text-ink" : done ? "text-brand-700" : "text-ink-faint"}`}>{s}</span>
            </button>
            {i < steps.length - 1 && (
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

function Group({ label, children, error }: { label: string; children: ReactNode; error?: boolean }) {
  return (
    <fieldset className="mt-8">
      <legend className={`mb-3 text-sm font-semibold ${error ? "text-busy" : "text-ink"}`}>{label}</legend>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </fieldset>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[15px] font-semibold transition-all duration-200 ${
        active ? "border-brand-600 bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgba(31,112,73,.8)]" : "border-line bg-white text-ink-soft hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-800"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.12em] text-brand-700 rtl:tracking-normal">
        <span className="h-px w-6 bg-brand-300" aria-hidden="true" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  hint,
  error,
  optional,
  badge,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string | false;
  optional?: string;
  badge?: string;
}) {
  return (
    <label className="block">
      <span className="field-label flex flex-wrap items-center gap-x-2 gap-y-1">
        {label}
        {optional && <span className="whitespace-nowrap text-xs font-medium text-ink-faint">({optional})</span>}
        {badge && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            <IconCheck size={11} strokeWidth={3} /> {badge}
          </span>
        )}
      </span>
      {children}
      {error ? <ErrorText>{error}</ErrorText> : hint ? <span className="mt-1.5 block text-[13px] text-ink-muted">{hint}</span> : null}
    </label>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <span className="field-error" role="alert">
      <IconAlert size={16} className="mt-px shrink-0" /> {children}
    </span>
  );
}

function ReviewRow({ label, children, onEdit, editLabel }: { label: string; children: ReactNode; onEdit: () => void; editLabel: string }) {
  return (
    <div className="flex flex-col gap-1 bg-white px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
      <dt className="w-40 shrink-0 text-sm text-ink-muted">{label}</dt>
      <dd className="flex-1 text-[15px] font-semibold text-ink">{children}</dd>
      <button type="button" onClick={onEdit} className="self-start text-sm font-semibold text-brand-700 hover:underline sm:self-center">
        {editLabel}
      </button>
    </div>
  );
}

function Success({
  t,
  locale,
  result,
  when,
  service,
  address,
  institution,
}: {
  t: T;
  locale: Locale;
  result: { reference: string; start: string; end: string; email: string };
  when: string;
  service: ServiceType;
  address: PostalAddress | null;
  institution: string;
}) {
  const s = t.booking.success;
  const ics = useMemo(() => {
    const f = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const loc = service === "onsite" && address ? [institution, formatAddress(address)].filter(Boolean).join(", ") : "Telefon";
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Interpreting NBG//Buchung//DE",
      "BEGIN:VEVENT",
      `UID:${result.reference}@interpreting-nbg.de`,
      `DTSTAMP:${f(new Date().toISOString())}`,
      `DTSTART:${f(result.start)}`,
      `DTEND:${f(result.end)}`,
      `SUMMARY:Dolmetschtermin ${result.reference} (${site.brand})`,
      `LOCATION:${loc.replace(/,/g, "\\,")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
  }, [result, service, address, institution]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-8 text-center shadow-deep animate-fade-up sm:p-14">
      <div className="bg-girih pointer-events-none absolute inset-0 opacity-70 mask-fade-b" aria-hidden="true" />
      <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-white shadow-lift ring-8 ring-brand-50">
        <IconCheck size={38} strokeWidth={2.4} />
      </div>
      <h2 className="relative mx-auto mt-8 max-w-xl text-3xl font-bold sm:text-4xl">{s.title}</h2>
      <p className="relative mx-auto mt-4 max-w-lg text-lg leading-relaxed text-ink-soft">
        {s.text.split("{email}")[0]}
        <b dir="ltr">{result.email}</b>
        {s.text.split("{email}")[1]}
      </p>
      <div className="relative mx-auto mt-8 inline-flex flex-col gap-1 rounded-2xl border border-line bg-paper px-6 py-4 text-start">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted rtl:tracking-normal">{s.reference}</span>
        <span className="text-xl font-bold tracking-wide text-brand-700" dir="ltr">
          {result.reference}
        </span>
        <span className="text-sm text-ink-soft">{when}</span>
      </div>
      <div className="relative mt-9 flex flex-wrap justify-center gap-3">
        <a href={ics} download={`${result.reference}.ics`} className="btn-primary">
          <IconCalendar size={18} /> {s.addToCalendar}
        </a>
        <Link href={`/${locale}`} className="btn-ghost">
          {s.home}
        </Link>
      </div>
    </div>
  );
}
