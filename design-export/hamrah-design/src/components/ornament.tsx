import { useEffect, useRef, useState, type ReactNode } from "react";

/** Schmales Kelim-Band (afghanisches Teppichmuster, rein geometrisch) als eleganter Trenner */
export function KilimBand({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 w-full bg-repeat-x ${className}`}
      style={{
        backgroundSize: "24px 12px",
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='12'><rect width='24' height='12' fill='#f6efe3'/><rect y='0' width='24' height='1.5' fill='#23405e'/><rect y='10.5' width='24' height='1.5' fill='#23405e'/><path d='M12 2 L18 6 L12 10 L6 6Z' fill='#a4412d'/><path d='M12 4.2 L15 6 L12 7.8 L9 6Z' fill='#e0b25a'/><path d='M0 2 L3 6 L0 10Z M24 2 L21 6 L24 10Z' fill='#0b5a39'/></svg>`,
        )}")`,
      }}
    />
  );
}

/** Zarte Bergsilhouette (Hindukusch-Anmutung) als Hintergrund-Abschluss */
export function MountainLine({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className={`pointer-events-none block w-full ${className}`}
    >
      <path
        d="M0 120 L90 84 L160 104 L260 44 L330 92 L420 60 L500 100 L600 30 L690 88 L780 56 L860 98 L960 40 L1050 90 L1140 62 L1230 100 L1330 50 L1440 96 L1440 160 L0 160Z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M0 140 L120 110 L220 128 L340 96 L450 132 L560 104 L680 136 L800 100 L920 130 L1040 108 L1160 138 L1280 112 L1440 134 L1440 160 L0 160Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

/** Blendet Inhalte beim Scrollen sanft ein (von unten, leicht in 3D) */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "is-shown" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
