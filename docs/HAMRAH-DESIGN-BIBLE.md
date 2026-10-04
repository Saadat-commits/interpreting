# HAMRAH Design Bible

Diese Datei ist das Design-Gesetz für die öffentliche HAMRAH-Website. Jede neue Seite, Komponente und Animation
richtet sich danach. Wenn Code und Bible sich widersprechen, wird eines von beiden angepasst – nie stillschweigend
ignoriert.

Technische Quelle der Werte: `tailwind.config.ts` (Tokens), `src/app/globals.css` (Komponenten-Klassen),
`src/config/services.ts` (Service Worlds), `src/components/hamrah/` (Bausteine), `src/components/three/` (3D).

---

## 1. Brand

**HAMRAH** (همراه) heißt auf Persisch „Begleiter“, „der mitgeht“. Das ist die ganze Idee:
HAMRAH geht mit – vom ersten Klick bis der Auftrag erledigt ist.

| Kern | Bedeutung für das Design |
| --- | --- |
| Begleitung | Jede Leistung ist ein **Weg** mit klaren Stationen. Das zentrale grafische Motiv ist die **HAMRAH-Linie**: eine durchgehende Linie, die Schritte verbindet. |
| Herkunft | Afghanische Berge (Logo, Fotografie), persische Sprache, Fürth als Heimat. Kultur zeigt sich ruhig – im Logo, in Fotos, in zweisprachigen Details. Keine Flaggen, keine Folklore-Ornamente als Tapete. |
| Verlässlichkeit | Klare Sprache, ehrliche Aussagen, keine erfundenen Zahlen, Siegel oder Garantien. |
| Handwerk | Sechs konkrete Leistungen, die man anfassen kann: Eimer, Karton, Schraube, Paket, Stimme, Schutz. Deshalb physische 3D-Objekte statt abstrakter Blobs. |

**Tonalität:** direkt, warm, kurz. Sie-Form auf Deutsch, höflich-respektvoll auf Persisch. Jeder Satz beantwortet
eine Frage, die sich Kund:innen wirklich stellen („Was kostet das?“ → „Wovon der Preis abhängt“).

**Name im Text:** immer `HAMRAH` in Versalien als Wortmarke, im Fließtext ebenfalls `HAMRAH`.

---

## 2. Farben

Eine Basis aus warmem Papier und tiefem Nachtgrün, ein Markengrün, ein Safran-Akzent. Jede Service World bekommt
**eine** eigene Akzentfarbe – nur in ihrer Welt, nie gemischt.

### Basis

| Token | Wert | Einsatz |
| --- | --- | --- |
| `night` | `#0D1411` | dunkle Bühnen (Service Worlds, CTA), Text auf hell |
| `night-soft` | `#17211C` | Flächen auf dunkel |
| `stone` | `#F3F1EB` | warme Hintergrundfläche, Hero-Bühne |
| `stone-deep` | `#E8E4DA` | Linien/Flächen auf `stone` |
| `paper` | `#FFFFFF` | Inhaltsflächen, Formulare |
| `ink` | `#13201A` | Haupttext |
| `ink-soft` | `#3B4A43` | Sekundärtext |
| `ink-muted` | `#5F6E67` | Meta-Text (Kontrast ≥ 4.5:1 auf Weiß und `stone`) |
| `line` | `#E4EAE6` | Trennlinien |
| `brand-600` | `#1F7049` | HAMRAH-Grün: primäre Aktionen, Links, Fokus |
| `brand-700` | `#195A3C` | Hover der primären Aktion |
| `mint` | `#6EE7A0` | Grün auf dunklem Grund (nie auf Weiß für Text) |
| `saffron` | `#E9A23B` | die HAMRAH-Linie, aktive Station, kleine Hervorhebung. Nie als Fläche für Text. |
| `busy` | `#B94A43` | ausschließlich Fehler / „nicht verfügbar“ |

### Service-World-Akzente

