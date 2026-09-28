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
      <main className="relative min-h-[80vh] overflow-x-clip pb-32">
        <div className="container-page relative max-w-6xl">
          <BookingWizard locale={locale} t={t} initialService={initial} initialCategory={category} />
        </div>
      </main>
    </>
  );
}
