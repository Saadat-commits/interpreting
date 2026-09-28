/** SVG-Pfad eines achtzackigen Sterns (Motiv aus afghanischer/persischer Ornamentik, Girih). */
export function starPath(cx: number, cy: number, r: number, inner = 0.62, points = 8) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}
