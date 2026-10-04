#!/usr/bin/env node
/**
 * Visual Review (docs/HAMRAH-DESIGN-BIBLE.md, „Review-Checkliste“).
 * Screenshots aller Prüfbreiten, Konsolenfehler, horizontales Überlaufen – optional mit Reduced Motion.
 *
 *   npm run dev                                  # in einem zweiten Terminal
 *   node scripts/visual-review.mjs               # alle Seiten, alle Breiten
 *   node scripts/visual-review.mjs /de/anfrage   # nur bestimmte Pfade
 *
 * Umgebung: BASE_URL (Standard http://localhost:3000), CHROME_PATH (lokales Chrome/Chromium),
 *           OUT (Standard ./visual-review), REDUCED_MOTION=1
 * Exit-Code 1, wenn Konsolenfehler oder Überlauf gefunden wurden.
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "visual-review";
const REDUCED = process.env.REDUCED_MOTION === "1";
const WIDTHS = [1440, 1280, 1024, 430, 390, 375];
const PATHS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "/de",
      "/fa",
      "/de/leistungen",
      ...["reinigung", "umzug", "montage", "transport", "dolmetschen", "sicherheit"].map((s) => `/de/leistungen/${s}`),
      "/fa/leistungen/umzug",
      "/de/anfrage",
      "/de/anfrage/umzug",
      "/fa/anfrage/reinigung",
      "/de/termin",
      "/de/informationen",
      "/de/kontakt",
    ];

const executablePath =
  process.env.CHROME_PATH ??
  ["/usr/local/bin/google-chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((f) => existsSync(f));
const browser = await chromium.launch({
  executablePath,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
await mkdir(OUT, { recursive: true });

const problems = [];
for (const p of PATHS) {
  for (const w of WIDTHS) {
    const mobile = w < 1024;
    const page = await browser.newPage({
      viewport: { width: w, height: mobile ? 844 : 900 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: REDUCED ? "reduce" : "no-preference",
    });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(1500);
    // Einmal durchscrollen, damit Lazy-Szenen und ScrollTrigger laufen
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const name = `${p.replace(/\//g, "_").replace(/^_/, "") || "root"}-${w}${REDUCED ? "-rm" : ""}.png`;
    await page.screenshot({ path: path.join(OUT, name) });
    const status = res?.status() ?? 0;
    const issues = [status >= 400 && `HTTP ${status}`, overflow > 0 && `overflow ${overflow}px`, ...errors.map((e) => `console: ${e.slice(0, 160)}`)].filter(Boolean);
    console.log(`${issues.length ? "✗" : "✓"} ${p} @${w}${issues.length ? `  ${issues.join(" | ")}` : ""}`);
    if (issues.length) problems.push({ path: p, width: w, issues });
    await page.close();
  }
}
await browser.close();
console.log(`\n${problems.length ? `${problems.length} Problem(e)` : "Keine Probleme"} – Screenshots in ${OUT}/`);
process.exit(problems.length ? 1 : 0);
