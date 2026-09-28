import { NextResponse } from "next/server";
import { resendVerification } from "@/lib/server/booking-service";
import { baseUrlFrom } from "@/lib/server/base-url";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(req, "resend", 3)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id.slice(0, 80) : "";
  const ok = id ? await resendVerification(id, baseUrlFrom(req)) : false;
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "invalid" }, { status: 404 });
}
