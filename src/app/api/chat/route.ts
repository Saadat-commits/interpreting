import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/server/store";
import { notifyOwnerOfChat } from "@/lib/server/mail";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().max(120).optional(),
  contact: z.string().trim().min(5).max(200),
  message: z.string().trim().min(2).max(3000),
  locale: z.enum(["de", "fa"]),
  page: z.string().max(300).optional(),
  website: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(req, "chat", 8)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });
  const msg = { id: `chat_${crypto.randomUUID()}`, ...parsed.data, createdAt: new Date().toISOString() };
  delete (msg as { website?: string }).website;
  try {
    await getStore().addChatMessage(msg);
    await notifyOwnerOfChat(msg);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[chat]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
