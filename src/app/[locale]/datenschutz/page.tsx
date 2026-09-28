import { notFound } from "next/navigation";
import { LegalPage } from "@/components/LegalPage";
import { DatenschutzContent } from "@/components/LegalContent";
import { getDictionary, isLocale } from "@/lib/i18n";

export const metadata = { title: "Datenschutz" };

// MUSTERTEXT – vor dem Livegang an die tatsächlichen Dienste (Hosting, E-Mail, Chat, Karten) anpassen und prüfen lassen.
export default async function Datenschutz({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <LegalPage locale={locale} t={t} title={t.legal.privacy}>
      <DatenschutzContent />
    </LegalPage>
  );
}
