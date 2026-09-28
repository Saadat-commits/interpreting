"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { IconArrow, IconClose, IconMenu } from "./icons";

export function Header({ locale, t, minimal = false }: { locale: Locale; t: Dictionary["nav"]; minimal?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: `/${locale}#leistungen`, label: t.services },
    { href: `/${locale}#ablauf`, label: t.process },
    { href: `/${locale}#ueber-uns`, label: t.about },
    { href: `/${locale}#kontakt`, label: t.contact },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ${
        scrolled ? "border-b border-line/70 bg-white/85 shadow-[0_8px_30px_-18px_rgba(16,40,28,.25)] backdrop-blur-xl" : "bg-white/0"
      }`}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Logo locale={locale} />
        {!minimal && (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Hauptnavigation">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[15px] font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-700">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher locale={locale} label={t.switchLabel} />
          </div>
          {!minimal && (
            <Link href={`/${locale}/termin`} className="btn-primary hidden !px-5 !py-2.5 md:inline-flex">
              {t.book}
              <IconArrow size={18} />
            </Link>
          )}
          {!minimal && (
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white shadow-soft lg:hidden"
              aria-label={open ? t.close : t.menu}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <IconClose /> : <IconMenu />}
            </button>
          )}
          {minimal && (
            <div className="sm:hidden">
              <LanguageSwitcher locale={locale} label={t.switchLabel} />
            </div>
          )}
        </div>
      </div>
      {open && !minimal && (
        <div className="border-t border-line bg-white/95 backdrop-blur-xl lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile Navigation">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-ink-soft hover:bg-brand-50">
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between gap-3">
              <LanguageSwitcher locale={locale} label={t.switchLabel} />
              <Link href={`/${locale}/termin`} className="btn-primary !py-2.5" onClick={() => setOpen(false)}>
                {t.book}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
