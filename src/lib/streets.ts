/**
 * Straßen zu einer PLZ – für die Vorschläge unter dem Straßenfeld.
 *
 * Produktion: OpenPLZ API (amtliches Straßenverzeichnis, ohne API-Schlüssel),
 * Fallback: Photon/OpenStreetMap. Offline/Demo: kleine Beispielliste.
 */

/** Beispiel-Straßen für Demo und Entwicklung ohne Internet */
export const DEMO_STREETS: Record<string, string[]> = {
  "90402": ["Königstraße", "Luitpoldstraße", "Frauentorgraben", "Marientorgraben", "Färberstraße", "Kornmarkt", "Lorenzer Platz", "Breite Gasse", "Karolinenstraße", "Hallplatz", "Pfannenschmiedsgasse", "Königstorgraben", "Gleißbühlstraße"],
  "90403": ["Hauptmarkt", "Theresienstraße", "Burgstraße", "Albrecht-Dürer-Platz", "Egidienplatz", "Hans-Sachs-Platz", "Weinmarkt", "Rathausplatz", "Tucherstraße", "Füll", "Obstmarkt"],
  "90408": ["Pirckheimerstraße", "Bucher Straße", "Rollnerstraße", "Friedrichstraße", "Wurzelbauerstraße", "Kirchenweg", "Kaulbachstraße", "Löbleinstraße"],
  "90419": ["Prof.-Ernst-Nathan-Straße", "Johannisstraße", "Kirchhoffstraße", "Brückenstraße", "Wallensteinstraße", "Schnieglinger Straße"],
  "90429": ["Fürther Straße", "Bärenschanzstraße", "Gostenhofer Hauptstraße", "Kernstraße", "Leopoldstraße", "Wiesentalstraße", "Obere Kanalstraße"],
  "90439": ["Schweinauer Hauptstraße", "Rothenburger Straße", "Schwabacher Straße", "Hohe Marter", "Kanalstraße", "Dianastraße"],
  "90441": ["Schweinauer Hauptstraße", "Ansbacher Straße", "Frankenstraße", "Gibitzenhofstraße", "Wallensteinstraße"],
  "90443": ["Dietzstraße", "Richard-Wagner-Platz", "Allersberger Straße", "Sandstraße", "Frauentorgraben", "Kohlenhofstraße", "Tafelfeldstraße", "Steinbühler Straße", "Gugelstraße", "Humboldtstraße", "Pillenreuther Straße"],
  "90459": ["Humboldtstraße", "Wölckernstraße", "Landgrabenstraße", "Pillenreuther Straße", "Gugelstraße", "Aufseßplatz", "Allersberger Straße", "Hummelsteiner Weg"],
  "90461": ["Allersberger Straße", "Wodanstraße", "Harsdörfferstraße", "Siemensstraße", "Schweiggerstraße"],
  "90471": ["Karl-Schönleben-Straße", "Breslauer Straße", "Liegnitzer Straße", "Neuselsbrunn"],
  "90478": ["Regensburger Straße", "Schlossstraße", "Scheurlstraße", "Stephanstraße", "Harsdörfferstraße"],
  "90489": ["Äußere Sulzbacher Straße", "Sulzbacher Straße", "Bayreuther Straße", "Kressenstraße", "Wöhrder Hauptstraße", "Laufer Schlagturm"],
  "90762": ["Königstraße", "Schwabacher Straße", "Nürnberger Straße", "Gustavstraße", "Moststraße", "Friedrichstraße", "Königswarterstraße", "Rudolf-Breitscheid-Straße"],
  "91052": ["Hauptstraße", "Nürnberger Straße", "Güterhallenstraße", "Hugenottenplatz", "Luitpoldstraße", "Werner-von-Siemens-Straße"],
  "91054": ["Hauptstraße", "Universitätsstraße", "Schlossplatz", "Krankenhausstraße", "Östliche Stadtmauerstraße", "Maximiliansplatz"],
  "90547": ["Hauptstraße", "Faber-Castell-Straße", "Albrecht-Dürer-Straße", "Rednitzstraße"],
  "10115": ["Invalidenstraße", "Chausseestraße", "Torstraße", "Brunnenstraße", "Bergstraße", "Linienstraße"],
  "80331": ["Marienplatz", "Kaufingerstraße", "Sendlinger Straße", "Rosenstraße", "Tal", "Rindermarkt"],
};

export function normalizeStreetKey(s: string) {
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/str\.?$/, "strasse")
    .replace(/[^a-z0-9äöü]/g, "");
}

/** Filtert und sortiert Straßennamen: Treffer am Anfang zuerst, dann enthaltene */
export function rankStreets(all: string[], query: string, limit = 6): string[] {
  const q = normalizeStreetKey(query);
  const unique = [...new Set(all)];
  if (!q) return unique.sort((a, b) => a.localeCompare(b, "de")).slice(0, limit);
  const starts: string[] = [];
  const contains: string[] = [];
  for (const s of unique) {
    const k = normalizeStreetKey(s);
    if (k.startsWith(q)) starts.push(s);
    else if (k.includes(q)) contains.push(s);
  }
  const byLen = (a: string, b: string) => a.length - b.length || a.localeCompare(b, "de");
  return [...starts.sort(byLen), ...contains.sort(byLen)].slice(0, limit);
}
