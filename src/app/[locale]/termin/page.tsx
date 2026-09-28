import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header, PageHeader } from "@/components/Header";
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
  searchParams: Promise<{ leistung?: string; anlass?: string; wer?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { leistung, anlass, wer } = await searchParams;
  const t = getDictionary(locale);
  const initial = leistung === "phone" || leistung === "onsite" ? leistung : undefined;
  const category = anlass && anlass in t.categories ? (anlass as AppointmentCategory) : undefined;
  return (
    <>
      <Header locale={locale} t={t} active="book" />
      <PageHeader locale={locale} t={t} title={t.gov.book} lead={t.booking.subtitle} crumbs={[{ label: t.gov.book }]} />
      <main className="pb-10">
        <div className="container-page">
          <BookingWizard locale={locale} t={t} initialService={initial} initialCategory={category} initialWho={wer === "einrichtung" ? "organisation" : wer === "privat" ? "private" : undefined} />
        </div>
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}
