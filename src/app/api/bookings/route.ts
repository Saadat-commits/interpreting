import { NextResponse } from "next/server";
import { bookingRequestSchema } from "@/lib/booking-schema";
import { createBooking } from "@/lib/server/booking-service";
import { baseUrlFrom } from "@/lib/server/base-url";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(req, "bookings", 10)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 422 });
  }
  try {
    const result = await createBooking(parsed.data, baseUrlFrom(req));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    const b = result.booking;
    // Bewusst ohne Preise/Rechnungsdaten; der Termin ist bis zur E-Mail-Bestätigung reserviert
    return NextResponse.json(
      { id: b.id, status: b.status, email: b.contact.email, start: b.start, end: b.end, holdUntil: b.verification?.expiresAt },
      { status: 201 },
    );
  } catch (e) {
    console.error("[bookings]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
