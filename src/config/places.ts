import type { PostalAddress } from "@/lib/types";

/**
 * Häufige Terminorte zum Antippen (ein Tipp = fertige Adresse).
 * Adressen vor dem Livegang bitte einmal prüfen und bei Bedarf ergänzen.
 */
export const commonPlaces: PostalAddress[] = [
  { label: "Dietzstraße 4, 90443 Nürnberg", street: "Dietzstraße", houseNumber: "4", postalCode: "90443", city: "Nürnberg", country: "DE", placeName: "Jugendamt Nürnberg", source: "manual" },
  { label: "Richard-Wagner-Platz 5, 90443 Nürnberg", street: "Richard-Wagner-Platz", houseNumber: "5", postalCode: "90443", city: "Nürnberg", country: "DE", placeName: "Jobcenter Nürnberg-Stadt", source: "manual" },
  { label: "Prof.-Ernst-Nathan-Straße 1, 90419 Nürnberg", street: "Prof.-Ernst-Nathan-Straße", houseNumber: "1", postalCode: "90419", city: "Nürnberg", country: "DE", placeName: "Klinikum Nürnberg Nord", source: "manual" },
  { label: "Breslauer Straße 201, 90471 Nürnberg", street: "Breslauer Straße", houseNumber: "201", postalCode: "90471", city: "Nürnberg", country: "DE", placeName: "Klinikum Nürnberg Süd", source: "manual" },
  { label: "Innerer Laufer Platz 3, 90403 Nürnberg", street: "Innerer Laufer Platz", houseNumber: "3", postalCode: "90403", city: "Nürnberg", country: "DE", placeName: "Ausländerbehörde Nürnberg", source: "manual" },
  { label: "Hauptmarkt 18, 90403 Nürnberg", street: "Hauptmarkt", houseNumber: "18", postalCode: "90403", city: "Nürnberg", country: "DE", placeName: "Rathaus Nürnberg", source: "manual" },
];
