import { NextResponse } from "next/server";
import { computeMonth, isValidDuration } from "@/lib/availability";
import { zonedToUtc, daysInMonth, pad } from "@/lib/time";
import { availabilityConfig } from "@/config/availability";
import { getCalendar } from "@/lib/server/calendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service");
  const duration = Number(searchParams.get("duration"));
  const month = searchParams.get("month") ?? "";
  if ((service !== "phone" && service !== "onsite") || !isValidDuration(service, duration) || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const [year, m] = month.split("-").map(Number);
  const tz = availabilityConfig.timezone;
  const from = zonedToUtc(`${year}-${pad(m)}-01`, "00:00", tz);
  const to = zonedToUtc(`${year}-${pad(m)}-${daysInMonth(year, m)}`, "23:59", tz);
  // Einen Tag Rand für Puffer über Mitternacht
  const busy = await getCalendar().getBusy(new Date(from.getTime() - 86400000), new Date(to.getTime() + 86400000));
  const days = computeMonth({ service, durationMinutes: duration, year, month: m, busy });
  return NextResponse.json({ month, timezone: tz, days }, { headers: { "Cache-Control": "no-store" } });
}
