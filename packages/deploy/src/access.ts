// Cloudflare Access JWT check (Workers runtime): RS256 signature against the team certs, audience and expiry.
// The dashboard sits behind an Access application; the Worker verifies the token itself so that a request
// reaching it by another path (workers.dev, a misconfigured route) is still refused.

const enc = new TextEncoder();
let cache: { at: number; keys: Map<string, CryptoKey> } | null = null;

function b64url(s: string): Uint8Array<ArrayBuffer> {
  const b = atob(
    s.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (s.length % 4)) % 4),
  );
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function certs(
  team: string,
  fetcher: typeof fetch,
): Promise<Map<string, CryptoKey>> {
  if (cache && Date.now() - cache.at < 3_600_000) return cache.keys;
  const r = await fetcher(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error(`access certs: HTTP ${r.status}`);
  const j = (await r.json()) as { keys: (JsonWebKey & { kid: string })[] };
  const keys = new Map<string, CryptoKey>();
  for (const k of j.keys)
    keys.set(
      k.kid,
      await crypto.subtle.importKey(
        "jwk",
        k,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"],
      ),
    );
  cache = { at: Date.now(), keys };
  return keys;
}

export interface AccessIdentity {
  email?: string;
  sub?: string;
}

/** Returns the identity carried by a valid Access token for `aud`, or null. */
export async function verifyAccess(
  token: string | null | undefined,
  team: string | undefined,
  aud: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<AccessIdentity | null> {
  if (!token || !team || !aud) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64url(parts[0]!)));
    const payload = JSON.parse(new TextDecoder().decode(b64url(parts[1]!)));
    if (header.alg !== "RS256") return null;
    const key = (await certs(team, fetcher)).get(header.kid);
    if (!key) return null;
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64url(parts[2]!),
      enc.encode(`${parts[0]}.${parts[1]}`),
    );
    if (!ok) return null;
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(aud)) return null;
    const now = Date.now() / 1000;
    if (typeof payload.exp !== "number" || payload.exp + 30 < now) return null;
    if (typeof payload.nbf === "number" && payload.nbf - 30 > now) return null;
    if (payload.iss !== `https://${team}`) return null;
    return { email: payload.email, sub: payload.sub };
  } catch {
    return null;
  }
}

/** Constant-time comparison of a bearer token with the configured deploy token. */
export function bearerOk(
  header: string | null,
  token: string | undefined,
): boolean {
  if (!token || !header?.startsWith("Bearer ")) return false;
  const a = enc.encode(header.slice(7));
  const b = enc.encode(token);
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i]! ^ b[i]!;
  return d === 0;
}
