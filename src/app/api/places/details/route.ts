import { NextResponse } from "next/server";
import { getPlacesProvider } from "@/lib/server/places";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const provider = getPlacesProvider();
  if (!id || !provider.details) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    const address = await provider.details(id, {
      lang: searchParams.get("lang") ?? "de",
      session: searchParams.get("session") ?? undefined,
    });
    return address ? NextResponse.json({ address }) : NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch (e) {
    console.error("[places/details]", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
