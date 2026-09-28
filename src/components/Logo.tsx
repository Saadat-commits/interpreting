import Link from "next/link";
import { starPath } from "@/lib/star";
import { site } from "@/config/site";
import type { Locale } from "@/lib/types";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2C8A5D" />
          <stop offset="1" stopColor="#154831" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lm)" />
      <path d={starPath(20, 20, 11.5, 0.66)} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="2.8" fill="#fff" />
    </svg>
  );
}

export function Logo({ locale }: { locale: Locale }) {
  return (
    <Link href={`/${locale}`} className="group flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label={site.brand}>
      <span className="transition-transform duration-500 group-hover:rotate-[22.5deg]">
        <LogoMark size={34} />
      </span>
      <span className="leading-tight" dir="ltr">
        <span className="block whitespace-nowrap text-[14px] font-bold sm:text-[15px] tracking-tight text-ink">{site.brand}</span>
        <span className="hidden whitespace-nowrap text-[11px] font-medium text-ink-muted sm:block">{site.brandTagline}</span>
      </span>
    </Link>
  );
}
