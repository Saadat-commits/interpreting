"use client";

import { useEffect, useState } from "react";

/** Bewegung reduziert? Mobile/leichtes Gerät? – laut Design Bible bestimmen beide, wie viel 3D und Motion läuft. */
export function useMotionPrefs() {
  const [prefs, setPrefs] = useState({ reduced: false, lite: true, ready: false });
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setPrefs({ reduced: rm.matches, lite: !desktop.matches, ready: true });
    update();
    rm.addEventListener("change", update);
    desktop.addEventListener("change", update);
    return () => {
      rm.removeEventListener("change", update);
      desktop.removeEventListener("change", update);
    };
  }, []);
  return prefs;
}

/** true, sobald das Element einmal in die Nähe des Viewports kommt (für Lazy Loading) */
export function useNearViewport<T extends Element>(ref: React.RefObject<T | null>, margin = "300px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);
  return near;
}
