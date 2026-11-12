/**
 * Google stack configuration: env validation, Consent Mode v2 default-denied
 * snippet, and the Content-Security-Policy derived from the configured IDs.
 * Nothing Google-related is loaded unless the matching PUBLIC_* id is set.
 * Pure TypeScript, zero dependencies.
 */

export interface GoogleEnv {
  PUBLIC_GTM_ID?: string;
  PUBLIC_GA4_MEASUREMENT_ID?: string;
  PUBLIC_GOOGLE_ADS_ID?: string;
  PUBLIC_ADSENSE_CLIENT_ID?: string;
  PUBLIC_GTM_SERVER_URL?: string;
  PUBLIC_ADSENSE_SLOT_ID?: string;
  [key: string]: string | undefined;
}

export interface GoogleConfig {
  gtm?: string;
  ga4?: string;
  ads?: string;
  adsense?: string;
  /** AdSense ad unit id (digits) used by reserved slots. */
  slot?: string;
  /** Server-side GTM / first-party collection base URL (https origin, no path). */
  srv?: string;
}

const PATTERNS = {
  gtm: /^GTM-[A-Z0-9]{4,10}$/,
  ga4: /^G-[A-Z0-9]{6,14}$/,
  ads: /^AW-\d{6,12}$/,
  adsense: /^ca-pub-\d{10,20}$/,
};

function pick(value: string | undefined, re: RegExp): string | undefined {
  const v = (value || "").trim();
  return re.test(v) ? v : undefined;
}

/** Invalid or missing ids are dropped, so they can never be injected into HTML. */
export function readGoogleConfig(env: GoogleEnv = {}): GoogleConfig {
  const cfg: GoogleConfig = {};
  const gtm = pick(env.PUBLIC_GTM_ID, PATTERNS.gtm);
  const ga4 = pick(env.PUBLIC_GA4_MEASUREMENT_ID, PATTERNS.ga4);
  const ads = pick(env.PUBLIC_GOOGLE_ADS_ID, PATTERNS.ads);
  const adsense = pick(env.PUBLIC_ADSENSE_CLIENT_ID, PATTERNS.adsense);
  if (gtm) cfg.gtm = gtm;
  if (ga4) cfg.ga4 = ga4;
  if (ads) cfg.ads = ads;
  if (adsense) cfg.adsense = adsense;
  const slot = pick(env.PUBLIC_ADSENSE_SLOT_ID, /^\d{6,14}$/);
  if (adsense && slot) cfg.slot = slot;
  const srv = (env.PUBLIC_GTM_SERVER_URL || "").trim();
  if (/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(srv)) cfg.srv = srv;
  return cfg;
}

export function hasAnyGoogleId(cfg: GoogleConfig): boolean {
  return Boolean(cfg.gtm || cfg.ga4 || cfg.ads || cfg.adsense);
}

/**
 * Inline classic script executed first in <head>. Consent Mode v2: every
 * advertising and analytics signal starts denied; the banner (boot.js) updates it.
 */
export const CONSENT_DEFAULT_SNIPPET =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}" +
  "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'," +
  "analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied'," +
  "security_storage:'granted',wait_for_update:500});" +
  "gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);" +
  "try{var t=localStorage.getItem('aphrody_theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}";

export function consentScriptTag(): string {
  return `<script>${CONSENT_DEFAULT_SNIPPET}</script>`;
}

/** JSON config read by boot.js. "<" is escaped so it cannot close the script element. */
export function configScriptTag(cfg: GoogleConfig): string {
  return `<script type="application/json" id="g-cfg">${JSON.stringify(cfg).replace(/</g, "\\u003c")}</script>`;
}

export function buildCsp(cfg: GoogleConfig): string {
  const script = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];
  const connect = ["'self'"];
  const frame: string[] = [];
  if (cfg.gtm || cfg.ga4 || cfg.ads) {
    script.push("https://www.googletagmanager.com");
    connect.push(
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://stats.g.doubleclick.net",
      "https://www.googletagmanager.com",
    );
  }
  if (cfg.gtm) frame.push("https://www.googletagmanager.com");
  if (cfg.ads || cfg.adsense) {
    script.push(
      "https://googleads.g.doubleclick.net",
      "https://www.googleadservices.com",
    );
    connect.push("https://googleads.g.doubleclick.net");
  }
  if (cfg.adsense) {
    script.push(
      "https://pagead2.googlesyndication.com",
      "https://partner.googleadservices.com",
      "https://tpc.googlesyndication.com",
    );
    connect.push("https://pagead2.googlesyndication.com");
    frame.push(
      "https://googleads.g.doubleclick.net",
      "https://tpc.googlesyndication.com",
      "https://pagead2.googlesyndication.com",
    );
  }
  if (cfg.srv) connect.push(cfg.srv);
  return [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    `connect-src ${connect.join(" ")}`,
    `frame-src ${frame.length ? frame.join(" ") : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://www.google.com",
  ].join("; ");
}
