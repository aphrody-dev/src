import { DEFAULT_CSP, type ResolvedSite } from "./config.ts";

export const SECURITY: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export const IMMUTABLE = "public, max-age=31536000, immutable";
export const REVALIDATE = "public, max-age=0, must-revalidate";

/** Cloudflare-style _headers: /_static/* immutable, documents must-revalidate, site CSP. Cloudflare joins a header
 * set by two matching rules with a comma, so Cache-Control is set once per path: on each document, and on /_static/*. */
export function headersFile(
  site: ResolvedSite,
  documents: string[] = [],
): string {
  const rules: [string, Record<string, string>][] = [
    ["/*", { ...SECURITY, "Content-Security-Policy": site.csp ?? DEFAULT_CSP }],
    ["/_static/*", { "Cache-Control": IMMUTABLE }],
    ...[...new Set(documents)]
      .sort()
      .map((p): [string, Record<string, string>] => [
        p,
        { "Cache-Control": REVALIDATE },
      ]),
    ...Object.entries(site.headers ?? {}),
  ];
  return `${rules
    .map(
      ([p, h]) =>
        `${p}\n${Object.entries(h)
          .map(([k, v]) => `  ${k}: ${v}`)
          .join("\n")}`,
    )
    .join("\n")}\n`;
}

export function redirectsFile(site: ResolvedSite): string {
  return (
    (site.redirects ?? [])
      .map(
        (r) =>
          `${r.source} ${r.destination} ${r.permanent === false ? 302 : 301}`,
      )
      .join("\n") + "\n"
  );
}

/** Parse _headers into ordered rules (used by the bun server). */
export function parseHeaders(
  text: string,
): { pattern: string; headers: Record<string, string> }[] {
  const out: { pattern: string; headers: Record<string, string> }[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) out.push({ pattern: line.trim(), headers: {} });
    else {
      const i = line.indexOf(":");
      if (i > 0 && out.length)
        out.at(-1)!.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return out;
}

export function headersFor(
  rules: ReturnType<typeof parseHeaders>,
  path: string,
): Record<string, string> {
  const h: Record<string, string> = {};
  for (const r of rules) {
    const re = new RegExp(
      `^${r.pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
    );
    if (re.test(path)) Object.assign(h, r.headers);
  }
  return h;
}
