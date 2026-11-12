/**
 * boot.js: small progressive-enhancement entry loaded on every page.
 *  - "/" keyboard shortcut focuses the search box
 *  - Consent Mode v2 banner (only when a Google id is configured)
 *  - GTM / gtag / Ads / AdSense loaded deferred (first interaction or idle)
 *  - WebMCP tools registered on navigator.modelContext when available
 * Every feature is feature-detected and wrapped so that no error can escape on
 * Safari, Firefox or older browsers.
 */

import { WEBMCP_TOOLS } from "./../seo/webmcp-tools";

interface Cfg {
  gtm?: string;
  ga4?: string;
  ads?: string;
  adsense?: string;
  srv?: string;
}

const w = window as any;
const doc = document;
const STORE_KEY = "aphrody_consent";

function safe(fn: () => void): void {
  try {
    fn();
  } catch {
    /* progressive enhancement: never surface errors */
  }
}

/** Google ids are baked in at build time (Bun.build define) from the PUBLIC_* env vars. */
declare const __G_CFG__: Cfg | undefined;
const cfg: Cfg = typeof __G_CFG__ !== "undefined" ? __G_CFG__ : {};
const hasIds = Boolean(cfg.gtm || cfg.ga4 || cfg.ads || cfg.adsense);
const fr = (doc.documentElement.lang || "fr").toLowerCase().startsWith("fr");

function gtag(..._args: unknown[]): void {
  (w.dataLayer = w.dataLayer || []).push(arguments);
}

/* ---------- "/" shortcut ---------- */
function initShortcut(): void {
  doc.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (
      t &&
      (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    )
      return;
    const input = doc.querySelector<HTMLInputElement>(
      ".search-input, #q, #ns-q",
    );
    if (input) {
      e.preventDefault();
      input.focus();
    }
  });
}

/* ---------- Consent ---------- */
type Decision = { v: 1; a: 0 | 1 };

function readDecision(): Decision | null {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    return d && d.v === 1 ? (d as Decision) : null;
  } catch {
    return null;
  }
}

function applyConsent(granted: boolean): void {
  const s = granted ? "granted" : "denied";
  gtag("consent", "update", {
    ad_storage: s,
    ad_user_data: s,
    ad_personalization: s,
    analytics_storage: s,
    functionality_storage: s,
    personalization_storage: s,
  });
  if (granted) loadAdsense();
}

function saveDecision(granted: boolean): void {
  safe(() =>
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ v: 1, a: granted ? 1 : 0 }),
    ),
  );
  applyConsent(granted);
}

function showBanner(): void {
  if (doc.querySelector(".consent-banner")) return;
  const el = doc.createElement("div");
  el.className = "consent-banner";
  el.setAttribute("role", "region");
  el.setAttribute(
    "aria-label",
    fr ? "Préférences de confidentialité" : "Privacy preferences",
  );
  const text = fr
    ? "Aphrody peut utiliser des cookies de mesure d'audience et de publicité (Google). Tout est refusé tant que vous ne choisissez pas."
    : "Aphrody may use audience-measurement and advertising cookies (Google). Everything stays denied until you choose.";
  el.innerHTML =
    `<p id="cb-t">${text}</p><div class="consent-actions">` +
    `<button type="button" class="m3-btn m3-btn-tonal" data-c="0">${fr ? "Tout refuser" : "Reject all"}</button>` +
    `<button type="button" class="m3-btn" data-c="1">${fr ? "Tout accepter" : "Accept all"}</button></div>`;
  el.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest(
      "button[data-c]",
    ) as HTMLElement | null;
    if (!b) return;
    saveDecision(b.dataset.c === "1");
    el.remove();
  });
  doc.body.appendChild(el);
}

function addReopen(): void {
  const footer = doc.querySelector("footer");
  if (!footer || footer.querySelector("[data-consent-reopen]")) return;
  const b = doc.createElement("button");
  b.type = "button";
  b.className = "m3-btn m3-btn-text";
  b.setAttribute("data-consent-reopen", "");
  b.textContent = fr ? "Gérer les cookies" : "Manage cookies";
  b.addEventListener("click", showBanner);
  footer.appendChild(b);
}

/* ---------- Google loaders ---------- */
function addScript(src: string, extra?: (s: HTMLScriptElement) => void): void {
  const s = doc.createElement("script");
  s.async = true;
  s.src = src;
  extra?.(s);
  doc.head.appendChild(s);
}

let adsenseLoaded = false;
function loadAdsense(): void {
  if (!cfg.adsense || adsenseLoaded) return;
  adsenseLoaded = true;
  addScript(
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsense)}`,
    (s) => {
      s.crossOrigin = "anonymous";
      s.onload = () => {
        safe(() => {
          doc.querySelectorAll("ins.adsbygoogle").forEach(() => {
            (w.adsbygoogle = w.adsbygoogle || []).push({});
          });
        });
      };
    },
  );
}

function loadGoogleTags(): void {
  const base = cfg.srv || "https://www.googletagmanager.com";
  if (cfg.gtm) {
    (w.dataLayer = w.dataLayer || []).push({
      "gtm.start": Date.now(),
      event: "gtm.js",
    });
    addScript(`${base}/gtm.js?id=${encodeURIComponent(cfg.gtm)}`);
  } else if (cfg.ga4 || cfg.ads) {
    const first = (cfg.ga4 || cfg.ads) as string;
    addScript(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(first)}`,
    );
    gtag("js", new Date());
    // First-party relay: hits go to <origin>/g/collect, forwarded by the server.
    if (cfg.ga4)
      gtag("config", cfg.ga4, {
        server_container_url: cfg.srv || location.origin,
      });
    if (cfg.ads) gtag("config", cfg.ads);
  }
  const d = readDecision();
  if (d && d.a === 1) loadAdsense();
}

function whenIdleOrInteracted(fn: () => void): void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach((t) =>
      removeEventListener(t, run),
    );
    safe(fn);
  };
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach((t) =>
    addEventListener(t, run, { once: true, passive: true }),
  );
  if (typeof w.requestIdleCallback === "function")
    w.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 4000);
}

/* ---------- WebMCP ---------- */
function initWebMcp(): void {
  const mc = (navigator as any).modelContext;
  if (!mc) return;
  const tools = WEBMCP_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: t.annotations,
    async execute(args: Record<string, unknown>) {
      const q = t.http.param
        ? `?${t.http.param}=${encodeURIComponent(String(args?.[t.http.param] ?? ""))}`
        : "";
      const res = await fetch(t.http.path + q, {
        headers: { Accept: "application/json" },
      });
      return { content: [{ type: "text", text: await res.text() }] };
    },
  }));
  if (typeof mc.registerTool === "function") {
    for (const t of tools) safe(() => mc.registerTool(t));
  } else if (typeof mc.provideContext === "function") {
    mc.provideContext({ tools });
  }
}

/* ---------- init ---------- */
safe(initShortcut);
safe(initWebMcp);
safe(() => {
  if (
    !doc.documentElement.hasAttribute("data-theme") &&
    matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    doc.documentElement.setAttribute("data-theme", "dark");
  }
});
if (hasIds) {
  safe(() => {
    const d = readDecision();
    if (d) applyConsent(d.a === 1);
    else showBanner();
    addReopen();
    whenIdleOrInteracted(loadGoogleTags);
  });
}
