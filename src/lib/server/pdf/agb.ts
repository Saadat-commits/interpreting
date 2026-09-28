import { site } from "@/config/site";
import { agb } from "@/content/agb";
import type { PDFPage } from "pdf-lib";
import { A4, C, M, createDoc, drawMark, text, wrap } from "./common";

let cached: Uint8Array | null = null;

function fill(s: string) {
  return s.replaceAll("{brand}", site.brand).replaceAll("{city}", site.city);
}

export async function renderAgbPdf(): Promise<Uint8Array> {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const { doc, fonts } = await createDoc(`${agb.title} – ${site.brand}`);
  const { regular: R, semibold: S, bold: B } = fonts;
  const width = A4.w - 2 * M;
  const bodySize = 9.5;
  const lh = 14.5;
  const bottom = 80;

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;

  const newPage = () => {
    page = doc.addPage([A4.w, A4.h]);
    pages.push(page);
    page.drawRectangle({ x: 0, y: A4.h - 6, width: A4.w, height: 6, color: C.brand });
    drawMark(page, M, A4.h - 52, 18);
    text(page, S, site.brand, M + 26, A4.h - 46, 9.5);
    text(page, R, agb.title, A4.w - M, A4.h - 46, 8, C.muted, "right");
    y = A4.h - 90;
  };
  const ensure = (h: number) => {
    if (y - h < bottom) newPage();
  };

  newPage();
  // Titelblock
  y -= 20;
  text(page, B, agb.title, M, y, 22);
  y -= 22;
  text(page, R, `${agb.subtitle} · ${site.brand}`, M, y, 11, C.soft);
  y -= 16;
  text(page, R, agb.version, M, y, 8.5, C.muted);
  y -= 18;
  page.drawLine({ start: { x: M, y }, end: { x: M + 48, y }, thickness: 2, color: C.brand });
  y -= 30;

  agb.sections.forEach((section, si) => {
    ensure(60);
    const num = `§ ${si + 1}`;
    text(page, B, num, M, y, 11, C.brand);
    text(page, B, section.heading, M + 36, y, 11);
    y -= 20;
    section.paragraphs.forEach((p, pi) => {
      const lines = wrap(R, fill(p), bodySize, width - 36);
      ensure(Math.min(lines.length, 3) * lh);
      text(page, S, `(${pi + 1})`, M + 36 - 4, y, bodySize, C.muted, "right");
      for (const l of lines) {
        ensure(lh);
        text(page, R, l, M + 36, y, bodySize, C.soft);
        y -= lh;
      }
      y -= 6;
    });
    y -= 12;
  });

  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 52 }, end: { x: A4.w - M, y: 52 }, thickness: 0.5, color: C.line });
    text(p, R, `${site.brand} · ${site.street} · ${site.postalCode} ${site.city} · ${site.email}`, M, 38, 7.5, C.muted);
    text(p, R, `Seite ${i + 1} von ${pages.length}`, A4.w - M, 38, 7.5, C.muted, "right");
  });

  cached = await doc.save();
  return cached;
}
