import { NextResponse } from "next/server";
import { citiesForPostalCode } from "@/lib/postal";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  return NextResponse.json({ cities: citiesForPostalCode(code) }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
