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

import { parseFreeAddress } from "./address";

describe("parseFreeAddress", () => {
  it("erkennt Tippfehler-Adresse", () =>
    expect(parseFreeAddress("Luisenstraß 3 90762 Fürth")).toEqual({ street: "Luisenstraße", houseNumber: "3", postalCode: "90762", city: "Fürth" }));
  it("Abkürzung und Komma", () =>
    expect(parseFreeAddress("Hauptstr. 12a, 90402 nürnberg")).toEqual({ street: "Hauptstraße", houseNumber: "12a", postalCode: "90402", city: "Nürnberg" }));
  it("PLZ zuerst", () =>
    expect(parseFreeAddress("90402 Nürnberg, Königstraße 5")).toEqual({ street: "Königstraße", houseNumber: "5", postalCode: "90402", city: "Nürnberg" }));
  it("mehrteilige Straße", () =>
    expect(parseFreeAddress("Am Plärrer 7 90443 Nürnberg")).toEqual({ street: "Am Plärrer", houseNumber: "7", postalCode: "90443", city: "Nürnberg" }));
  it("ohne PLZ unvollständig", () => expect(parseFreeAddress("Luisenstraße 3")?.postalCode).toBe(""));
});

import { cityForPostalCode } from "./postal";
import { suggestEmail } from "./email-typo";

describe("Hilfen", () => {
  it("PLZ → Ort", () => {
    expect(cityForPostalCode("90762")).toBe("Fürth");
    expect(cityForPostalCode("90443")).toBe("Nürnberg");
    expect(cityForPostalCode("10115")).toBe("Berlin");
    expect(cityForPostalCode("00000")).toBeNull();
  });
  it("E-Mail-Tippfehler", () => {
    expect(suggestEmail("petra@gmial.com")).toBe("petra@gmail.com");
    expect(suggestEmail("petra@gmx.dee")).toBe("petra@gmx.de");
    expect(suggestEmail("petra@web,de")).toBe("petra@web.de");
    expect(suggestEmail("petra@gmail.com")).toBeNull();
    expect(suggestEmail("info@jugendamt-nuernberg.de")).toBeNull();
  });
});
