"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { services } from "@/config/services";
import { hamrahCopy } from "@/lib/i18n/hamrah";
import type { Locale } from "@/lib/types";
import { IconCheck, IconDoc, IconMail } from "../icons";

gsap.registerPlugin(ScrollTrigger);

/**
 * „SO FUNKTIONIERT HAMRAH“: Desktop pinnt den Abschnitt, der Bildschirm im Telefon zeigt den jeweiligen Schritt.
 * Mobile / Reduced Motion: einfache nummerierte Liste.
 */
export function HowItWorks({ locale }: { locale: Locale }) {
  const h = hamrahCopy[locale];
  const section = useRef<HTMLElement>(null);
  const pinEl = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      setPinned(true);
      const st = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: () => `+=${window.innerHeight * 2.2}`,
        pin: pinEl.current,
        scrub: true,
        onUpdate: (self) => setActive(Math.min(3, Math.floor(self.progress * 4))),
      });
      return () => {
        st.kill();
        setPinned(false);
        setActive(0);
      };
    });
    return () => mm.revert();
  }, []);

  const s = services[0];
  const q = s.booking.mode === "request" ? s.booking.steps[0].questions : [];
  const first = q[0] && "options" in q[0] ? q[0] : null;

  return (
    <section ref={section} className="bg-white" aria-labelledby="how-title">
      <div ref={pinEl} className="lg:flex lg:h-[100svh] lg:items-center">
        <div className="container-hamrah grid items-center gap-12 py-24 sm:py-32 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-0">
          <div>
            <p className="t-eyebrow text-ink-muted">{h.how.eyebrow}</p>
            <h2 id="how-title" className="t-h2 mt-3 text-ink">
              {h.how.title}
            </h2>
            <ol className="relative mt-10 space-y-2">
              <span aria-hidden className="absolute bottom-6 start-[19px] top-6 w-0.5 bg-ink/10" />
              <span
                aria-hidden
                className="absolute start-[19px] top-6 w-0.5 origin-top bg-saffron transition-transform duration-500"
                style={{ height: "calc(100% - 3rem)", transform: `scaleY(${pinned ? active / 3 : 1})` }}
              />
              {h.how.steps.map((step, i) => {
                const on = !pinned || i <= active;
                const current = pinned && i === active;
                return (
                  <li key={step.title} className="relative flex gap-5 py-3" aria-current={current ? "step" : undefined}>
                    <span
                      className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-bold transition-colors duration-300 ${
                        on ? "bg-night text-white" : "border-2 border-ink/15 bg-white text-ink-faint"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={`pt-1.5 transition-opacity duration-300 ${pinned && !current ? "opacity-45" : "opacity-100"}`}>
                      <span className="t-h3 block text-ink">{step.title}</span>
                      <span className="mt-1.5 block max-w-[52ch] text-[16px] leading-relaxed text-ink-soft">{step.text}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mx-auto hidden w-[300px] lg:block" aria-hidden="true">
            <div className="rounded-[46px] bg-night p-2.5 shadow-deep">
              <div className="relative h-[600px] overflow-hidden rounded-[38px] bg-stone">
                <div className="absolute inset-x-0 top-0 flex h-12 items-center justify-between px-7 text-[12px] font-bold text-ink">
                  <span>HAMRAH</span>
                  <span className="tabular-nums text-ink-muted">
                    {active + 1}/4 · {h.how.screen[active]}
                  </span>
                </div>
                {[
                  <div key="0" className="grid grid-cols-2 gap-2.5">
                    {services.map((sv, i) => (
                      <div key={sv.slug} className={`rounded-2xl bg-white p-3 transition-shadow ${i === 0 ? "ring-2 ring-night" : ""}`}>
                        <span className="block h-7 w-7 rounded-lg" style={{ backgroundColor: sv.color }} />
                        <span className="mt-6 block text-[13px] font-bold text-ink">{sv.name[locale]}</span>
                      </div>
                    ))}
                  </div>,
                  <div key="1" className="space-y-4">
                    <p className="text-[12px] font-bold" style={{ color: s.color }}>
                      {s.name[locale]}
                    </p>
                    {first && (
                      <>
                        <p className="text-[16px] font-bold text-ink">{first.label[locale]}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {first.options.slice(0, 4).map((o, i) => (
                            <span key={o.id} className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${i === 0 ? "bg-night text-white" : "bg-white text-ink"}`}>
                              {o.label[locale]}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between rounded-2xl bg-white p-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-stone text-[16px] font-bold">−</span>
                      <span className="text-[15px] font-bold tabular-nums text-ink">60 m²</span>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-stone text-[16px] font-bold">+</span>
                    </div>
                    <span className="mt-6 block rounded-full bg-brand-600 py-3 text-center text-[13px] font-bold text-white">{h.request.next}</span>
                  </div>,
                  <div key="2" className="flex h-full flex-col items-center justify-center pb-16 text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-white">
                      <IconCheck size={30} strokeWidth={2.4} />
                    </span>
                    <p className="mt-5 text-[17px] font-bold text-ink">{h.how.screen[2]}</p>
                    <span className="mt-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-[13px] font-semibold text-ink-soft">
                      <IconMail size={18} /> {h.request.offer}
                    </span>
                  </div>,
                  <div key="3" className="space-y-2.5">
                    {services[0].journey.slice(1, 4).map((j) => (
                      <div key={j.title.de} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-mint/50 text-brand-800">
                          <IconCheck size={15} strokeWidth={2.6} />
                        </span>
                        <span className="text-[13px] font-semibold text-ink">{j.title[locale]}</span>
                      </div>
                    ))}
                    <div className="mt-6 flex items-center gap-3 rounded-2xl bg-night p-4 text-white">
                      <IconDoc size={22} />
                      <span className="text-[13px] font-semibold">PDF</span>
                    </div>
                  </div>,
                ].map((screen, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 bottom-0 top-12 px-5 pt-4 transition-[opacity,transform] duration-500 ease-out"
                    style={{ opacity: i === active ? 1 : 0, transform: `translateY(${i === active ? 0 : i < active ? -16 : 16}px)` }}
                  >
                    {screen}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
