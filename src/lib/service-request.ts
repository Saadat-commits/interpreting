import { z } from "zod";
import { serviceBySlug, serviceSlugs, visibleQuestions, type FormStep, type Question, type ServiceWorld } from "@/config/services";
import { addressProblems, formatAddress } from "./address";
import { emailRe, isPhone } from "./validators";
import type { Locale, PostalAddress } from "./types";

export type Answer = string | string[] | number | boolean | PostalAddress | null;
export type Answers = Record<string, Answer>;

export type FieldError = "required" | "chooseOne" | "invalid";

const isAddress = (v: unknown): v is PostalAddress =>
  !!v && typeof v === "object" && !Array.isArray(v) && typeof (v as PostalAddress).postalCode === "string";

/** Startwerte: Zahlen auf ihren Default, Schalter aus, Mehrfachauswahl leer */
export function initialAnswers(s: ServiceWorld): Answers {
  const a: Answers = {};
  if (s.booking.mode !== "request") return a;
  for (const step of s.booking.steps)
    for (const q of step.questions) {
      if (q.type === "number") a[q.id] = q.default ?? q.min;
      else if (q.type === "toggle") a[q.id] = false;
      else if (q.type === "multi") a[q.id] = [];
    }
  return a;
}

function checkQuestion(q: Question, v: Answer | undefined): FieldError | null {
  const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
  if (empty) return q.required ? (q.type === "choice" || q.type === "multi" ? "chooseOne" : "required") : null;
  switch (q.type) {
    case "choice":
      return typeof v === "string" && q.options.some((o) => o.id === v) ? null : "invalid";
    case "multi":
      return Array.isArray(v) && v.every((x) => q.options.some((o) => o.id === x)) ? null : "invalid";
    case "number":
      return typeof v === "number" && Number.isFinite(v) && v >= q.min && v <= q.max ? null : "invalid";
    case "toggle":
      return typeof v === "boolean" ? null : "invalid";
    case "address":
      return isAddress(v) && addressProblems(v).length === 0 ? null : "required";
    case "date":
      return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= todayIso() ? null : "invalid";
    case "text":
      return typeof v === "string" && v.length <= 2000 ? null : "invalid";
  }
}

export function todayIso(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function validateStep(step: FormStep, answers: Answers) {
  const errors: Record<string, FieldError> = {};
  for (const q of visibleQuestions(step, answers)) {
    const e = checkQuestion(q, answers[q.id]);
    if (e) errors[q.id] = e;
  }
  return errors;
}

/** Nur Antworten auf sichtbare Fragen behalten – ausgeblendete Werte gehen nicht mit in die Anfrage */
export function cleanAnswers(s: ServiceWorld, answers: Answers): Answers {
  if (s.booking.mode !== "request") return {};
  const out: Answers = {};
  for (const step of s.booking.steps)
    for (const q of visibleQuestions(step, answers)) {
      const v = answers[q.id];
      if (v === undefined || v === null || v === "") continue;
      out[q.id] = typeof v === "string" ? v.trim() : v;
    }
  return out;
}

const trimmed = (max: number) => z.string().trim().max(max);

export const serviceRequestSchema = z.object({
  locale: z.enum(["de", "fa"]),
  service: z.enum(serviceSlugs),
  answers: z.record(z.string().max(40), z.unknown()),
  contact: z.object({
    customerType: z.enum(["private", "business"]),
    company: trimmed(160).optional(),
    name: trimmed(120).min(2),
    email: trimmed(200).regex(emailRe),
    phone: trimmed(40).refine(isPhone),
  }),
  notes: trimmed(2000).optional(),
  consent: z.literal(true),
  /** Honeypot gegen Spam-Bots – muss leer bleiben */
  website: z.string().max(0).optional(),
});

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;

/** Prüft alle Antworten gegen die Fragen der Leistung. Liefert bereinigte Antworten oder die Fehler. */
export function validateRequestAnswers(slug: string, raw: Record<string, unknown>) {
  const s = serviceBySlug(slug);
  if (!s || s.booking.mode !== "request") return { ok: false as const, errors: { service: "invalid" as FieldError } };
  const answers = raw as Answers;
  const errors: Record<string, FieldError> = {};
  for (const step of s.booking.steps) Object.assign(errors, validateStep(step, answers));
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, answers: cleanAnswers(s, answers) };
}

/** Lesbare Zeilen „Frage – Antwort“ für E-Mails und die Prüfen-Ansicht */
export function answerRows(s: ServiceWorld, answers: Answers, locale: Locale, yesNo: { yes: string; no: string }): [string, string][] {
  if (s.booking.mode !== "request") return [];
  const rows: [string, string][] = [];
  const all = s.booking.steps.flatMap((st) => st.questions.map((q) => q.label[locale]));
  const repeated = (label: string) => all.indexOf(label) !== all.lastIndexOf(label);
  for (const step of s.booking.steps)
    for (const q of visibleQuestions(step, answers)) {
      const v = answers[q.id];
      const text = formatAnswer(q, v, locale, yesNo);
      const label = q.label[locale];
      if (text) rows.push([repeated(label) ? `${step.title[locale]}: ${label}` : label, text]);
    }
  return rows;
}

export function formatAnswer(q: Question, v: Answer | undefined, locale: Locale, yesNo: { yes: string; no: string }): string {
  if (v === undefined || v === null || v === "") return "";
  switch (q.type) {
    case "choice":
      return q.options.find((o) => o.id === v)?.label[locale] ?? String(v);
    case "multi":
      return (v as string[]).map((id) => q.options.find((o) => o.id === id)?.label[locale] ?? id).join(", ");
    case "number":
      return `${(v as number).toLocaleString(locale === "fa" ? "fa-IR" : "de-DE")}${q.unit ? ` ${q.unit[locale]}` : ""}`;
    case "toggle":
      return v ? yesNo.yes : yesNo.no;
    case "address":
      return isAddress(v) ? formatAddress(v) : "";
    case "date":
      return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-gregory" : "de-DE", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${v as string}T00:00:00Z`),
      );
    case "text":
      return String(v);
  }
}
