/**
 * Bewegung für die Website: Einblenden beim Scrollen, 3D-Neigung, Tiefen-Effekt im Kopfbereich und ein
 * drehender Globus. Alles ohne Zusatzpaket, respektiert „Bewegung reduzieren“ und läuft nur sichtbar.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Blendet Inhalt weich ein, sobald er im Bild erscheint (ohne JavaScript bleibt er sichtbar) */
export function Reveal({
  children,
  delay = 0,
  className = "",
  from = "up",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  from?: "up" | "left" | "right" | "zoom";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add("js");
    const el = ref.current;
    if (!el || reduced() || !("IntersectionObserver" in window)) return setOn(true);
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`rv rv-${from} ${on ? "rv-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Karte, die sich zum Mauszeiger neigt (3D) und glänzt */
export function Tilt({
  children,
  className = "",
  max = 9,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch" || reduced()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`tilt ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/** Tiefen-Effekt: Ebenen bewegen sich beim Scrollen und mit dem Zeiger unterschiedlich schnell */
export function Depth({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let px = 0;
    let py = 0;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = Math.min(window.scrollY, 900);
      el.style.setProperty("--sy", String(y));
      el.style.setProperty("--px", px.toFixed(3));
      el.style.setProperty("--py", py.toFixed(3));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
      queue();
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className={`depth ${className}`}>
      {children}
    </div>
  );
}

/** Schwebende Sprachblasen im Kopfbereich */
export function LanguageChips({ items }: { items: string[] }) {
  const pos = [
    "left-[50%] top-[16%]",
    "right-[2%] top-[22%]",
    "left-[55%] bottom-[10%]",
    "right-[3%] bottom-[16%]",
    "left-[46%] top-[7%]",
    "right-[20%] bottom-[5%]",
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] hidden sm:block">
      {items.slice(0, pos.length).map((t, i) => (
        <span
          key={t}
          className={`float-chip absolute ${pos[i]} rounded-full bg-white/10 px-4 py-2 text-[15px] font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur`}
          style={{ animationDelay: `${i * 0.7}s`, animationDuration: `${6 + (i % 3)}s` }}
          dir="auto"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

const D = Math.PI / 180;
const MARK = [
  { n: "Fürth", lat: 49.48, lng: 10.99, c: "#fcd34d" },
  { n: "Teheran", lat: 35.69, lng: 51.39, c: "#6ee7a0" },
  { n: "Kabul", lat: 34.53, lng: 69.17, c: "#6ee7a0" },
];

/** Drehender Globus (Canvas, ohne Zusatzpaket): Punkte, Verbindungen von Fürth nach Teheran und Kabul */
export function Globe({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const still = reduced();
    const pts: [number, number][] = [];
    const N = 900;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const lat = Math.asin(y);
      const lng = i * Math.PI * (3 - Math.sqrt(5));
      pts.push([lat, lng]);
    }
    let w = 0;
    let h = 0;
    const fit = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    let visible = true;
    const io = new IntersectionObserver((e) => (visible = !!e[0]?.isIntersecting));
    io.observe(cv);
    let raf = 0;
    let rot = -42 * D;
    const proj = (lat: number, lng: number, R: number, tilt: number) => {
      const l = lng + rot;
      const x = Math.cos(lat) * Math.sin(l);
      const y0 = Math.sin(lat);
      const z0 = Math.cos(lat) * Math.cos(l);
      const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
      const z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
      return { x: w / 2 + x * R, y: h / 2 - y * R, z };
    };
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const R = Math.min(w, h) * 0.42;
      const tilt = 0.62;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, R * 0.2, w / 2, h / 2, R * 1.35);
      g.addColorStop(0, "rgba(110,231,160,.16)");
      g.addColorStop(1, "rgba(110,231,160,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, R, 0, 7);
      ctx.stroke();
      for (const [lat, lng] of pts) {
        const p = proj(lat, lng, R, tilt);
        if (p.z < 0) continue;
        ctx.fillStyle = `rgba(255,255,255,${0.2 + p.z * 0.7})`;
        ctx.fillRect(p.x, p.y, 2, 2);
      }
      const home = MARK[0]!;
      for (let i = 1; i < MARK.length; i++) {
        const m = MARK[i]!;
        // Bogen als Linie über die Kugel, mit wanderndem Punkt
        const steps = 48;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= steps; s++) {
          const f = s / steps;
          const lat = (home.lat + (m.lat - home.lat) * f) * D;
          const lng = (home.lng + (m.lng - home.lng) * f) * D;
          const lift = 1 + Math.sin(f * Math.PI) * 0.16;
          const p = proj(lat, lng, R * lift, tilt);
          if (p.z < -0.05) {
            started = false;
            continue;
          }
          if (!started) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
          started = true;
        }
        ctx.strokeStyle = "rgba(252,211,77,.55)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        const f = (((t / 2600 + i * 0.37) % 1) + 1) % 1;
        const lat = (home.lat + (m.lat - home.lat) * f) * D;
        const lng = (home.lng + (m.lng - home.lng) * f) * D;
        const p = proj(lat, lng, R * (1 + Math.sin(f * Math.PI) * 0.16), tilt);
        if (p.z > 0) {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.6, 0, 7);
          ctx.fill();
        }
      }
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      for (const m of MARK) {
        const p = proj(m.lat * D, m.lng * D, R, tilt);
        if (p.z < 0.02) continue;
        const pulse = 3 + Math.sin(t / 380) * 1.2;
        ctx.fillStyle = m.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 7);
        ctx.fill();
        ctx.strokeStyle = `${m.c}88`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + pulse, 0, 7);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.9)";
        ctx.fillText(m.n, p.x + 10, p.y + 4);
      }
      if (!still) rot += 0.0035;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Globus mit Verbindung zwischen Fürth, Teheran und Kabul"
      className={className}
    />
  );
}
