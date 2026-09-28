"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { availabilityConfig } from "@/config/availability";
import { site } from "@/config/site";
import { detectCategory, formatAddress } from "@/lib/address";
import { suggestEmail } from "@/lib/email-typo";
import { emailRe, isPhone } from "@/lib/validators";
import type { Dictionary } from "@/lib/i18n";
import { intlLocale } from "@/lib/i18n";
import type { AppointmentCategory, Language, Locale, PostalAddress, ServiceType } from "@/lib/types";
import { IconAlert, IconArrow, IconCalendar, IconCheck, IconFamily, IconPhone, IconPin, IconUser, IconBuilding, IconClock, IconGlobe, IconMail } from "../icons";
import { CheckEmail, formatWhen, type PendingBooking } from "./BookingDone";
import { CalendarPicker } from "./CalendarPicker";
import { MountainScene } from "./MountainScene";
import { StructuredAddress } from "./StructuredAddress";

type T = Dictionary;
type StepId = "start" | "how" | "when" | "where" | "details" | "review";
type How = "onsite" | "phone" | "instant";

const STORAGE_KEY = "inbg.booking.v3";

interface Remembered {
  who?: "private" | "organisation";
  first?: string;
  last?: string;
  email?: string;
  phone?: string;
  orgName?: string;
  billingAddress?: PostalAddress | null;
  language?: Language;
}

function readRemembered(): Remembered {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Remembered;
  } catch {
    return {};
  }
}

function writeRemembered(r: Remembered) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  } catch {
    /* Speicher nicht verfügbar */
  }
}

