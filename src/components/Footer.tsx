import Link from "next/link";
import { site } from "@/config/site";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { Logo } from "./Logo";
import { IconMail, IconPhone, IconPin } from "./icons";

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <footer id="kontakt" className="relative mt-24 border-t border-line bg-paper">
      <div className="bg-girih pointer-events-none absolute inset-0 opacity-60 mask-fade-b" aria-hidden="true" />
      <div className="container-page relative grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo locale={locale} />
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-muted">{t.meta.description}</p>
          <p className="mt-6 flex items-center gap-3 text-sm text-ink-muted">
            <span className="h-px w-8 bg-brand-300" aria-hidden="true" />
            <span>{t.footer.between}</span>
            <span lang={locale === "de" ? "fa" : "de"} className={locale === "de" ? "font-fa" : ""}>
              {locale === "de" ? "· در خانهٔ دو زبان" : "· Zwischen zwei Sprachen zu Hause"}
            </span>
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">{t.nav.contact}</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-ink-soft">
            <li>
              <a href={site.phoneHref} className="inline-flex items-center gap-3 transition hover:text-brand-700">
                <IconPhone size={18} className="text-brand-600" />
                <span dir="ltr">{site.phone}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-3 transition hover:text-brand-700">
                <IconMail size={18} className="text-brand-600" />
                <span dir="ltr">{site.email}</span>
              </a>
            </li>
            <li className="inline-flex items-center gap-3">
              <IconPin size={18} className="text-brand-600" />
              <span dir="ltr">
                {site.postalCode} {site.city}
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">{t.nav.services}</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-ink-soft">
            <li>{t.services.phone.title}</li>
            <li>{t.services.onsite.title}</li>
            <li>
              <Link href={`/${locale}/termin`} className="font-semibold text-brand-700 hover:underline">
                {t.nav.book}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-line">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-6 text-[13px] text-ink-muted sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} {site.brand}. {t.footer.rights}
          </span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Rechtliches">
            <Link href={`/${locale}/impressum`} className="hover:text-ink">
              {t.footer.imprint}
            </Link>
            <Link href={`/${locale}/datenschutz`} className="hover:text-ink">
              {t.footer.privacy}
            </Link>
            <a href={site.agbUrl} target="_blank" rel="noopener" className="hover:text-ink">
              {t.footer.terms}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