| Welt | Token | Wert | Idee |
| --- | --- | --- | --- |
| Reinigung | `world-cleaning` | `#3A9FB5` | Wasser |
| Umzug | `world-moving` | `#C27C3E` | Karton |
| Montage | `world-assembly` | `#5872A0` | Werkzeugstahl |
| Transport | `world-transport` | `#D9653B` | Signal / unterwegs |
| Dolmetschen | `world-interpreting` | `#1F7049` | HAMRAH-Grün (Ursprung der Marke) |
| Sicherheit | `world-security` | `#3F4C86` | Nacht / Schutz |

**Regeln**
- Text auf Akzentfarben nur in Weiß und nur ab 18 px fett, sonst Akzent nur für Icons, Linien, 3D-Materialien.
- Verläufe nur als Licht (radial, sehr weich) – nie als Button- oder Kartenhintergrund.
- Kein Glassmorphism als Stil. `backdrop-blur` nur für den fixierten Header, damit Text darunter lesbar bleibt.

---

## 3. Typografie

- **Manrope** (Latein) für alles, **Vazirmatn** für Persisch (`html[dir=rtl]`). Beide über `next/font`, `display: swap`.
- Keine weiteren Schriften. Hierarchie entsteht durch Größe, Gewicht und Weißraum.

| Rolle | Klasse | Größe (mobil → desktop) | Gewicht | Zeilenhöhe | Laufweite |
| --- | --- | --- | --- | --- | --- |
| Display (Hero) | `.t-display` | 40 → 76 px | 800 | 1.02 | -0.035em |
| H1 Seite | `.t-h1` | 34 → 56 px | 800 | 1.05 | -0.03em |
| H2 Abschnitt | `.t-h2` | 28 → 44 px | 750 | 1.1 | -0.025em |
| H3 | `.t-h3` | 19 → 22 px | 700 | 1.25 | -0.01em |
| Lead | `.t-lead` | 17 → 19 px | 500 | 1.6 | 0 |
| Body | Standard | 15–16 px | 400/500 | 1.6 | 0 |
| Label / Eyebrow | `.t-eyebrow` | 12.5 px | 700 | 1 | 0.14em, Versalien (nur Latein) |

- Persisch: keine negative Laufweite, keine Versalien, Zeilenhöhe +0.15.
- Überschriften `text-wrap: balance`, Absätze max. 62 Zeichen (`max-w-[62ch]`).
- Zahlen in Formularen und Zeiten `tabular-nums`.

---

## 4. Spacing

Basis 4 px. Abschnitte atmen – lieber eine Sektion weniger als eine gequetschte.

| Token | Wert | Einsatz |
| --- | --- | --- |
| Abschnitt | `py-24` mobil, `py-32` desktop | Abstand zwischen Story-Abschnitten |
| Block | `gap-10` / `gap-16` | Überschrift ↔ Inhalt |
| Element | `gap-3` / `gap-4` | Elemente in Listen |
| Seitenrand | `px-5` mobil, `px-8` tablet, max. Breite `1240px` (`.container-hamrah`) |

---

## 5. Radius

| Token | Wert | Einsatz |
| --- | --- | --- |
| `rounded-full` | – | Buttons, Chips, Statusmarken |
| `rounded-2xl` | 16 px | Eingabefelder, kleine Flächen |
| `rounded-[28px]` | 28 px | große Flächen (Bühnen, Panels) |
| 3D-Objekte | weich gefaste Kanten (RoundedBox) | gleiche Haptik wie die UI |

Keine Mischung aus eckig und rund in einer Komponente.

---

## 6. Buttons

| Variante | Klasse | Einsatz |
| --- | --- | --- |
| Primär | `.h-btn .h-btn-primary` | **eine** Hauptaktion pro Bildschirm („Leistung wählen“, „Anfrage senden“) |
| Sekundär | `.h-btn .h-btn-secondary` | Alternativen („Anrufen“) |
| Auf dunkel | `.h-btn .h-btn-light` | Primär auf `night` |
| Textlink | `.h-link` | Weiterführend, mit Pfeil, der sich 2 px bewegt |

