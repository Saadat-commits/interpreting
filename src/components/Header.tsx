"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";
import { bookingHref, services } from "@/config/services";
import type { Dictionary } from "@/lib/i18n";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import type { Locale } from "@/lib/types";
import { ServiceIcon } from "./hamrah/ServiceIcon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { IconArrow, IconClose, IconMenu, IconPhone } from "./icons";
import { navItems, type NavKey } from "./nav";

/**
 * HAMRAH-Kopf: fixiert, ruhig. Links Marke, Mitte drei Ziele, rechts Sprache, Telefon und die eine Hauptaktion.
 * Mobil: Vollbild-Panel mit den sechs Leistungen.
 */
export function Header({ locale, t, active }: { locale: Locale; t: Dictionary; active?: NavKey }) {
  const h = hamrahCopy[locale];
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const items = navItems(locale);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = [toggleRef.current, ...panelRef.current.querySelectorAll<HTMLElement>("a,button")].filter(Boolean) as HTMLElement[];
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault();
        f[0].focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      toggleRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <a href="#inhalt" className="sr-only z-[60] rounded-full bg-night px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-3">
        {h.skip}
      </a>
      <header
        className={`sticky top-0 z-40 transition-[background-color,border-color] duration-300 ${
          scrolled || open ? "border-b border-ink/10 bg-white/90 backdrop-blur-md" : "border-b border-transparent bg-white/0"
        }`}
      >
        <div className="container-hamrah flex h-[68px] items-center justify-between gap-4">
          <Logo locale={locale} />

          <nav aria-label={t.nav.menu} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {items.map((it) => (
                <li key={it.key} className={it.key === "services" ? "group relative" : undefined}>
                  <Link
                    href={it.href}
                    aria-current={it.key === active ? "page" : undefined}
                    className="relative block rounded-full px-4 py-2 text-[15px] font-semibold text-ink-soft transition-colors hover:text-ink aria-[current=page]:text-ink"
                  >
                    {it.label}
                    <span aria-hidden className={`absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-saffron transition-opacity ${it.key === active ? "opacity-100" : "opacity-0"}`} />
                  </Link>
                  {it.key === "services" && (
                    <div className="invisible absolute start-0 top-full pt-3 opacity-0 transition-opacity duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      <ul className="grid w-[520px] grid-cols-2 gap-1 rounded-[22px] border border-ink/10 bg-white p-2 shadow-lift">
                        {services.map((s) => (
                          <li key={s.slug}>
                            <Link href={`/${locale}/leistungen/${s.slug}`} className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-stone">
                              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: s.color }}>
                                <ServiceIcon slug={s.slug} size={18} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[15px] font-bold text-ink">{s.name[locale]}</span>
                                <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">{s.short[locale]}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden text-[14px] text-ink-soft md:block">
              <LanguageSwitcher locale={locale} label={t.nav.switchLabel} compact />
            </div>
            <a href={site.phoneHref} className="hidden h-11 items-center gap-2 rounded-full px-3 text-[14px] font-semibold text-ink-soft hover:text-ink xl:inline-flex">
              <IconPhone size={16} /> <span dir="ltr">{site.phone}</span>
            </a>
            <a href={site.phoneHref} aria-label={h.nav.call} className="grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-stone xl:hidden">
              <IconPhone size={19} />
            </a>
            <Link href={`/${locale}/anfrage`} aria-current={active === "book" ? "page" : undefined} className="h-btn h-btn-primary !h-11 !px-5 !text-[14px]">
              {h.nav.book}
            </Link>
            <button
              ref={toggleRef}
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-stone lg:hidden"
              aria-expanded={open}
              aria-controls="hamrah-menu"
              aria-label={open ? h.nav.close : h.nav.menu}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <IconClose size={22} /> : <IconMenu size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <div ref={panelRef} id="hamrah-menu" className="fixed inset-x-0 bottom-0 top-[68px] overflow-y-auto bg-white lg:hidden">
            <div className="container-hamrah flex min-h-full flex-col pb-8 pt-4">
              <p className="t-eyebrow text-ink-muted">{h.nav.services}</p>
              <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/${locale}/leistungen/${s.slug}`} onClick={() => setOpen(false)} className="flex min-h-14 items-center gap-3 py-3 text-[18px] font-bold text-ink">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                      <span className="flex-1">{s.name[locale]}</span>
                      <IconArrow size={18} className="h-arrow text-ink-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-6 space-y-1">
                {items
                  .filter((i) => i.key !== "services")
                  .map((it) => (
                    <li key={it.key}>
                      <Link href={it.href} onClick={() => setOpen(false)} aria-current={it.key === active ? "page" : undefined} className="block py-2.5 text-[17px] font-semibold text-ink-soft">
                        {it.label}
                      </Link>
                    </li>
                  ))}
              </ul>
              <div className="mt-auto space-y-3 pt-8">
                <a href={site.phoneHref} className="h-btn h-btn-secondary w-full">
                  <IconPhone size={18} /> <span dir="ltr">{site.phone}</span>
                </a>
                <Link href={`/${locale}/anfrage`} onClick={() => setOpen(false)} className="h-btn h-btn-primary w-full">
                  {h.nav.book}
                </Link>
                <div className="flex justify-center pt-2 text-[15px] text-ink-soft">
                  <LanguageSwitcher locale={locale} label={t.nav.switchLabel} compact />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

/** Seitenkopf für Unterseiten: Brotkrumen, Überschrift, kurze Einleitung */
export function PageHeader({ locale, t, title, lead, crumbs = [] }: { locale: Locale; t: Dictionary; title: string; lead?: string; crumbs?: { href?: string; label: string }[] }) {
  return (
    <div className="bg-white">
      <div className="container-hamrah pb-8 pt-8 sm:pb-12 sm:pt-12">
        <nav aria-label={t.gov.breadcrumb} className="text-[13px] text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={`/${locale}`} className="hover:text-ink hover:underline">
                {t.gov.home}
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="rtl:rotate-180">›</span>
                {c.href ? (
                  <Link href={c.href} className="hover:text-ink hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-ink-soft">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="t-h1 mt-4 max-w-4xl text-ink">{title}</h1>
        {lead && <p className="t-lead mt-4 max-w-[62ch] text-ink-soft">{lead}</p>}
      </div>
    </div>
  );
}
