import { starPath } from "@/lib/star";
import type { Locale } from "@/lib/types";

/**
 * Illustration „Über uns“: Ein Spitzbogen (Iwan), wie er in der afghanischen und
 * persischen Architektur vorkommt, gefüllt mit einem Girih-Gitter – darin ein
 * Zitat in beiden Sprachen. Dezenter kultureller Bezug ohne Flaggen-Symbolik.
 */
export function ArchArtwork({ quote, quoteAlt, locale }: { quote: string; quoteAlt: string; locale: Locale }) {
  const arch = "M40 520 V250 C40 140 120 70 200 30 C280 70 360 140 360 250 V520 Z";
  const stars: [number, number, number][] = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 40 + col * 80 + (row % 2 ? 40 : 0);
      const y = 60 + row * 70;
      stars.push([x, y, 26]);
    }
  }
  return (
    <div className="relative mx-auto max-w-[480px]" dir="ltr">
      <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-brand-50 to-transparent blur-2xl" aria-hidden="true" />
      <svg viewBox="0 0 400 540" className="relative w-full drop-shadow-[0_30px_50px_rgba(16,40,28,.18)]" role="img" aria-label={quote}>
        <defs>
          <linearGradient id="arch-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1F7049" />
            <stop offset="1" stopColor="#103827" />
          </linearGradient>
          <clipPath id="arch-clip">
            <path d={arch} />
          </clipPath>
          <radialGradient id="arch-glow" cx="50%" cy="30%" r="60%">
            <stop offset="0" stopColor="#82C29E" stopOpacity=".55" />
            <stop offset="1" stopColor="#82C29E" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Rahmen */}
        <path d="M24 532 V246 C24 128 110 52 200 12 C290 52 376 128 376 246 V532 Z" fill="#fff" stroke="#D9EEE1" strokeWidth="1.5" />
        <path d={arch} fill="url(#arch-bg)" />
        <g clipPath="url(#arch-clip)">
          <rect x="0" y="0" width="400" height="540" fill="url(#arch-glow)" />
          <g fill="none" stroke="#fff" strokeOpacity=".13" strokeWidth="1.2">
            {stars.map(([x, y, r], i) => (
              <path key={i} d={starPath(x, y, r, 0.64)} />
            ))}
          </g>
          {/* Lichtkreis */}
          <circle cx="200" cy="170" r="54" fill="#fff" fillOpacity=".06" />
          <path d={starPath(200, 170, 40, 0.66)} fill="#fff" fillOpacity=".1" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" />
          <circle cx="200" cy="170" r="6" fill="#fff" />
        </g>
        {/* Innere Bogenlinie */}
        <path d="M62 520 V256 C62 158 132 96 200 60 C268 96 338 158 338 256 V520" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1" />
      </svg>
      {/* Zitatkarte */}
      <figure className="absolute inset-x-[10%] bottom-[7%] rounded-2xl border border-white/60 bg-white/95 p-5 text-center shadow-deep backdrop-blur sm:p-6" dir={locale === "fa" ? "rtl" : "ltr"}>
        <blockquote className="text-lg font-bold leading-snug text-ink sm:text-xl">{locale === "fa" ? `«${quote}»` : `„${quote}“`}</blockquote>
        <figcaption className={`mt-2 text-base text-brand-700 ${locale === "de" ? "font-fa" : ""}`} lang={locale === "de" ? "fa" : "de"} dir={locale === "de" ? "rtl" : "ltr"}>
          {quoteAlt}
        </figcaption>
      </figure>
    </div>
  );
}
