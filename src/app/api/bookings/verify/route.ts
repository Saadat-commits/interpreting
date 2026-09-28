import { NextResponse } from "next/server";
import { publicBooking, verifyBooking } from "@/lib/server/booking-service";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(req, "verify", 20)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token.slice(0, 200) : "";
  if (!token) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const result = await verifyBooking(token);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "slot_taken" ? 409 : 404 });
    return NextResponse.json(publicBooking(result.booking));
  } catch (e) {
    console.error("[verify]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
