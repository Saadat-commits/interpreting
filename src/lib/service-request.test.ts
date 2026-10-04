import { describe, expect, it } from "vitest";
import { serviceBySlug, services } from "@/config/services";
import { answerRows, cleanAnswers, initialAnswers, serviceRequestSchema, validateRequestAnswers, validateStep } from "./service-request";
import type { PostalAddress } from "./types";

const addr: PostalAddress = {
  label: "Königstraße 1, 90762 Fürth",
  street: "Königstraße",
  houseNumber: "1",
  postalCode: "90762",
  city: "Fürth",
  country: "DE",
  source: "manual",
};
const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

describe("service registry", () => {
  it("has unique question ids per service and valid showIf references", () => {
    for (const s of services) {
      if (s.booking.mode !== "request") continue;
      const ids = s.booking.steps.flatMap((st) => st.questions.map((q) => q.id));
      expect(new Set(ids).size, s.slug).toBe(ids.length);
      for (const st of s.booking.steps) for (const q of st.questions) if (q.showIf) expect(ids, `${s.slug}.${q.id}`).toContain(q.showIf.id);
    }
  });
});

describe("validateRequestAnswers", () => {
  const cleaning = () => ({ ...initialAnswers(serviceBySlug("reinigung")!), object: "apartment", kind: "deep", rhythm: "once", address: addr, date: future, timeWindow: "morning" });

  it("accepts a complete cleaning request", () => {
    const r = validateRequestAnswers("reinigung", cleaning());
    expect(r.ok).toBe(true);
  });

  it("reports missing required answers", () => {
    const a = cleaning() as Record<string, unknown>;
    delete a.kind;
    a.address = null;
    const r = validateRequestAnswers("reinigung", a);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toMatchObject({ kind: "chooseOne", address: "required" });
  });

  it("rejects unknown options, out-of-range numbers and past dates", () => {
    const r = validateRequestAnswers("reinigung", { ...cleaning(), object: "castle", size: 99999, date: "2000-01-01" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toMatchObject({ object: "invalid", size: "invalid", date: "invalid" });
  });

  it("drops answers to hidden questions", () => {
    const s = serviceBySlug("reinigung")!;
    const a = { ...cleaning(), object: "stairs", rooms: 4 };
    expect(cleanAnswers(s, a).rooms).toBeUndefined();
    const step = s.booking.mode === "request" ? s.booking.steps[0] : null;
    expect(Object.keys(validateStep(step!, { ...a, rooms: -5 }))).not.toContain("rooms");
  });

  it("refuses services that are booked in the wizard", () => {
    expect(validateRequestAnswers("dolmetschen", {}).ok).toBe(false);
    expect(validateRequestAnswers("unknown", {}).ok).toBe(false);
  });
});

describe("serviceRequestSchema", () => {
  const base = {
    locale: "de",
    service: "umzug",
    answers: {},
    contact: { customerType: "private", name: "Ali Ahmadi", email: "ali@example.org", phone: "0911 123456" },
    consent: true,
  };
  it("requires consent and an empty honeypot", () => {
    expect(serviceRequestSchema.safeParse(base).success).toBe(true);
    expect(serviceRequestSchema.safeParse({ ...base, consent: false }).success).toBe(false);
    expect(serviceRequestSchema.safeParse({ ...base, website: "spam" }).success).toBe(false);
    expect(serviceRequestSchema.safeParse({ ...base, contact: { ...base.contact, email: "nope" } }).success).toBe(false);
  });
});

describe("answerRows", () => {
  it("renders labels in the requested language", () => {
    const s = serviceBySlug("transport")!;
    const rows = answerRows(s, { cargo: "furniture", pieces: 2, heavy: true, pickup: addr }, "de", { yes: "Ja", no: "Nein" });
    expect(rows).toContainEqual(["Was wird transportiert?", "Möbelstück"]);
    expect(rows).toContainEqual(["Schwerer als 30 kg", "Ja"]);
    expect(answerRows(s, { cargo: "furniture" }, "fa", { yes: "بله", no: "خیر" })[0]).toEqual(["چه چیزی حمل می‌شود؟", "مبل"]);
  });
});
