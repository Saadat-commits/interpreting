import { NextResponse } from "next/server";
import { streetsForPostalCode } from "@/lib/server/streets";
import { rankStreets } from "@/lib/streets";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plz = searchParams.get("plz") ?? "";
  const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!/^\d{5}$/.test(plz)) return NextResponse.json({ streets: [] });
  if (!rateLimit(req, "streets", 120)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const all = await streetsForPostalCode(plz, q);
  return NextResponse.json({ streets: rankStreets(all, q, 6) });
}
