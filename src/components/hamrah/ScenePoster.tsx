import { services } from "@/config/services";

/** Ruhiges Standbild der Szene – sichtbar bis WebGL geladen ist oder wenn WebGL fehlt. */
export function ScenePoster({ color, className = "" }: { color?: string; className?: string }) {
  const pts = [
    [150, 250],
    [130, 175],
    [215, 130],
    [385, 130],
    [470, 175],
    [450, 250],
  ];
  return (
    <svg viewBox="0 0 600 400" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="poster-glow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="300" cy="215" rx="290" ry="170" fill="url(#poster-glow)" />
      <path d="M90 150 L170 60 L215 105 L270 40 L340 120 L390 75 L470 150 Z" fill="#B7B9A6" opacity="0.45" />
      <ellipse cx="300" cy="235" rx="250" ry="105" fill="#E2DCCF" />
      <ellipse cx="300" cy="222" rx="250" ry="105" fill="#EFEBE2" />
      <path d={`M${pts.map((p) => p.join(" ")).join(" L")}`} fill="none" stroke="#E9A23B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + 14} rx="26" ry="9" fill="#000" opacity="0.06" />
          <rect x={x - 18} y={y - 22} width="36" height="36" rx="10" fill={color ?? services[i].color} />
        </g>
      ))}
    </svg>
  );
}
