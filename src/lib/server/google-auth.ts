import { createSign } from "node:crypto";

/**
 * Ein Google-Zugang für alles: Dienstkonto mit domänenweiter Delegierung (Google Workspace).
 * Die Website handelt im Namen von GOOGLE_DELEGATED_USER (z. B. saadat@interpreting-nbg.de):
 *   - Gmail:    E-Mails an Kund:innen senden (mit Rechnung und AGB)
 *   - Kalender: freie Zeiten prüfen und Buchungen eintragen
 *
 * Benötigte Umgebungsvariablen: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY,
 * GOOGLE_DELEGATED_USER (ohne Delegierung: Kalender muss mit dem Dienstkonto geteilt sein).
 */
export const SCOPES = {
  calendar: "https://www.googleapis.com/auth/calendar",
  gmailSend: "https://www.googleapis.com/auth/gmail.send",
};

export function googleConfigured() {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}

export function delegatedUser() {
  return process.env.GOOGLE_DELEGATED_USER || undefined;
}

const cache = new Map<string, { value: string; exp: number }>();

export async function googleAccessToken(scope: string, subject = delegatedUser()): Promise<string> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !key) throw new Error("Google-Dienstkonto ist nicht eingerichtet.");

  const cacheKey = `${scope}|${subject ?? ""}`;
  const now = Math.floor(Date.now() / 1000);
  const hit = cache.get(cacheKey);
  if (hit && hit.exp - 60 > now) return hit.value;

  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const claims: Record<string, unknown> = { iss: clientEmail, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 };
  if (subject) claims.sub = subject;
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64(claims)}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key).toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Google-Anmeldung fehlgeschlagen (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cache.set(cacheKey, { value: data.access_token, exp: now + data.expires_in });
  return data.access_token;
}

/** Sendet eine fertige MIME-Nachricht über die Gmail-API im Namen des delegierten Nutzers. */
export async function gmailSendRaw(mime: Buffer) {
  const token = await googleAccessToken(SCOPES.gmailSend);
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: mime.toString("base64url") }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Gmail (${res.status}): ${await res.text()}`);
}
