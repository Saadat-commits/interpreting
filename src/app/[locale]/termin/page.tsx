import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).booking.title } : {};
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ leistung?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { leistung } = await searchParams;
  const t = getDictionary(locale);
  const initial = leistung === "phone" || leistung === "onsite" ? leistung : undefined;
  return (
    <>
      <Header locale={locale} t={t.nav} minimal />
      <main className="relative min-h-[80vh] overflow-hidden pb-32">
        <div className="bg-girih pointer-events-none absolute inset-x-0 top-0 h-[420px] mask-fade-b opacity-80" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-40 start-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" aria-hidden="true" />
        <div className="container-page relative max-w-4xl pt-10 sm:pt-14">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">{t.booking.title}</h1>
            <p className="mt-3 text-lg text-ink-muted">{t.booking.subtitle}</p>
          </div>
          <div className="mt-10">
            <BookingWizard locale={locale} t={t} initialService={initial} />
          </div>
        </div>
      </main>
    </>
  );
}
