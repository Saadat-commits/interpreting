const DOMAINS = ["gmail.com", "googlemail.com", "gmx.de", "gmx.net", "web.de", "t-online.de", "outlook.com", "outlook.de", "hotmail.com", "hotmail.de", "yahoo.com", "yahoo.de", "icloud.com", "freenet.de", "posteo.de", "mail.de", "live.de", "aol.com"];

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Schlägt bei vertippten E-Mail-Anbietern die richtige Adresse vor („gmial.com“ → „gmail.com“). */
export function suggestEmail(email: string): string | null {
  const m = email.trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m) return null;
  const [, user, domain] = m;
  if (DOMAINS.includes(domain)) return null;
  const fixed = domain.replace(/,/g, ".").replace(/\.(con|cm|cmo|om|comm)$/, ".com").replace(/\.(dee|dd|ed)$/, ".de");
  if (DOMAINS.includes(fixed)) return `${user}@${fixed}`;
  let best: string | null = null;
  let bestD = 3;
  for (const d of DOMAINS) {
    const dist = distance(fixed, d);
    if (dist < bestD) [best, bestD] = [d, dist];
  }
  return best && bestD <= 2 ? `${user}@${best}` : null;
}
