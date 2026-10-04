"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { site } from "@/config/site";
import { serviceBySlug, visibleQuestions, type FormStep, type Question, type ServiceSlug } from "@/config/services";
import type { Dictionary } from "@/lib/i18n";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import { answerRows, initialAnswers, todayIso, validateStep, type Answer, type Answers, type FieldError } from "@/lib/service-request";
import { emailRe, isPhone } from "@/lib/validators";
import type { Locale, PostalAddress } from "@/lib/types";
import { StructuredAddress, type AddressTexts } from "../booking/StructuredAddress";
import { IconArrow, IconCheck, IconPhone } from "../icons";
import { ServiceIcon } from "./ServiceIcon";

interface Contact {
  customerType: "private" | "business";
  company: string;
  name: string;
  email: string;
  phone: string;
}

const emptyContact: Contact = { customerType: "private", company: "", name: "", email: "", phone: "" };

/**
 * Anfrage-Assistent für alle Leistungen mit Angebot. Die Schritte kommen aus der Service-Registry
 * (src/config/services.ts), danach folgen immer Kontakt und Prüfen. Neue Leistung = nur Registry ergänzen.
 */
export function RequestEngine({ locale, slug, addressTexts }: { locale: Locale; slug: ServiceSlug; addressTexts: Dictionary["booking"]["flow"]["address"] }) {
  const s = serviceBySlug(slug)!;
  const c = hamrahCopy[locale].request;
  const steps: FormStep[] = s.booking.mode === "request" ? s.booking.steps : [];
  const total = steps.length + 2;
  const storageKey = `hamrah:anfrage:${slug}`;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(s));
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, FieldError | "invalidEmail" | "invalidPhone">>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "done">("idle");
  const [reference, setReference] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const restored = useRef(false);
  const firstRender = useRef(true);

  // Angaben überleben ein Neuladen der Seite (nur in diesem Tab)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { answers?: Answers; contact?: Contact; notes?: string };
        if (saved.answers) setAnswers((a) => ({ ...a, ...saved.answers }));
        if (saved.contact) setContact({ ...emptyContact, ...saved.contact });
        if (saved.notes) setNotes(saved.notes);
      }
    } catch {
      /* privater Modus o. Ä. – dann eben ohne Zwischenspeicher */
    }
    restored.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!restored.current || status === "done") return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ answers, contact, notes }));
    } catch {
      /* ignorieren */
    }
  }, [answers, contact, notes, storageKey, status]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    (formRef.current ?? topRef.current)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }, [index, status]);

  const set = (id: string, v: Answer) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setErrors((e) => {
      if (!e[id]) return e;
      const next = { ...e };
      delete next[id];
      return next;
    });
  };

  const isContact = index === steps.length;
  const isReview = index === steps.length + 1;
  const stepTitle = isContact ? c.contactTitle : isReview ? c.reviewTitle : steps[index].title[locale];

  const contactErrors = () => {
    const e: typeof errors = {};
    if (contact.customerType === "business" && contact.company.trim().length < 2) e.company = "required";
    if (contact.name.trim().length < 2) e.name = "required";
    if (!emailRe.test(contact.email.trim())) e.email = "invalidEmail";
    if (!isPhone(contact.phone)) e.phone = "invalidPhone";
    if (!consent) e.consent = "required";
    return e;
  };

  const focusFirstError = (e: Record<string, unknown>) => {
    const first = Object.keys(e)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] textarea, [data-field="${first}"] button`);
      el?.focus();
    });
  };

  const next = () => {
    const e = isContact ? contactErrors() : validateStep(steps[index], answers);
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError(e);
    setIndex((i) => Math.min(i + 1, total - 1));
  };

  const back = () => {
    setErrors({});
    setIndex((i) => Math.max(0, i - 1));
  };

  const submit = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          service: slug,
          answers,
          contact: { ...contact, company: contact.customerType === "business" ? contact.company : undefined },
          notes: notes.trim() || undefined,
          consent,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string };
      if (!res.ok || !data.ok) throw new Error(String(res.status));
      setReference(data.reference ?? "");
      setStatus("done");
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* ignorieren */
      }
    } catch {
      setStatus("error");
    }
  };

  const reviewRows = useMemo(() => answerRows(s, answers, locale, { yes: c.yes, no: c.no }), [s, answers, locale, c.yes, c.no]);

  if (status === "done") {
    return (
      <section ref={topRef} className="mx-auto max-w-[640px] scroll-mt-24 py-10 text-center" aria-live="polite">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full text-white" style={{ backgroundColor: s.color }}>
          <IconCheck size={30} />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="t-h2 mt-6 text-ink outline-none">
          {c.doneTitle}
        </h2>
        <p className="t-lead mt-4 text-ink-soft">{c.doneText.replace("{email}", contact.email.trim())}</p>
        {reference && (
          <p className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-3">
            <span className="text-[14px] text-ink-muted">{c.doneRef}</span>
            <span dir="ltr" className="text-[18px] font-bold tabular-nums text-ink">
              {reference}
            </span>
          </p>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/${locale}`} className="h-btn h-btn-primary">
            {c.doneHome}
          </Link>
          <a href={site.phoneHref} className="h-btn h-btn-secondary">
            <IconPhone size={18} /> {c.doneCall}
          </a>
        </div>
      </section>
    );
  }

  const progress = ((index + 1) / total) * 100;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (isReview) submit();
        else next();
      }}
      className="grid scroll-mt-24 gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 lg:pb-16"
      style={{ ["--c" as string]: s.color }}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-4 text-[14px] font-semibold text-ink-muted">
          <span className="tabular-nums">{c.progress.replace("{n}", String(index + 1)).replace("{total}", String(total))}</span>
          <span style={{ color: s.color }}>{s.name[locale]}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/[.07]" aria-hidden="true">
          <div className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${progress}%`, backgroundColor: s.color }} />
        </div>

        <h2 ref={headingRef} tabIndex={-1} className="t-h2 mt-8 text-ink outline-none">
          {stepTitle}
        </h2>

        <div className="mt-8 space-y-8">
          {!isContact &&
            !isReview &&
            visibleQuestions(steps[index], answers).map((q) => (
              <QuestionField key={q.id} q={q} value={answers[q.id]} error={errors[q.id] as FieldError | undefined} onChange={(v) => set(q.id, v)} locale={locale} addressTexts={addressTexts} />
            ))}

          {isContact && (
            <ContactFields contact={contact} setContact={(p) => { setContact((x) => ({ ...x, ...p })); setErrors({}); }} notes={notes} setNotes={setNotes} consent={consent} setConsent={(v) => { setConsent(v); setErrors({}); }} errors={errors} locale={locale} />
          )}

          {isReview && (
            <div className="space-y-6">
              <p className="rounded-2xl border border-saffron/40 bg-saffron/10 px-5 py-4 text-[15px] leading-relaxed text-ink">{c.honest}</p>
              <ReviewBlock title={s.name[locale]} rows={reviewRows} onEdit={() => setIndex(0)} editLabel={c.edit} />
              <ReviewBlock
                title={c.contactTitle}
                rows={[
                  [c.customerType, contact.customerType === "business" ? `${c.business}: ${contact.company}` : c.private],
                  [c.name, contact.name],
                  [c.email, contact.email],
                  [c.phone, contact.phone],
                  ...(notes.trim() ? ([[c.notes, notes.trim()]] as [string, string][]) : []),
                ]}
                onEdit={() => setIndex(steps.length)}
                editLabel={c.edit}
              />
              {status === "error" && (
                <p role="alert" className="rounded-2xl bg-busy/10 px-5 py-4 text-[15px] font-semibold text-busy">
                  {c.error}
                </p>
              )}
            </div>
          )}
        </div>

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="sr-only"
        />

        {/* Aktionen: Mobile als feste Leiste unten, Desktop inline */}
        <div className="sticky bottom-0 z-30 -mx-5 mt-10 border-t border-ink/10 bg-stone/95 px-5 pt-3 backdrop-blur pb-[max(.75rem,env(safe-area-inset-bottom))] sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="flex items-center gap-3">
            {index > 0 && (
              <button type="button" onClick={back} className="h-btn h-btn-secondary px-5">
                <IconArrow size={18} className="rotate-180" />
                <span className="sr-only sm:not-sr-only">{c.back}</span>
              </button>
            )}
            <button type="submit" disabled={status === "sending"} className="h-btn h-btn-primary flex-1 lg:flex-none">
              {isReview ? (status === "sending" ? c.sending : c.submit) : c.next}
              {status !== "sending" && <IconArrow size={18} className="h-arrow" />}
            </button>
          </div>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border border-ink/10 bg-white p-6">
          <p className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundColor: s.color }}>
              <ServiceIcon slug={slug} size={20} />
            </span>
            <span className="text-[17px] font-bold text-ink">{s.name[locale]}</span>
          </p>
          <ol className="mt-6 space-y-1">
            {[...steps.map((st) => st.title[locale]), c.contactTitle, c.reviewTitle].map((title, i) => (
              <li key={title + i}>
                <button
                  type="button"
                  disabled={i > index}
                  onClick={() => i < index && setIndex(i)}
                  aria-current={i === index ? "step" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start text-[15px] transition-colors ${i === index ? "font-bold text-ink" : i < index ? "text-ink-soft hover:bg-stone" : "text-ink-faint"}`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums ${i < index ? "text-white" : i === index ? "border-2 text-ink" : "border border-ink/15"}`}
                    style={i < index ? { backgroundColor: s.color } : i === index ? { borderColor: s.color } : undefined}
                  >
                    {i < index ? <IconCheck size={14} /> : i + 1}
                  </span>
                  {title}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-ink/10 pt-5 text-[14px] leading-relaxed text-ink-muted">{s.pricing.intro[locale]}</p>
          <a href={site.phoneHref} className="h-link mt-4 text-[15px]">
            <IconPhone size={16} /> <span dir="ltr">{site.phone}</span>
          </a>
        </div>
      </aside>
    </form>
  );
}

function errorText(e: string, c: (typeof hamrahCopy)[Locale]["request"], q?: Question) {
  if (e === "chooseOne") return c.chooseOne;
  if (e === "invalidEmail") return c.invalidEmail;
  if (e === "invalidPhone") return c.invalidPhone;
  if (e === "invalid" && q?.type === "date") return c.dateFuture;
  if (e === "invalid") return c.invalid;
  return c.required;
}

function FieldShell({ q, error, locale, children, labelFor, group }: { q: Question; error?: FieldError; locale: Locale; children: React.ReactNode; labelFor?: string; group?: boolean }) {
  const c = hamrahCopy[locale].request;
  const id = useId();
  const label = (
    <>
      {q.label[locale]}
      {!q.required && q.type !== "toggle" && <span className="ms-2 text-[13px] font-medium text-ink-faint">{c.optional}</span>}
    </>
  );
  const hint = q.hint && <span className="mt-1 block text-[14px] text-ink-muted">{q.hint[locale]}</span>;
  const err = error && (
    <p id={`${id}-err`} className="field-error" role="alert">
      {errorText(error, c, q)}
    </p>
  );
  if (group)
    return (
      <fieldset data-field={q.id} aria-describedby={error ? `${id}-err` : undefined} aria-invalid={error ? true : undefined}>
        <legend className="text-[17px] font-bold text-ink">
          {label}
          {hint}
        </legend>
        <div className="mt-3">{children}</div>
        {err}
      </fieldset>
    );
  return (
    <div data-field={q.id}>
      <label htmlFor={labelFor} className="block text-[17px] font-bold text-ink">
        {label}
        {hint}
      </label>
      <div className="mt-3">{children}</div>
      {err}
    </div>
  );
}

function QuestionField({ q, value, error, onChange, locale, addressTexts }: { q: Question; value: Answer | undefined; error?: FieldError; onChange: (v: Answer) => void; locale: Locale; addressTexts: AddressTexts }) {
  const c = hamrahCopy[locale].request;
  const id = useId();
  const invalid = error ? "border-busy/60" : "";

  switch (q.type) {
    case "choice":
    case "multi": {
      const multi = q.type === "multi";
      const selected = multi ? ((value as string[]) ?? []) : (value as string | undefined);
      return (
        <FieldShell q={q} error={error} locale={locale} group>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {q.options.map((o) => {
              const checked = multi ? (selected as string[]).includes(o.id) : selected === o.id;
              return (
                <label key={o.id} className={`h-choice relative ${invalid}`}>
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name={`${id}-${q.id}`}
                    value={o.id}
                    checked={checked}
                    onChange={() => {
                      if (!multi) return onChange(o.id);
                      const cur = selected as string[];
                      onChange(checked ? cur.filter((x) => x !== o.id) : [...cur, o.id]);
                    }}
                    className="sr-only"
                  />
                  {multi && (
                    <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${checked ? "border-white/40 bg-white/15" : "border-ink/25"}`}>
                      {checked && <IconCheck size={13} />}
                    </span>
                  )}
                  {o.label[locale]}
                </label>
              );
            })}
          </div>
        </FieldShell>
      );
    }
    case "number": {
      const v = typeof value === "number" ? value : (q.default ?? q.min);
      const step = q.step ?? 1;
      const clamp = (n: number) => Math.min(q.max, Math.max(q.min, n));
      return (
        <FieldShell q={q} error={error} locale={locale} labelFor={id}>
          <div className="inline-flex items-center gap-2">
            <button type="button" onClick={() => onChange(clamp(v - step))} disabled={v <= q.min} aria-label={`${c.decrease}: ${q.label[locale]}`} className="h-btn h-btn-secondary h-12 w-12 px-0 text-[22px]">
              −
            </button>
            <div className="relative">
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min={q.min}
                max={q.max}
                step={step}
                value={v}
                onChange={(e) => onChange(e.target.value === "" ? q.min : clamp(Number(e.target.value)))}
                className={`h-field w-28 text-center text-[18px] font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${invalid}`}
              />
            </div>
            <button type="button" onClick={() => onChange(clamp(v + step))} disabled={v >= q.max} aria-label={`${c.increase}: ${q.label[locale]}`} className="h-btn h-btn-secondary h-12 w-12 px-0 text-[22px]">
              +
            </button>
            {q.unit && <span className="ms-1 text-[15px] font-semibold text-ink-muted">{q.unit[locale]}</span>}
          </div>
        </FieldShell>
      );
    }
    case "toggle": {
      const on = value === true;
      return (
        <div data-field={q.id}>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-ink/15 bg-white px-5 py-4 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-brand-600/60 has-[:focus-visible]:ring-offset-2">
            <span className="text-[16px] font-semibold text-ink">{q.label[locale]}</span>
            <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
            <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "" : "bg-ink/20"}`} style={on ? { backgroundColor: "var(--c)" } : undefined}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start] duration-200 motion-reduce:transition-none ${on ? "start-6" : "start-1"}`} />
            </span>
          </label>
        </div>
      );
    }
    case "address":
      return (
        <FieldShell q={q} error={error} locale={locale} group>
          <StructuredAddress value={(value as PostalAddress | null) ?? null} onChange={(a) => onChange(a)} t={addressTexts} locale={locale} />
        </FieldShell>
      );
    case "date":
      return (
        <FieldShell q={q} error={error} locale={locale} labelFor={id}>
          <input id={id} type="date" min={todayIso()} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={`h-field max-w-[260px] ${invalid}`} aria-invalid={error ? true : undefined} />
        </FieldShell>
      );
    case "text":
      return (
        <FieldShell q={q} error={error} locale={locale} labelFor={id}>
          {q.multiline ? (
            <textarea id={id} rows={3} maxLength={2000} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={`h-field h-auto py-3 ${invalid}`} />
          ) : (
            <input id={id} type="text" maxLength={300} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={`h-field ${invalid}`} />
          )}
        </FieldShell>
      );
  }
}

