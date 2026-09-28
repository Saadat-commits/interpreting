import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleCalendarProvider } from "./google";
import type { Booking } from "@/lib/types";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

describe("GoogleCalendarProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("meldet sich per Dienstkonto an, liest Belegung und trägt Termine ein", async () => {
    process.env.GOOGLE_CALENDAR_ID = "saadat@interpreting-nbg.de";
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "website@projekt.iam.gserviceaccount.com";
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = privateKey.export({ type: "pkcs8", format: "pem" }).toString().replace(/\n/g, "\\n");
    const calls: { url: string; body: string }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, body: String(init.body) });
      if (url.includes("oauth2")) {
        const jwt = new URLSearchParams(String(init.body)).get("assertion")!;
        const [h, p, sig] = jwt.split(".");
        const ok = createVerify("RSA-SHA256").update(`${h}.${p}`).verify(publicKey, Buffer.from(sig, "base64url"));
        return new Response(JSON.stringify(ok ? { access_token: "tok", expires_in: 3600 } : {}), { status: ok ? 200 : 401 });
      }
      if (url.endsWith("/freeBusy"))
        return new Response(JSON.stringify({ calendars: { "saadat@interpreting-nbg.de": { busy: [{ start: "2026-10-01T08:00:00Z", end: "2026-10-01T09:00:00Z" }] } } }));
      return new Response(JSON.stringify({ id: "evt123" }));
    });

    const g = GoogleCalendarProvider.fromEnv()!;
    const busy = await g.getBusy(new Date("2026-10-01"), new Date("2026-10-02"));
    expect(busy).toHaveLength(1);

    const link = await g.createEvent({
      id: "bk1", reference: "T-2026-0001", service: "onsite", language: "dari", category: "youth_office",
      start: "2026-10-02T08:00:00.000Z", end: "2026-10-02T09:00:00.000Z",
      onsite: { address: { label: "", street: "Dietzstraße", houseNumber: "4", postalCode: "90443", city: "Nürnberg", country: "DE", source: "manual" }, institution: "Jugendamt Nürnberg" },
      contact: { name: "Petra", email: "p@example.org", phone: "0911 1" },
    } as Booking);
    expect(link).toMatchObject({ provider: "google", externalEventId: "evt123", syncStatus: "synced" });
    const ev = JSON.parse(calls.at(-1)!.body);
    expect(ev.location).toContain("Jugendamt Nürnberg");
    expect(calls.filter((c) => c.url.includes("oauth2"))).toHaveLength(1); // Token wird wiederverwendet
  });
});

describe("Gmail-Versand über das Dienstkonto", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("sendet im Namen von saadat@interpreting-nbg.de", async () => {
    process.env.GOOGLE_DELEGATED_USER = "saadat@interpreting-nbg.de";
    const calls: { url: string; body: string }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, body: String(init.body) });
      if (url.includes("oauth2")) return new Response(JSON.stringify({ access_token: "tok2", expires_in: 3600 }));
      return new Response(JSON.stringify({ id: "msg1" }));
    });
    const { gmailSendRaw } = await import("../google-auth");
    await gmailSendRaw(Buffer.from("Subject: Test\r\n\r\nHallo"));
    const jwt = new URLSearchParams(calls[0].body).get("assertion")!;
    const claims = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
    expect(claims.sub).toBe("saadat@interpreting-nbg.de");
    expect(claims.scope).toContain("gmail.send");
    expect(calls[1].url).toContain("/gmail/v1/users/me/messages/send");
  });
});
