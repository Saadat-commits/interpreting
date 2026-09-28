"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { site } from "@/config/site";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { LogoMark } from "./Logo";
import { IconArrow, IconChat, IconClose, IconPhone, IconSend } from "./icons";

type Msg = { from: "bot" | "me"; text: string };

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

const CRISP_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

/**
 * Fixierte Kontakt-Buttons (unten rechts): Anrufen + Live-Chat.
 * Live-Chat: Wenn NEXT_PUBLIC_CRISP_WEBSITE_ID gesetzt ist, wird Crisp als
 * Echtzeit-Chat geladen. Andernfalls öffnet sich der integrierte Chat, dessen
 * Nachrichten gespeichert und sofort per E-Mail zugestellt werden.
 */
export function FloatingContact({ locale, t }: { locale: Locale; t: Dictionary["chat"] }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: t.greeting }]);
  const [usedQuick, setUsedQuick] = useState<number[]>([]);
  const [form, setForm] = useState({ name: "", contact: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [hint, setHint] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CRISP_ID || window.$crisp) return;
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_ID;
    window.$crisp.push(["do", "chat:hide"]);
    window.$crisp.push(["on", "chat:closed", () => window.$crisp?.push(["do", "chat:hide"])]);
    const s = document.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleChat = () => {
    if (CRISP_ID && window.$crisp) {
      window.$crisp.push(["do", "chat:show"]);
      window.$crisp.push(["do", "chat:open"]);
      return;
    }
    setOpen((o) => !o);
  };

  const quick = (i: number) => {
    setUsedQuick((u) => [...u, i]);
    setMsgs((m) => [...m, { from: "me", text: t.quick[i] }, { from: "bot", text: t.quickAnswers[i] }]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.contact.trim().length < 5) {
      setHint(t.contactRequired);
      return;
    }
    if (form.message.trim().length < 2) return;
    setHint(null);
    setState("sending");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale, page: window.location.pathname }),
      });
      if (!res.ok) throw new Error();
      setMsgs((m) => [...m, { from: "me", text: form.message }, { from: "bot", text: t.sent }]);
      setForm((f) => ({ ...f, message: "" }));
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden" dir={locale === "fa" ? "rtl" : "ltr"}>
      {open && (
        <div
          role="dialog"
          aria-label={t.title}
          className="w-[min(92vw,380px)] origin-bottom-right animate-fade-up overflow-hidden rounded-3xl border border-line bg-white shadow-deep"
        >
          <div className="relative flex items-center gap-3 bg-brand-700 px-5 py-4 text-white">
            <div className="bg-girih-light absolute inset-0 opacity-60" aria-hidden="true" />
            <div className="relative">
              <LogoMark size={38} />
              <span className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-brand-700 bg-brand-300" />
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="font-bold">{t.title}</div>
              <div className="text-xs text-brand-100">{t.subtitle}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Schließen">
              <IconClose size={18} />
            </button>
          </div>

          <div ref={listRef} className="max-h-[42vh] space-y-2.5 overflow-y-auto bg-paper px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.from === "me" ? "rounded-ee-md bg-brand-600 text-white" : "rounded-es-md border border-line bg-white text-ink-soft"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              {t.quick.map((q, i) =>
                usedQuick.includes(i) ? null : (
                  <button key={q} type="button" onClick={() => quick(i)} className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[13px] font-medium text-brand-700 transition hover:bg-brand-50">
                    {q}
                  </button>
                ),
              )}
              {usedQuick.includes(0) && (
                <Link href={`/${locale}/termin`} onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-[13px] font-semibold text-white">
                  {t.bookCta} <IconArrow size={14} />
                </Link>
              )}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-2 border-t border-line p-3">
            <div className="grid grid-cols-2 gap-2">
              <input className="field !py-2 !text-sm" placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label={t.name} autoComplete="name" />
              <input
                className={`field !py-2 !text-sm ${hint ? "field-invalid" : ""}`}
                placeholder={t.contact}
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                aria-label={t.contact}
                aria-invalid={!!hint}
                autoComplete="email"
                dir="ltr"
              />
            </div>
            <input tabIndex={-1} autoComplete="off" className="hidden" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} aria-hidden="true" />
            {hint && <p className="text-xs text-busy">{hint}</p>}
            <div className="flex items-end gap-2">
              <textarea
                className="field min-h-[44px] flex-1 resize-none !py-2.5 !text-sm"
                rows={2}
                placeholder={t.message}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                aria-label={t.message}
              />
              <button type="submit" disabled={state === "sending" || form.message.trim().length < 2} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-lift transition hover:bg-brand-700 disabled:bg-ink-faint/60 disabled:shadow-none" aria-label={t.send}>
                <IconSend size={18} />
              </button>
            </div>
            {state === "error" && <p className="text-xs text-busy">{t.error}</p>}
          </form>
        </div>
      )}

      <div className="flex items-center gap-3">
        <a
          href={site.phoneHref}
          className="group flex h-14 items-center gap-2 rounded-full border border-line bg-white p-2 text-sm font-semibold text-ink shadow-lift transition hover:-translate-y-0.5 hover:shadow-deep sm:pe-5"
          aria-label={`${t.call}: ${site.phone}`}
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
            <IconPhone size={20} />
          </span>
          <span className="hidden sm:inline" dir="ltr">
            {site.phone}
          </span>
        </a>
        <button
          type="button"
          onClick={toggleChat}
          className="grid h-14 w-14 animate-pulseRing place-items-center rounded-full bg-brand-600 text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-brand-700"
          aria-label={t.open}
          aria-expanded={open}
        >
          {open ? <IconClose /> : <IconChat size={24} />}
        </button>
      </div>
    </div>
  );
}
