"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/types";
import { IconGlobe } from "./icons";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || `/${locale}`;
  const target: Locale = locale === "de" ? "fa" : "de";
  const href = pathname.replace(/^\/(de|fa)(?=\/|$)/, `/${target}`);
  return (
    <div className="flex items-center rounded-full border border-line bg-white p-1 text-sm shadow-soft" role="group" aria-label={label}>
      <IconGlobe size={16} className="mx-1.5 text-ink-muted" />
      {(["de", "fa"] as const).map((l) =>
        l === locale ? (
          <span key={l} className="rounded-full bg-brand-600 px-3 py-1 font-semibold text-white" aria-current="true" lang={l}>
            {l === "de" ? "DE" : "فارسی"}
          </span>
        ) : (
          <Link
            key={l}
            href={href}
            hrefLang={l}
            lang={l}
            className="rounded-full px-3 py-1 font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
          >
            {l === "de" ? "DE" : "فارسی"}
          </Link>
        ),
      )}
    </div>
  );
}
