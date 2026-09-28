import Link from "next/link";
import { site } from "@/config/site";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { Logo } from "./Logo";
import { IconMail, IconPhone, IconPin } from "./icons";

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const h = t.home;
  return (
    <footer id="kontakt" className="mt-24 border-t border-line bg-white">
      <div className="container-page grid grid-cols-1 gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo locale={locale} />
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-muted">{t.meta.description}</p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">{h.contactLabel}</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-ink-soft">
            <li>
              <a href={site.phoneHref} className="inline-flex items-center gap-3 font-semibold hover:text-brand-700">
                <IconPhone size={18} className="text-brand-600" />
                <span dir="ltr">{site.phone}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-3 hover:text-brand-700">
                <IconMail size={18} className="text-brand-600" />
                <span dir="ltr">{site.email}</span>
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">{h.areaLabel}</h2>
          <p className="mt-4 flex items-start gap-3 text-[15px] leading-relaxed text-ink-soft">
            <IconPin size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <span>{h.onsite.area}</span>
          </p>
          <p className="mt-3 flex items-start gap-3 text-[15px] leading-relaxed text-ink-soft">
            <IconPhone size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <span>{h.phone.area}</span>
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-6 pb-20 text-[13px] text-ink-muted sm:flex-row sm:items-center sm:pb-6">
          <span>
            © {new Date().getFullYear()} {site.brand}
          </span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Rechtliches">
            <a href={site.agbUrl} target="_blank" rel="noopener" className="font-semibold text-brand-700 hover:underline">
              {t.footer.terms}
            </a>
            <Link href={`/${locale}/impressum`} className="hover:text-ink">
              {t.footer.imprint}
            </Link>
            <Link href={`/${locale}/datenschutz`} className="hover:text-ink">
              {t.footer.privacy}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
