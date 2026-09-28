import { NextResponse, type NextRequest } from "next/server";

/**
 * 1. Vorab-Schutz: Solange SITE_PUBLIC nicht "true" ist, ist die Seite
 *    - per Passwort geschützt (wenn SITE_PASSWORD gesetzt ist) und
 *    - für Suchmaschinen gesperrt (noindex).
 * 2. Sprach-Weiterleitung von „/“ auf /de bzw. /fa.
 */
export function middleware(req: NextRequest) {
  const isPublic = process.env.SITE_PUBLIC === "true";
  const password = process.env.SITE_PASSWORD;

  if (!isPublic && password) {
    const user = process.env.SITE_USER || "vorschau";
    const header = req.headers.get("authorization") ?? "";
    const [scheme, encoded] = header.split(" ");
    let ok = false;
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const i = decoded.indexOf(":");
      ok = decoded.slice(0, i) === user && decoded.slice(i + 1) === password;
    }
    if (!ok) {
      return new NextResponse("Diese Website ist noch nicht öffentlich.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Vorschau", charset="UTF-8"', "X-Robots-Tag": "noindex, nofollow" },
      });
    }
  }

  let res: NextResponse;
  if (req.nextUrl.pathname === "/") {
    const prefersFa = /^(fa|prs|ps)\b/i.test(req.headers.get("accept-language") ?? "");
    res = NextResponse.redirect(new URL(prefersFa ? "/fa" : "/de", req.url));
  } else {
    res = NextResponse.next();
  }
  if (!isPublic) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
