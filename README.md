# Interpreting NBG – Dolmetschen & Begleitung

Website mit Buchungsplattform für professionelles Dolmetschen **Persisch (Farsi) · Dari · Paschtu ↔ Deutsch** –
telefonisch deutschlandweit und als persönliche Begleitung zu Arzt-, Schul-, Jugendamt- und Behördenterminen.

Next.js 15 (App Router) · TypeScript · Tailwind CSS · pdf-lib · Nodemailer

## Schnellstart

```bash
npm install
cp .env.example .env.local   # Werte anpassen
npm run dev                  # http://localhost:3000
```

Produktion: `npm run build && npm start` (Node-Server, z. B. VPS/Docker). Tests: `npm test`, Typprüfung: `npm run lint`.

## Was ist enthalten

| Bereich | Umsetzung |
| --- | --- |
| Design | Weiß + ein grüner Akzent, viel Weißraum, sanfte Schatten/Hover/Scroll-Einblendungen, leichte 3D-Neigung im Hero. Kulturelle Akzente: Girih-Sternmuster und Spitzbogen (Iwan) aus afghanisch-persischer Ornamentik, zweisprachige Zitate – keine Flaggen. Illustrationen sind eigene SVGs (`src/components/HeroVisual.tsx`, `ArchArtwork.tsx`). |
| Sprachen | `/de` und `/fa` (Persisch, rechtsbündig/RTL, Schrift Vazirmatn). Umschalter oben rechts, `/` leitet je nach Browsersprache weiter. Texte: `src/lib/i18n/de.ts`, `fa.ts`. |
| Buchung | 4-Schritt-Assistent unter `/[locale]/termin`: Leistung → Kalender → Angaben → Prüfen. Nur freie Zeiten sind anklickbar (grün), belegte/nicht verfügbare rot und gesperrt. Doppelbuchungen werden serverseitig verhindert. |
| Adressen | Frei getippte Adressen (z. B. „Luisenstraß 3 90762 Fürth“) werden erkannt, korrigiert und sofort übernommen. Zusätzlich Autocomplete über Google Places (mit `GOOGLE_MAPS_API_KEY`) oder OpenStreetMap/Photon (ohne Schlüssel). „Weiter“ erst bei vollständiger, ausgewählter Adresse; fehlt z. B. die Hausnummer, wird gezielt nachgefragt. Manuelle Eingabe als Rückfalloption. Checkbox „Das ist auch meine Rechnungsadresse“ ist standardmäßig aktiv. |
| Automatik | Einrichtung (z. B. „Jugendamt Nürnberg“) und Terminart werden aus der gewählten Adresse erkannt, die Rückrufnummer aus der Telefonnummer übernommen, Kontaktdaten wiederkehrender Kund:innen lokal im Browser gemerkt. |
| Preise | **Nirgends auf der Website.** Nur serverseitig in `src/config/pricing.ts` (Beispielwerte!) und im Abschnitt „Abrechnung“ der PDF-Rechnung. |
| E-Mail-Bestätigung | Nach dem Absenden ist der Termin 60 Min. reserviert; Kund:innen bestätigen per Link in der E-Mail (Double-Opt-in). Erst dann ist der Termin verbindlich. Link-Basis: `SITE_URL`. |
| Nach Bestätigung | Automatisch: PDF-Rechnung, Bestätigungsmail mit persönlicher Dankesnachricht (bei persischer Buchung zweisprachig) inkl. Rechnung + AGB als Anhang, Benachrichtigung an Sie. Kalenderdatei (.ics) zum Download. |
| AGB | Sauber gesetztes PDF unter `/agb.pdf` (Inhalt: `src/content/agb.ts`), dezent im Footer verlinkt. |
| Kontakt | Fixierte Buttons unten rechts: Anrufen + Live-Chat. Chat integriert (Nachrichten gespeichert + per E-Mail) oder echter Echtzeit-Chat über Crisp (`NEXT_PUBLIC_CRISP_WEBSITE_ID`). |
| Nicht öffentlich | Solange `SITE_PUBLIC` ≠ `true`: `noindex` + robots-Sperre; mit `SITE_PASSWORD` zusätzlich Passwortschutz für die ganze Seite. |

## Online stellen unter interpreting-nbg.de (Vercel + Supabase)

