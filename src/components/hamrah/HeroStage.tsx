"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/config/site";
import { bookingHref, services, type ServiceSlug } from "@/config/services";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import type { Locale } from "@/lib/types";
import { IconArrow, IconPhone } from "../icons";
import type { DioramaApi } from "../three/diorama";
import { useMotionPrefs, useNearViewport } from "./motion";
import { ScenePoster } from "./ScenePoster";
import { ServiceIcon } from "./ServiceIcon";

gsap.registerPlugin(ScrollTrigger);

const colors = Object.fromEntries(services.map((s) => [s.slug, s.color])) as Record<ServiceSlug, string>;

/**
 * HERO + SERVICE SELECTOR teilen sich eine Szene.
 * Desktop: Szene klebt rechts; Scrollen fährt die Kamera vom Überblick zur Auswahl, Hover/Fokus fährt zum Objekt.
 * Mobile: Szene als Bild zwischen Text und Auswahl, Tippen öffnet die Welt.
 */
export function HeroStage({ locale }: { locale: Locale }) {
  const h = hamrahCopy[locale];
  const router = useRouter();
  const { reduced, lite, ready } = useMotionPrefs();
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const api = useRef<DioramaApi | null>(null);
  const near = useNearViewport(sceneRef);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<ServiceSlug | null>(null);
  const [shown, setShown] = useState<ServiceSlug>("reinigung");

  useEffect(() => {
    if (!ready || !near || !canvasRef.current) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    (async () => {
      const [{ webglAvailable }, { createDiorama }] = await Promise.all([import("../three/core"), import("../three/diorama")]);
      if (disposed || !canvasRef.current || !webglAvailable()) return;
      const d = createDiorama(canvasRef.current, {
        lite,
        reduced,
        colors,
        locale,
        onHover: (s) => {
          setActive(s);
          if (s) setShown(s);
          d.focus(s);
        },
        onSelect: (s) => router.push(`/${locale}/leistungen/${s}`),
      });
      api.current = d;
      setLoaded(true);
      let st: ScrollTrigger | undefined;
      if (!reduced && !lite && selectorRef.current) {
        st = ScrollTrigger.create({
          trigger: selectorRef.current,
          start: "top bottom",
          end: "top 25%",
          scrub: 0.6,
          onUpdate: (self) => d.setScroll(self.progress),
        });
      }
      cleanup = () => {
        st?.kill();
        d.dispose();
        api.current = null;
      };
    })();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [ready, near, lite, reduced, locale, router]);

  const hover = (s: ServiceSlug | null) => {
    setActive(s);
    if (s) setShown(s);
    api.current?.focus(s);
  };
  const current = services.find((s) => s.slug === shown)!;

  return (
    <section className="relative -mt-[68px] overflow-x-clip bg-stone pt-[68px]" aria-labelledby="hero-title">
      <div className="container-hamrah grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-x-12">
        {/* HERO */}
        <div className="flex flex-col justify-center pb-6 pt-2 sm:pt-6 lg:col-start-1 lg:row-start-1 lg:min-h-[calc(100svh-68px)] lg:py-20">
          <p className="t-eyebrow flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-saffron" aria-hidden />
            <span>{h.hero.eyebrow}</span>
            {h.hero.langs.map((l) => (
              <span key={l} className="flex items-center gap-2 normal-case tracking-normal">
                <span aria-hidden className="text-ink-faint">
                  ·
                </span>
                <bdi>{l}</bdi>
              </span>
            ))}
          </p>
          <h1 id="hero-title" className="t-display mt-5 max-w-[14ch] text-ink">
            {h.hero.title}
          </h1>
          <p className="t-lead mt-6 max-w-[54ch] text-ink-soft">{h.hero.lead}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#auswahl" className="h-btn h-btn-primary">
              {h.hero.cta} <IconArrow size={18} className="rotate-90 rtl:-rotate-90" />
            </a>
            <a href={site.phoneHref} className="h-btn h-btn-secondary">
              <IconPhone size={18} /> <span dir="ltr">{site.phone}</span>
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-2" aria-label={h.nav.services}>
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${locale}/leistungen/${s.slug}`}
                  onMouseEnter={() => hover(s.slug)}
                  onMouseLeave={() => hover(null)}
                  onFocus={() => hover(s.slug)}
                  onBlur={() => hover(null)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-4 text-[14px] font-semibold text-ink-soft transition-colors hover:border-ink/25 hover:text-ink"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  {s.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* SZENE */}
        <div ref={sceneRef} className="relative order-first h-[38svh] min-h-[260px] sm:h-[46svh] lg:order-none lg:sticky lg:top-[68px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[calc(100svh-68px)] lg:self-start" aria-hidden="true">
          <div className="absolute inset-y-0 -end-5 -start-5 sm:-end-8 sm:-start-8 lg:start-0 lg:-end-[max(2rem,calc((100vw-1240px)/2+2rem))]">
            <ScenePoster className={`absolute inset-0 m-auto h-full w-full transition-opacity duration-700 ${loaded ? "opacity-0" : "opacity-100"}`} />
            <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center lg:flex">
            <span className={`rounded-full bg-white/85 px-4 py-2 text-[13px] font-semibold text-ink-soft shadow-soft transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}>
              {active ? services.find((s) => s.slug === active)!.name[locale] : "\u00a0"}
            </span>
          </div>
        </div>

        {/* SERVICE SELECTOR */}
        <div ref={selectorRef} id="auswahl" className="scroll-mt-20 pb-20 pt-10 lg:col-start-1 lg:row-start-2 lg:flex lg:min-h-[calc(100svh-68px)] lg:flex-col lg:justify-center lg:py-24">
          <p className="t-eyebrow text-ink-muted">{h.selector.eyebrow}</p>
          <h2 className="t-h2 mt-3 text-ink">{h.selector.title}</h2>
          <p className="mt-3 hidden text-[15px] text-ink-muted lg:block">{h.selector.hint}</p>
          <ul className="mt-8 border-t border-ink/10" onMouseLeave={() => hover(null)}>
            {services.map((s, i) => {
              const on = active === s.slug;
              return (
                <li key={s.slug} className="border-b border-ink/10">
                  <Link
                    href={`/${locale}/leistungen/${s.slug}`}
                    onMouseEnter={() => hover(s.slug)}
                    onFocus={() => hover(s.slug)}
                    className="group relative flex min-h-[68px] items-center gap-4 py-3 outline-offset-4"
                  >
                    <span className="w-7 text-[13px] font-bold tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: s.color }}>
                      <ServiceIcon slug={s.slug} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[19px] font-bold tracking-[-0.01em] text-ink sm:text-[21px]">{s.name[locale]}</span>
                      <span className="block truncate text-[14px] text-ink-muted">{s.short[locale]}</span>
                    </span>
                    <IconArrow size={20} className={`h-arrow shrink-0 transition-colors ${on ? "text-ink" : "text-ink-faint"}`} />
                    <span aria-hidden className="absolute bottom-[-1px] start-0 h-0.5 w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100 rtl:origin-right" style={{ backgroundColor: s.color }} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 hidden min-h-[148px] lg:block" aria-live="polite">
            <p className="text-[15px] font-bold" style={{ color: current.color }}>
              {current.name[locale]}
            </p>
            <p className="mt-1 max-w-[52ch] text-[16px] leading-relaxed text-ink-soft">{current.heroLead[locale]}</p>
            <div className="mt-4 flex gap-5">
              <Link href={`/${locale}/leistungen/${current.slug}`} className="h-link">
                {h.selector.open} <IconArrow size={16} className="h-arrow" />
              </Link>
              <Link href={bookingHref(locale, current)} className="h-link !text-ink-soft">
                {h.selector.book} <IconArrow size={16} className="h-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
