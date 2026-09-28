import Link from "next/link";
import { site } from "@/config/site";
import type { Locale } from "@/lib/types";

/** Logo: zwei Berggipfel mit Schnee – ruhig, ohne religiöse Symbole */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <rect width="40" height="40" rx="11" fill="#1F6B47" />
      <path d="M6 29.5 15.2 15l4.6 7.1 3.4-4.9L34 29.5Z" fill="#fff" />
      <path d="m15.2 15-2.6 4.1 1.6-.6 1.3 1.2 1.2-1.3 1.2.4Z" fill="#1F6B47" opacity=".35" />
      <path d="M6 29.5h28" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ locale }: { locale: Locale }) {
  return (
    <Link href={`/${locale}`} className="group flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label={site.brand}>
      <span>
        <LogoMark size={34} />
      </span>
      <span className="leading-tight" dir="ltr">
        <span className="block whitespace-nowrap text-[14px] font-bold sm:text-[15px] tracking-tight text-ink">{site.brand}</span>
        <span className="hidden whitespace-nowrap text-[11px] font-medium text-ink-muted sm:block">{site.brandTagline}</span>
      </span>
    </Link>
  );
}
