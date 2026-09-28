import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
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
      <Header locale={locale} t={t.nav} minimal />
      <main className="relative min-h-[80vh] overflow-hidden pb-32">
        <div className="container-page relative max-w-3xl pt-12">
          <VerifyBooking t={t} locale={locale} token={token} />
        </div>
      </main>
    </>
  );
}
