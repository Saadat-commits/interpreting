import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { Footer } from "@/components/Footer";
import { Header, PageHeader } from "@/components/Header";
import { HelpLink } from "@/components/HelpChat";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import {
  IconArrow,
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconCounsel,
  IconDoc,
  IconFamily,
  IconHelp,
  IconHome,
  IconMail,
  IconMedical,
  IconPhone,
  IconPin,
  IconScale,
  IconSchool,
} from "@/components/icons";

import { bookingHref, services } from "@/config/services";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import { HeroStage } from "@/components/hamrah/HeroStage";
import { HowItWorks } from "@/components/hamrah/HowItWorks";
import { BookingCta, TrustSection } from "@/components/hamrah/Sections";
import { ServiceIcon } from "@/components/hamrah/ServiceIcon";
import { WorldsShowcase } from "@/components/hamrah/WorldsShowcase";

const serviceIcons: Record<string, ReactNode> = {
  family: <IconFamily size={22} />,
  work: <IconBriefcase size={22} />,
  medical: <IconMedical size={22} />,
  school: <IconSchool size={22} />,
  building: <IconBuilding size={22} />,
  scale: <IconScale size={22} />,
  counsel: <IconCounsel size={22} />,
  home: <IconHome size={22} />,
};

const tileIcons: Record<string, ReactNode> = {
  book: <IconCalendar size={26} />,
  services: <IconBriefcase size={26} />,
  info: <IconDoc size={26} />,
  contact: <IconPhone size={26} />,
};

/* ---------- Bausteine ---------- */

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-ink/10 pt-10 first:border-t-0 first:pt-2 [&+section]:mt-14">
      <h2 className="text-[24px] font-bold tracking-[-0.02em] text-ink sm:text-[28px]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 text-[16px] font-bold text-brand-800">
        <IconHelp size={20} /> {title}
      </div>
      <div className="mt-2 text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

