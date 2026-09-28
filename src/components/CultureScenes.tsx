import type { ReactNode } from "react";
import { starPath } from "@/lib/star";

/**
 * Illustrationen „Zwei Kulturen“ – bewusst monochrom in Grün gehalten.
 * Jede Szene besteht aus drei Ebenen (Hintergrund, Motiv, Vordergrund),
 * die in der 3D-Karte unterschiedlich tief liegen.
 */

const G = {
  900: "#103827",
  800: "#154831",
  700: "#195A3C",
  600: "#1F7049",
  500: "#2C8A5D",
  400: "#4FA478",
  300: "#82C29E",
  200: "#B3DCC3",
  100: "#D9EEE1",
  50: "#EFF7F2",
};

const VB = "0 0 320 240";

function Layer({ children, depth, className = "" }: { children: ReactNode; depth: number; className?: string }) {
  return (
    <svg viewBox={VB} className={`absolute inset-0 h-full w-full ${className}`} style={{ transform: `translateZ(${depth}px)` }} aria-hidden="true">
      {children}
    </svg>
  );
}

function Frame({ id, children, fill }: { id: string; children?: ReactNode; fill: string }) {
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect width="320" height="240" rx="22" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="320" height="240" fill={fill} />
        {children}
      </g>
    </>
  );
}

function stars(cols: number, rows: number, size: number, color: string, opacity: number, ox = 0, oy = 0) {
  const out: ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push(
        <path
          key={`${r}-${c}`}
          d={starPath(ox + c * size + (r % 2 ? size / 2 : 0), oy + r * size * 0.9, size * 0.34, 0.64)}
          fill="none"
          stroke={color}
          strokeOpacity={opacity}
        />,
      );
  return out;
}

/* ---------------- 1 · Chai – Gastfreundschaft ---------------- */
function Chai() {
  const diamonds = Array.from({ length: 12 }, (_, i) => i * 28 + 4);
  return (
    <>
      <Layer depth={0}>
        <Frame id="c-chai" fill="#fff">
          {stars(8, 6, 44, G[500], 0.12, 10, 16)}
          <rect y="178" width="320" height="62" fill={G[700]} />
          <rect y="184" width="320" height="2" fill={G[300]} opacity=".6" />
          <rect y="232" width="320" height="2" fill={G[300]} opacity=".6" />
          {diamonds.map((x) => (
            <g key={x}>
              <path d={`M${x + 12} 194 l12 15 -12 15 -12 -15z`} fill={G[500]} />
              <path d={`M${x + 12} 203 l5 6 -5 6 -5 -6z`} fill={G[100]} />
            </g>
          ))}
        </Frame>
      </Layer>
      <Layer depth={36}>
        <ellipse cx="160" cy="184" rx="118" ry="15" fill={G[900]} opacity=".35" />
        <ellipse cx="160" cy="180" rx="116" ry="14" fill={G[800]} />
        <ellipse cx="160" cy="177" rx="108" ry="10" fill={G[600]} />
        {/* Teekanne (Tschainak) */}
        <path d="M86 128 C 60 124, 52 100, 44 92 C 52 92, 64 104, 90 116 Z" fill={G[700]} />
        <path d="M168 110 C 196 104, 200 150, 170 156" fill="none" stroke={G[800]} strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="128" cy="140" rx="50" ry="38" fill={G[600]} />
        <path d="M80 140 a48 22 0 0 0 96 0" fill={G[700]} />
        <ellipse cx="128" cy="104" rx="30" ry="8" fill={G[500]} />
        <path d="M104 104 q24 -26 48 0" fill={G[500]} />
        <circle cx="128" cy="84" r="6" fill={G[300]} />
        <path d={starPath(128, 138, 17, 0.64)} fill="none" stroke={G[100]} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="128" cy="138" r="4" fill={G[100]} />
        <ellipse cx="128" cy="140" rx="50" ry="38" fill="none" stroke={G[400]} strokeOpacity=".5" />
        <path d="M96 120 a36 30 0 0 1 22 -12" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
      </Layer>
      <Layer depth={70}>
        {[212, 256].map((x, i) => (
          <g key={x}>
            <ellipse cx={x} cy={172} rx="22" ry="6" fill={G[200]} />
            <path d={`M${x - 13} 128 C ${x - 13} 146, ${x - 6} 150, ${x - 8} 168 L ${x + 8} 168 C ${x + 6} 150, ${x + 13} 146, ${x + 13} 128 Z`} fill="#fff" fillOpacity=".75" stroke={G[300]} />
            <path d={`M${x - 11} 140 C ${x - 10} 150, ${x - 5} 153, ${x - 7} 166 L ${x + 7} 166 C ${x + 5} 153, ${x + 10} 150, ${x + 11} 140 Z`} fill={G[400]} />
            <path
              d={`M${x - 4} 120 c -8 -10, 8 -14, 0 -26 M${x + 5} 118 c -8 -10, 8 -14, 0 -24`}
              fill="none"
              stroke={G[300]}
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-float"
              style={{ animationDelay: `${-i * 1.5}s`, animationDuration: "5s" }}
            />
          </g>
        ))}
      </Layer>
    </>
  );
}

