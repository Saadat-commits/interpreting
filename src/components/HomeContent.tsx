import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import {
  IconArrow,
  IconBriefcase,
  IconBuilding,
  IconCheck,
  IconCounsel,
  IconDoc,
  IconFamily,
  IconHome,
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

/**
 * Startseite – bewusst ruhig: weiß, grün als einzige Akzentfarbe, echte Fotos
 * afghanischer Berge. Nur drei Dinge: Informationen (Leistungen), Termin buchen, AGB.
 */
export function HomeContent({ locale, t }: { locale: Locale; t: Dictionary }) {
  const h = t.home;
  const book = (q = "") => `/${locale}/termin${q}`;
  const [titleA, titleB] = h.title.split("\n");

  return (
    <>
      <Header locale={locale} t={t.nav} />
      <main className="overflow-x-clip">
        {/* ---------- Hero ---------- */}
        <section className="container-page pt-8 sm:pt-14">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              {h.eyebrow}
            </p>
            <h1 className="mt-5 text-[2.1rem] font-bold leading-[1.1] tracking-tight text-ink sm:text-[3.4rem]">
              {titleA}
              <br />
              <span className="text-brand-700">{titleB}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-soft sm:text-lg">{h.lead}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={book()} className="btn-primary !px-7 !py-4 !text-base">
                {h.ctaBook} <IconArrow size={19} className="rtl:rotate-180" />
              </Link>
              <a href={site.phoneHref} className="btn-ghost !px-6 !py-4 !text-base">
                <IconPhone size={18} className="text-brand-600" />
                <span dir="ltr">{site.phone}</span>
              </a>
            </div>
            <ul className="mt-7 flex flex-col gap-2.5 text-[15px] text-ink-soft sm:flex-row sm:flex-wrap sm:gap-x-6">
              {h.facts.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                    <IconCheck size={12} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Panorama: Nuristan */}
        <figure className="container-page mt-10 sm:mt-14">
          <div className="relative overflow-hidden rounded-[28px] bg-brand-50 shadow-[0_30px_60px_-30px_rgba(16,40,28,.35)]">
            <img
              src={imageUrl("nuristan.jpg")}
              srcSet={`${imageUrl("nuristan-sm.jpg")} 1000w, ${imageUrl("nuristan.jpg")} 2000w`}
              sizes="(min-width: 1152px) 1100px, 100vw"
              alt=""
              className="h-[240px] w-full object-cover sm:h-[440px]"
              fetchPriority="high"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/50 to-transparent" aria-hidden="true" />
            <figcaption className="absolute bottom-3 end-3 rounded-full bg-white/85 px-3 py-1 text-[11px] text-ink-muted backdrop-blur">{h.heroCredit}</figcaption>
          </div>
        </figure>

        {/* ---------- Zwei Wege ---------- */}
        <section id="leistungen" className="container-page scroll-mt-24 pt-20 sm:pt-28">
          <h2 className="text-[1.75rem] font-bold tracking-tight text-ink sm:text-4xl">{h.waysTitle}</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            <WayCard icon={<IconPin size={26} />} title={h.onsite.title} text={h.onsite.text} area={h.onsite.area} cta={h.onsite.cta} href={book("?leistung=onsite")} />
            <WayCard icon={<IconPhone size={26} />} title={h.phone.title} text={h.phone.text} area={h.phone.area} cta={h.phone.cta} href={book("?leistung=phone")} />
          </div>
        </section>

        {/* ---------- Wobei ich übersetze ---------- */}
        <section className="container-page pt-20 sm:pt-28">
          <h2 className="text-[1.75rem] font-bold tracking-tight text-ink sm:text-4xl">{h.servicesTitle}</h2>
          <p className="mt-3 text-[17px] text-ink-muted">{h.servicesLead}</p>
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {h.services.map((s) => (
              <li key={s.title}>
                <Link
                  href={book(`?leistung=onsite&anlass=${s.key}`)}
                  className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift lg:flex-col lg:gap-3 lg:p-5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                    {serviceIcons[s.icon]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] font-bold text-ink">{s.title}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-ink-muted">{s.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Für Einrichtungen ---------- */}
        <section className="container-page pt-20 sm:pt-28">
          <div className="grid grid-cols-1 gap-8 rounded-[28px] border border-line bg-white p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand-700">{h.orgEyebrow}</p>
              <h2 className="mt-3 text-[1.6rem] font-bold leading-tight tracking-tight text-ink sm:text-3xl">{h.orgTitle}</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">{h.orgText}</p>
              <Link href={book("?wer=einrichtung")} className="btn-primary mt-7 !px-6 !py-3.5">
                {h.orgCta} <IconArrow size={18} className="rtl:rotate-180" />
              </Link>
            </div>
            <ul className="space-y-3">
              {h.orgPoints.map((p) => (
                <li key={p} className="flex items-center gap-3 rounded-2xl bg-brand-50/60 px-4 py-3.5 text-[15px] font-semibold text-ink">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-brand-700 ring-1 ring-brand-100">
                    <IconCheck size={15} strokeWidth={2.6} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Abschluss: Band-e Amir ---------- */}
        <section className="container-page pt-20 sm:pt-28">
          <div className="relative overflow-hidden rounded-[28px]">
            <img
              src={imageUrl("band-e-amir.jpg")}
              srcSet={`${imageUrl("band-e-amir-sm.jpg")} 1000w, ${imageUrl("band-e-amir.jpg")} 2000w`}
              sizes="(min-width: 1152px) 1100px, 100vw"
              alt=""
              loading="lazy"
              className="h-[380px] w-full object-cover sm:h-[420px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d2a1c]/85 via-[#0d2a1c]/35 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <h2 className="text-[1.6rem] font-bold leading-tight text-white sm:text-4xl">{h.closingTitle}</h2>
              <p className="mt-2 max-w-xl text-[16px] text-white/85">{h.closingText}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={book()} className="btn bg-white !px-6 !py-3.5 text-brand-800 shadow-lift hover:bg-brand-50">
                  {h.ctaBook} <IconArrow size={18} className="rtl:rotate-180" />
                </Link>
                <a href={site.agbUrl} target="_blank" rel="noopener" className="btn border border-white/40 !px-5 !py-3.5 text-white hover:bg-white/10">
                  <IconDoc size={18} /> {h.agbTitle}
                </a>
              </div>
            </div>
            <p className="absolute end-3 top-3 rounded-full bg-black/30 px-3 py-1 text-[11px] text-white/85 backdrop-blur">{h.closingCredit}</p>
          </div>
        </section>
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}

function WayCard({ icon, title, text, area, cta, href }: { icon: ReactNode; title: string; text: string; area: string; cta: string; href: string }) {
  return (
    <div className="flex flex-col rounded-[24px] border border-line bg-white p-6 transition hover:border-brand-200 hover:shadow-lift sm:p-8">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-[0_12px_24px_-12px_rgba(31,112,73,.8)]">{icon}</span>
      <h3 className="mt-5 text-2xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">{text}</p>
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50/60 px-3.5 py-2.5 text-[14px] font-semibold text-brand-800">
        <IconPin size={16} className="mt-0.5 shrink-0" /> {area}
      </p>
      <Link href={href} className="mt-6 inline-flex items-center gap-2 self-start text-[15px] font-bold text-brand-700 hover:gap-3 hover:underline">
        {cta} <IconArrow size={17} className="rtl:rotate-180" />
      </Link>
    </div>
  );
}
