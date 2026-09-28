import { notFound } from "next/navigation";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";
import { getDictionary, isLocale } from "@/lib/i18n";

export const metadata = { title: "Impressum" };

// TODO: Angaben vor dem Livegang vervollständigen und prüfen lassen.
export default async function Impressum({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <LegalPage locale={locale} t={t} title={t.legal.imprint}>
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {site.brand}
        <br />
        {site.owner}
        <br />
        {site.street}
        <br />
        {site.postalCode} {site.city}
      </p>
      <h2>Kontakt</h2>
      <p>
        Telefon: {site.phone}
        <br />
        E-Mail: {site.email}
      </p>
      <h2>Steuerliche Angaben</h2>
      <p>
        Steuernummer: {site.taxNumber}
        {site.vatId && (
          <>
            <br />
            USt-IdNr.: {site.vatId}
          </>
        )}
      </p>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </LegalPage>
  );
}
