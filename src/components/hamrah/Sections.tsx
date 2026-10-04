import Link from "next/link";
import { site } from "@/config/site";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import { imageUrl } from "@/lib/asset";
import type { Locale } from "@/lib/types";
import { IconArrow, IconPhone } from "../icons";

/** TRUST / QUALITÄT – nur Aussagen, die stimmen. */
export function TrustSection({ locale }: { locale: Locale }) {
  const h = hamrahCopy[locale];
  return (
    <section className="bg-stone py-24 sm:py-32" aria-labelledby="trust-title">
      <div className="container-hamrah grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div>
          <p className="t-eyebrow text-ink-muted">{h.trust.eyebrow}</p>
          <h2 id="trust-title" className="t-h2 mt-3 max-w-[16ch] text-ink">
            {h.trust.title}
          </h2>
          <figure className="mt-12 hidden lg:block">
            <p lang="fa" dir="rtl" className="font-fa text-[96px] font-bold leading-none text-ink/90">
              همراه
            </p>
            <figcaption className="mt-4 max-w-[34ch] text-[15px] text-ink-muted">{h.meaning}</figcaption>
          </figure>
        </div>
        <ul className="border-t border-ink/10">
          {h.trust.items.map((it, i) => (
            <li key={it.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-b border-ink/10 py-7">
              <span className="pt-1 text-[13px] font-bold tabular-nums text-saffron">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="t-h3 text-ink">{it.title}</h3>
                <p className="mt-2 max-w-[56ch] text-[16px] leading-relaxed text-ink-soft">{it.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** BOOKING CTA */
export function BookingCta({ locale }: { locale: Locale }) {
  const h = hamrahCopy[locale];
  return (
    <section className="on-dark relative isolate overflow-hidden bg-night text-white" aria-labelledby="cta-title">
      <img
        src={imageUrl("band-e-amir-sm.jpg")}
        srcSet={`${imageUrl("band-e-amir-sm.jpg")} 1000w, ${imageUrl("band-e-amir.jpg")} 2000w`}
        sizes="100vw"
        alt=""
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/75 to-night/55" />
      <div className="container-hamrah flex min-h-[520px] flex-col justify-end py-20 sm:py-28">
        <h2 id="cta-title" className="t-h1 max-w-[16ch]">
          {h.cta.title}
        </h2>
        <p className="t-lead mt-4 max-w-[48ch] text-white/75">{h.cta.text}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={`/${locale}/anfrage`} className="h-btn h-btn-light">
            {h.cta.primary} <IconArrow size={18} className="h-arrow" />
          </Link>
          <a href={site.phoneHref} className="h-btn h-btn-ghost-light">
            <IconPhone size={18} /> <span dir="ltr">{site.phone}</span>
          </a>
        </div>
        <p className="mt-14 text-[12px] text-white/45">{h.cta.credit}</p>
      </div>
    </section>
  );
}
