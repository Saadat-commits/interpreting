import type { Dictionary } from "@/lib/i18n";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import type { Locale } from "@/lib/types";

export type NavKey = "home" | "services" | "book" | "info" | "contact";

export function navItems(locale: Locale, _g?: Dictionary["gov"]) {
  const n = hamrahCopy[locale].nav;
  return [
    { key: "services" as const, href: `/${locale}/leistungen`, label: n.services },
    { key: "info" as const, href: `/${locale}/informationen`, label: n.how },
    { key: "contact" as const, href: `/${locale}/kontakt`, label: n.contact },
  ];
}
