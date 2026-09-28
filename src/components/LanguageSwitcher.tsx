"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/types";
import { IconGlobe } from "./icons";

export function LanguageSwitcher({ locale, label, compact }: { locale: Locale; label: string; compact?: boolean }) {
  const pathname = usePathname() || `/${locale}`;
  const target: Locale = locale === "de" ? "fa" : "de";
  const href = pathname.replace(/^\/(de|fa)(?=\/|$)/, `/${target}`);
  if (compact) {
    // Servicezeile: schlichte Textumschaltung
    return (
      <div className="flex items-center gap-1" role="group" aria-label={label}>
        <IconGlobe size={14} className="hidden opacity-80 sm:block" />
        {(["de", "fa"] as const).map((l, i) => (
          <span key={l} className="flex items-center gap-1">
            {i > 0 && <span className="opacity-50">|</span>}
            {l === locale ? (
              <span className="font-bold underline underline-offset-4" aria-current="true" lang={l}>
                <span className="sm:hidden">{l === "de" ? "DE" : "فا"}</span>
                <span className="hidden sm:inline">{l === "de" ? "Deutsch" : "فارسی"}</span>
              </span>
            ) : (
              <Link href={href} hrefLang={l} lang={l} className="opacity-90 hover:underline">
                <span className="sm:hidden">{l === "de" ? "DE" : "فا"}</span>
                <span className="hidden sm:inline">{l === "de" ? "Deutsch" : "فارسی"}</span>
              </Link>
            )}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center rounded-full border border-line bg-white p-1 text-sm shadow-soft" role="group" aria-label={label}>
      <IconGlobe size={16} className="mx-1.5 hidden text-ink-muted sm:block" />
      {(["de", "fa"] as const).map((l) =>
        l === locale ? (
          <span key={l} className="rounded-full bg-brand-600 px-2.5 py-1 font-semibold text-white sm:px-3" aria-current="true" lang={l}>
            {l === "de" ? "DE" : "فارسی"}
          </span>
        ) : (
          <Link
            key={l}
            href={href}
            hrefLang={l}
            lang={l}
            className="rounded-full px-2.5 py-1 font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-700 sm:px-3"
          >
            {l === "de" ? "DE" : "فارسی"}
          </Link>
        ),
      )}
    </div>
  );
}
