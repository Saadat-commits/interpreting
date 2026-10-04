import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ServiceIcon } from "@/components/hamrah/ServiceIcon";
import { IconArrow } from "@/components/icons";
import { bookingHref, services } from "@/config/services";
import { getDictionary, isLocale } from "@/lib/i18n";
import { hamrahCopy } from "@/lib/i18n/hamrah";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: hamrahCopy[locale].request.chooseTitle } : {};
}

export default async function RequestChooserPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const c = hamrahCopy[locale].request;
  return (
    <>
      <Header locale={locale} t={t} active="book" />
      <main id="inhalt" className="bg-stone pb-20 pt-12 sm:pt-16">
        <div className="container-hamrah">
          <h1 className="t-h1 max-w-[18ch] text-ink">{c.chooseTitle}</h1>
          <p className="t-lead mt-5 max-w-[56ch] text-ink-soft">{c.chooseLead}</p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={bookingHref(locale, s)}
                  className="group flex h-full flex-col rounded-3xl border border-ink/10 bg-white p-6 transition-colors hover:border-[color:var(--c)]"
                  style={{ ["--c" as string]: s.color }}
                >
                  <span className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ backgroundColor: s.color }}>
                      <ServiceIcon slug={s.slug} size={22} />
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${s.booking.mode === "wizard" ? "bg-brand-600/10 text-brand-700" : "bg-ink/[.06] text-ink-soft"}`}>
                      {s.booking.mode === "wizard" ? c.direct : c.offer}
                    </span>
                  </span>
                  <span className="mt-6 text-[22px] font-bold tracking-[-0.01em] text-ink">{s.name[locale]}</span>
                  <span className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-soft">{s.short[locale]}</span>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-bold" style={{ color: s.color }}>
                    {c.next} <IconArrow size={18} className="h-arrow" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}
