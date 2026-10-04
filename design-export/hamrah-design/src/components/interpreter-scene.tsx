import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useLocale } from "@/lib/locale-context";
import { designCopy } from "@/lib/i18n";

/**
 * Lebendige Illustration: Dolmetscher zwischen zwei Menschen am Tisch, dahinter die Berge.
 * Bewusst ohne Flaggen und ohne religiöse Symbole – afghanische Note über Berge, Kelim-Läufer und Tee.
 * Drei Ebenen (Himmel/Berge, Menschen, Sprechblasen) bewegen sich beim Zeigen leicht in 3D.
 */
export function InterpreterScene({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  const d = designCopy[locale];
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % d.bubblesLeft.length), 4200);
    return () => window.clearInterval(id);
  }, [d.bubblesLeft.length]);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width - 0.5;
    const y = (event.clientY - r.top) / r.height - 0.5;
    box.current.style.setProperty("--ry", `${x * 10}deg`);
    box.current.style.setProperty("--rx", `${-y * 8}deg`);
  };
  const leave = () => {
    box.current?.style.setProperty("--ry", "0deg");
    box.current?.style.setProperty("--rx", "0deg");
  };

  return (
    <div className={`scene-3d ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <div
        ref={box}
        className="scene-tilt relative aspect-[4/3] w-full"
        role="img"
        aria-label={d.sceneAlt}
      >
        {/* Ebene 1: Himmel und Berge */}
        <div className="scene-layer overflow-hidden rounded-[2rem] border border-white shadow-[0_40px_80px_-40px_oklch(0.3_0.06_160/45%)]">
          <SceneBack />
        </div>
        {/* Ebene 2: Menschen und Tisch */}
        <div className="scene-layer scene-mid">
          <SceneFront />
        </div>
        {/* Ebene 3: Sprechblasen und Plaketten */}
        <div className="scene-layer scene-front pointer-events-none" dir="ltr">
          <div
            key={`l${i}`}
            className="scene-bubble absolute left-[4%] top-[20%] origin-bottom-left sm:left-[6%]"
            dir="rtl"
          >
            <span className="font-['Vazirmatn',sans-serif] text-base font-semibold sm:text-xl">
              {d.bubblesLeft[i]}
            </span>
            <i className="scene-tail right-auto left-7" />
          </div>
          <div className="absolute left-1/2 top-[3%] -translate-x-1/2">
            <span className="scene-link" aria-hidden="true">
              <b />
              <b />
              <b />
            </span>
          </div>
          <div
            key={`r${i}`}
            className="scene-bubble scene-bubble-late absolute right-[4%] top-[20%] origin-bottom-right sm:right-[6%]"
          >
            <span className="text-sm font-semibold sm:text-lg">{d.bubblesRight[i]}</span>
            <i className="scene-tail right-7" />
          </div>
          <span className="scene-chip float-badge absolute left-1 bottom-[16%] sm:-left-2 hidden sm:inline-flex">
            🔒 {d.chipConfidential}
          </span>
          <span className="scene-chip float-badge float-delay absolute right-1 bottom-[26%] sm:-right-2 hidden sm:inline-flex">
            🤝 {d.chipNeutral}
          </span>
          <span className="scene-chip absolute left-1/2 bottom-[3%] -translate-x-1/2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            {d.chipLive}
          </span>
        </div>
      </div>
    </div>
  );
}

function SceneBack() {
  return (
    <svg viewBox="0 0 640 480" className="block size-full" aria-hidden="true">
      <defs>
        <linearGradient id="isc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f9f7" />
          <stop offset="0.6" stopColor="#ffffff" />
          <stop offset="1" stopColor="#fbf7f0" />
        </linearGradient>
        <radialGradient id="isc-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe3a3" />
          <stop offset="0.55" stopColor="#f7cf7a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f7cf7a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="isc-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6e5e3" />
          <stop offset="1" stopColor="#eef5f2" />
        </linearGradient>
        <linearGradient id="isc-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9cbb9" />
          <stop offset="1" stopColor="#e3efe8" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#isc-sky)" />
      <g className="scene-sun">
        <circle cx="486" cy="118" r="92" fill="url(#isc-sun)" />
        <circle cx="486" cy="118" r="30" fill="#fbd889" />
      </g>
      <g className="scene-cloud">
        <ellipse cx="120" cy="96" rx="46" ry="12" fill="#ffffff" />
        <ellipse cx="146" cy="88" rx="26" ry="12" fill="#ffffff" />
        <ellipse cx="340" cy="70" rx="34" ry="8" fill="#ffffff" opacity="0.9" />
      </g>
      <g className="scene-ridge-far">
        <path
          d="M-30 300 L40 246 L96 268 L170 196 L214 236 L262 176 L304 222 L352 150 L404 212 L452 172 L504 226 L566 186 L670 256 L670 480 L-30 480Z"
          fill="url(#isc-far)"
        />
        {/* Schneekappen */}
        <path d="M152 214 L170 196 L188 214 L178 210 L171 219 L162 210Z" fill="#fff" />
        <path d="M246 192 L262 176 L279 196 L270 192 L263 200 L255 192Z" fill="#fff" />
        <path d="M332 170 L352 150 L374 176 L362 171 L354 181 L344 171Z" fill="#fff" />
        <path d="M437 186 L452 172 L468 188 L460 185 L453 193 L445 185Z" fill="#fff" />
        <path d="M550 197 L566 186 L584 198 L575 196 L567 203 L559 196Z" fill="#fff" />
      </g>
      <g className="scene-birds" fill="none" stroke="#6f857b" strokeWidth="2" strokeLinecap="round">
        <path d="M220 120 q6 -6 12 0 q6 -6 12 0" />
        <path d="M252 104 q4 -4 8 0 q4 -4 8 0" />
      </g>
      <path
        className="scene-ridge-mid"
        d="M-40 342 L30 302 L96 324 L160 284 L232 330 L302 292 L372 322 L444 272 L520 322 L604 290 L680 326 L680 480 L-40 480Z"
        fill="url(#isc-mid)"
      />
      <path
        d="M-20 396 C 100 356, 210 374, 320 364 C 440 352, 540 344, 660 384 L660 480 L-20 480Z"
        fill="#f5f9f6"
      />
    </svg>
  );
}

function SceneFront() {
  return (
    <svg viewBox="0 0 640 480" className="block size-full" aria-hidden="true">
      <defs>
        <linearGradient id="isc-terra" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d98a64" />
          <stop offset="1" stopColor="#a8563a" />
        </linearGradient>
        <linearGradient id="isc-green" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f8a5b" />
          <stop offset="1" stopColor="#0b5a39" />
        </linearGradient>
        <linearGradient id="isc-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d86a3" />
          <stop offset="1" stopColor="#3e5573" />
        </linearGradient>
        <linearGradient id="isc-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1e6d4" />
          <stop offset="1" stopColor="#dcc7a6" />
        </linearGradient>
        <pattern id="isc-kilim" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#a4412d" />
          <path d="M14 2 L26 14 L14 26 L2 14Z" fill="#e0b25a" />
          <path d="M14 7 L21 14 L14 21 L7 14Z" fill="#23405e" />
          <path d="M14 11 L17 14 L14 17 L11 14Z" fill="#f6efe3" />
        </pattern>
        <filter id="isc-soft" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#16352a" floodOpacity="0.18" />
        </filter>
      </defs>

      <ellipse cx="320" cy="452" rx="260" ry="16" fill="#16352a" opacity="0.07" />

      {/* Links: Klientin/Klient */}
      <g filter="url(#isc-soft)" className="scene-person-left">
        <path
          d="M108 376 C108 318 130 294 166 294 C202 294 224 318 224 376Z"
          fill="url(#isc-terra)"
        />
        <path d="M152 296 L166 314 L180 296Z" fill="#f3d9c6" />
        <rect x="157" y="280" width="18" height="18" rx="6" fill="#b97a57" />
        <circle cx="166" cy="258" r="30" fill="#c98b66" />
        <path d="M134 256 C132 222 200 220 198 258 C190 238 152 236 134 256Z" fill="#2b1f1a" />
        <g className="scene-blink">
          <circle cx="155" cy="262" r="2.8" fill="#2b1f1a" />
          <circle cx="177" cy="262" r="2.8" fill="#2b1f1a" />
        </g>
        <path
          d="M157 275 Q166 282 175 275"
          fill="none"
          stroke="#7a3e28"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* erklärende Hand */}
        <g className="scene-gesture">
          <path
            d="M206 330 Q232 336 238 356"
            fill="none"
            stroke="url(#isc-terra)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <circle cx="240" cy="358" r="9" fill="#c98b66" />
        </g>
      </g>

      {/* Mitte: Dolmetscher mit Headset */}
      <g filter="url(#isc-soft)" className="scene-person-mid">
        <path
          d="M256 376 C256 304 280 280 320 280 C360 280 384 304 384 376Z"
          fill="url(#isc-green)"
        />
        <path d="M304 282 L320 304 L336 282Z" fill="#ffffff" />
        <rect x="310" y="264" width="20" height="20" rx="7" fill="#a86f4f" />
        <circle cx="320" cy="240" r="33" fill="#b97c5a" />
        <path d="M286 236 C284 200 356 200 354 238 C346 216 302 214 286 236Z" fill="#231915" />
        <g className="scene-blink scene-blink-late">
          <circle cx="308" cy="244" r="3" fill="#231915" />
          <circle cx="332" cy="244" r="3" fill="#231915" />
        </g>
        <path
          d="M309 258 Q320 266 331 258"
          fill="none"
          stroke="#6b3a24"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M285 240 A35 35 0 0 1 355 240"
          fill="none"
          stroke="#1d2a24"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <rect x="279" y="232" width="11" height="20" rx="5" fill="#1d2a24" />
        <rect x="350" y="232" width="11" height="20" rx="5" fill="#1d2a24" />
        <path
          d="M285 250 Q290 272 308 270"
          fill="none"
          stroke="#1d2a24"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle className="scene-mic" cx="310" cy="270" r="4" fill="#34d399" />
      </g>

      {/* Rechts: Sachbearbeiterin/Sachbearbeiter */}
      <g filter="url(#isc-soft)" className="scene-person-right">
        <path
          d="M416 376 C416 318 438 294 474 294 C510 294 532 318 532 376Z"
          fill="url(#isc-blue)"
        />
        <path d="M460 296 L474 318 L488 296Z" fill="#eef2f7" />
        <rect x="465" y="280" width="18" height="18" rx="6" fill="#e2b692" />
        <circle cx="474" cy="258" r="30" fill="#f0c9a8" />
        <path
          d="M442 262 C436 222 512 222 506 262 C502 240 470 232 450 248 C447 253 444 257 442 262Z"
          fill="#8a5a3c"
        />
        <g fill="none" stroke="#3a3f47" strokeWidth="2">
          <circle cx="463" cy="262" r="8" />
          <circle cx="485" cy="262" r="8" />
          <path d="M471 262 H477" />
        </g>
        <g className="scene-blink">
          <circle cx="463" cy="262" r="2.4" fill="#2d2a28" />
          <circle cx="485" cy="262" r="2.4" fill="#2d2a28" />
        </g>
        <path
          d="M465 276 Q474 282 483 276"
          fill="none"
          stroke="#9a5a44"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>

      {/* Tisch mit Kelim-Läufer */}
      <path
        d="M86 372 H554 a12 12 0 0 1 12 12 v8 H74 v-8 a12 12 0 0 1 12 -12Z"
        fill="url(#isc-wood)"
      />
      <rect x="96" y="392" width="448" height="8" rx="4" fill="#cdb693" opacity="0.6" />
      <g>
        <rect x="244" y="374" width="152" height="58" rx="2" fill="url(#isc-kilim)" />
        <rect x="244" y="374" width="152" height="6" fill="#f6efe3" />
        <rect x="244" y="380" width="152" height="3" fill="#23405e" />
        <rect x="244" y="423" width="152" height="3" fill="#23405e" />
        <rect x="244" y="426" width="152" height="6" fill="#f6efe3" />
        <g stroke="#e8dcc6" strokeWidth="2" strokeLinecap="round">
          {Array.from({ length: 19 }, (_, n) => (
            <path key={n} d={`M${249 + n * 8} 432 v9`} />
          ))}
        </g>
      </g>

      {/* Tee im Glas (links) mit Dampf */}
      <g>
        <ellipse cx="190" cy="372" rx="22" ry="5" fill="#e9dcc6" />
        <path d="M178 348 H202 L198 370 H182Z" fill="#c7672f" opacity="0.85" />
        <path d="M178 348 H202" stroke="#ffffff" strokeWidth="2" />
        <g
          className="scene-steam"
          fill="none"
          stroke="#b8c6bf"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M186 342 c-5 -7 5 -11 0 -18" />
          <path d="M195 340 c-5 -7 5 -11 0 -18" />
        </g>
      </g>

      {/* Notizblock (Mitte) */}
      <g transform="rotate(-4 320 360)">
        <rect x="292" y="350" width="46" height="22" rx="3" fill="#ffffff" stroke="#dfe7e2" />
        <path
          d="M298 357 H330 M298 363 H322"
          stroke="#b9c9c0"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <path d="M344 368 L362 352" stroke="#0b5a39" strokeWidth="4" strokeLinecap="round" />

      {/* Unterlagen (rechts) */}
      <g transform="rotate(6 470 360)">
        <rect x="444" y="344" width="58" height="30" rx="3" fill="#ffffff" stroke="#dfe7e2" />
        <path
          d="M452 352 H492 M452 358 H486 M452 364 H478"
          stroke="#c4d0ca"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
