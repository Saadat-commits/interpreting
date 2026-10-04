"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { services } from "@/config/services";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import type { Locale } from "@/lib/types";
import { IconArrow } from "../icons";
import { ServiceIcon } from "./ServiceIcon";

gsap.registerPlugin(ScrollTrigger);

/**
 * SERVICE WORLDS: jede Leistung als Weg in Stationen.
 * Desktop: die HAMRAH-Linie wächst beim Scrollen, Stationen leuchten nacheinander auf (Fortschritt = Information).
 * Mobile: Stationen horizontal wischbar.
 */
export function WorldsShowcase({ locale }: { locale: Locale }) {
  const h = hamrahCopy[locale];
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      el.querySelectorAll<HTMLElement>("[data-world]").forEach((row) => {
        const stations = [...row.querySelectorAll<HTMLElement>("[data-station]")];
        const set = (p: number) => {
          row.style.setProperty("--p", String(p));
          stations.forEach((s, i) => s.toggleAttribute("data-on", i / Math.max(1, stations.length - 1) <= p + 0.001));
        };
        set(0);
        ScrollTrigger.create({ trigger: row, start: "top 78%", end: "bottom 42%", scrub: 0.4, onUpdate: (self) => set(self.progress) });
      });
      return () => {
        el.querySelectorAll<HTMLElement>("[data-world]").forEach((row) => {
          row.style.removeProperty("--p");
          row.querySelectorAll("[data-station]").forEach((s) => s.setAttribute("data-on", ""));
        });
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="on-dark bg-night py-24 text-white sm:py-32" aria-labelledby="worlds-title">
      <div className="container-hamrah">
        <p className="t-eyebrow text-mint">{h.worlds.eyebrow}</p>
        <h2 id="worlds-title" className="t-h2 mt-3 max-w-[20ch]">
          {h.worlds.title}
        </h2>
        <p className="t-lead mt-4 text-white/65">{h.worlds.lead}</p>

        <div className="mt-14">
          {services.map((s) => {
            const n = s.journey.length;
            return (
              <article key={s.slug} data-world className="grid gap-6 border-t border-white/10 py-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:py-14" style={{ ["--c" as string]: s.color, ["--p" as string]: 1 }}>
                <header>
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ backgroundColor: s.color }}>
                    <ServiceIcon slug={s.slug} size={22} />
                  </span>
                  <h3 className="mt-4 text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]">{s.name[locale]}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/60">{s.short[locale]}</p>
                  <Link href={`/${locale}/leistungen/${s.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-white hover:underline">
                    {h.worlds.open} {s.name[locale]} <IconArrow size={16} className="h-arrow" />
                  </Link>
                </header>
                <div className="min-w-0">
                  <p className="mb-3 text-[12px] font-semibold text-white/40 lg:hidden">{h.worlds.swipe}</p>
                  <ol className="relative -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:gap-0 lg:overflow-visible lg:px-0" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                    <span aria-hidden className="absolute top-[19px] hidden h-0.5 bg-white/10 lg:block" style={{ insetInlineStart: `calc(100% / ${2 * n})`, insetInlineEnd: `calc(100% / ${2 * n})` }} />
                    <span
                      aria-hidden
                      className="absolute top-[19px] hidden h-0.5 ltr:origin-left rtl:origin-right lg:block"
                      style={{ insetInlineStart: `calc(100% / ${2 * n})`, insetInlineEnd: `calc(100% / ${2 * n})`, backgroundColor: "var(--c)", transform: "scaleX(var(--p))" }}
                    />
                    {s.journey.map((j, i) => (
                      <li
                        key={j.title.de}
                        data-station
                        data-on=""
                        className="group/st relative w-[74%] shrink-0 snap-start rounded-2xl bg-white/[.05] p-5 sm:w-[44%] lg:w-auto lg:bg-transparent lg:p-0 lg:px-2 lg:text-center"
                      >
                        <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 border-white/15 bg-night text-[13px] font-bold tabular-nums text-white/50 transition-colors duration-300 group-data-[on]/st:border-[color:var(--c)] group-data-[on]/st:bg-[color:var(--c)] group-data-[on]/st:text-white lg:mx-auto">
                          {i + 1}
                        </span>
                        <span className="mt-4 block text-[16px] font-bold text-white/45 transition-colors duration-300 group-data-[on]/st:text-white">{j.title[locale]}</span>
                        <span className="mt-1.5 block text-[13.5px] leading-relaxed text-white/40 transition-colors duration-300 group-data-[on]/st:text-white/65">{j.text[locale]}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
