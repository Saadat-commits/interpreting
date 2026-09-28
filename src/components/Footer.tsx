import Link from "next/link";
import { site } from "@/config/site";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { HelpLink } from "./HelpChat";
import { navItems } from "./nav";
import { Logo } from "./Logo";
import { IconMail, IconPhone, IconPin } from "./icons";

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const g = t.gov;
  const colTitle = "text-[13px] font-bold uppercase tracking-[0.12em] text-brand-800";
  const link = "text-[15px] text-ink-soft hover:text-brand-700 hover:underline";
  return (
    <footer className="mt-20 border-t-4 border-brand-600 bg-[#F6F9F7]">
      <div className="container-page grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo locale={locale} />
          <p className="mt-4 text-[14px] leading-relaxed text-ink-muted">{t.home.onsite.area}</p>
        </div>
        <div>
          <h2 className={colTitle}>{g.contact}</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <a href={site.phoneHref} className={`inline-flex items-center gap-2 font-semibold ${link}`}>
                <IconPhone size={16} className="text-brand-600" /> <span dir="ltr">{site.phone}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className={`inline-flex items-center gap-2 ${link}`}>
                <IconMail size={16} className="text-brand-600" /> <span dir="ltr">{site.email}</span>
              </a>
            </li>
            <li className="flex items-start gap-2 text-[15px] text-ink-soft">
              <IconPin size={16} className="mt-1 shrink-0 text-brand-600" /> {t.home.phone.area}
            </li>
          </ul>
        </div>
        <div>
          <h2 className={colTitle}>{g.start.tilesTitle}</h2>
          <ul className="mt-4 space-y-2.5">
            {navItems(locale, g)
              .filter((i) => i.key !== "home")
              .map((i) => (
                <li key={i.key}>
                  <Link href={i.href} className={link}>
                    {i.label}
                  </Link>
                </li>
              ))}
            <li>
              <HelpLink className={link}>{g.help}</HelpLink>
            </li>
          </ul>
        </div>
        <div>
          <h2 className={colTitle}>{g.contactPage.legalTitle}</h2>
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
      <div className="border-t border-line bg-white">
        <div className="container-page py-5 text-[13px] text-ink-muted">
          © {new Date().getFullYear()} {site.brand}
        </div>
      </div>
    </footer>
  );
}
