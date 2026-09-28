/** Minimaler In-Memory-Router für die statische Vorschau (ersetzt Next.js-Routing). */
type Listener = () => void;
let current = "/de";
const listeners = new Set<Listener>();

export function getPath() {
  return current;
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function navigate(href: string) {
  const [pathAndQuery, hash] = href.split("#");
  const next = pathAndQuery || current.split("?")[0];
  if (next !== current) {
    current = next;
    listeners.forEach((l) => l());
  }
  requestAnimationFrame(() => {
    const el = hash ? document.getElementById(hash) : null;
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo({ top: 0 });
  });
}
