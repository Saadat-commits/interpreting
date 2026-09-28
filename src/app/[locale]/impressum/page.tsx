import { notFound } from "next/navigation";
import { LegalPage } from "@/components/LegalPage";
import { ImpressumContent } from "@/components/LegalContent";
import { getDictionary, isLocale } from "@/lib/i18n";

export const metadata = { title: "Impressum" };

// TODO: Angaben vor dem Livegang vervollständigen und prüfen lassen.
export default async function Impressum({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <LegalPage locale={locale} t={t} title={t.legal.imprint}>
      <ImpressumContent />
    </LegalPage>
  );
}
