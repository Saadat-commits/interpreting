# Auftrag an Kimi: Design der Hamrah-Website verbessern

Du bekommst nur die **Design-Dateien** einer Webseite (React 19, TanStack Start, Tailwind CSS v4, lucide-react).
Verbessere **Design, Animation und 3D-Effekte**. Mache die Seite deutlich schöner, lebendiger und professioneller,
wie die besten Webseiten (Revolut, Stripe, Linear). Viel Bewegung, aber hochwertig und ruhig.

## Das darfst du ändern
- Tailwind-Klassen, Farben, Abstände, Schriftgrößen, Verläufe, Schatten, Rundungen
- `src/styles.css` (neue Animationen mit `@keyframes`, 3D-Effekte, Übergänge)
- `src/components/motion.tsx` (Einblenden, Neigung, Tiefe, Globus, neue Effekte)
- Reihenfolge und Aufbau der Bereiche in `src/routes/index.tsx`, neue rein dekorative Elemente

## Das darfst du NICHT ändern (sonst geht die App kaputt)
- Alle Ausdrücke mit Texten und Daten wie `t.…`, `w.…`, `d.…`, `useLocale()`, `designCopy`, `webCopy` (nur umstellen, nie löschen oder umbenennen)
- `Link to="…"`, `search={{ … }}`, `href="tel:…"`, `SITE_PHONE_*` (Ziele der Knöpfe müssen bleiben)
- `createFileRoute(...)` und die `head`-Angaben
- Importe von `@/lib/...` und `@/assets/...` (nur ergänzen, nicht entfernen)
- Nichts mit Server, Anmeldung, Schlüsseln, Datenbank oder Zahlungen hinzufügen

## Regeln
1. **Nichts löschen**: Inhalte und Funktionen bleiben, nur besser gestaltet.
2. Keine neuen Pakete (kein framer-motion, kein three.js). Nur CSS, Canvas und React.
3. `prefers-reduced-motion` respektieren (Bewegung aus, Inhalt bleibt sichtbar).
4. Muss am Handy (390 px Breite) und am Computer gut aussehen, ohne waagerechtes Scrollen.
5. Rechts-nach-links-Sprachen (Dari, Farsi, Paschtu) müssen funktionieren: keine festen `left`/`right`-Texte ohne Gegenstück.
6. Schnell bleiben: Animationen nur mit `transform` und `opacity`, Canvas pausieren wenn nicht sichtbar.
7. Keine erfundenen Zahlen, Auszeichnungen oder Versprechen („zertifiziert“, „100 % sicher“ usw.) in Texten.
8. Gib mir **die vollständigen geänderten Dateien** zurück (nicht nur Ausschnitte), mit dem gleichen Dateipfad.

## Marke
Dunkelgrün-Schwarz `#0c0e0d`, Grün `#6ee7a0` und `#3d5a3e`, Gelb `#fcd34d` für Hervorhebung, helle Flächen `#f4f5f3`.
Schrift Inter. Stimmung: ruhig, vertrauenswürdig, afghanische Berge, Fürth, Dolmetschen Dari/Farsi/Paschtu.
