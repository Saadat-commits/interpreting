import { NextResponse } from "next/server";
import { getStore } from "@/lib/server/store";
import { notifyOwnerOfRequest, sendRequestReceipt } from "@/lib/server/mail";
import { rateLimit } from "@/lib/server/rate-limit";
import { serviceRequestSchema, validateRequestAnswers } from "@/lib/service-request";
import type { ServiceRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(req, "requests", 5)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = serviceRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 422 });
  const input = parsed.data;
  const checked = validateRequestAnswers(input.service, input.answers);
  if (!checked.ok) return NextResponse.json({ error: "validation", fields: checked.errors }, { status: 422 });

  const now = new Date().toISOString();
  const contact = { ...input.contact, company: input.contact.customerType === "business" ? input.contact.company || undefined : undefined };
  try {
    const request = await getStore().createServiceRequest(
      (seq): ServiceRequest => ({
        id: `req_${crypto.randomUUID()}`,
        reference: `A-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`,
        status: "new",
        locale: input.locale,
        service: input.service,
        answers: checked.answers,
        contact,
        notes: input.notes || undefined,
        consentAt: now,
        createdAt: now,
      }),
    );
    // Gespeichert ist die Anfrage auf jeden Fall – ein Mailfehler darf sie nicht verloren gehen lassen
    const mails = await Promise.allSettled([notifyOwnerOfRequest(request), sendRequestReceipt(request)]);
    mails.forEach((m) => m.status === "rejected" && console.error("[requests] mail", m.reason));
    return NextResponse.json({ ok: true, reference: request.reference });
  } catch (e) {
    console.error("[requests]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
