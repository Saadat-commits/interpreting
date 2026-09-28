"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/config/site";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { openHelp } from "./HelpChat";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { IconClose, IconHelp, IconMail, IconMenu, IconPhone } from "./icons";
import { navItems, type NavKey } from "./nav";

/**
 * Kopfbereich wie bei einer Behörden-Website:
 *  1. Servicezeile: Telefon · E-Mail · Hilfe · Sprache
 *  2. Logo
 *  3. Hauptnavigation – die aktuelle Seite ist markiert
 */
export function Header({ locale, t, active }: { locale: Locale; t: Dictionary; active?: NavKey }) {
  const g = t.gov;
  const [open, setOpen] = useState(false);
  const items = navItems(locale, g);

  return (
    <header className="relative z-40 bg-white">
      {/* Servicezeile */}
      <div className="bg-brand-800 text-white">
        <div className="container-page flex h-10 items-center justify-between gap-4 text-[13px]">
          <div className="flex min-w-0 items-center gap-5">
            <a href={site.phoneHref} className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold hover:underline">
              <IconPhone size={14} /> <span dir="ltr">{site.phone}</span>
            </a>
            <a href={`mailto:${site.email}`} className="hidden items-center gap-1.5 hover:underline sm:inline-flex">
              <IconMail size={14} /> <span dir="ltr">{site.email}</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={openHelp} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
              <IconHelp size={15} /> {g.help}
            </button>
            <LanguageSwitcher locale={locale} label={t.nav.switchLabel} compact />
          </div>
        </div>
      </div>

      {/* Logo + Navigation */}
      <div className="border-b border-line">
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <Logo locale={locale} />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[14px] font-semibold text-ink md:hidden"
            aria-expanded={open}
            aria-controls="hauptmenue"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <IconClose size={18} /> : <IconMenu size={18} />} {open ? t.nav.close : t.nav.menu}
          </button>
        </div>
        <nav id="hauptmenue" aria-label="Hauptnavigation" className={`${open ? "block" : "hidden"} border-t border-line md:block`}>
          <ul className="container-page flex flex-col md:flex-row md:gap-1">
            {items.map((it) => {
              const isActive = it.key === active;
              return (
                <li key={it.key}>
                  <Link
                    href={it.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`block border-b-[3px] px-1 py-3 text-[15px] font-semibold transition md:px-4 ${
                      isActive ? "border-brand-600 text-brand-800" : "border-transparent text-ink-soft hover:border-brand-200 hover:text-brand-700"
                    } ${it.key === "book" && !isActive ? "text-brand-700" : ""}`}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

/** Seitenkopf: Brotkrumen, Überschrift und kurze Einleitung */
export function PageHeader({ locale, t, title, lead, crumbs = [] }: { locale: Locale; t: Dictionary; title: string; lead?: string; crumbs?: { href?: string; label: string }[] }) {
  return (
    <div className="border-b border-line bg-[#F6F9F7]">
      <div className="container-page py-7 sm:py-9">
        <nav aria-label={t.gov.breadcrumb} className="text-[13px] text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={`/${locale}`} className="text-brand-700 hover:underline">
                {t.gov.home}
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <span aria-hidden="true">›</span>
                {c.href ? (
                  <Link href={c.href} className="text-brand-700 hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-3 text-[1.9rem] font-bold leading-tight tracking-tight text-ink sm:text-[2.4rem]">{title}</h1>
        {lead && <p className="mt-3 max-w-3xl text-[17px] leading-relaxed text-ink-soft">{lead}</p>}
      </div>
    </div>
  );
}
