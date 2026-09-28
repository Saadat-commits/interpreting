/**
 * Baut eine eigenständige, statische Vorschau der Website (eine HTML-Datei mit
 * eingebettetem CSS/JS) für die private Ansicht ohne Server.
 *   node preview/build.mjs  →  preview/dist/index.html (+ agb.pdf)
 */
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dist = path.join(here, "dist");
mkdirSync(dist, { recursive: true });

const js = await build({
  entryPoints: [path.join(here, "entry.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  alias: {
    "next/link": path.join(here, "shims/next-link.tsx"),
    "next/navigation": path.join(here, "shims/next-navigation.ts"),
    "@": path.join(root, "src"),
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID": '""',
    "process.env.NEXT_PUBLIC_DEMO": '"1"',
    "process.env.NEXT_PUBLIC_ASSET_BASE": '""',
    "process.env.NEXT_PUBLIC_AGB_URL": '"agb.pdf"',
    "process.env.NEXT_PUBLIC_ADDRESS_HINT": '""',
  },
});

execSync(
  `npx tailwindcss -c tailwind.config.ts -i src/app/globals.css --content "./src/**/*.{ts,tsx},./preview/**/*.{ts,tsx}" -o preview/dist/app.css --minify`,
  { cwd: root, stdio: "inherit" },
);
// Beispiel-PDFs (Rechnung + AGB) mit erfundenen Daten
await build({
  entryPoints: [path.join(here, "sample-pdfs.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: path.join(dist, "sample-pdfs.mjs"),
  alias: { "@": path.join(root, "src") },
  logLevel: "warning",
});
execSync(`node ${path.join(dist, "sample-pdfs.mjs")} ${dist}`, { cwd: root, stdio: "inherit" });

const css = readFileSync(path.join(dist, "app.css"), "utf8");

const html = `<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Interpreting NBG Vorschau</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Vazirmatn:wght@400;500;600;700&display=swap">
<style>
:root{--font-sans:"Manrope",system-ui,-apple-system,"Segoe UI",sans-serif;--font-fa:"Vazirmatn",Tahoma,system-ui,sans-serif;color-scheme:light}
body{background:#fff}
${css}
.reveal{opacity:1;transform:none}
</style>
<div id="root"></div>
<script>${js.outputFiles[0].text.replace(/<\/script/g, "<\\/script")}</script>
`;
writeFileSync(path.join(dist, "index.html"), html);
// Fotos (Bilder aus /public/images) neben die Seite legen
cpSync(path.join(root, "public/images"), path.join(dist, "images"), { recursive: true });
console.log(`preview/dist/index.html – ${(html.length / 1024).toFixed(0)} KB`);
