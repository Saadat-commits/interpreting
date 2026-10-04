import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RequestEngine } from "@/components/hamrah/RequestEngine";
import { IconArrow } from "@/components/icons";
import { bookingHref, isServiceSlug, serviceBySlug, serviceSlugs } from "@/config/services";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { hamrahCopy } from "@/lib/i18n/hamrah";

export function generateStaticParams() {
  return locales.flatMap((locale) => serviceSlugs.filter((s) => serviceBySlug(s)!.booking.mode === "request").map((service) => ({ locale, service })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; service: string }> }): Promise<Metadata> {
  const { locale, service } = await params;
  const s = serviceBySlug(service);
  if (!isLocale(locale) || !s) return {};
  return { title: `${s.name[locale]} – ${hamrahCopy[locale].world.bookRequest}` };
}

export default async function ServiceRequestPage({ params }: { params: Promise<{ locale: string; service: string }> }) {
  const { locale, service } = await params;
  if (!isLocale(locale) || !isServiceSlug(service)) notFound();
  const s = serviceBySlug(service)!;
  if (s.booking.mode === "wizard") redirect(bookingHref(locale, s));
  const t = getDictionary(locale);
  const h = hamrahCopy[locale];
  return (
    <>
      <Header locale={locale} t={t} active="book" />
      <main id="inhalt" className="bg-stone pt-8 sm:pt-12">
        <div className="container-hamrah">
          <Link href={`/${locale}/leistungen/${s.slug}`} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-muted hover:text-ink">
            <IconArrow size={16} className="rotate-180" /> {s.name[locale]}
          </Link>
          <h1 className="t-h1 mt-6 max-w-[20ch] text-ink">
            {h.world.bookRequest}: <span style={{ color: s.color }}>{s.name[locale]}</span>
          </h1>
          <p className="t-lead mt-4 max-w-[58ch] text-ink-soft">{h.world.bookTextRequest}</p>
          <div className="mt-10 sm:mt-12">
            <RequestEngine locale={locale} slug={s.slug} addressTexts={t.booking.flow.address} />
          </div>
        </div>
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}
