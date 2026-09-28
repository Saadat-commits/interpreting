/** Einfache In-Memory-Begrenzung pro IP (pro Minute). Für mehrere Instanzen später durch Redis o. ä. ersetzen. */
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(req: Request, bucket: string, perMinute: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + 60000 });
    return true;
  }
  entry.count++;
  return entry.count <= perMinute;
}