Die Domain liegt bei Squarespace (ehemals Google Domains), E-Mail läuft über Google Workspace.
**Die E-Mail-Einträge (MX, TXT/SPF, DKIM) werden nicht angefasst** – nur die Einträge für die Website.

1. **Datenbank:** Supabase-Projekt anlegen (Region Frankfurt). Unter *Connect → Transaction pooler* die
   Verbindungs-URL kopieren (Port 6543). Tabellen legt die Website beim ersten Start selbst an.
2. **Hosting:** Auf vercel.com mit GitHub anmelden → *Add New → Project* → Repository `interpreting` importieren.
   Unter *Environment Variables* mindestens setzen: `DATABASE_URL`, `SITE_URL=https://www.interpreting-nbg.de`,
   `SITE_PASSWORD` (solange die Seite nicht öffentlich sein soll), `OWNER_EMAIL`, SMTP-Werte (siehe `.env.example`).
3. **Domain:** In Vercel *Settings → Domains* `interpreting-nbg.de` und `www.interpreting-nbg.de` hinzufügen.
4. **DNS bei Squarespace:** *Domains → interpreting-nbg.de → DNS-Einstellungen*:
   - die Squarespace-Standardeinträge für die Website entfernen (A-Einträge `198.185.159.x` / `198.49.23.x`
     und CNAME `www → ext-sq.squarespace.com`),
   - neu anlegen: `A @ → 76.76.21.21` und `CNAME www → cname.vercel-dns.com`
     (bzw. genau die Werte, die Vercel unter *Domains* anzeigt),
   - Google-Workspace-Einträge (MX, TXT) **unverändert lassen**.
5. Nach einigen Minuten bis Stunden ist die Seite unter der Domain erreichbar (HTTPS richtet Vercel automatisch ein).

## Vor dem Livegang anpassen

- `src/config/site.ts` – Name, Anschrift, Telefon, E-Mail, Steuernummer, Bankverbindung (alle `TODO`).
- `src/config/pricing.ts` – echte Honorare, Kleinunternehmerregelung ja/nein.
- `src/config/availability.ts` – Arbeitszeiten, Vorlauf, Puffer, Urlaubstage.
- `src/content/agb.ts`, Impressum und Datenschutz – **Mustertexte, bitte rechtlich prüfen lassen.**
- SMTP-Zugang eintragen, `OWNER_EMAIL` setzen.
- Zum Veröffentlichen: `SITE_PUBLIC=true` und `SITE_PASSWORD` leeren.

## Vorbereitet für später

Das Datenmodell (`src/lib/types.ts`) enthält bereits alle Felder:

- **Google Kalender** – `Booking.calendar` (Provider, calendarId, eventId, Sync-Status). Schnittstelle `CalendarProvider`
  in `src/lib/server/calendar/`; der Platzhalter `google.ts` wird mit `freebusy.query` (Belegung) und `events.insert`
  (Eintrag) gefüllt und über `GOOGLE_CALENDAR_ENABLED` aktiviert. Die Verfügbarkeit berücksichtigt dann automatisch beide Quellen.
- **Zahlung (Stripe/Revolut)** – `Booking.payment` / `Invoice.payment` (Provider, Status, externe ID, Checkout-Link).
  Schnittstelle `PaymentProvider` in `src/lib/server/payments/`; ein Checkout-Link erscheint dann automatisch auf der Rechnung.
- **Datenbank** – Speicherung läuft über die Schnittstelle `Store` (`src/lib/server/store/`). Aktuell JSON-Datei
  (ideal für einen einzelnen Server); für Serverless-Hosting oder mehrere Instanzen durch z. B. Postgres ersetzen.

## Projektstruktur

```
src/
  app/[locale]/        Seiten (Start, Termin, Impressum, Datenschutz) – de/fa
  app/api/             availability · places · bookings · chat
  app/agb.pdf/         AGB als PDF
  components/          UI (Header, Hero, Chat, Buchungsassistent …)
  config/              Stammdaten, Verfügbarkeit, Preise (server-only)
  lib/                 Datenmodell, Verfügbarkeit, Validierung, i18n
  lib/server/          Buchung, PDF, Mail, Kalender, Zahlung, Speicher
assets/fonts/          Schriften für die PDFs
```
