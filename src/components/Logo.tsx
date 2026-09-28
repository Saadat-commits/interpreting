import Link from "next/link";
import { site } from "@/config/site";
import { imageUrl } from "@/lib/asset";
import type { Locale } from "@/lib/types";

/** Logo: Berge (Original-Bilddatei des Inhabers) */
export function LogoMark({ size = 36 }: { size?: number }) {
  return <img src={imageUrl("logo-berge.png")} alt="" width={Math.round(size * 2.25)} height={size} className="block shrink-0" style={{ height: size, width: Math.round(size * 2.25) }} />;
}

export function Logo({ locale }: { locale: Locale }) {
  return (
    <Link href={`/${locale}`} className="group flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label={site.brand}>
      <LogoMark size={36} />
      <span className="leading-tight" dir="ltr">
        <span className="block whitespace-nowrap text-[14px] font-bold sm:text-[15px] tracking-tight text-ink">{site.brand}</span>
        <span className="hidden whitespace-nowrap text-[11px] font-medium text-ink-muted sm:block">{site.brandTagline}</span>
      </span>
    </Link>
  );
}
