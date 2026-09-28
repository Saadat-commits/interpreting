import { NextResponse } from "next/server";
import { getPlacesProvider } from "@/lib/server/places";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 3) return NextResponse.json({ suggestions: [] });
  if (!rateLimit(req, "places", 60)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  try {
    const suggestions = await getPlacesProvider().suggest(q, {
      lang: searchParams.get("lang") ?? "de",
      session: searchParams.get("session") ?? undefined,
    });
    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("[places]", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
