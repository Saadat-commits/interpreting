import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header, PageHeader } from "@/components/Header";
import { VerifyBooking } from "@/components/booking/BookingDone";
import { getDictionary, isLocale } from "@/lib/i18n";

// Liest Query-Parameter (Leistung, Anlass bzw. Bestätigungs-Token) → immer dynamisch rendern
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Termin bestätigen", robots: { index: false } };

export default async function VerifyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { t: token = "" } = await searchParams;
  const t = getDictionary(locale);
  return (
    <>
      <Header locale={locale} t={t} active="book" />
      <PageHeader locale={locale} t={t} title={t.gov.book} crumbs={[{ href: `/${locale}/termin`, label: t.gov.book }, { label: "✓" }]} />
      <main className="container-page max-w-3xl py-10">
        <VerifyBooking t={t} locale={locale} token={token} />
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}
