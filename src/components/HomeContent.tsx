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

/** Bilder liegen in /public/images – in der Vorschau relativ zur Seite */
export const imageUrl = (name: string) => `${process.env.NEXT_PUBLIC_ASSET_BASE ?? "/"}images/${name}`;

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
    <section id={id} className="scroll-mt-6 pt-12 first:pt-10">
      <h2 className="border-s-4 border-brand-600 ps-3 text-[1.45rem] font-bold leading-tight text-ink sm:text-[1.6rem]">{title}</h2>
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
      <main>{children}</main>
      <Footer locale={locale} t={t} />
    </>
  );
}

/* ---------- Startseite ---------- */

export function HomeContent({ locale, t }: { locale: Locale; t: Dictionary }) {
  const g = t.gov;
  const hrefs: Record<string, string> = {
    book: `/${locale}/termin`,
    services: `/${locale}/leistungen`,
    info: `/${locale}/informationen`,
    contact: `/${locale}/kontakt`,
  };
  return (
    <PageShell locale={locale} t={t} active="home">
      {/* Titel mit Bergfoto */}
      <div className="border-b border-line">
        <div className="container-page grid grid-cols-1 items-center gap-8 py-8 sm:py-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="text-[1.9rem] font-bold leading-tight tracking-tight text-ink sm:text-[2.5rem]">{g.start.title}</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">{g.start.lead}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={hrefs.book} className="btn-primary !rounded-lg !px-6 !py-3.5">
                {g.book} <IconArrow size={18} className="rtl:rotate-180" />
              </Link>
              <a href={site.phoneHref} className="btn-ghost !rounded-lg !px-5 !py-3.5">
                <IconPhone size={18} className="text-brand-600" /> <span dir="ltr">{site.phone}</span>
              </a>
            </div>
          </div>
          <figure className="relative overflow-hidden rounded-xl">
            <img
              src={imageUrl("nuristan-sm.jpg")}
              srcSet={`${imageUrl("nuristan-sm.jpg")} 1000w, ${imageUrl("nuristan.jpg")} 2000w`}
              sizes="(min-width: 1024px) 520px, 100vw"
              alt=""
              className="h-[200px] w-full object-cover sm:h-[280px]"
            />
            <figcaption className="absolute bottom-2 end-2 rounded bg-white/85 px-2 py-0.5 text-[10.5px] text-ink-muted">{t.home.heroCredit}</figcaption>
          </figure>
        </div>
      </div>

      <div className="container-page">
        {/* Online-Dienste */}
        <Section title={g.start.tilesTitle}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {g.start.tiles.map((tile) => (
              <li key={tile.key}>
                <Link
                  href={hrefs[tile.key]}
                  className={`group flex h-full flex-col rounded-xl border p-5 transition hover:shadow-lift ${
                    tile.key === "book" ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white hover:border-brand-300"
                  }`}
                >
                  <span className={tile.key === "book" ? "text-white" : "text-brand-700"}>{tileIcons[tile.key]}</span>
                  <span className="mt-3 text-[18px] font-bold">{tile.title}</span>
                  <span className={`mt-1 text-[14px] leading-relaxed ${tile.key === "book" ? "text-white/85" : "text-ink-muted"}`}>{tile.text}</span>
                  <span className={`mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold ${tile.key === "book" ? "text-white" : "text-brand-700"}`}>
                    <IconArrow size={16} className="transition group-hover:translate-x-0.5 rtl:rotate-180" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* Häufig gebucht */}
        <Section title={g.start.frequentTitle}>
          <ul className="grid grid-cols-1 overflow-hidden rounded-xl border border-line sm:grid-cols-2">
            {t.home.services.map((s, i) => (
              <li key={s.title} className={`border-line ${i > 0 ? "border-t" : ""} ${i === 1 ? "sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-s" : ""}`}>
                <Link href={`/${locale}/termin?leistung=onsite&anlass=${s.key}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-brand-50/60">
                  <span className="text-brand-700">{serviceIcons[s.icon]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink">{s.title}</span>
                    <span className="block truncate text-[13px] text-ink-muted">{s.text}</span>
                  </span>
                  <IconArrow size={16} className="shrink-0 text-brand-600 rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* Hinweis für Einrichtungen */}
        <section className="pt-12">
          <Notice title={g.start.noticeTitle}>
            <p>{t.home.orgText}</p>
            <Link href={`/${locale}/termin?wer=einrichtung`} className="mt-3 inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
              {t.home.orgCta} <IconArrow size={16} className="rtl:rotate-180" />
            </Link>
          </Notice>
        </section>
      </div>
    </PageShell>
  );
}

/* ---------- Leistungen ---------- */

export function ServicesContent({ locale, t }: { locale: Locale; t: Dictionary }) {
  const g = t.gov;
  const p = g.servicesPage;
  return (
    <PageShell locale={locale} t={t} active="services">
      <PageHeader locale={locale} t={t} title={g.services} lead={p.lead} crumbs={[{ label: g.services }]} />
      <div className="container-page">
        <Section title={p.factsTitle}>
          <dl className="overflow-hidden rounded-xl border border-line">
            {p.facts.map((f, i) => (
              <div key={f.label} className={`grid grid-cols-1 gap-1 px-4 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-6 ${i ? "border-t border-line" : ""} ${i % 2 ? "bg-[#F9FBFA]" : "bg-white"}`}>
                <dt className="text-[14px] font-bold text-ink">{f.label}</dt>
                <dd className="text-[15px] text-ink-soft">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title={t.home.waysTitle}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { icon: <IconPin size={22} />, w: t.home.onsite, href: `/${locale}/termin?leistung=onsite` },
              { icon: <IconPhone size={22} />, w: t.home.phone, href: `/${locale}/termin?leistung=phone` },
            ].map(({ icon, w, href }) => (
              <div key={w.title} className="flex flex-col rounded-xl border border-line p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white">{icon}</span>
                  <h3 className="text-[18px] font-bold text-ink">{w.title}</h3>
                </div>
                <p className="mt-3 text-[15px] text-ink-soft">{w.text}</p>
                <p className="mt-2 text-[14px] text-ink-muted">{w.area}</p>
                <Link href={href} className="mt-4 inline-flex items-center gap-1.5 self-start font-semibold text-brand-700 hover:underline">
                  {w.cta} <IconArrow size={16} className="rtl:rotate-180" />
                </Link>
              </div>
            ))}
          </div>
        </Section>

        <Section title={p.listTitle}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {t.home.services.map((s) => (
              <li key={s.title} className="flex gap-4 rounded-xl border border-line p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">{serviceIcons[s.icon]}</span>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-[14px] text-ink-muted">{s.text}</p>
                  <Link href={`/${locale}/termin?leistung=onsite&anlass=${s.key}`} className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-brand-700 hover:underline">
                    {p.bookThis} <IconArrow size={14} className="rtl:rotate-180" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <section className="pt-12">
          <Notice title={g.start.noticeTitle}>
            <p>{t.home.orgText}</p>
          </Notice>
        </section>
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
      <div className="container-page">
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
      <div className="container-page">
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