- Höhe 48 px (Touch-Ziel ≥ 44 px), Padding 24 px, Schrift 15 px / 700.
- Hover: Farbe dunkelt ab, Pfeil wandert. **Kein** Hochspringen, kein Glow.
- Fokus: 3 px Ring `brand-600` mit 2 px Abstand – immer sichtbar, auch auf dunkel (dann `mint`).
- Deaktiviert: 45 % Deckkraft + `cursor-not-allowed`, Grund daneben als Text.

---

## 7. Navigation

- Header fixiert, 68 px hoch, weiß mit 85 % Deckkraft + Blur, unterer Rand erscheint erst nach dem Scrollen.
- Links: Wortmarke + Berg-Logo. Mitte: Leistungen, So funktioniert’s, Kontakt. Rechts: Sprache, Telefon, „Buchen“ (Primär).
- Aktive Seite: `aria-current="page"` + 2 px Linie in `saffron` unter dem Wort.
- Mobil: Logo + „Buchen“ + Menü-Knopf. Das Menü ist ein Vollbild-Panel mit großen Zeilen (56 px), den sechs
  Leistungen mit Farbpunkt und Telefon am Ende. Fokus wird im Panel gehalten, `Esc` schließt.

---

## 8. Cards

HAMRAH vermeidet Karten-Raster. Wenn Inhalte gruppiert werden müssen:

- **Zeilen statt Karten**: Listen mit Trennlinien (Leistungsumfang, benötigte Informationen).
- **Bühnen**: eine große Fläche pro Thema (`rounded-[28px]`, `stone` oder `night`), nie mehr als zwei nebeneinander.
- Schatten nur für schwebende Ebenen (Header, Dropdown, Hilfe-Chat). Flächen haben keine Schatten, sondern Kontrast.
- Hover einer klickbaren Fläche: Inhalt bewegt sich (Pfeil, Objekt), die Fläche selbst bleibt ruhig.

---

## 9. Mobile

Mobile ist eine eigene Experience, kein verkleinerter Desktop.

| Thema | Desktop (≥ 1024 px) | Mobile (< 1024 px) |
| --- | --- | --- |
| 3D | Volle Szene, Schatten, Berge im Hintergrund, Maus-Parallaxe | Weniger Objekte, keine Schatten, `devicePixelRatio ≤ 1.5`, keine Parallaxe |
| Scroll-Story | Pinned + Scrub (GSAP) | Kein Pinning. Szene klebt oben (40 % Höhe), Schritte scrollen darunter |
| Service Selector | Liste + 3D-Fokus bei Hover | Große Touch-Zeilen, Tippen öffnet die Welt direkt |
| Service Worlds | Station für Station gescrubbt | Horizontal wischbare Stationen (Scroll-Snap) |
| Navigation | Inline | Vollbild-Panel |
| Formular | Zwei Spalten wo sinnvoll | Eine Spalte, Aktionsleiste unten fixiert |

---

## 10. Motion

**Gesetz: Animation muss eine Information erklären. Wenn sie nichts erklärt, fliegt sie raus.**

| Erlaubt | Verboten |
| --- | --- |
| Fortschritt zeigen (Linie wächst, Station leuchtet) | Fade-in für jedes Element |
| Ursache → Wirkung (Wasser → saubere Fläche) | Dauerhaft schwebende Deko |
| Fokus lenken (Kamera fährt zum gewählten Service) | Parallaxe ohne Bezug zum Inhalt |
| Zustandswechsel (Schritt 2 → 3 im Formular) | Bounce, Elastic, Konfetti |