function ContactFields({
  contact,
  setContact,
  notes,
  setNotes,
  consent,
  setConsent,
  errors,
  locale,
}: {
  contact: Contact;
  setContact: (p: Partial<Contact>) => void;
  notes: string;
  setNotes: (v: string) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  errors: Record<string, string>;
  locale: Locale;
}) {
  const c = hamrahCopy[locale].request;
  const id = useId();
  const input = (key: "company" | "name" | "email" | "phone", label: string, type: string, autoComplete: string) => (
    <div data-field={key}>
      <label htmlFor={`${id}-${key}`} className="block text-[16px] font-bold text-ink">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        type={type}
        autoComplete={autoComplete}
        dir={type === "email" || type === "tel" ? "ltr" : undefined}
        value={contact[key]}
        onChange={(e) => setContact({ [key]: e.target.value })}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${id}-${key}-err` : undefined}
        className={`h-field mt-2 ${errors[key] ? "border-busy/60" : ""} ${locale === "fa" && (type === "email" || type === "tel") ? "text-right" : ""}`}
      />
      {errors[key] && (
        <p id={`${id}-${key}-err`} className="field-error" role="alert">
          {errorText(errors[key], c)}
        </p>
      )}
    </div>
  );
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-[17px] font-bold text-ink">{c.customerType}</legend>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:max-w-[420px]">
          {(["private", "business"] as const).map((t) => (
            <label key={t} className="h-choice">
              <input type="radio" name={`${id}-type`} checked={contact.customerType === t} onChange={() => setContact({ customerType: t })} className="sr-only" />
              {t === "private" ? c.private : c.business}
            </label>
          ))}
        </div>
      </fieldset>
      {contact.customerType === "business" && input("company", c.company, "text", "organization")}
      {input("name", c.name, "text", "name")}
      <div className="grid gap-6 sm:grid-cols-2">
        {input("email", c.email, "email", "email")}
        {input("phone", c.phone, "tel", "tel")}
      </div>
      <div>
        <label htmlFor={`${id}-notes`} className="block text-[16px] font-bold text-ink">
          {c.notes} <span className="ms-2 text-[13px] font-medium text-ink-faint">{c.optional}</span>
        </label>
        <span className="mt-1 block text-[14px] text-ink-muted">{c.notesHint}</span>
        <textarea id={`${id}-notes`} rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} className="h-field mt-2 h-auto py-3" />
      </div>
      <div data-field="consent">
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-ink-soft">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={errors.consent ? true : undefined}
            className="mt-1 h-5 w-5 shrink-0 rounded border-ink/30 accent-brand-600"
          />
          <span>
            {c.consent}{" "}
            <Link href={`/${locale}/datenschutz`} className="font-semibold text-brand-700 underline underline-offset-2" target="_blank">
              {c.privacy}
            </Link>
          </span>
        </label>
        {errors.consent && (
          <p className="field-error" role="alert">
            {c.required}
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewBlock({ title, rows, onEdit, editLabel }: { title: string; rows: [string, string][]; onEdit: () => void; editLabel: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
        <h3 className="text-[16px] font-bold text-ink">{title}</h3>
        <button type="button" onClick={onEdit} className="text-[14px] font-semibold text-brand-700 underline-offset-4 hover:underline">
          {editLabel}
        </button>
      </div>
      <dl className="divide-y divide-ink/[.06]">
        {rows.map(([k, v], i) => (
          <div key={`${i}-${k}`} className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-[14px] text-ink-muted">{k}</dt>
            <dd className="break-words text-[15px] font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
