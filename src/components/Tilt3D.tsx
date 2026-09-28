"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Karte mit echter 3D-Neigung und Lichtreflex. Kinder können über
 * `style={{ transform: "translateZ(40px)" }}` in die Tiefe gestaffelt werden.
 */
export function Tilt3D({ children, className = "", max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * max * 1.2).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
    el.style.setProperty("--glare", "1");
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare", "0");
  };

  return (
    <div className={`perspective ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <div
        ref={ref}
        className="tilt-card preserve-3d relative h-full transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: "rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))" }}
      >
        {children}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: "var(--glare,0)",
            background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,.35), transparent 55%)",
            transform: "translateZ(80px)",
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
