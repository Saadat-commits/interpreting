import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroVisual } from "@/components/HeroVisual";
import { Reveal } from "@/components/Reveal";
import { ArchArtwork } from "@/components/ArchArtwork";
import {
  IconArrow,
  IconBridge,
  IconCheck,
  IconClock,
  IconPhone,
  IconPin,
  IconScale,
  IconShield,
  categoryIcons,
} from "@/components/icons";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { AppointmentCategory } from "@/lib/types";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const valueIcons = [IconShield, IconScale, IconBridge, IconClock];

  return (
    <>
      <Header locale={locale} t={t.nav} />
      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden">
          <div className="bg-dots pointer-events-none absolute inset-0 mask-radial opacity-70" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-40 end-[-10%] h-[520px] w-[520px] rounded-full bg-brand-100/50 blur-3xl" aria-hidden="true" />
          <div className="container-page relative grid items-center gap-14 pb-20 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-28">
            <div>
              <div className="eyebrow animate-fade-up">
                <span className="h-px w-8 bg-brand-500" aria-hidden="true" />
                {t.hero.eyebrow}
              </div>
              <h1 className="mt-6 whitespace-pre-line text-[2.6rem] font-bold leading-[1.05] text-ink animate-fade-up [animation-delay:80ms] sm:text-6xl lg:text-[4.2rem] rtl:leading-[1.3]">
                {t.hero.title.split("\n")[0]}
                {"\n"}
                <span className="relative inline-block text-brand-600">
                  {t.hero.title.split("\n")[1]}
                  <svg className="absolute -bottom-2 start-0 h-3 w-full text-brand-200" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M2 9C50 3 150 3 198 8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft animate-fade-up [animation-delay:160ms]">{t.hero.lead}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up [animation-delay:240ms]">
                <Link href={`/${locale}/termin`} className="btn-primary !px-7 !py-4 !text-base">
                  {t.hero.ctaPrimary}
                  <IconArrow size={20} />
                </Link>
                <a href={site.phoneHref} className="btn-ghost !px-6 !py-4 !text-base">
                  <IconPhone size={18} className="text-brand-600" />
                  {t.hero.ctaSecondary}
                </a>
              </div>
              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 animate-fade-up [animation-delay:320ms]">
                {t.hero.trust.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-brand-700">
                      <IconCheck size={13} strokeWidth={2.4} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-fade-up [animation-delay:200ms]">
              <HeroVisual t={t.hero} locale={locale} />
            </div>
          </div>
        </section>

        {/* ---------- Leistungen ---------- */}
        <section id="leistungen" className="scroll-mt-24 py-20 lg:py-28">
          <div className="container-page">
            <Reveal className="max-w-2xl">
              <div className="eyebrow">{t.services.eyebrow}</div>
              <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-[2.6rem]">{t.services.title}</h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {([
                { key: "phone", icon: IconPhone, data: t.services.phone },
                { key: "onsite", icon: IconPin, data: t.services.onsite },
              ] as const).map(({ key, icon: Icon, data }, i) => (
                <Reveal key={key} delay={i * 120}>
                  <article className="card card-hover group relative h-full overflow-hidden p-8 sm:p-10">
                    <div className="bg-girih pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden="true" />
                    <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgba(44,138,93,.12)] transition-all duration-500 group-hover:-rotate-6 group-hover:bg-brand-600 group-hover:text-white">
                      <Icon size={26} />
                    </div>
                    <h3 className="relative mt-7 text-2xl font-bold">{data.title}</h3>
                    <p className="relative mt-3 text-[16px] leading-relaxed text-ink-soft">{data.text}</p>
                    <ul className="relative mt-7 space-y-3 border-t border-line pt-6">
                      {data.points.map((p) => (
                        <li key={p} className="flex items-center gap-3 text-[15px] font-medium text-ink">
                          <IconCheck size={18} className="text-brand-600" strokeWidth={2.2} />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/${locale}/termin?leistung=${key}`} className="relative mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-700 transition-all group-hover:gap-3">
                      {t.nav.book} <IconArrow size={18} />
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-8">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-paper px-6 py-5">
                <span className="me-2 text-sm font-semibold text-ink-muted">{t.services.languagesTitle}</span>
                {t.services.languages.map((l) => (
                  <span key={l} className="chip">
                    {l}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- Einsatzorte ---------- */}
        <section className="relative overflow-hidden bg-paper py-20 lg:py-28">
          <div className="bg-girih pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper via-paper/40 to-paper" aria-hidden="true" />
          <div className="container-page relative">
            <Reveal className="mx-auto max-w-2xl text-center">
              <div className="eyebrow">{t.settings.eyebrow}</div>
              <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-[2.6rem]">{t.settings.title}</h2>
            </Reveal>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {t.settings.items.map((item, i) => {
                const Icon = categoryIcons[item.key as AppointmentCategory];
                return (
                  <Reveal key={item.key} delay={(i % 3) * 90}>
                    <div className="card card-hover group flex h-full items-start gap-5 p-6">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-100 bg-white text-brand-700 shadow-soft transition duration-500 group-hover:scale-110 group-hover:border-brand-200">
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{item.title}</h3>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{item.text}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- Ablauf ---------- */}
        <section id="ablauf" className="scroll-mt-24 py-20 lg:py-28">
          <div className="container-page">
            <Reveal className="max-w-2xl">
              <div className="eyebrow">{t.process.eyebrow}</div>
              <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-[2.6rem]">{t.process.title}</h2>
            </Reveal>
            <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
              <div className="pointer-events-none absolute inset-x-[16%] top-9 hidden h-px bg-gradient-to-r from-brand-100 via-brand-300 to-brand-100 md:block" aria-hidden="true" />
              {t.process.steps.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 140} className="relative">
                  <div className="relative z-10 mx-auto grid h-[72px] w-[72px] place-items-center rounded-full border border-line bg-white shadow-lift md:mx-0">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">{(i + 1).toLocaleString(locale === "fa" ? "fa-IR" : "de-DE")}</span>
                  </div>
                  <h3 className="mt-6 text-center text-xl font-bold md:text-start">{s.title}</h3>
                  <p className="mt-2 text-center text-[15px] leading-relaxed text-ink-muted md:text-start">{s.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Über uns ---------- */}
        <section id="ueber-uns" className="scroll-mt-24 py-20 lg:py-28">
          <div className="container-page grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <ArchArtwork quote={t.about.quote} quoteAlt={t.about.quoteAlt} locale={locale} />
            </Reveal>
            <div>
              <Reveal>
                <div className="eyebrow">{t.about.eyebrow}</div>
                <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-[2.4rem]">{t.about.title}</h2>
                <p className="mt-6 text-[17px] leading-relaxed text-ink-soft">{t.about.text}</p>
              </Reveal>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {t.about.values.map((v, i) => {
                  const Icon = valueIcons[i];
                  return (
                    <Reveal key={v.title} delay={i * 80}>
                      <div className="flex h-full gap-4 rounded-2xl border border-line bg-white p-5 transition duration-500 hover:border-brand-200 hover:shadow-soft">
                        <Icon size={22} className="mt-0.5 shrink-0 text-brand-600" />
                        <div>
                          <div className="font-bold">{v.title}</div>
                          <div className="mt-1 text-sm leading-relaxed text-ink-muted">{v.text}</div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="pb-8">
          <div className="container-page">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2rem] bg-brand-700 px-8 py-14 text-white shadow-deep sm:px-14 sm:py-16">
                <div className="bg-girih-light absolute inset-0 opacity-70" aria-hidden="true" />
                <div className="absolute -bottom-32 -end-20 h-80 w-80 rounded-full bg-brand-500/40 blur-3xl" aria-hidden="true" />
                <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-3xl font-bold sm:text-4xl">{t.cta.title}</h2>
                    <p className="mt-3 max-w-lg text-lg text-brand-100">{t.cta.text}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/${locale}/termin`} className="btn bg-white !px-7 !py-4 text-brand-800 shadow-lift hover:-translate-y-0.5 hover:bg-brand-50">
                      {t.cta.button} <IconArrow size={20} />
                    </Link>
                    <a href={site.phoneHref} className="btn border border-white/30 !px-6 !py-4 text-white hover:bg-white/10">
                      <IconPhone size={18} />
                      <span dir="ltr">{site.phone}</span>
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}
