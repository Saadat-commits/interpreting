"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { site } from "@/config/site";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { LogoMark } from "./Logo";
import { IconClose, IconHelp, IconPhone, IconSend } from "./icons";

type Bubble = { from: "bot" | "me"; text: string; fallback?: boolean };

/**
 * Kleine „Hilfe“ unten rechts. Öffnet einen kompakten KI-Chat, der Fragen beantwortet
 * und auf Wunsch einen Termin bucht (mit E-Mail-Bestätigung wie beim Formular).
 */
export function HelpChat({ locale, t }: { locale: Locale; t: Dictionary["help"] }) {
  const [open, setOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([{ from: "bot", text: t.greeting }]);
  const [history, setHistory] = useState<unknown[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setBubbles((b) => [...b, { from: "me", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, input: q, messages: history }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { reply: string; messages: unknown[]; booked?: { email: string } };
      setHistory(data.messages.slice(-50));
      setBubbles((b) => [
        ...b,
        ...(data.reply ? [{ from: "bot" as const, text: data.reply }] : []),
        ...(data.booked ? [{ from: "bot" as const, text: t.booked.replace("{email}", data.booked.email) }] : []),
      ]);
    } catch {
      setBubbles((b) => [...b, { from: "bot", text: t.unavailable, fallback: true }]);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className="fixed bottom-4 end-4 z-50 flex flex-col items-end gap-3 print:hidden" dir={locale === "fa" ? "rtl" : "ltr"}>
      {open && (
        <section
          role="dialog"
          aria-label={t.title}
          className="flex h-[min(78vh,560px)] w-[min(92vw,370px)] animate-fade-up flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-deep"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <LogoMark size={32} />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-ink">{t.title}</div>
              <div className="truncate text-[12px] text-ink-muted">{t.subtitle}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:bg-brand-50" aria-label={t.close}>
              <IconClose size={18} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4" aria-live="polite">
            {bubbles.map((b, i) => (
              <div key={i} className={`flex ${b.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed ${
                    b.from === "me" ? "rounded-ee-md bg-brand-600 text-white" : "rounded-es-md bg-brand-50/70 text-ink"
                  }`}
                >
                  {b.text}
                  {b.fallback && (
                    <span className="mt-2 flex flex-wrap gap-2">
                      <a href={site.phoneHref} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-700 ring-1 ring-brand-100">
                        <IconPhone size={14} /> <span dir="ltr">{site.phone}</span>
                      </a>
                      <Link href={`/${locale}/termin`} onClick={() => setOpen(false)} className="inline-flex rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-700 ring-1 ring-brand-100">
                        {t.bookLink}
                      </Link>
                    </span>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-es-md bg-brand-50/70 px-4 py-3" aria-label={t.thinking}>
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}
            {bubbles.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {t.quick.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-700 hover:bg-brand-50">
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-line p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                className="field !rounded-full !py-2.5"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                maxLength={2000}
                aria-label={t.placeholder}
              />
              <button type="submit" disabled={busy || !input.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white disabled:opacity-40" aria-label={t.send}>
                <IconSend size={18} className="rtl:-scale-x-100" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-faint">{t.note}</p>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-[14px] font-bold text-ink shadow-lift transition hover:border-brand-200 hover:text-brand-700"
      >
        {open ? <IconClose size={17} /> : <IconHelp size={18} className="text-brand-600" />}
        {t.button}
      </button>
    </div>
  );
}