/* ---------------- 2 · Baukunst – Kuppel, Iwan und die weißen Tauben ---------------- */
function Architecture() {
  return (
    <>
      <Layer depth={0}>
        <Frame id="c-arch" fill="#fff">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={G[50]} />
              <stop offset="1" stopColor={G[100]} />
            </linearGradient>
          </defs>
                    <circle cx="252" cy="54" r="26" fill="none" stroke={G[200]} strokeWidth="1.5" />
          {stars(8, 3, 46, G[500], 0.1, 8, 150)}
          <rect y="214" width="320" height="26" fill={G[100]} />
        </Frame>
      </Layer>
      <Layer depth={34}>
        {/* Minarette */}
        {[52, 268].map((x) => (
          <g key={x}>
            <rect x={x - 8} y="70" width="16" height="148" fill={G[700]} />
            <rect x={x - 11} y="112" width="22" height="7" rx="2" fill={G[500]} />
            <rect x={x - 8} y="136" width="16" height="3" fill={G[300]} />
            <rect x={x - 8} y="160" width="16" height="3" fill={G[300]} />
            <path d={`M${x - 10} 70 q10 -26 20 0z`} fill={G[500]} />
            <path d={`M${x} 42 v8`} stroke={G[700]} strokeWidth="2" />
          </g>
        ))}
        {/* Kuppel */}
        <rect x="118" y="92" width="84" height="26" fill={G[600]} />
        <path d="M112 96 C 112 50, 150 36, 160 18 C 170 36, 208 50, 208 96 Z" fill={G[500]} />
        {[128, 144, 160, 176, 192].map((x) => (
          <path key={x} d={`M${x} 96 C ${x} 70, ${160 + (x - 160) * 0.4} 44, 160 22`} fill="none" stroke={G[300]} strokeOpacity=".7" />
        ))}
        <path d="M160 6 v12" stroke={G[700]} strokeWidth="2.5" />
        <circle cx="160" cy="6" r="3" fill={G[700]} />
        {/* Fassade mit Iwan */}
        <rect x="74" y="118" width="172" height="100" fill={G[600]} />
        <rect x="74" y="118" width="172" height="8" fill={G[700]} />
        <path d="M122 218 V168 C 122 146, 146 132, 160 124 C 174 132, 198 146, 198 168 V218 Z" fill={G[800]} />
        <path d="M132 218 V172 C 132 154, 150 142, 160 136 C 170 142, 188 154, 188 172 V218 Z" fill={G[700]} />
        <path d={starPath(160, 170, 16, 0.64)} fill="none" stroke={G[200]} strokeWidth="1.8" />
        {[88, 102, 216, 230].map((x) => (
          <path key={x} d={`M${x - 5} 200 V172 q5 -10 10 0 V200z`} fill={G[800]} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={starPath(82 + i * 15.6, 208, 4.5, 0.6)} fill={G[300]} opacity=".7" />
        ))}
      </Layer>
      <Layer depth={72}>
        {/* Weiße Tauben – Wahrzeichen von Mazar-e Sharif */}
        {[
          [58, 76, 1],
          [90, 56, 0.8],
          [224, 98, 0.9],
          [252, 118, 0.7],
        ].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`} className="animate-float" style={{ animationDelay: `${-i * 1.2}s`, animationDuration: "6s" }}>
            <path d="M0 0 C 8 -10, 16 -10, 20 -2 C 26 -12, 34 -12, 42 -4 C 34 -2, 28 4, 20 6 C 12 6, 6 4, 0 0 Z" fill="#fff" stroke={G[600]} strokeWidth="1.6" strokeLinejoin="round" />
          </g>
        ))}
      </Layer>
    </>
  );
}

/* ---------------- 3 · Handwerk – afghanischer Teppich ---------------- */
function Carpet() {
  const gul = (cx: number, cy: number, key: string) => (
    <g key={key}>
      <path d={`M${cx - 26} ${cy - 11} L${cx - 11} ${cy - 22} H${cx + 11} L${cx + 26} ${cy - 11} V${cy + 11} L${cx + 11} ${cy + 22} H${cx - 11} L${cx - 26} ${cy + 11} Z`} fill={G[600]} stroke={G[300]} strokeWidth="1.5" />
      <path d={`M${cx} ${cy - 15} L${cx + 17} ${cy} L${cx} ${cy + 15} L${cx - 17} ${cy} Z`} fill={G[200]} />
      <path d={`M${cx} ${cy - 8} L${cx + 9} ${cy} L${cx} ${cy + 8} L${cx - 9} ${cy} Z`} fill={G[700]} />
      <path d={`M${cx - 26} ${cy} H${cx - 36} M${cx + 26} ${cy} H${cx + 36}`} stroke={G[300]} strokeWidth="2" />
    </g>
  );
  return (
    <>
      <Layer depth={0}>
        <Frame id="c-carpet" fill="#fff">
          {stars(8, 6, 44, G[500], 0.1, 10, 16)}
        </Frame>
      </Layer>
      <Layer depth={32}>
        <g transform="rotate(-4 160 120)">
          {Array.from({ length: 30 }, (_, i) => (
            <path key={i} d={`M${48 + i * 7.6} 20 v-10 M${48 + i * 7.6} 220 v10`} stroke={G[200]} strokeWidth="2" />
          ))}
          <rect x="40" y="20" width="240" height="200" rx="4" fill={G[800]} />
          <rect x="48" y="28" width="224" height="184" fill="none" stroke={G[500]} strokeWidth="8" />
          <rect x="58" y="38" width="204" height="164" fill="none" stroke={G[200]} strokeWidth="1.5" />
          {Array.from({ length: 13 }, (_, i) => (
            <path key={i} d={`M${56 + i * 17.3} 32 l4 -4 4 4 -4 4z`} fill={G[200]} opacity=".8" />
          ))}
          {[
            [110, 85],
            [210, 85],
            [110, 155],
            [210, 155],
          ].map(([x, y]) => gul(x, y, `${x}-${y}`))}
          <path d={starPath(160, 120, 16, 0.6)} fill={G[300]} />
        </g>
      </Layer>
      <Layer depth={70}>
        {/* Wollknäuel */}
        <g transform="translate(262 196)">
          <circle r="24" fill={G[400]} />
          {[-14, -6, 2, 10].map((o) => (
            <path key={o} d={`M${o - 10} -20 C ${o + 12} -8, ${o - 8} 8, ${o + 10} 22`} fill="none" stroke={G[200]} strokeWidth="2" />
          ))}
          <path d="M-20 12 C -40 22, -60 14, -84 26" fill="none" stroke={G[400]} strokeWidth="2.5" />
        </g>
      </Layer>
    </>
  );
}

/* ---------------- 4 · Nürnberg – Kaiserburg und Altstadt ---------------- */
function Nuremberg() {
  const houses = [
    [18, 44, 58],
    [66, 40, 66],
    [110, 46, 54],
    [160, 42, 70],
    [206, 48, 60],
    [258, 44, 64],
  ];
  return (
    <>
      <Layer depth={0}>
        <Frame id="c-nbg" fill="#fff">
          <circle cx="70" cy="56" r="30" fill="none" stroke={G[200]} strokeWidth="1.5" />
          <path d="M0 150 C 60 120, 120 96, 190 104 C 250 110, 290 130, 320 140 V240 H0Z" fill={G[100]} />
        </Frame>
      </Layer>
      <Layer depth={30}>
        {/* Kaiserburg mit Sinwellturm */}
        <path d="M120 126 H270 V150 H120Z" fill={G[700]} />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={122 + i * 12.5} y="120" width="7" height="8" fill={G[700]} />
        ))}
        <rect x="150" y="84" width="46" height="46" fill={G[600]} />
        <path d="M146 86 L173 58 L200 86Z" fill={G[800]} />
        <rect x="218" y="64" width="24" height="66" fill={G[600]} />
        <path d="M214 66 L230 28 L246 66Z" fill={G[800]} />
        <circle cx="230" cy="84" r="4" fill={G[200]} />
        {[160, 176].map((x) => (
          <rect key={x} x={x} y="100" width="8" height="12" rx="4" fill={G[200]} />
        ))}
        <rect x="104" y="104" width="30" height="30" fill={G[600]} />
        <path d="M100 106 L119 86 L138 106Z" fill={G[800]} />
      </Layer>
      <Layer depth={64}>
        {/* Fachwerkhäuser */}
        {houses.map(([x, w, h], i) => {
          const base = 212;
          const top = base - h;
          return (
            <g key={i}>
              <rect x={x} y={top} width={w} height={h} fill="#fff" stroke={G[600]} strokeWidth="2" />
              <path d={`M${x - 3} ${top} L${x + w / 2} ${top - w * 0.72} L${x + w + 3} ${top}Z`} fill={G[600]} />
              <path d={`M${x} ${top + h / 2} H${x + w} M${x + w / 2} ${top} V${base} M${x} ${top} L${x + w / 2} ${top + h / 2} L${x + w} ${top} M${x} ${base} L${x + w / 2} ${top + h / 2} L${x + w} ${base}`} stroke={G[600]} strokeWidth="1.6" fill="none" />
              <rect x={x + w / 2 - 5} y={top - w * 0.38} width="10" height="8" fill={G[100]} />
            </g>
          );
        })}
        <rect x="0" y="212" width="320" height="28" fill={G[200]} />
        {[20, 90, 160, 230, 300].map((x) => (
          <path key={x} d={`M${x - 14} 224 q7 -5 14 0 t14 0`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        ))}
      </Layer>
    </>
  );
}


/* ---------------- 5 · Musik – der Rubab ---------------- */
function Rubab() {
  return (
    <>
      <Layer depth={0}>
        <Frame id="c-rubab" fill="#fff">
          {stars(8, 6, 44, G[500], 0.1, 10, 16)}
        </Frame>
      </Layer>
      <Layer depth={36}>
        <g transform="rotate(-28 160 130)">
          <rect x="151" y="14" width="18" height="84" rx="4" fill={G[800]} />
          {[30, 44, 58, 72, 86].map((y) => (
            <rect key={y} x="151" y={y} width="18" height="1.6" fill={G[300]} />
          ))}
          <path d="M149 16 L140 -6 L180 -6 L171 16Z" fill={G[700]} />
          {[-2, 6].map((y) => (
            <g key={y}>
              <circle cx="136" cy={y} r="3.5" fill={G[500]} />
              <circle cx="184" cy={y} r="3.5" fill={G[500]} />
            </g>
          ))}
          <path d="M126 150 C 120 124, 134 100, 150 96 H170 C 186 100, 200 124, 194 150 Z" fill={G[700]} />
          {[
            [148, 112],
            [172, 112],
            [138, 132],
            [182, 132],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#fff" opacity=".85" />
          ))}
          <path d={starPath(160, 124, 9, 0.6)} fill="#fff" opacity=".9" />
          <ellipse cx="160" cy="178" rx="46" ry="50" fill={G[600]} />
          <ellipse cx="160" cy="184" rx="32" ry="36" fill="#fff" stroke={G[300]} strokeWidth="1.5" />
          <rect x="150" y="196" width="20" height="5" rx="2" fill={G[800]} />
          {[-4, 0, 4].map((o) => (
            <path key={o} d={`M${160 + o} 198 L${160 + o} 16`} stroke={G[300]} strokeWidth=".8" />
          ))}
        </g>
      </Layer>
      <Layer depth={70}>
        {[
          [238, 70, 0],
          [262, 110, 1],
          [60, 96, 2],
        ].map(([x, y, i]) => (
          <g key={i} transform={`translate(${x} ${y})`} className="animate-float" style={{ animationDelay: `${-i * 1.4}s`, animationDuration: "5.5s" }}>
            <ellipse cx="0" cy="14" rx="7" ry="5" fill={G[500]} transform="rotate(-20 0 14)" />
            <path d="M6 12 V-12 q10 4 12 12" fill="none" stroke={G[500]} strokeWidth="2.4" strokeLinecap="round" />
          </g>
        ))}
      </Layer>
    </>
  );
}

/* ---------------- 6 · Kalligrafie ---------------- */
function Calligraphy() {
  return (
    <>
      <Layer depth={0}>
        <Frame id="c-calli" fill="#fff">
          <rect x="22" y="22" width="276" height="196" rx="16" fill="none" stroke={G[200]} strokeWidth="1.5" />
          <rect x="32" y="32" width="256" height="176" rx="10" fill="none" stroke={G[300]} strokeDasharray="2 5" />
          {[
            [32, 32],
            [288, 32],
            [32, 208],
            [288, 208],
          ].map(([x, y]) => (
            <path key={`${x}${y}`} d={starPath(x, y, 11, 0.6)} fill="#fff" stroke={G[500]} strokeWidth="1.4" />
          ))}
        </Frame>
      </Layer>
      <Layer depth={40}>
        <text x="160" y="126" textAnchor="middle" fontSize="54" fontWeight="700" fill={G[700]} style={{ fontFamily: "var(--font-fa), Vazirmatn, Tahoma, sans-serif" }}>
          خوش آمدید
        </text>
        <path d="M92 146 C 130 158, 190 158, 228 146" fill="none" stroke={G[400]} strokeWidth="2" strokeLinecap="round" />
        <text x="160" y="178" textAnchor="middle" fontSize="15" fontWeight="600" letterSpacing="3" fill={G[500]} style={{ fontFamily: "var(--font-sans), sans-serif" }}>
          WILLKOMMEN
        </text>
      </Layer>
      <Layer depth={72}>
        <g transform="rotate(38 262 60)">
          <rect x="256" y="10" width="9" height="100" rx="4" fill={G[600]} />
          <path d="M256 110 L260.5 128 L265 110Z" fill={G[800]} />
        </g>
        <path d="M34 186 h28 v22 a6 6 0 0 1 -6 6 h-16 a6 6 0 0 1 -6 -6z" fill={G[700]} />
        <ellipse cx="48" cy="186" rx="14" ry="4" fill={G[900]} />
      </Layer>
    </>
  );
}

/* ---------------- 7 · Nowruz – Frühling, Sabzeh und Tulpen ---------------- */
function Nowruz() {
  const blades = Array.from({ length: 26 }, (_, i) => i);
  return (
    <>
      <Layer depth={0}>
        <Frame id="c-nowruz" fill="#fff">
          {stars(8, 6, 44, G[500], 0.09, 10, 16)}
          <rect y="200" width="320" height="40" fill={G[100]} />
        </Frame>
      </Layer>
      <Layer depth={34}>
        {/* Sabzeh */}
        {blades.map((i) => {
          const x = 104 + i * 3.2;
          const h = 44 + ((i * 37) % 26);
          const bend = ((i % 5) - 2) * 4;
          return <path key={i} d={`M${x} 176 q ${bend} ${-h / 2} ${bend * 1.6} ${-h}`} fill="none" stroke={i % 3 ? G[500] : G[400]} strokeWidth="2.2" strokeLinecap="round" />;
        })}
        <path d="M92 174 H198 L188 206 H102Z" fill={G[700]} />
        <path d="M92 174 H198" stroke={G[300]} strokeWidth="3" />
        {/* Tulpen */}
        {[
          [236, 108, -6],
          [258, 96, 4],
          [278, 116, 10],
        ].map(([x, y, r], i) => (
          <g key={i} transform={`rotate(${r} ${x} 200)`}>
            <path d={`M${x} ${y + 14} C ${x} 150, ${x} 180, ${x} 200`} stroke={G[600]} strokeWidth="2.5" fill="none" />
            <path d={`M${x} ${y + 60} q -16 -6 -18 -24 q 14 6 18 22`} fill={G[400]} />
            <path d={`M${x - 10} ${y} q 0 18 10 18 q 10 0 10 -18 l -5 6 l -5 -8 l -5 8z`} fill={G[500]} />
          </g>
        ))}
      </Layer>
      <Layer depth={70}>
        {[
          [52, 196],
          [72, 204],
        ].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx="11" ry="14" fill="#fff" stroke={G[500]} strokeWidth="1.6" />
            <path d={`M${x - 10} ${y - 2} q 5 -5 10 0 t 10 0`} fill="none" stroke={G[500]} strokeWidth="1.4" />
            <circle cx={x} cy={y + 6} r="2" fill={G[400]} />
          </g>
        ))}
        {[
          [40, 60],
          [210, 40],
          [292, 64],
        ].map(([x, y], i) => (
          <g key={i} className="animate-float" style={{ animationDelay: `${-i * 1.7}s`, animationDuration: "6.5s" }}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={x} cy={y - 5} rx="3" ry="5" fill="#fff" stroke={G[400]} transform={`rotate(${a} ${x} ${y})`} />
            ))}
            <circle cx={x} cy={y} r="2" fill={G[500]} />
          </g>
        ))}
      </Layer>
    </>
  );
}

/* ---------------- 8 · Dichtung – Rumi aus Balkh ---------------- */
function Poetry() {
  return (
    <>
      <Layer depth={0}>
        <Frame id="c-poetry" fill="#fff">
          {stars(8, 6, 44, G[500], 0.09, 10, 16)}
        </Frame>
      </Layer>
      <Layer depth={36}>
        <path d="M160 62 C 128 50, 88 50, 50 60 V 196 C 88 186, 128 186, 160 198 Z" fill="#fff" stroke={G[300]} strokeWidth="1.5" />
        <path d="M160 62 C 192 50, 232 50, 270 60 V 196 C 232 186, 192 186, 160 198 Z" fill="#fff" stroke={G[300]} strokeWidth="1.5" />
        <path d="M160 62 V198" stroke={G[400]} strokeWidth="1.5" />
        <path d="M44 66 V 202 C 88 192, 128 192, 160 204 C 192 192, 232 192, 276 202 V66" fill="none" stroke={G[600]} strokeWidth="3" />
        <text x="146" y="100" textAnchor="end" fontSize="12.5" fontWeight="600" fill={G[700]} style={{ fontFamily: "var(--font-fa), Vazirmatn, Tahoma, sans-serif" }} direction="rtl">
          هر کسی کو دور ماند
        </text>
        <text x="146" y="122" textAnchor="end" fontSize="12.5" fontWeight="600" fill={G[700]} style={{ fontFamily: "var(--font-fa), Vazirmatn, Tahoma, sans-serif" }} direction="rtl">
          از اصل خویش
        </text>
        <text x="256" y="100" textAnchor="end" fontSize="12.5" fontWeight="600" fill={G[700]} style={{ fontFamily: "var(--font-fa), Vazirmatn, Tahoma, sans-serif" }} direction="rtl">
          باز جوید روزگار
        </text>
        <text x="256" y="122" textAnchor="end" fontSize="12.5" fontWeight="600" fill={G[700]} style={{ fontFamily: "var(--font-fa), Vazirmatn, Tahoma, sans-serif" }} direction="rtl">
          وصل خویش
        </text>
        {[140, 152, 164].map((y) => (
          <g key={y}>
            <rect x="68" y={y} width="78" height="3" rx="1.5" fill={G[100]} />
            <rect x="176" y={y} width="78" height="3" rx="1.5" fill={G[100]} />
          </g>
        ))}
        <path d={starPath(214, 176, 7, 0.6)} fill={G[400]} />
      </Layer>
      <Layer depth={70}>
        <g transform="rotate(-32 268 70)">
          <path d="M262 10 C 286 30, 284 80, 268 118 C 256 80, 250 40, 262 10 Z" fill="#fff" stroke={G[600]} strokeWidth="1.8" />
          <path d="M266 22 C 268 60, 268 90, 268 124" stroke={G[600]} strokeWidth="1.6" fill="none" />
        </g>
      </Layer>
    </>
  );
}

export const cultureScenes = {
  chai: Chai,
  architecture: Architecture,
  rubab: Rubab,
  carpet: Carpet,
  calligraphy: Calligraphy,
  nowruz: Nowruz,
  poetry: Poetry,
  nuremberg: Nuremberg,
} as const;
export type CultureKey = keyof typeof cultureScenes;
