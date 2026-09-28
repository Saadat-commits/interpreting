import { promises as fs } from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, type RGB } from "pdf-lib";

export const A4 = { w: 595.28, h: 841.89 };
export const M = 56; // Seitenrand

export const C = {
  ink: rgb(0.075, 0.125, 0.1),
  soft: rgb(0.23, 0.29, 0.26),
  muted: rgb(0.42, 0.48, 0.45),
  line: rgb(0.89, 0.92, 0.9),
  brand: rgb(0.122, 0.439, 0.286), // #1F7049
  brandSoft: rgb(0.937, 0.969, 0.949), // #EFF7F2
  white: rgb(1, 1, 1),
};

export interface Fonts {
  regular: PDFFont;
  semibold: PDFFont;
  bold: PDFFont;
}

let fontBytes: { regular: Uint8Array; semibold: Uint8Array; bold: Uint8Array } | null = null;

async function loadFontBytes() {
  if (!fontBytes) {
    const dir = path.join(process.cwd(), "assets", "fonts");
    const [regular, semibold, bold] = await Promise.all(
      ["Manrope-Regular.ttf", "Manrope-SemiBold.ttf", "Manrope-Bold.ttf"].map((f) => fs.readFile(path.join(dir, f))),
    );
    fontBytes = { regular, semibold, bold };
  }
  return fontBytes;
}

export async function createDoc(title: string) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const bytes = await loadFontBytes();
  const fonts: Fonts = {
    regular: await doc.embedFont(bytes.regular, { subset: true }),
    semibold: await doc.embedFont(bytes.semibold, { subset: true }),
    bold: await doc.embedFont(bytes.bold, { subset: true }),
  };
  // Logo des Inhabers (Berge); fehlt die Datei, wird ein schlichtes Zeichen gezeichnet
  const logo = await fs
    .readFile(path.join(process.cwd(), "public", "images", "logo-berge.png"))
    .then((b) => doc.embedPng(b))
    .catch(() => undefined);
  doc.setTitle(title);
  doc.setAuthor("Interpreting NBG");
  doc.setCreator("Interpreting NBG");
  doc.setLanguage("de-DE");
  return { doc, fonts, logo };
}

/** Ersetzt Zeichen, die die Schrift nicht enthält (z. B. arabische Schrift), durch Umschreibung. */
export function safe(font: PDFFont, text: string) {
  const supported = new Set(font.getCharacterSet());
  let out = "";
  for (const ch of text) out += supported.has(ch.codePointAt(0)!) ? ch : ch === "↔" ? "–" : "";
  return out.replace(/\s{2,}/g, " ").trim() || "—";
}

export function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

export function text(
  page: PDFPage,
  font: PDFFont,
  str: string,
  x: number,
  y: number,
  size: number,
  color: RGB = C.ink,
  align: "left" | "right" = "left",
) {
  const s = safe(font, str);
  const dx = align === "right" ? font.widthOfTextAtSize(s, size) : 0;
  page.drawText(s, { x: x - dx, y, size, font, color });
}

/** Kleines Markenzeichen: achtzackiger Stern (Girih-Motiv) in grünem Quadrat */
/** Logo (Berge) in Höhe `s` zeichnen; liefert die Breite zurück */
export function drawMark(page: PDFPage, x: number, y: number, s: number, logo?: PDFImage): number {
  if (logo) {
    const w = (logo.width / logo.height) * s;
    page.drawImage(logo, { x, y, width: w, height: s });
    return w;
  }
  page.drawRectangle({ x, y, width: s, height: s, color: C.brand });
  page.drawSvgPath("M6 29.5 L15.2 15 L19.8 22.1 L23.2 17.2 L34 29.5 Z", { x, y: y + s, scale: s / 40, color: C.white });
  return s;
}

/** Abgerundetes Rechteck; (x, y) = linke untere Ecke wie bei pdf-lib üblich */
export function roundRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  opts: { fill?: RGB; stroke?: RGB; strokeWidth?: number; opacity?: number } = {},
) {
  const d = `M${r} 0 H${w - r} A${r} ${r} 0 0 1 ${w} ${r} V${h - r} A${r} ${r} 0 0 1 ${w - r} ${h} H${r} A${r} ${r} 0 0 1 0 ${h - r} V${r} A${r} ${r} 0 0 1 ${r} 0 Z`;
  page.drawSvgPath(d, {
    x,
    y: y + h,
    color: opts.fill,
    borderColor: opts.stroke,
    borderWidth: opts.stroke ? (opts.strokeWidth ?? 0.8) : 0,
    opacity: opts.opacity,
    borderOpacity: opts.opacity,
  });
}

function starD(r: number, inner = 0.64) {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    pts.push(`${(Math.cos(a) * rad).toFixed(2)} ${(Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/** Dezentes Girih-Sternmuster in einem Bereich */
export function girih(page: PDFPage, x0: number, y0: number, w: number, h: number, size = 34, color = C.brand, opacity = 0.09) {
  const d = starD(size * 0.36);
  for (let row = 0; row * size * 0.9 < h + size; row++) {
    for (let col = 0; col * size < w + size; col++) {
      const cx = x0 + col * size + (row % 2 ? size / 2 : 0);
      const cy = y0 + row * size * 0.9;
      if (cx > x0 + w + 2 || cy > y0 + h + 2) continue;
      page.drawSvgPath(d, { x: cx, y: cy, borderColor: color, borderWidth: 0.7, borderOpacity: opacity });
    }
  }
}

/** QR-Code aus einer Bit-Matrix zeichnen */
export function drawQr(page: PDFPage, modules: { size: number; get(r: number, c: number): number }, x: number, y: number, size: number, color = C.ink) {
  const cell = size / modules.size;
  for (let r = 0; r < modules.size; r++) {
    for (let c = 0; c < modules.size; c++) {
      if (modules.get(r, c)) page.drawRectangle({ x: x + c * cell, y: y + size - (r + 1) * cell, width: cell + 0.05, height: cell + 0.05, color });
    }
  }
}
