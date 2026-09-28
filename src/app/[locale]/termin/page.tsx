import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { AppointmentCategory } from "@/lib/types";

// Liest Query-Parameter (Leistung, Anlass bzw. Bestätigungs-Token) → immer dynamisch rendern
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).booking.title } : {};
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ leistung?: string; anlass?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { leistung, anlass } = await searchParams;
  const t = getDictionary(locale);
  const initial = leistung === "phone" || leistung === "onsite" ? leistung : undefined;
  const category = anlass && anlass in t.categories ? (anlass as AppointmentCategory) : undefined;
  return (
    <>
      <Header locale={locale} t={t.nav} minimal />
      <main className="relative min-h-[80vh] overflow-hidden pb-32">
        <div className="bg-girih pointer-events-none absolute inset-x-0 top-0 h-[420px] mask-fade-b opacity-80" aria-hidden="true" />
        <div className="container-page relative max-w-4xl pt-10 sm:pt-14">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">{t.booking.title}</h1>
            <p className="mt-3 text-lg text-ink-muted">{t.booking.subtitle}</p>
          </div>
          <div className="mt-10">
            <BookingWizard locale={locale} t={t} initialService={initial} initialCategory={category} />
          </div>
        </div>
      </main>
    </>
  );
}
