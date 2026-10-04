import Link from "next/link";
import { site } from "@/config/site";
import { services } from "@/config/services";
import type { Dictionary } from "@/lib/i18n";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import type { Locale } from "@/lib/types";
import { HelpLink } from "./HelpChat";
import { navItems } from "./nav";
import { Logo } from "./Logo";
import { IconMail, IconPhone } from "./icons";

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const h = hamrahCopy[locale];
  const colTitle = "text-[13px] font-bold text-white/50";
  const link = "text-[15px] text-white/80 transition-colors hover:text-white";
  return (
    <footer className="on-dark bg-night text-white">
      <div className="container-hamrah grid grid-cols-2 gap-x-6 gap-y-12 py-16 sm:py-20 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 lg:col-span-1">
          <Logo locale={locale} light />
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/65">{h.footer.tagline}</p>
          <div className="mt-6 flex flex-col gap-2.5">
            <a href={site.phoneHref} className={`inline-flex items-center gap-2 font-semibold ${link}`}>
              <IconPhone size={16} className="text-mint" /> <span dir="ltr">{site.phone}</span>
            </a>
            <a href={`mailto:${site.email}`} className={`inline-flex items-center gap-2 ${link}`}>
              <IconMail size={16} className="text-mint" /> <span dir="ltr">{site.email}</span>
            </a>
          </div>
        </div>
        <div>
          <h2 className={colTitle}>{h.footer.services}</h2>
          <ul className="mt-4 space-y-2.5">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/${locale}/leistungen/${s.slug}`} className={`inline-flex items-center gap-2 ${link}`}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  {s.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className={colTitle}>{h.footer.company}</h2>
          <ul className="mt-4 space-y-2.5">
            {navItems(locale).map((i) => (
              <li key={i.key}>
                <Link href={i.href} className={link}>
                  {i.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`/${locale}/anfrage`} className={link}>
                {h.nav.book}
              </Link>
            </li>
            <li>
              <HelpLink className={link}>{t.gov.help}</HelpLink>
            </li>
          </ul>
        </div>
        <div>
          <h2 className={colTitle}>{h.footer.legal}</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a href={site.agbUrl} target="_blank" rel="noopener" className={link}>
                {t.footer.terms}
              </a>
            </li>
            <li>
              <Link href={`/${locale}/impressum`} className={link}>
                {t.footer.imprint}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/datenschutz`} className={link}>
                {t.footer.privacy}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-hamrah flex flex-col gap-2 py-6 text-[13px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} HAMRAH · {site.brand}
          </span>
          <span>{h.meaning}</span>
        </div>
      </div>
    </footer>
  );
}
