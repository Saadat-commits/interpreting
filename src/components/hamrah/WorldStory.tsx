"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/config/site";
import { bookingHref, serviceBySlug, type ServiceSlug } from "@/config/services";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import type { Locale } from "@/lib/types";
import { IconArrow, IconPhone } from "../icons";
import type { WorldApi } from "../three/worlds";
import { useMotionPrefs, useNearViewport } from "./motion";
import { ScenePoster } from "./ScenePoster";
import { ServiceIcon } from "./ServiceIcon";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero + Ablauf einer Service World. Die Szene klebt (Desktop rechts, Mobile oben),
 * jede Station im Text entspricht einer Station der Szene. Scrollen = Fortschritt.
 */
export function WorldStory({ locale, slug }: { locale: Locale; slug: ServiceSlug }) {
  const s = serviceBySlug(slug)!;
  const h = hamrahCopy[locale];
  const { reduced, lite, ready } = useMotionPrefs();
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const near = useNearViewport(sceneRef);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const n = s.journey.length;

  useEffect(() => {
    if (!ready || !near || !canvasRef.current) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    (async () => {
      const [{ webglAvailable }, { createWorld }] = await Promise.all([import("../three/core"), import("../three/worlds")]);
      if (disposed || !canvasRef.current || !webglAvailable()) return;
      const w: WorldApi = createWorld(canvasRef.current, slug, { lite, color: s.color, locale });
      setLoaded(true);
      const st = ScrollTrigger.create({
        trigger: stepsRef.current,
        start: lite ? "top 75%" : "top 55%",
        end: lite ? "bottom 75%" : "bottom 55%",
        scrub: reduced ? false : 0.5,
        onUpdate: (self) => {
          const p = self.progress * (n - 1);
          const idx = Math.round(p);
          w.setProgress(reduced ? idx : p);
          setActive(idx);
        },
      });
      cleanup = () => {
        st.kill();
        w.dispose();
      };
    })();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [ready, near, lite, reduced, slug, s.color, locale, n]);

  const book = bookingHref(locale, s);
  const bookLabel = s.booking.mode === "wizard" ? h.world.bookWizard : h.world.bookRequest;

  return (
    <section className="relative -mt-[68px] overflow-x-clip bg-stone pt-[68px]" style={{ ["--c" as string]: s.color }}>
      <div className="container-hamrah grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-x-12">
        {/* Szene: Mobile klebt sie oben über dem Text, Desktop rechts */}
        <div
          ref={sceneRef}
          aria-hidden="true"
          className="sticky top-[68px] z-10 col-start-1 row-span-2 row-start-1 h-[40svh] min-h-[240px] self-start bg-stone lg:col-start-2 lg:h-[calc(100svh-68px)] lg:bg-transparent"
        >
          <div className="scene-fade absolute inset-y-0 -end-5 -start-5 sm:-end-8 sm:-start-8 lg:-start-12 lg:-end-[max(2rem,calc((100vw-1240px)/2+2rem))]">
            <ScenePoster color={s.color} className={`absolute inset-0 m-auto h-full w-full transition-opacity duration-700 ${loaded ? "opacity-0" : "opacity-100"}`} />
            <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center lg:bottom-8">
            <span className="rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold text-ink shadow-soft">
              <span className="tabular-nums text-ink-muted">
                {h.world.step} {active + 1} {h.world.of} {n}
              </span>{" "}
              · {s.journey[active].title[locale]}
            </span>
          </div>
        </div>

        {/* HERO */}
        <div className="col-start-1 row-start-1 mt-[max(40svh,240px)] flex flex-col justify-center pb-10 pt-8 lg:mt-0 lg:min-h-[calc(100svh-68px)] lg:py-20">
          <Link href={`/${locale}/leistungen`} className="inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-ink-muted hover:text-ink">
            <IconArrow size={16} className="rotate-180 rtl:rotate-0" /> {h.world.back}
          </Link>
          <p className="mt-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundColor: s.color }}>
              <ServiceIcon slug={slug} size={20} />
            </span>
            <span className="text-[16px] font-bold" style={{ color: s.color }}>
              {s.name[locale]}
            </span>
          </p>
          <h1 className="t-display mt-5 max-w-[13ch] text-ink rtl:max-w-[16ch]">{s.heroTitle[locale]}</h1>
          <p className="t-lead mt-6 max-w-[54ch] text-ink-soft">{s.heroLead[locale]}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={book} className="h-btn h-btn-primary">
              {bookLabel} <IconArrow size={18} className="h-arrow" />
            </Link>
            <a href={site.phoneHref} className="h-btn h-btn-secondary">
              <IconPhone size={18} /> <span dir="ltr">{site.phone}</span>
            </a>
          </div>
        </div>

        {/* ABLAUF */}
        <div className="col-start-1 row-start-2 pb-16 lg:pb-[30svh]">
          <p className="t-eyebrow text-ink-muted">{h.world.journey}</p>
          <h2 className="t-h2 mt-3 text-ink">{h.world.journeyTitle}</h2>
          <ol ref={stepsRef} className="relative mt-8">
            {s.journey.map((j, i) => {
              const on = i <= active;
              return (
                <li key={j.title.de} className="relative flex min-h-[46svh] gap-5 lg:min-h-[62svh]" aria-current={i === active ? "step" : undefined}>
                  <span className="relative flex flex-col items-center">
                    <span
                      className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-bold tabular-nums transition-colors duration-300 ${
                        on ? "text-white" : "border-2 border-ink/15 bg-stone text-ink-faint"
                      }`}
                      style={on ? { backgroundColor: s.color } : undefined}
                    >
                      {i + 1}
                    </span>
                    {i < n - 1 && <span aria-hidden className="mt-2 w-0.5 flex-1 rounded-full transition-colors duration-500" style={{ backgroundColor: i < active ? s.color : "rgba(19,32,26,.1)" }} />}
                  </span>
                  <span className={`pb-10 pt-1.5 transition-opacity duration-300 ${i === active ? "opacity-100" : "opacity-50"}`}>
                    <span className="block text-[24px] font-bold tracking-[-0.02em] text-ink sm:text-[30px]">{j.title[locale]}</span>
                    <span className="mt-2 block max-w-[44ch] text-[17px] leading-relaxed text-ink-soft">{j.text[locale]}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
