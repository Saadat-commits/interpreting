/**
 * Zentrale Stammdaten. Alle mit TODO markierten Werte vor dem Livegang ersetzen.
 * Diese Datei ist öffentlich (wird auch im Browser verwendet) – keine Preise hier!
 */
export const site = {
  brand: "Interpreting NBG",
  brandTagline: "Dolmetschen & Begleitung",
  owner: "Vorname Nachname", // TODO: Inhaber:in
  street: "Musterstraße 1", // TODO
  postalCode: "90402", // TODO
  city: "Nürnberg",
  country: "Deutschland",
  phone: "+49 911 0000000", // TODO
  phoneHref: "tel:+499110000000", // TODO
  email: "info@interpreting-nbg.de", // TODO
  website: "interpreting-nbg.de",
  taxNumber: "000/000/00000", // TODO Steuernummer
  vatId: "", // optional USt-IdNr.
  bank: {
    holder: "Vorname Nachname", // TODO
    iban: "DE00 0000 0000 0000 0000 00", // TODO
    bic: "XXXXDEXXXXX", // TODO
    name: "Musterbank", // TODO
  },
  timezone: "Europe/Berlin",
} as const;

export type Site = typeof site;