- Bibliothek: **GSAP + ScrollTrigger** für Scroll-Storytelling (Pin, Scrub, Timeline). CSS-Transitions für Hover/Fokus.
- Kurven: `power3.out` für Eintritte, `power2.inOut` für Kamerafahrten, `none` für Scrub.
- Dauer: Hover 200 ms, Zustandswechsel 350–450 ms, Kamerafahrt 900–1200 ms.
- Alle GSAP-Instanzen laufen in `gsap.context()` / `gsap.matchMedia()` und werden beim Unmount mit `revert()` entfernt.
- `prefers-reduced-motion: reduce`: kein Pinning, kein Scrub, keine Kamerafahrten. Szenen springen auf den Zielzustand.
  Alle Informationen bleiben als Text sichtbar.

---

## 11. 3D

**Erst fragen: braucht die Szene echtes 3D?**

| Echtes 3D (three.js) | DOM / CSS / SVG |
| --- | --- |
| Räumliche Objekte, die man erkennen muss: Karton, Transporter, Paket, Möbel, Eimer | Linien, Schritte, Zahlen, Formulare |
| Kamera, Licht, Schatten, Tiefe sind Teil der Aussage | Hover-Effekte, Fortschritt |

Entscheidung für HAMRAH:
- **three.js** für das Hero-Diorama und die Hero-Szenen der Service Worlds. Kein Spline-Export, weil Spline-Runtime
  (~1 MB) und externe Szenen-Dateien schwer zu kontrollieren sind; die Objekte werden prozedural aus einfachen,
  weich gefasten Formen gebaut (eigene Formensprache, keine gekauften Modelle).
- **Rendern nur bei Bedarf** (`requestRender()`): bei Kamerafahrt, Scrub, Hover, Resize. Keine Dauer-Render-Loop.
- Canvas wird erst geladen, wenn er in Sichtweite kommt (`IntersectionObserver` + `import()`), und ist `aria-hidden`.
  Jede Information der Szene steht zusätzlich im DOM.
- Ohne WebGL: ruhiges Standbild (Logo-Berge + Farbe der Welt), Inhalt unverändert.
- Material: matt (`MeshStandardMaterial`, roughness 0.55–0.8), Farben aus den Tokens, ein Hauptlicht von links oben,
  weiches Füll-Licht, Schatten nur auf Desktop.

**Formensprache:** weiche Kanten, kompakte Proportionen, wenig Details, eine Akzentfarbe pro Objekt. Wie gut gemachtes
Spielzeug – nicht wie CAD und nicht wie Cartoon.

---

## 12. Service Worlds

Jede Leistung ist eine eigene Welt mit **einer Geschichte in Stationen**. Die Geschichte wird in der Szene gezeigt,
in der Stationsliste geschrieben und im Formular abgefragt. Quelle: `src/config/services.ts`.

| Welt | Stationen (Szene) |
| --- | --- |
| Reinigung | Schmutz → Wasser → Reinigung → Oberfläche sauber → Buchung |
| Umzug | Wohnung → Kartons → Packen → LKW → Route → Ankunft |
| Montage | Einzelteile → Werkzeuge → Montage → fertiges Möbel |
| Transport | Paket → Abholung → Fahrzeug → Route → Lieferung |
| Dolmetschen | Sprache A → Dolmetscher → Sprache B → Termin → Einsatz |
| Sicherheit | Mitarbeiter → Qualifikation → Auftrag → unterwegs → Einsatz → Abschluss |

Jede Welt-Seite hat in dieser Reihenfolge: Hero-Szene mit Titel → Ablauf (Szene scrubbt durch die Stationen) →
Leistungen → Was wir von Ihnen brauchen → Wovon der Preis abhängt → Buchung.

Neue Welt hinzufügen: Eintrag in `services.ts` (Texte de/fa, Stationen, Fragen) + Szene in
`src/components/three/worlds/`. Das Formular entsteht automatisch aus den Fragen.

---

## 13. Photography

