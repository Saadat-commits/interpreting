import type { PostalAddress } from "@/lib/types";

export interface PlaceSuggestion {
  id: string;
  title: string;
  subtitle: string;
  /** Vollständig, falls der Anbieter die Adresse direkt liefert (Photon) */
  address?: PostalAddress;
  /** Google: Details müssen separat geladen werden */
  needsDetails?: boolean;
}

export interface PlacesProvider {
  suggest(query: string, opts: { lang: string; session?: string }): Promise<PlaceSuggestion[]>;
  details?(id: string, opts: { lang: string; session?: string }): Promise<PostalAddress | null>;
}

const DE_BBOX = "5.87,47.27,15.04,55.06";

/* ---------------- Photon (OpenStreetMap, ohne API-Schlüssel) ---------------- */

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    district?: string;
    locality?: string;
    countrycode?: string;
  };
}

class PhotonProvider implements PlacesProvider {
  constructor(private base = process.env.PHOTON_URL || "https://photon.komoot.io") {}

  async suggest(query: string, { lang }: { lang: string }) {
    const url = new URL("/api/", this.base);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "8");
    url.searchParams.set("lang", lang === "fa" ? "de" : lang);
    url.searchParams.set("bbox", DE_BBOX);
    const res = await fetch(url, {
      headers: { "User-Agent": "interpreting-nbg-booking/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`photon ${res.status}`);
    const data = (await res.json()) as { features: PhotonFeature[] };
    const seen = new Set<string>();
    const out: PlaceSuggestion[] = [];
    for (const f of data.features) {
      const p = f.properties;
      if (p.countrycode && p.countrycode !== "DE") continue;
      const city = p.city || p.town || p.village || p.locality || "";
      const isPoi = !!p.name && p.osm_key !== "place" && p.osm_key !== "highway" && p.type !== "street" && p.type !== "house";
      const street = p.street || (p.type === "street" ? p.name : "") || "";
      const address: PostalAddress = {
        label: [street && `${street}${p.housenumber ? ` ${p.housenumber}` : ""}`, [p.postcode, city].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", "),
        street,
        houseNumber: p.housenumber || "",
        postalCode: p.postcode || "",
        city,
        country: "DE",
        placeName: isPoi ? p.name : undefined,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        source: "photon",
        providerId: `${p.osm_type}${p.osm_id}`,
      };
      const key = `${address.placeName}|${address.label}`;
      if (seen.has(key) || !address.label) continue;
      seen.add(key);
      out.push({
        id: address.providerId!,
        title: isPoi ? p.name! : address.label.split(", ")[0],
        subtitle: isPoi ? address.label : address.label.split(", ").slice(1).join(", "),
        address,
      });
    }
    return out;
  }
}

/* ---------------- Google Places API (New) – aktiv, sobald GOOGLE_MAPS_API_KEY gesetzt ---------------- */

class GooglePlacesProvider implements PlacesProvider {
  constructor(private key: string) {}

  async suggest(query: string, { lang, session }: { lang: string; session?: string }) {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": this.key },
      body: JSON.stringify({ input: query, includedRegionCodes: ["de"], languageCode: lang === "fa" ? "de" : lang, sessionToken: session }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`google ${res.status}`);
    const data = (await res.json()) as {
      suggestions?: { placePrediction?: { placeId: string; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }[];
    };
    return (data.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({
        id: p.placeId,
        title: p.structuredFormat?.mainText?.text ?? "",
        subtitle: p.structuredFormat?.secondaryText?.text ?? "",
        needsDetails: true,
      }));
  }

  async details(id: string, { lang, session }: { lang: string; session?: string }): Promise<PostalAddress | null> {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`);
    url.searchParams.set("languageCode", lang === "fa" ? "de" : lang);
    if (session) url.searchParams.set("sessionToken", session);
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": this.key,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,addressComponents,location,types",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const p = (await res.json()) as {
      id: string;
      displayName?: { text: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      types?: string[];
      addressComponents?: { longText: string; shortText: string; types: string[] }[];
    };
    const comp = (t: string) => p.addressComponents?.find((c) => c.types.includes(t));
    const street = comp("route")?.longText ?? "";
    const isPoi = !!p.types?.some((t) => t === "establishment" || t === "point_of_interest");
    return {
      label: p.formattedAddress ?? "",
      street,
      houseNumber: comp("street_number")?.longText ?? "",
      postalCode: comp("postal_code")?.longText ?? "",
      city: comp("locality")?.longText ?? comp("postal_town")?.longText ?? "",
      country: comp("country")?.shortText ?? "DE",
      placeName: isPoi ? p.displayName?.text : undefined,
      lat: p.location?.latitude,
      lon: p.location?.longitude,
      source: "google",
      providerId: p.id,
    };
  }
}

/* ---------------- Demo-Daten (Entwicklung ohne Internet) ---------------- */

const MOCK: PostalAddress[] = [
  { label: "Dietzstraße 4, 90443 Nürnberg", street: "Dietzstraße", houseNumber: "4", postalCode: "90443", city: "Nürnberg", country: "DE", placeName: "Jugendamt Nürnberg", source: "mock" },
  { label: "Prof.-Ernst-Nathan-Straße 1, 90419 Nürnberg", street: "Prof.-Ernst-Nathan-Straße", houseNumber: "1", postalCode: "90419", city: "Nürnberg", country: "DE", placeName: "Klinikum Nürnberg Nord", source: "mock" },
  { label: "Hauptmarkt 18, 90403 Nürnberg", street: "Hauptmarkt", houseNumber: "18", postalCode: "90403", city: "Nürnberg", country: "DE", placeName: "Rathaus Nürnberg", source: "mock" },
  { label: "Richard-Wagner-Platz 5, 90443 Nürnberg", street: "Richard-Wagner-Platz", houseNumber: "5", postalCode: "90443", city: "Nürnberg", country: "DE", placeName: "Jobcenter Nürnberg-Stadt", source: "mock" },
  { label: "Königstraße 12, 90402 Nürnberg", street: "Königstraße", houseNumber: "12", postalCode: "90402", city: "Nürnberg", country: "DE", source: "mock" },
  { label: "Fürther Straße 80, 90429 Nürnberg", street: "Fürther Straße", houseNumber: "80", postalCode: "90429", city: "Nürnberg", country: "DE", source: "mock" },
  { label: "Hauptstraße 5, 91054 Erlangen", street: "Hauptstraße", houseNumber: "5", postalCode: "91054", city: "Erlangen", country: "DE", source: "mock" },
  { label: "Hauptstraße, 90547 Stein", street: "Hauptstraße", houseNumber: "", postalCode: "90547", city: "Stein", country: "DE", source: "mock" },
];

class MockProvider implements PlacesProvider {
  async suggest(query: string) {
    const q = query.toLowerCase();
    return MOCK.filter((a) => `${a.placeName ?? ""} ${a.label}`.toLowerCase().includes(q) || q.split(/\s+/).every((w) => `${a.placeName ?? ""} ${a.label}`.toLowerCase().includes(w)))
      .slice(0, 6)
      .map((a, i) => ({
        id: `mock-${i}-${a.label}`,
        title: a.placeName ?? a.label.split(", ")[0],
        subtitle: a.placeName ? a.label : a.label.split(", ")[1],
        address: a,
      }));
  }
}

export function getPlacesProvider(): PlacesProvider {
  const choice = process.env.ADDRESS_PROVIDER;
  if (choice === "mock") return new MockProvider();
  if (process.env.GOOGLE_MAPS_API_KEY && choice !== "photon") return new GooglePlacesProvider(process.env.GOOGLE_MAPS_API_KEY);
  return new PhotonProvider();
}
