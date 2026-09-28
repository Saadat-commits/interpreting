import { DEMO_STREETS } from "@/lib/streets";

/**
 * Alle Straßen einer PLZ laden – mit Zwischenspeicher, damit jede PLZ nur einmal
 * abgefragt wird.
 */
const cache = new Map<string, { at: number; streets: string[] }>();
const TTL = 1000 * 60 * 60 * 24;

async function fromOpenPlz(plz: string): Promise<string[]> {
  const base = process.env.OPENPLZ_URL || "https://openplzapi.org";
  const out: string[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${base}/de/Streets?postalCode=${plz}&page=${page}&pageSize=50`, {
      headers: { Accept: "application/json", "User-Agent": "interpreting-nbg-booking/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`openplz ${res.status}`);
    const rows = (await res.json()) as { name: string }[];
    out.push(...rows.map((r) => r.name));
    const total = Number(res.headers.get("x-total-pages") ?? 0);
    if (rows.length < 50 || (total && page >= total)) break;
  }
  return out;
}

async function fromPhoton(plz: string, query: string): Promise<string[]> {
  const url = new URL("/api/", process.env.PHOTON_URL || "https://photon.komoot.io");
  url.searchParams.set("q", `${query} ${plz}`);
  url.searchParams.set("limit", "15");
  url.searchParams.set("layer", "street");
  url.searchParams.set("lang", "de");
  const res = await fetch(url, { headers: { "User-Agent": "interpreting-nbg-booking/1.0" }, signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`photon ${res.status}`);
  const data = (await res.json()) as { features: { properties: { name?: string; postcode?: string } }[] };
  return data.features.filter((f) => f.properties.postcode === plz && f.properties.name).map((f) => f.properties.name!);
}

export async function streetsForPostalCode(plz: string, query = ""): Promise<string[]> {
  if (!/^\d{5}$/.test(plz)) return [];
  if (process.env.ADDRESS_PROVIDER === "mock") return DEMO_STREETS[plz] ?? [];
  const hit = cache.get(plz);
  if (hit && Date.now() - hit.at < TTL) return hit.streets;
  try {
    const streets = await fromOpenPlz(plz);
    if (streets.length) {
      cache.set(plz, { at: Date.now(), streets });
      if (cache.size > 2000) cache.delete(cache.keys().next().value!);
      return streets;
    }
  } catch (e) {
    console.warn("[streets] openplz", e);
  }
  // Fallback: Photon (nicht zwischengespeichert, da abhängig von der Eingabe)
  if (query.length >= 2) {
    try {
      return await fromPhoton(plz, query);
    } catch (e) {
      console.warn("[streets] photon", e);
    }
  }
  return DEMO_STREETS[plz] ?? [];
}
