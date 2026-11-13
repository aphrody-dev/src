export interface Budgets {
  /** gzip bytes of each HTML document plus the site stylesheet (first round trip). */
  criticalGz?: number;
  /** gzip bytes of each client script. */
  scriptGz?: number;
  /** minimum wck overall score (0-100); wck errors always fail. */
  wckScore?: number;
}

export interface Redirect {
  source: string;
  destination: string;
  permanent?: boolean;
}

export interface SiteConfig {
  name: string;
  /** First domain is canonical. */
  domains: string[];
  locales?: string[];
  defaultLocale?: string;
  /** Extra headers by path pattern (Cloudflare _headers syntax). */
  headers?: Record<string, Record<string, string>>;
  /** Content-Security-Policy of HTML documents. */
  csp?: string;
  redirects?: Redirect[];
  /** Path prefixes proxied to the backend (e.g. /api/*), served by route.ts with the bun target. */
  origin?: { prefixes: string[]; url?: string };
  budgets?: Budgets;
  /** Client entry points (relative to the site root), bundled to /_static/[name]-[hash].js. */
  scripts?: string[];
  /** App stylesheets (relative to the site root), appended to tokens.css in one hashed sheet. */
  styles?: string[];
  /** Font ids of assets/brand/gen/fonts/fonts.json; the first ones listed in `preload` are preloaded. */
  fonts?: string[];
  preloadFonts?: string[];
  /** Files copied verbatim to dist (dist path -> source path relative to the site root). */
  copy?: Record<string, string>;
  /** Material Web elements bundled with componentsBundle(). */
  elements?: string[];
  /** Build target: "edge" (no precompression) or "bun" (.br/.gz next to each file). */
  target?: "edge" | "bun";
}

export const DEFAULT_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

export function defineSite(
  c: SiteConfig,
): Required<Pick<SiteConfig, "locales" | "defaultLocale">> & SiteConfig {
  if (!c.domains.length) throw new Error("defineSite: at least one domain");
  const locales = c.locales ?? ["en"];
  const defaultLocale = c.defaultLocale ?? locales[0]!;
  if (!locales.includes(defaultLocale))
    throw new Error(
      `defineSite: defaultLocale ${defaultLocale} not in locales`,
    );
  return { ...c, locales, defaultLocale };
}

export type ResolvedSite = ReturnType<typeof defineSite>;

/** Path of `path` in `locale`: the default locale has no prefix. */
export function localizedPath(
  site: Pick<ResolvedSite, "defaultLocale">,
  locale: string,
  path: string,
): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return locale === site.defaultLocale ? p : `/${locale}${p === "/" ? "/" : p}`;
}

export const origin = (site: Pick<SiteConfig, "domains">) =>
  `https://${site.domains[0]}`;
