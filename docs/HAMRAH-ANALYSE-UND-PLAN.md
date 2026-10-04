# HAMRAH – Analyse und Umsetzungsplan

Stand der Analyse: Repository `Saadat-commits/interpreting` (das einzige Repository, auf das diese Entwicklungsumgebung
Zugriff hat).

## A. Aktuelle Architektur

- **Framework:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS 3.4, Vitest.
- **Sprachen:** `/de` und `/fa` (RTL). Texte in `src/lib/i18n/de.ts` und `fa.ts`, Middleware leitet `/` nach Browsersprache weiter
  und schützt die Seite per Passwort, solange `SITE_PUBLIC` ≠ `true`.
- **Seiten:** Start, Leistungen, Termin (Buchungsassistent), Termin bestätigen, Informationen & AGB, Kontakt, Impressum, Datenschutz, `agb.pdf`.
- **APIs (`src/app/api`)**: `bookings` (anlegen, Doppelbuchungsschutz), `bookings/verify` (Double-Opt-in), `bookings/resend`,
  `availability` (freie Zeiten inkl. Google Kalender), `assistant` (KI-Hilfe, Anthropic), `chat`, `places`, `plz`, `streets`.
- **Server-Logik (`src/lib/server`)**: Buchungsservice, Abrechnung, PDF-Rechnung und AGB (pdf-lib), E-Mail (Gmail-API per
  Dienstkonto → SMTP → `.eml`-Ablage), Google Kalender, Rate-Limit, Speicher (Postgres/Supabase über `DATABASE_URL`, sonst JSON-Datei).
- **Statische Vorschau:** `preview/` baut eine Demo ohne Server (esbuild + Mock-API).
- **Nicht in diesem Repository** (im Auftrag genannt, aber hier nicht vorhanden): `CLAUDE.md`, `AGENTS.md`, `docs/STAND.md`,
  `docs/SYSTEMPLAN.md`, Supabase-Auth, Rollen/Permissions, Mitarbeiter-App, Büro, Zeittracking, PIN, QR, Standort,
  Dokumente. Das Paket `design-export/hamrah-design/` stammt aus einer anderen App (TanStack Start, Mitarbeiter-App) und
  enthält nur Design-Code. Diese Bereiche wurden deshalb weder geändert noch gelöscht.

## B. Aktuelles Design

- Stil „Behörden-Website“: grüne Servicezeile, Logo, Reiter-Navigation, Kachel-Raster „Online-Dienste“, Tabellenlisten.
- Farben: Weiß + Grün `#1F7049`, Manrope/Vazirmatn. Ein Foto im Hero.
- Nur eine Leistung (Dolmetschen). Marke „Interpreting NBG“.
- Design-Export „hamrah-design“: dunkler Hero, Phone-Mock, Marquee, Globus-Canvas, Tilt-Karten, viele Fade-ins.

## C. Was kaputt / schlecht ist

1. `src/data/plz.json` fehlte im Repository (von `.gitignore` ausgeschlossen) → Build/Tests rot. Behoben in PR #1.
2. `design-export/` lief in die Typprüfung und erzeugte 20+ Fehler (fremde Abhängigkeiten). Behoben in PR #1.
3. Öffentliche Website erklärt HAMRAH nicht: keine Marke, nur eine Leistung, keine Service-Auswahl.
4. Kachel-Raster und Tabellenlisten wirken wie Verwaltung, nicht wie Premium-Service.
5. Keine Motion-Sprache, keine Szene, kein visueller Anker.
6. Design-Export arbeitet mit Fade-in bei jedem Element, dauerhaft schwebenden Elementen und erfundenen Werten im Phone-Mock („352,82 €“) – widerspricht der Bible.

## D. Was bereits gut ist (bleibt)

- Buchungsassistent Dolmetschen mit echter Verfügbarkeit, Doppelbuchungsschutz, Double-Opt-in, Rechnung, AGB, Kalender.
- Adresseingabe mit PLZ → Ort, Straßenvorschlägen und Fehlerkorrektur (`StructuredAddress`).
- Saubere Trennung Server/Client, Rate-Limit, Honeypot, zod-Validierung, RLS in Postgres.
- Zweisprachigkeit inkl. RTL, Reduced-Motion-Regel in CSS, Fokusring.
- Berg-Logo und echte Fotos aus Afghanistan.

## E. Vorhandene Design-System-Regeln

- Tailwind-Tokens: `brand-50…900`, `ink`, `line`, `busy`, Schatten `soft/lift/deep/ring`, Radius `xl2/xl3`.
- Komponenten-Klassen: `.btn-primary`, `.btn-ghost`, `.card`, `.field`, `.chip`, `.eyebrow`, `.container-page`.
- Regeln im README: Preise nirgends auf der Website, ein Akzent (Grün), keine Flaggen.
- Design-Export: oklch-Variablen, Markenfarben `#0c0e0d`, `#6ee7a0`, `#3d5a3e`, `#fcd34d`.

