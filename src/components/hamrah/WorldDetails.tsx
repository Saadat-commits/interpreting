import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { bookingHref, services, type ServiceWorld } from "@/config/services";
import type { Dictionary } from "@/lib/i18n";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import type { Locale } from "@/lib/types";
import { IconArrow, IconCheck, IconPhone, IconPin } from "../icons";
import { ServiceIcon } from "./ServiceIcon";

function Block({ eyebrow, title, children, aside }: { eyebrow: string; title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-t border-ink/10 py-14 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div>
          <p className="t-eyebrow text-ink-muted">{eyebrow}</p>
          <h2 className="t-h2 mt-3 max-w-[16ch] text-ink">{title}</h2>
          {aside}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function Rows({ items, color, icon }: { items: string[]; color: string; icon: "check" | "dot" }) {
  return (
    <ul className="border-t border-ink/10">
      {items.map((it) => (
        <li key={it} className="flex items-start gap-4 border-b border-ink/10 py-4 text-[17px] text-ink">
          {icon === "check" ? (
            <IconCheck size={20} strokeWidth={2.4} className="mt-1 shrink-0" style={{ color }} />
          ) : (
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
          )}
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** Leistungen → Ihre Angaben → Preislogik → (Dolmetschen: Anlässe) → Buchung → weitere Welten */
export function WorldDetails({ locale, t, s }: { locale: Locale; t: Dictionary; s: ServiceWorld }) {
  const h = hamrahCopy[locale];
  const book = bookingHref(locale, s);
  const wizard = s.booking.mode === "wizard";
  return (
    <>
      <div className="bg-white">
        <div className="container-hamrah">
          <Block eyebrow={h.world.includes} title={h.world.includesTitle}>
            <Rows items={s.includes.map((x) => x[locale])} color={s.color} icon="check" />
          </Block>
          <Block eyebrow={h.world.needs} title={h.world.needsTitle}>
            <Rows items={s.needs.map((x) => x[locale])} color={s.color} icon="dot" />
          </Block>
          <Block eyebrow={h.world.pricing} title={h.world.pricingTitle} aside={<p className="mt-4 max-w-[40ch] text-[15px] text-ink-muted">{h.world.noPrices}</p>}>
            <p className="text-[19px] font-semibold leading-relaxed text-ink">{s.pricing.intro[locale]}</p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {s.pricing.factors.map((f, i) => (
                <li key={f.de} className="flex gap-3 rounded-2xl bg-stone p-5">
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: s.color }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[16px] leading-snug text-ink">{f[locale]}</span>
                </li>
              ))}
            </ol>
          </Block>

          {wizard && (
            <Block eyebrow={t.home.waysTitle} title={t.gov.servicesPage.listTitle}>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: <IconPin size={20} />, w: t.home.onsite, href: `/${locale}/termin?leistung=onsite` },
                  { icon: <IconPhone size={20} />, w: t.home.phone, href: `/${locale}/termin?leistung=phone` },
                ].map(({ icon, w, href }) => (
                  <Link key={w.title} href={href} className="group flex flex-col rounded-[22px] bg-stone p-6 transition-colors hover:bg-stone-deep">
                    <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundColor: s.color }}>
                      {icon}
                    </span>
                    <span className="mt-4 text-[19px] font-bold text-ink">{w.title}</span>
                    <span className="mt-1.5 text-[15px] text-ink-soft">{w.text}</span>
                    <span className="mt-1 text-[13px] text-ink-muted">{w.area}</span>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-brand-700">
                      {w.cta} <IconArrow size={16} className="h-arrow" />
                    </span>
                  </Link>
                ))}
              </div>
              <ul className="mt-6 border-t border-ink/10">
                {t.home.services.map((a) => (
                  <li key={a.title} className="border-b border-ink/10">
                    <Link href={`/${locale}/termin?leistung=onsite&anlass=${a.key}`} className="group flex items-center gap-4 py-4">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-bold text-ink">{a.title}</span>
                        <span className="block text-[14px] text-ink-muted">{a.text}</span>
                      </span>
                      <IconArrow size={18} className="h-arrow shrink-0 text-ink-faint group-hover:text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 rounded-2xl border border-ink/10 p-5 text-[15px] leading-relaxed text-ink-soft">
                <strong className="block text-ink">{t.gov.start.noticeTitle}</strong>
                {t.home.orgText}{" "}
                <Link href={`/${locale}/termin?wer=einrichtung`} className="h-link">
                  {t.home.orgCta}
                </Link>
              </p>
            </Block>
          )}
        </div>
      </div>

      <section className="on-dark relative isolate overflow-hidden bg-night py-24 text-white sm:py-32">
        <div aria-hidden className="absolute -top-40 start-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl rtl:translate-x-1/2" style={{ background: `radial-gradient(closest-side, ${s.color}, transparent)` }} />
        <div className="container-hamrah">
          <p className="flex items-center gap-2 text-[15px] font-bold text-white/70">
            <ServiceIcon slug={s.slug} size={18} /> {s.name[locale]}
          </p>
          <h2 className="t-h1 mt-4">{h.world.bookTitle}</h2>
          <p className="t-lead mt-4 max-w-[50ch] text-white/70">{wizard ? h.world.bookTextWizard : h.world.bookTextRequest}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={book} className="h-btn h-btn-light">
              {wizard ? h.world.bookWizard : h.world.bookRequest} <IconArrow size={18} className="h-arrow" />
            </Link>
            <a href={site.phoneHref} className="h-btn h-btn-ghost-light">
              <IconPhone size={18} /> <span dir="ltr">{site.phone}</span>
            </a>
          </div>

          <h3 className="mt-20 text-[13px] font-bold text-white/50">{h.world.other}</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {services
              .filter((o) => o.slug !== s.slug)
              .map((o) => (
                <li key={o.slug}>
                  <Link href={`/${locale}/leistungen/${o.slug}`} className="group flex items-center gap-3 rounded-2xl bg-white/[.06] p-4 transition-colors hover:bg-white/[.1]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ backgroundColor: o.color }}>
                      <ServiceIcon slug={o.slug} size={18} />
                    </span>
                    <span className="flex-1 text-[15px] font-bold">{o.name[locale]}</span>
                    <IconArrow size={16} className="h-arrow text-white/50" />
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </>
  );
}