- Nur echte Fotos mit Quellenangabe (aktuell: Nuristan und Band-e Amir, Unsplash). Keine Stock-Menschen mit Headset.
- Fotos sind Atmosphäre (Herkunft, Weite) – nie Beweis für eine Leistung, die sie nicht zeigen.
- Immer `srcset` (1000 w / 2000 w), `loading="lazy"` außerhalb des ersten Bildschirms, `alt=""` wenn rein atmosphärisch.
- Über Fotos liegt Text nur mit einem `night`-Verlauf von mindestens 55 % Deckkraft.

---

## 14. Accessibility

- WCAG 2.2 AA: Kontrast ≥ 4.5:1 für Text, ≥ 3:1 für Bedienelemente und Fokusringe.
- Alles per Tastatur bedienbar; sichtbarer Fokus; logische Tab-Reihenfolge; „Zum Inhalt springen“-Link.
- Service Selector: echte Links in einer Liste. Fokus löst dieselbe Szenenreaktion aus wie Hover.
- 3D und dekorative SVGs `aria-hidden="true"`; die Information steht als Text daneben.
- Formulare: jedes Feld mit `<label>`, Fehler mit `aria-describedby` und Text (nie nur Farbe), Gruppen als `fieldset`/`legend`.
- RTL: logische Eigenschaften (`ms-`, `pe-`, `start-`), Pfeile spiegeln (`rtl:rotate-180`).
- Reduced Motion siehe Motion.

---

## 15. Performance

| Budget | Wert |
| --- | --- |
| JS beim ersten Laden (Startseite, ohne 3D) | ≤ 140 kB gzip |
| three.js + Szene | nachgeladen, nur wenn sichtbar |
| LCP | ≤ 2.5 s (Hero-Text ist LCP, nicht die Szene) |
| CLS | ≤ 0.05 (Canvas-Container mit fester Höhe) |
| Bilder | ≤ 250 kB je Bild, WebP/JPEG mit `srcset` |

- Keine Videos, keine Dauer-Render-Loops, keine Bibliothek für etwas, das CSS kann.
- `renderer.setPixelRatio(min(devicePixelRatio, 2))` desktop, `1.5` mobil; Geometrien/Materialien beim Unmount `dispose()`.
- ScrollTrigger-Instanzen und Event-Listener beim Unmount entfernen.

---

## 16. UX-Regeln

1. **Eine Aufgabe pro Abschnitt.** Hero erklärt, Selector lässt wählen, Worlds zeigen, Ablauf erklärt, Trust beruhigt, CTA bucht.
2. **Wählen vor Ausfüllen.** Erst die Leistung, dann nur die Fragen, die für diese Leistung nötig sind.
3. **Jede Leistung hat eigene Fragen.** Nie dasselbe Formular für alles.
4. **Eine Frage pro Gedanke.** Auswahl als große Chips statt Dropdown, Zahlen als Stepper, Text nur wenn nötig.
5. **Ehrlich über den Status.** Dolmetschen ist direkt buchbar (freie Termine). Andere Leistungen sind eine Anfrage,
   auf die ein verbindliches Angebot folgt – das steht so auf dem Knopf und in der Bestätigung.
6. **Preise:** keine Beträge auf der Website. Stattdessen „Wovon der Preis abhängt“ – konkret und vollständig.
7. **Telefon ist immer einen Tipp entfernt.** Header, Welt-Seiten, Formular.
8. **Nichts erfinden.** Keine Kundenzahlen, Bewertungen, Siegel oder Garantien, die es nicht gibt.

---

## 17. Design Review – vor jedem Merge

Ist das HAMRAH? · Ist es hochwertig? · Ist es klar? · Ist es einzigartig? · Erklärt die Animation etwas? ·
Ist es mobil gut? · Ist es schnell? · Ist es ohne Animation genauso verständlich?

Prüfbreiten: 1440, 1280, 1024, 430, 390, 375 px. Prüfen: Hero, Services, Animation, Navigation, CTA, Footer,
Buchung, horizontales Überlaufen, Konsole ohne Fehler, Reduced Motion.
Werkzeug: `node scripts/visual-review.mjs` (Screenshots aller Breiten + Konsole + Überlauf).