/**
 * Buchung Schritt für Schritt – eine Frage pro Bildschirm:
 *   Wer + Sprache → Wie? → Wann? → Wo? → Daten (+ Rechnungsadresse falls nötig) → Prüfen
 * Jede Angabe wird genau einmal abgefragt: Namen, Telefon und E-Mail werden für Rückruf,
 * Rechnung und Bestätigung wiederverwendet. Privatpersonen werden nicht nach „Für wen?“ gefragt.
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
  const f = t.booking.flow;
  const [who, setWho] = useState<"private" | "organisation" | null>(null);
  const [how, setHow] = useState<How | null>(initialService ?? null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [duration, setDuration] = useState(60);
  const [start, setStart] = useState<string | null>(null);
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  const [place, setPlace] = useState<PostalAddress | null>(null);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<PostalAddress | null>(null);

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [clientFirst, setClientFirst] = useState("");
  const [clientLast, setClientLast] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState(false);
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wiederkehrende Kund:innen: Daten vom letzten Mal
  useEffect(() => {
    const r = readRemembered();
    if (r.first) setFirst(r.first);
    if (r.last) setLast(r.last);
    if (r.email) setEmail(r.email);
    if (r.phone) setPhone(r.phone);
    if (r.orgName) setOrgName(r.orgName);
    if (r.language) setLanguage(r.language);
    if (r.billingAddress) setBilling(r.billingAddress);
  }, []);

  const service: ServiceType | null = how === "onsite" ? "onsite" : how ? "phone" : null;
  const instant = how === "instant";
  // Rechnungsadresse nur, wenn sie nicht schon die Terminadresse ist
  const needsBilling = how !== null && (how !== "onsite" || !billingSame);
  const billingRecipient = who === "organisation" ? orgName.trim() : `${first.trim()} ${last.trim()}`.trim();

  const steps: StepId[] = useMemo(() => {
    const s: StepId[] = ["start", "how"];
    if (!instant) s.push("when");
    if (how === "onsite") s.push("where");
    s.push("details", "review");
    return s;
  }, [instant, how]);

  const step = steps[Math.min(stepIndex, steps.length - 1)];

  // Dauer an Leistung anpassen
  useEffect(() => {
    if (!service) return;
    const options = availabilityConfig.durations[service];
    if (!options.includes(duration)) setDuration(60);
    setStart(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  // Erster Schritt: sobald „Wer“ und „Sprache“ gewählt sind, geht es automatisch weiter
  const pickStart = (w: typeof who, l: typeof language) => {
    if (w) setWho(w);
    if (l) setLanguage(l);
    if ((w ?? who) && (l ?? language)) autoNext();
  };

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stepIndex]);

  const go = (delta: 1 | -1) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setDirection(delta);
    setStepIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
  };
  const autoNext = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => go(1), 380);
  };
  const jumpTo = (id: StepId) => {
    const i = steps.indexOf(id);
    if (i >= 0) {
      setDirection(i < stepIndex ? -1 : 1);
      setStepIndex(i);
    }
  };

  /* ---------------- Prüfung ---------------- */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (first.trim().length < 2) e.first = t.booking.errors.name;
    if (last.trim().length < 2) e.last = t.booking.errors.name;
    if (!emailRe.test(email.trim())) e.email = t.booking.errors.email;
    if (!isPhone(phone)) e.phone = t.booking.errors.phone;
    if (who === "organisation") {
      if (orgName.trim().length < 2) e.orgName = t.booking.errors.name;
      if (clientFirst.trim().length < 2) e.clientFirst = t.booking.errors.name;
      if (clientLast.trim().length < 2) e.clientLast = t.booking.errors.name;
    }
    if (needsBilling && !billing) e.billing = t.booking.errors.generic;
    return e;
  }, [first, last, email, phone, who, orgName, clientFirst, clientLast, needsBilling, billing, t]);

  const valid: Record<StepId, boolean> = {
    start: !!who && !!language,
    how: !!how,
    when: !!start,
    where: !!place,
    details: Object.keys(errors).length === 0,
    review: true,
  };
  const err = (k: string) => (touched[k] ? errors[k] : undefined);
  const touch = (k: string) => () => setTouched((x) => ({ ...x, [k]: true }));
  const emailSuggestion = suggestEmail(email);

  /* ---------------- Absenden ---------------- */
  const submit = async () => {
    if (!service || !language || !who) return;
    setSubmitting(true);
    setSubmitError(null);
    const contactName = `${first.trim()} ${last.trim()}`;
    const onsite = how === "onsite";
    const category: AppointmentCategory = detectCategory(`${orgName} ${place?.placeName ?? ""}`) ?? initialCategory ?? "other";
    const payload = {
      locale,
      service,
      language,
      category,
      durationMinutes: instant ? 60 : duration,
      start: instant ? new Date().toISOString() : start,
      bookerType: who,
      organisation: who === "organisation" ? { name: orgName.trim(), caseWorker: contactName } : undefined,
      clientName: who === "organisation" ? `${clientFirst.trim()} ${clientLast.trim()}` : contactName,
      onsite: onsite && place ? { address: place, institution: place.placeName || (who === "organisation" ? orgName.trim() : undefined) } : undefined,
      phoneSession: onsite ? undefined : { callNumber: phone.trim(), mode: instant ? "instant" : "scheduled" },
      contact: { name: contactName, organisation: who === "organisation" ? orgName.trim() : undefined, email: email.trim(), phone: phone.trim() },
      billingSameAsAppointment: onsite && billingSame,
      billingAddress: needsBilling ? billing : undefined,
      billingRecipient: billingRecipient || undefined,
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
        jumpTo("when");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setPending(await res.json());
      writeRemembered({ who, first, last, email, phone, orgName, language, billingAddress: needsBilling ? billing : place });
    } catch {
      setSubmitError(t.booking.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  const lc = intlLocale(locale);
  const fmtDuration = (m: number) => (m < 60 ? `${m.toLocaleString(lc)} ${t.common.minutes}` : `${(m / 60).toLocaleString(lc)} ${t.common.hours}`);
  const endOf = (iso: string) => new Date(new Date(iso).getTime() + duration * 60000).toISOString();
  const progress = pending ? 1 : stepIndex / Math.max(1, steps.length - 1);

  /* ---------------- Zusammenfassung (live) ---------------- */
  const summary: { icon: ReactNode; label: string; value: string; step: StepId }[] = [];
  if (who) summary.push({ icon: who === "private" ? <IconUser size={16} /> : <IconBuilding size={16} />, label: f.sumWho, value: who === "private" ? f.whoPrivate : orgName || f.whoOrg, step: "start" });
  if (how) summary.push({ icon: how === "onsite" ? <IconPin size={16} /> : <IconPhone size={16} />, label: f.sumHow, value: f[`how_${how}`], step: "how" });
  if (language) summary.push({ icon: <IconGlobe size={16} />, label: f.sumLang, value: t.languages[language], step: "start" });
  if (start && !instant) summary.push({ icon: <IconCalendar size={16} />, label: f.sumWhen, value: formatWhen(locale, start, endOf(start)), step: "when" });
  if (place) summary.push({ icon: <IconPin size={16} />, label: f.sumWhere, value: [place.placeName, formatAddress(place)].filter(Boolean).join(", "), step: "where" });

  const card = (
    <div className="rounded-[2rem] border border-line bg-white/95 p-5 shadow-deep backdrop-blur sm:p-8">
      {/* Fortschritt */}
      <div className="mb-7">
        <div className="flex items-center justify-between text-[13px] font-semibold text-ink-muted">
          <span>{f.stepOf.replace("{n}", String(stepIndex + 1)).replace("{total}", String(steps.length))}</span>
          {stepIndex > 0 && (
            <button type="button" onClick={() => go(-1)} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
              <IconArrow size={14} className="rotate-180" /> {t.common.back}
            </button>
          )}
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700 ease-out rtl:bg-gradient-to-l" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <div key={step} className={`relative z-20 ${direction === 1 ? "animate-step-in" : "animate-step-back"}`}>
        {/* ---------- Wer + Sprache (ein Bildschirm) ---------- */}
        {step === "start" && (
          <Question title={f.whoTitle} sub={f.whoSub}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice active={who === "private"} icon={<IconUser size={24} />} title={f.whoPrivate} text={f.whoPrivateText} onClick={() => pickStart("private", null)} />
              <Choice active={who === "organisation"} icon={<IconBuilding size={24} />} title={f.whoOrg} text={f.whoOrgText} onClick={() => pickStart("organisation", null)} />
            </div>
            <div className={`mt-7 transition-opacity duration-300 ${who ? "opacity-100" : "opacity-60"}`}>
              <div className="mb-3 text-[17px] font-bold text-ink">{f.langTitle}</div>
              <div className="grid grid-cols-3 gap-2.5">
                {(["dari", "farsi", "pashto"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => pickStart(null, l)}
                    aria-pressed={language === l}
                    className={`flex flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-3.5 transition ${language === l ? "border-brand-600 bg-brand-50/60 shadow-soft" : "border-line bg-white hover:border-brand-200"}`}
                  >
                    <span className="font-fa text-lg font-bold text-brand-700">{t.languagesNative[l]}</span>
                    <span className="text-[13px] font-semibold text-ink-soft">{t.languages[l]}</span>
                  </button>
                ))}
              </div>
            </div>
          </Question>
        )}

        {/* ---------- Wie? ---------- */}
        {step === "how" && (
          <Question title={f.howTitle}>
            <div className="grid gap-3">
              <Choice active={how === "onsite"} icon={<IconPin size={24} />} title={f.how_onsite} text={f.how_onsiteText} onClick={() => (setHow("onsite"), autoNext())} />
              <Choice active={how === "phone"} icon={<IconCalendar size={24} />} title={f.how_phone} text={f.how_phoneText} onClick={() => (setHow("phone"), autoNext())} />
              <Choice active={how === "instant"} icon={<IconPhone size={24} />} title={f.how_instant} text={f.how_instantText} onClick={() => (setHow("instant"), autoNext())} badge={f.instantBadge} />
            </div>
          </Question>
        )}

        {/* ---------- Wann? ---------- */}
        {step === "when" && service && (
          <Question title={f.whenTitle}>
            <div className="mb-5">
              <div className="mb-2.5 text-sm font-semibold text-ink">{f.durationLabel}</div>
              <div className="flex flex-wrap gap-2">
                {availabilityConfig.durations[service].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => (setDuration(m), setStart(null))}
                    aria-pressed={duration === m}
                    className={`rounded-full border px-4 py-2 text-[15px] font-semibold transition ${duration === m ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink-soft hover:border-brand-200"}`}
                  >
                    {fmtDuration(m)}
                  </button>
                ))}
              </div>
              <p className="mt-2.5 flex items-start gap-1.5 text-[13px] text-ink-muted">
                <IconClock size={15} className="mt-0.5 shrink-0 text-brand-600" /> {f.billingNote}
              </p>
            </div>
            {slotError && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-busy-line bg-white px-4 py-3 text-sm text-busy" role="alert">
                <IconAlert size={18} className="mt-0.5 shrink-0" /> {t.booking.errors.slotTaken}
              </div>
            )}
            <CalendarPicker
              service={service}
              duration={duration}
              selected={start}
              onSelect={(x) => {
                setStart(x);
                setSlotError(false);
                if (x) autoNext();
              }}
              t={t.booking.calendar}
              locale={locale}
              refreshKey={calendarRefresh}
            />
          </Question>
        )}

        {/* ---------- Wo? ---------- */}
        {step === "where" && (
          <Question title={f.whereTitle} sub={f.whereSub}>
            <StructuredAddress value={place} onChange={setPlace} t={f.address} locale={locale} autoFocus />
            <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 transition hover:border-brand-200">
              <input type="checkbox" className="peer sr-only" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-line bg-white text-white transition peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/25">
                <IconCheck size={14} strokeWidth={3} />
              </span>
              <span className="text-[15px] font-semibold text-ink">{f.sameBilling}</span>
            </label>
          </Question>
        )}

        {/* ---------- Daten ---------- */}
        {step === "details" && (
          <Question title={who === "organisation" ? f.detailsOrgTitle : f.detailsTitle} sub={who === "organisation" ? f.detailsOrgSub : f.detailsSub}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {who === "organisation" && (
                <Field label={f.orgName} error={err("orgName")} wide>
                  <input className="field" value={orgName} onChange={(e) => setOrgName(e.target.value)} onBlur={touch("orgName")} placeholder={f.orgNamePh} autoComplete="organization" />
                </Field>
              )}
              <Field label={who === "organisation" ? f.caseWorkerFirst : f.firstName} error={err("first")}>
                <input className="field" value={first} onChange={(e) => setFirst(e.target.value)} onBlur={touch("first")} autoComplete="given-name" />
              </Field>
              <Field label={who === "organisation" ? f.caseWorkerLast : f.lastName} error={err("last")}>
                <input className="field" value={last} onChange={(e) => setLast(e.target.value)} onBlur={touch("last")} autoComplete="family-name" />
              </Field>
              <Field label={f.phone} error={err("phone")}>
                <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={touch("phone")} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="0911 …" />
              </Field>
              <Field label={f.email} error={err("email")}>
                <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={touch("email")} type="email" inputMode="email" autoComplete="email" dir="ltr" />
                {emailSuggestion && (
                  <button type="button" onClick={() => setEmail(emailSuggestion)} className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[13px] text-ink-soft hover:border-brand-400">
                    {f.didYouMean} <b className="text-brand-700" dir="ltr">{emailSuggestion}</b>
                  </button>
                )}
              </Field>
              {who === "organisation" && (
                <>
                  <div className="mt-2 flex items-center gap-2.5 text-[15px] font-bold text-ink sm:col-span-2">
                    <IconFamily size={20} className="text-brand-600" /> {f.clientTitle}
                  </div>
                  <Field label={f.firstName} error={err("clientFirst")}>
                    <input className="field" value={clientFirst} onChange={(e) => setClientFirst(e.target.value)} onBlur={touch("clientFirst")} autoComplete="off" />
                  </Field>
                  <Field label={f.lastName} error={err("clientLast")}>
                    <input className="field" value={clientLast} onChange={(e) => setClientLast(e.target.value)} onBlur={touch("clientLast")} autoComplete="off" />
                  </Field>
                </>
              )}
            </div>
            {needsBilling && (
              <div className="mt-7 border-t border-line pt-6">
                <div className="text-[17px] font-bold text-ink">{who === "organisation" ? f.billingOrgTitle : f.billingTitle}</div>
                <p className="mb-4 mt-1 text-[14px] text-ink-muted">{fillName(f.billingSub, billingRecipient)}</p>
                <StructuredAddress value={billing} onChange={setBilling} t={f.address} locale={locale} />
              </div>
            )}
            <input tabIndex={-1} autoComplete="off" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} aria-hidden="true" />
          </Question>
        )}

        {/* ---------- Prüfen ---------- */}
        {step === "review" && (
          <Question title={f.reviewTitle} sub={f.reviewSub}>
            <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {summary.map((s) => (
                <ReviewRow key={s.label} icon={s.icon} label={s.label} value={s.value} onEdit={() => jumpTo(s.step)} edit={t.common.edit} />
              ))}
              {instant && <ReviewRow icon={<IconPhone size={16} />} label={f.sumWhen} value={f.instantNow} onEdit={() => jumpTo("how")} edit={t.common.edit} />}
              <ReviewRow
                icon={<IconMail size={16} />}
                label={who === "organisation" ? f.caseWorker : f.sumContact}
                value={`${first} ${last} · ${email} · ${phone}`}
                onEdit={() => jumpTo("details")}
                edit={t.common.edit}
              />
              {who === "organisation" && <ReviewRow icon={<IconFamily size={16} />} label={f.clientTitle} value={`${clientFirst} ${clientLast}`} onEdit={() => jumpTo("details")} edit={t.common.edit} />}
              <ReviewRow
                icon={<IconCheck size={16} />}
                label={f.sumBilling}
                value={needsBilling && billing ? `${billingRecipient}, ${formatAddress(billing)}` : `${billingRecipient} · ${f.sameAsPlace}`}
                onEdit={() => jumpTo(needsBilling ? "details" : "where")}
                edit={t.common.edit}
              />
            </dl>
            <div className="mt-5">
              <label className="field-label" htmlFor="bk-notes">
                {f.notes}
              </label>
              <textarea id="bk-notes" className="field min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.booking.details.notesPlaceholder} />
            </div>
            {instant && <p className="mt-4 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm text-ink-soft">{f.instantInfo}</p>}
            <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
              {t.booking.simple.terms1}{" "}
              <a href={site.agbUrl} target="_blank" rel="noopener" className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2">
                {t.booking.simple.termsLink}
              </a>{" "}
              {t.booking.simple.terms2}{" "}
              <a href={`/${locale}/datenschutz`} target="_blank" rel="noopener" className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2">
                {t.booking.simple.privacyLink}
              </a>
              {t.booking.simple.terms3}
            </p>
            {submitError && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-busy-line bg-white px-4 py-3 text-sm text-busy" role="alert">
                <IconAlert size={18} className="mt-0.5 shrink-0" /> {submitError}
              </div>
            )}
          </Question>
        )}
      </div>

      {/* Aktion */}
      {!["start", "how"].includes(step) && (
        <div className="mt-8 border-t border-line pt-6">
          {step === "review" ? (
            <button type="button" className="btn-primary w-full !py-4 !text-base" onClick={submit} disabled={submitting}>
              {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <IconCheck size={18} strokeWidth={2.4} />}
              {submitting ? t.booking.review.submitting : f.confirm}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary w-full !py-4 !text-base"
              disabled={!valid[step]}
              onClick={() => {
                if (step === "details" && !valid.details) return;
                go(1);
              }}
            >
              {f.continue} <IconArrow size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* 3D-Berge: die Kamera wandert mit jedem Schritt weiter */}
      <div className="relative left-1/2 w-screen -translate-x-1/2">
        <MountainScene progress={progress} className="h-[230px] w-full sm:h-[340px]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white" />
        <div className="pointer-events-none absolute inset-x-0 top-4 px-5 text-center sm:top-8">
          <h1 className="text-3xl font-bold text-ink drop-shadow-[0_2px_12px_rgba(255,255,255,.9)] sm:text-5xl">{t.booking.title}</h1>
          <p className="mt-2 hidden text-lg font-medium text-ink-soft drop-shadow-[0_1px_8px_rgba(255,255,255,.95)] sm:block">{f.heroSub}</p>
        </div>
      </div>

      <div className="relative z-10 -mt-14 grid grid-cols-1 gap-6 sm:-mt-20 lg:grid-cols-[minmax(0,1fr)_300px]">
        {pending ? <CheckEmail t={t} locale={locale} pending={pending} onChangeEmail={() => (setPending(null), jumpTo("details"))} /> : card}

        {/* Live-Übersicht wie beim Online-Checkout */}
        {!pending && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-line bg-white p-5 shadow-soft">
              <div className="text-sm font-bold text-ink">{f.summary}</div>
              {summary.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">{f.summaryEmpty}</p>
              ) : (
                <ul className="mt-4 space-y-3.5">
                  {summary.map((s) => (
                    <li key={s.label} className="flex gap-3 animate-fade-up">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">{s.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-xs text-ink-muted">{s.label}</span>
                        <span className="block text-sm font-semibold text-ink [overflow-wrap:anywhere]">{s.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5 border-t border-line pt-4 text-[13px] text-ink-muted">
                {f.questions}{" "}
                <a href={site.phoneHref} className="font-semibold text-brand-700" dir="ltr">
                  {site.phone}
                </a>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ================= Bausteine ================= */

const fillName = (s: string, name: string) => s.replace("{name}", name || "—");

function Question({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold leading-tight text-ink sm:text-[1.75rem]">{title}</h2>
      {sub && <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{sub}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Choice({
  active,
  icon,
  title,
  text,
  onClick,
  badge,
  compact,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  text?: string;
  onClick: () => void;
  badge?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex items-center gap-4 rounded-2xl border bg-white text-start transition-all duration-300 ${compact ? "p-4" : "p-4 sm:p-5"} ${
        active ? "border-brand-500 shadow-[0_0_0_4px_rgba(44,138,93,.14)]" : "border-line hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
      }`}
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition ${active ? "bg-brand-600 text-white" : "bg-white text-brand-700 ring-1 ring-brand-100 group-hover:ring-brand-200"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[16px] font-bold text-ink">{title}</span>
          {badge && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">{badge}</span>}
        </span>
        {text && <span className="mt-0.5 block text-[14px] leading-snug text-ink-muted">{text}</span>}
      </span>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${active ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>
        {active && <IconCheck size={13} strokeWidth={3} />}
      </span>
    </button>
  );
}

function Field({ label, children, error, wide }: { label: string; children: ReactNode; error?: string; wide?: boolean }) {
  return (
    <label className={`block min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
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

function ReviewRow({ icon, label, value, onEdit, edit }: { icon: ReactNode; label: string; value: string; onEdit: () => void; edit: string }) {
  return (
    <div className="flex items-start gap-3 bg-white px-4 py-3.5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-ink-muted">{label}</dt>
        <dd className="text-[15px] font-semibold text-ink [overflow-wrap:anywhere]">{value}</dd>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
        {edit}
      </button>
    </div>
  );
}
