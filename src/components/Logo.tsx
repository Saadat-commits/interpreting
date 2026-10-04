import Link from "next/link";
import { imageUrl } from "@/lib/asset";
import type { Locale } from "@/lib/types";

/** Logo: Berge (Original-Bilddatei des Inhabers) */
export function LogoMark({ size = 36, light }: { size?: number; light?: boolean }) {
  return (
    <img
      src={imageUrl("logo-berge.png")}
      alt=""
      width={Math.round(size * 2.25)}
      height={size}
      className={`block shrink-0 ${light ? "brightness-0 invert" : ""}`}
      style={{ height: size, width: Math.round(size * 2.25) }}
    />
  );
}

export function Logo({ locale, light }: { locale: Locale; light?: boolean }) {
  return (
    <Link href={`/${locale}`} className="group flex min-w-0 items-center gap-2.5 rounded-lg" aria-label="HAMRAH – Startseite">
      <LogoMark size={26} light={light} />
      <span className="flex items-baseline gap-2 leading-none" dir="ltr">
        <span className={`text-[17px] font-extrabold tracking-[0.16em] ${light ? "text-white" : "text-ink"}`}>HAMRAH</span>
        <span className={`hidden font-fa text-[13px] font-medium sm:inline ${light ? "text-white/60" : "text-ink-muted"}`} lang="fa">
          همراه
        </span>
      </span>
    </Link>
  );
}
