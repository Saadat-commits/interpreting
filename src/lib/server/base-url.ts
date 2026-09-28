/** Öffentliche Basis-URL für Links in E-Mails (SITE_URL hat Vorrang vor Request-Headern). */
export function baseUrlFrom(req: Request) {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}
