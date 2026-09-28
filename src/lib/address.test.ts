import { describe, expect, it } from "vitest";
import { addressProblems, detectCategory } from "./address";

describe("address validation", () => {
  const ok = { street: "Dietzstraße", houseNumber: "4", postalCode: "90443", city: "Nürnberg", country: "DE" };
  it("akzeptiert vollständige Adresse", () => expect(addressProblems(ok)).toEqual([]));
  it("verlangt Hausnummer", () => expect(addressProblems({ ...ok, houseNumber: "" })).toContain("houseNumber"));
  it("akzeptiert Zusätze", () => expect(addressProblems({ ...ok, houseNumber: "12a" })).toEqual([]));
  it("prüft PLZ", () => expect(addressProblems({ ...ok, postalCode: "9044" })).toContain("postalCode"));
});

describe("detectCategory", () => {
  it("erkennt Jugendamt", () => expect(detectCategory("Jugendamt Nürnberg")).toBe("youth_office"));
  it("erkennt Klinik", () => expect(detectCategory("Klinikum Nürnberg Nord")).toBe("medical"));
  it("erkennt Jobcenter", () => expect(detectCategory("Jobcenter Nürnberg-Stadt")).toBe("authority"));
});
