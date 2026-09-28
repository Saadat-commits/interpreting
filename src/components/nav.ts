import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export type NavKey = "home" | "services" | "book" | "info" | "contact";

export function navItems(locale: Locale, g: Dictionary["gov"]) {
  return [
    { key: "home" as const, href: `/${locale}`, label: g.home },
    { key: "services" as const, href: `/${locale}/leistungen`, label: g.services },
    { key: "book" as const, href: `/${locale}/termin`, label: g.book },
    { key: "info" as const, href: `/${locale}/informationen`, label: g.info },
    { key: "contact" as const, href: `/${locale}/kontakt`, label: g.contact },
  ];
}

