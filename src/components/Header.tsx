"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { IconArrow, IconPhone } from "./icons";

/**
 * Kopfzeile: Logo · Leistungen · AGB · Telefonnummer (immer sichtbar) · Sprache · Termin buchen.
 */
export function Header({ locale, t, minimal = false }: { locale: Locale; t: Dictionary["nav"]; minimal?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-white/90 backdrop-blur-xl transition-shadow duration-300 ${scrolled ? "shadow-[0_1px_0_#E4EAE6,0_8px_30px_-18px_rgba(16,40,28,.25)]" : ""}`}>
      <div className="container-page flex h-[68px] items-center justify-between gap-3">
        <Logo locale={locale} />
        {!minimal && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
            <Link href={`/${locale}#leistungen`} className="rounded-full px-4 py-2 text-[15px] font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-700">
              {t.services}
            </Link>
            <a href={site.agbUrl} target="_blank" rel="noopener" className="rounded-full px-4 py-2 text-[15px] font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-700">
              {t.terms}
            </a>
          </nav>
        )}
        <div className="flex items-center gap-2">
          <a
            href={site.phoneHref}
            className="flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3 text-[14px] font-bold text-ink transition hover:border-brand-200 sm:px-4"
            aria-label={site.phone}
          >
            <IconPhone size={17} className="text-brand-600" />
            <span className="hidden sm:inline" dir="ltr">
              {site.phone}
            </span>
          </a>
          <LanguageSwitcher locale={locale} label={t.switchLabel} />
          {!minimal && (
            <Link href={`/${locale}/termin`} className="btn-primary hidden !px-5 !py-2.5 lg:inline-flex">
              {t.book} <IconArrow size={17} className="rtl:rotate-180" />
            </Link>
          )}
        </div>
      </div>
      {!minimal && (
        // Mobil: die drei Ziele als ruhige Leiste – kein Menü nötig
        <nav className="container-page flex gap-2 overflow-x-auto pb-2.5 md:hidden" aria-label="Navigation">
          <Link href={`/${locale}/termin`} className="shrink-0 rounded-full bg-brand-600 px-4 py-1.5 text-[14px] font-semibold text-white">
            {t.book}
          </Link>
          <Link href={`/${locale}#leistungen`} className="shrink-0 rounded-full border border-line px-4 py-1.5 text-[14px] font-medium text-ink-soft">
            {t.services}
          </Link>
          <a href={site.agbUrl} target="_blank" rel="noopener" className="shrink-0 rounded-full border border-line px-4 py-1.5 text-[14px] font-medium text-ink-soft">
            {t.terms}
          </a>
        </nav>
      )}
    </header>
  );
}
