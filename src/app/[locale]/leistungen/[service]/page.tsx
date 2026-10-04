import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WorldDetails } from "@/components/hamrah/WorldDetails";
import { WorldStory } from "@/components/hamrah/WorldStory";
import { isServiceSlug, serviceBySlug, serviceSlugs } from "@/config/services";
import { getDictionary, isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) => serviceSlugs.map((service) => ({ locale, service })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; service: string }> }): Promise<Metadata> {
  const { locale, service } = await params;
  const s = serviceBySlug(service);
  if (!isLocale(locale) || !s) return {};
  return { title: `${s.name[locale]} – ${s.heroTitle[locale]}`, description: s.heroLead[locale] };
}

export default async function ServiceWorldPage({ params }: { params: Promise<{ locale: string; service: string }> }) {
  const { locale, service } = await params;
  if (!isLocale(locale) || !isServiceSlug(service)) notFound();
  const t = getDictionary(locale);
  const s = serviceBySlug(service)!;
  return (
    <>
      <Header locale={locale} t={t} active="services" />
      <main id="inhalt">
        <WorldStory locale={locale} slug={service} />
        <WorldDetails locale={locale} t={t} s={s} />
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}
