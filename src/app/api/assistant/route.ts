import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runAssistant } from "@/lib/server/assistant";
import { baseUrlFrom } from "@/lib/server/base-url";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  locale: z.enum(["de", "fa"]),
  input: z.string().trim().min(1).max(2000),
  // Verlauf inkl. Tool-Aufrufen – wird unverändert zurückgegeben und wieder mitgeschickt
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.unknown() })).max(60),
});

export async function POST(req: Request) {
  if (!rateLimit(req, "assistant", 30)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const raw = await req.text();
  if (raw.length > 200_000) return NextResponse.json({ error: "too_long" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });
  try {
    const result = await runAssistant(parsed.data.messages as Anthropic.Beta.BetaMessageParam[], parsed.data.input, parsed.data.locale, baseUrlFrom(req));
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) console.error("[assistant] ANTHROPIC_API_KEY fehlt oder ist ungültig");
    else if (e instanceof Anthropic.RateLimitError) console.error("[assistant] rate limited");
    else console.error("[assistant]", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