function PageShell({ locale, t, active, children }: { locale: Locale; t: Dictionary; active: Parameters<typeof Header>[0]["active"]; children: ReactNode }) {
  return (
    <>
      <Header locale={locale} t={t} active={active} />
      <main id="inhalt" className="pb-24">
        {children}
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}

/* ---------- Startseite ---------- */

/** HEADER → HERO → SERVICE SELECTOR → SERVICE WORLDS → SO FUNKTIONIERT HAMRAH → TRUST → BOOKING CTA → FOOTER */
export function HomeContent({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <>
      <Header locale={locale} t={t} active="home" />
      <main id="inhalt">
        <HeroStage locale={locale} />
        <WorldsShowcase locale={locale} />
        <HowItWorks locale={locale} />
        <TrustSection locale={locale} />
        <BookingCta locale={locale} />
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}

/* ---------- Leistungen (Übersicht der Service Worlds) ---------- */

export function ServicesContent({ locale, t }: { locale: Locale; t: Dictionary }) {
  const h = hamrahCopy[locale];
  return (
    <PageShell locale={locale} t={t} active="services">
      <PageHeader locale={locale} t={t} title={h.selector.title} lead={h.hero.lead} crumbs={[{ label: h.nav.services }]} />
      <div className="container-hamrah">
        <ul className="border-t border-ink/10">
          {services.map((s, i) => (
            <li key={s.slug} className="grid gap-6 border-b border-ink/10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-center lg:gap-12">
              <div className="flex items-start gap-5">
                <span className="pt-1 text-[13px] font-bold tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ backgroundColor: s.color }}>
                    <ServiceIcon slug={s.slug} size={24} />
                  </span>
                  <h2 className="t-h2 mt-5 text-ink">{s.name[locale]}</h2>
                  <p className="mt-2 text-[16px] text-ink-soft">{s.short[locale]}</p>
                </div>
              </div>
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[14px] font-semibold text-ink-soft" aria-label={h.world.journey}>
                {s.journey.map((j, k) => (
                  <li key={j.title.de} className="flex items-center gap-2">
                    {k > 0 && <span aria-hidden className="h-0.5 w-5 rounded-full" style={{ backgroundColor: s.color }} />}
                    <span className="rounded-full bg-stone px-3 py-1.5">{j.title[locale]}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Link href={`/${locale}/leistungen/${s.slug}`} className="h-btn h-btn-secondary">
                  {h.selector.open} <IconArrow size={18} className="h-arrow" />
                </Link>
                <Link href={bookingHref(locale, s)} className="h-btn h-btn-primary">
                  {s.booking.mode === "wizard" ? h.world.bookWizard : h.world.bookRequest}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}

/* ---------- Informationen & AGB ---------- */

export function InfoContent({ locale, t }: { locale: Locale; t: Dictionary }) {
  const g = t.gov;
  const p = g.infoPage;
  return (
    <PageShell locale={locale} t={t} active="info">
      <PageHeader locale={locale} t={t} title={g.info} lead={p.lead} crumbs={[{ label: g.info }]} />
      <div className="container-hamrah">
        <Section title={p.stepsTitle}>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {p.steps.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-line p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-[15px] font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 text-[16px] font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={p.billingTitle}>
          <ul className="space-y-2.5">
            {p.billing.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] text-ink-soft">
                <IconCheck size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-brand-600" /> {b}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={p.agbTitle} id="agb">
          <div className="flex flex-col items-start gap-4 rounded-xl border border-line p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <IconDoc size={28} className="shrink-0 text-brand-700" />
              <p className="text-[15px] text-ink-soft">{p.agbText}</p>
            </div>
            <a href={site.agbUrl} target="_blank" rel="noopener" className="btn-primary shrink-0 !rounded-lg !px-5 !py-3">
              {p.agbCta}
            </a>
          </div>
        </Section>

        <Section title={p.faqTitle}>
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {p.faq.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-[15px] font-semibold text-ink hover:bg-brand-50/50">
                  {f.q}
                  <span className="text-brand-700 transition group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>
      </div>
    </PageShell>
  );
}

/* ---------- Kontakt ---------- */

export function ContactContent({ locale, t }: { locale: Locale; t: Dictionary }) {
  const g = t.gov;
  const p = g.contactPage;
  const card = "rounded-xl border border-line p-5";
  return (
    <PageShell locale={locale} t={t} active="contact">
      <PageHeader locale={locale} t={t} title={g.contact} lead={p.lead} crumbs={[{ label: g.contact }]} />
      <div className="container-hamrah">
        <Section title={g.contact}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className={card}>
              <div className="flex items-center gap-2 font-bold text-ink">
                <IconPhone size={20} className="text-brand-600" /> {g.phone}
              </div>
              <a href={site.phoneHref} className="mt-2 block text-[18px] font-bold text-brand-700 hover:underline" dir="ltr">
                {site.phone}
              </a>
              <p className="mt-1 text-[14px] text-ink-muted">{p.phoneText}</p>
            </div>
            <div className={card}>
              <div className="flex items-center gap-2 font-bold text-ink">
                <IconMail size={20} className="text-brand-600" /> {g.email}
              </div>
              <a href={`mailto:${site.email}`} className="mt-2 block break-all text-[16px] font-semibold text-brand-700 hover:underline" dir="ltr">
                {site.email}
              </a>
              <p className="mt-1 text-[14px] text-ink-muted">{p.emailText}</p>
            </div>
            <div className={card}>
              <div className="flex items-center gap-2 font-bold text-ink">
                <IconHelp size={20} className="text-brand-600" /> {p.helpTitle}
              </div>
              <p className="mt-2 text-[14px] text-ink-muted">{p.helpText}</p>
              <HelpLink className="btn-primary mt-3 !rounded-lg !px-4 !py-2.5 !text-[14px]">{p.helpCta}</HelpLink>
            </div>
          </div>
        </Section>

        <Section title={p.areaTitle}>
          <dl className="overflow-hidden rounded-xl border border-line">
            {g.servicesPage.facts.slice(1, 3).map((f, i) => (
              <div key={f.label} className={`grid grid-cols-1 gap-1 px-4 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-6 ${i ? "border-t border-line" : ""}`}>
                <dt className="text-[14px] font-bold text-ink">{f.label}</dt>
                <dd className="text-[15px] text-ink-soft">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </PageShell>
  );
}