## F. Vorhandene Animationen

- CSS-Keyframes: `float`, `fade-up`, `step-in/step-back` (Formularschritte), `pulseRing`, `.reveal`.
- Design-Export: Wort-für-Wort-Einblendung, Marquee, Tilt, Depth-Parallaxe, Canvas-Globus.
- **Nicht vorhanden:** GSAP, Three.js, Spline, Framer Motion, WebGL, 3D-Komponenten.

## G. Verfügbare MCPs / Integrationen

| Integration | Status | Genutzt für |
| --- | --- | --- |
| GitHub (`gh` CLI, nur lesend) + Pull-Request-Werkzeug | verfügbar | Repository, PRs |
| Browser (Headless Chrome + Playwright) | verfügbar | Visual Review in 6 Breiten, Konsolenfehler |
| Websuche / Web-Fetch | verfügbar | Dokumentation (GSAP, three.js) |
| Cursor Cloud / Subscriptions | verfügbar | Laufzeit-Infos, CI-Benachrichtigungen |

## H. Fehlende MCPs

| Tool | Status | Was für die Verbindung nötig ist |
| --- | --- | --- |
| Magic Patterns | nicht verbunden | Magic-Patterns-MCP-Server in den Cursor-MCP-Einstellungen hinzufügen (API-Key aus dem Magic-Patterns-Konto) |
| 21st.dev | nicht verbunden | „21st.dev Magic“ MCP-Server mit API-Key von 21st.dev hinzufügen |
| Figma | nicht verbunden | Figma-MCP (Dev Mode) mit Figma-Token, Zugriff auf die HAMRAH-Datei |
| Spline | nicht verbunden | kein offizieller MCP; Szenen-URL/Export aus Spline nötig (für HAMRAH bewusst durch three.js ersetzt) |
| Supabase | nicht verbunden | Supabase-MCP mit Personal Access Token + Projekt-Ref |
| Zugriff auf das HAMRAH-Hauptrepository | fehlt | GitHub-App-Zugriff für das Repository mit Mitarbeiter-App/Auth freigeben |

Keine dieser Integrationen wurde simuliert. Der Code in diesem Repository ist die Source of Truth.

## I. Geänderte / neue Dateien

| Datei | Art |
| --- | --- |
| `docs/HAMRAH-DESIGN-BIBLE.md`, `docs/HAMRAH-ANALYSE-UND-PLAN.md` | neu |
| `tailwind.config.ts`, `src/app/globals.css` | Tokens + HAMRAH-Komponentenklassen ergänzt (alte Klassen bleiben für Formulare) |
| `src/config/services.ts` | neu – Registry der 6 Service Worlds inkl. Fragen |
| `src/lib/i18n/hamrah.ts` | neu – Texte der neuen Website (de/fa) |
| `src/components/Header.tsx`, `Footer.tsx`, `Logo.tsx`, `nav.ts` | neu gestaltet, gleiche Schnittstellen |
| `src/components/HomeContent.tsx` | Startseite ersetzt; Leistungen/Info/Kontakt im neuen Stil |
| `src/components/hamrah/*` | neu – Hero, Selector, Worlds, Ablauf, Trust, CTA, Welt-Seite, Anfrage-Engine |
| `src/components/three/*` | neu – Diorama + Szenen je Welt, on-demand rendering |
| `src/app/[locale]/leistungen/[service]/page.tsx` | neu – Service-Welt-Seiten |
| `src/app/[locale]/anfrage/…` | neu – Service-Auswahl + Formular je Leistung |
| `src/app/api/requests/route.ts` | neu – Anfrage speichern + E-Mails |
| `src/lib/server/store/*`, `src/lib/server/mail.ts`, `src/lib/types.ts` | ergänzt (neue Methode/Tabelle, nichts entfernt) |
| `scripts/visual-review.mjs` | neu – Screenshots in 6 Breiten + Konsole + Überlauf |

Unverändert: Buchungsassistent, Verfügbarkeit, Kalender, Rechnungen, PDF, Double-Opt-in, Middleware, Assistent, Chat.

## J. Reihenfolge der Umsetzung

1. Design Bible + Tokens (Fundament, alles Weitere hängt daran).
2. Service-Registry (eine Quelle für Seiten, Szenen und Formulare).
3. Header/Footer (wirken auf jeder Seite).
4. 3D-Grundlage (Renderer, on-demand, Objekte) + Diorama.
5. Startseite in der vorgegebenen Hierarchie.
6. Service-Welt-Seiten mit Szene je Leistung.
7. Booking Engine + API.
8. Visual Review, Reduced Motion, Performance, Tests.

Offene Entscheidung für den Inhaber: Die Rechtsdaten (Impressum, Rechnung, E-Mail-Absender) laufen weiter über
`site.brand` („Interpreting NBG“). Die öffentliche Website zeigt die Marke HAMRAH. Wenn HAMRAH auch auf Rechnungen
stehen soll, genügt eine Änderung in `src/config/site.ts`.
