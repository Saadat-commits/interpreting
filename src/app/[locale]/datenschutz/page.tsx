import { notFound } from "next/navigation";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";
import { getDictionary, isLocale } from "@/lib/i18n";

export const metadata = { title: "Datenschutz" };

// MUSTERTEXT – vor dem Livegang an die tatsächlichen Dienste (Hosting, E-Mail, Chat, Karten) anpassen und prüfen lassen.
export default async function Datenschutz({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <LegalPage locale={locale} t={t} title={t.legal.privacy}>
      <h2>1. Verantwortliche Stelle</h2>
      <p>
        {site.brand}, {site.owner}, {site.street}, {site.postalCode} {site.city}, E-Mail: {site.email}
      </p>
      <h2>2. Terminbuchung</h2>
      <p>
        Wenn Sie einen Termin buchen, verarbeiten wir die von Ihnen angegebenen Daten (Name, Kontaktdaten, Terminort, Name der Klientin bzw. des
        Klienten, Rechnungsadresse und Hinweise) ausschließlich zur Durchführung und Abrechnung des Auftrags (Art. 6 Abs. 1 lit. b DSGVO). Die Daten
        werden nach Ablauf der gesetzlichen Aufbewahrungsfristen gelöscht.
      </p>
      <h2>3. Adressvorschläge</h2>
      <p>
        Für die Adresseingabe werden Ihre Eingaben über unseren Server an einen Geodienst (OpenStreetMap/Photon bzw. Google Places) übermittelt, um
        passende Adressvorschläge anzuzeigen. Ihre IP-Adresse wird dabei nicht an den Dienst weitergegeben.
      </p>
      <h2>4. Chat und Kontakt</h2>
      <p>
        Nachrichten, die Sie über den Chat senden, werden gespeichert und per E-Mail an uns weitergeleitet, um Ihre Anfrage zu beantworten (Art. 6
        Abs. 1 lit. b bzw. f DSGVO).
      </p>
      <h2>5. Speicherung im Browser</h2>
      <p>
        Um Ihnen bei der nächsten Buchung Zeit zu sparen, speichern wir Ihre Kontaktdaten lokal in Ihrem Browser (localStorage). Diese Daten verlassen
        Ihr Gerät nicht und können jederzeit über die Browsereinstellungen gelöscht werden.
      </p>
      <h2>6. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das
        Recht auf Beschwerde bei einer Aufsichtsbehörde (in Bayern: Bayerisches Landesamt für Datenschutzaufsicht).
      </p>
    </LegalPage>
  );
}
