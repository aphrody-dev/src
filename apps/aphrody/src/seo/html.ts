/**
 * Static page renderers (SSG) for the home page, topic hubs, package hubs,
 * news, 404 and the no-JavaScript search results page.
 * Output is compact HTML5 with: canonical, hreflang fr-FR/en-US/x-default,
 * Open Graph, Consent Mode v2 default-denied snippet, speculationrules,
 * and a Schema.org @graph JSON-LD block.
 */

import {
  APP_URL,
  ECOSYSTEM_LABELS,
  HREFLANG,
  LOCALES,
  PACKAGE_ECOSYSTEMS,
  SITE_URL,
  VERTICALS,
  localizedPath,
  newsPath,
  packageHubPath,
  verticalPath,
  type Locale,
  type NewsArticle,
  type PackageEcosystem,
  type Vertical,
} from "./site";
import { buildPageGraph, graphToScript } from "./schema-graph";
import { consentScriptTag, type GoogleConfig } from "../google/config";
import { PAGE_CSS } from "./page-css";
import { renderBrandHome } from "./home";

export const UI = {
  fr: {
    skip: "Aller au contenu",
    search: "Recherche",
    searchBtn: "Rechercher",
    home: "Accueil",
    topics: "Rubriques",
    faq: "Questions fréquentes",
    other: "English",
    otherLabel: "Read this page in English",
    disclaimer: "Aphrody est indépendant et n'est pas affilié à Google.",
    ad: "Publicité",
    packages: "Paquets",
    install: "Installation",
    notFound: "Page introuvable",
    notFoundText: "Cette page n'existe pas.",
    results: "Résultats pour",
    noResults: "Aucune suggestion locale.",
    onGoogle: "Rechercher sur Google",
    suggestions: "Suggestions",
    catalog: "Catalogue de paquets",
    published: "Publié le",
  },
  en: {
    skip: "Skip to content",
    search: "Search",
    searchBtn: "Search",
    home: "Home",
    topics: "Topics",
    faq: "Frequently asked questions",
    other: "Français",
    otherLabel: "Lire cette page en français",
    disclaimer: "Aphrody is independent and is not affiliated with Google.",
    ad: "Advertisement",
    packages: "Packages",
    install: "Install",
    notFound: "Page not found",
    notFoundText: "This page does not exist.",
    results: "Results for",
    noResults: "No local suggestions.",
    onGoogle: "Search on Google",
    suggestions: "Suggestions",
    catalog: "Package catalog",
    published: "Published on",
  },
} as const;

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SPECULATION_RULES = JSON.stringify({
  prefetch: [
    {
      where: { href_matches: ["/search/*", "/en/search/*"] },
      eagerness: "moderate",
    },
  ],
});

export interface PageSpec {
  locale: Locale;
  /** French path (e.g. "/search/web"); null for non-indexable pages. */
  frPath: string | null;
  title: string;
  description: string;
  main: string;
  cfg: GoogleConfig;
  graph?: Record<string, unknown>;
  withApp?: boolean;
  noindex?: boolean;
  ogType?: string;
  footer?: string;
  mainClass?: string;
  header?: boolean;
}

function searchForm(locale: Locale, id: string, value = ""): string {
  const u = UI[locale];
  return (
    `<form class="ns-search" action="/search" method="get" role="search">` +
    `<input type="hidden" name="hl" value="${locale}">` +
    `<label for="${id}">${u.search}</label>` +
    `<input id="${id}" name="q" type="search" value="${esc(value)}" autocomplete="off" enterkeyhint="search">` +
    `<button type="submit" class="m3-btn">${u.searchBtn}</button></form>`
  );
}

export function adSlot(
  cfg: GoogleConfig,
  locale: Locale,
  name: string,
): string {
  if (!cfg.adsense) return "";
  const slot = cfg.slot ? ` data-ad-slot="${cfg.slot}"` : "";
  return (
    `<aside class="ad-slot" aria-label="${UI[locale].ad}" data-slot="${name}">` +
    `<ins class="adsbygoogle" style="display:block" data-ad-client="${cfg.adsense}"${slot} data-ad-format="auto" data-full-width-responsive="true"></ins></aside>`
  );
}

export function renderDocument(p: PageSpec): string {
  const u = UI[p.locale];
  const indexable = p.frPath !== null && !p.noindex;
  const canonical =
    p.frPath !== null ? SITE_URL + localizedPath(p.frPath, p.locale) : "";
  const head: string[] = [
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">',
    '<meta name="color-scheme" content="light dark">',
    '<meta name="referrer" content="strict-origin-when-cross-origin">',
    consentScriptTag(),
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}">`,
    indexable
      ? '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">'
      : '<meta name="robots" content="noindex, follow">',
  ];
  if (p.frPath !== null) {
    head.push(`<link rel="canonical" href="${canonical}">`);
    if (indexable) {
      for (const l of LOCALES) {
        head.push(
          `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${SITE_URL}${localizedPath(p.frPath, l)}">`,
        );
      }
      head.push(
        `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizedPath(p.frPath, "fr")}">`,
      );
    }
    head.push(
      `<meta property="og:title" content="${esc(p.title)}">`,
      `<meta property="og:description" content="${esc(p.description)}">`,
      `<meta property="og:url" content="${canonical}">`,
      `<meta property="og:type" content="${p.ogType || "website"}">`,
      '<meta property="og:site_name" content="Aphrody">',
      `<meta property="og:image" content="${SITE_URL}/og-image.png">`,
    );
  }
  head.push(
    '<link rel="icon" href="/favicon.ico" sizes="32x32">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    '<link rel="stylesheet" href="/style.css">',
    `<script type="speculationrules">${SPECULATION_RULES}</script>`,
  );
  if (!p.withApp) head.push(`<style>${PAGE_CSS}</style>`);
  if (p.graph) head.push(graphToScript(p.graph));

  const header =
    p.header === false
      ? '<header role="banner" class="google-header"></header>'
      : `<header role="banner" class="page-header"><a href="${localizedPath("/", p.locale)}" class="page-brand">Aphrody</a>` +
        (p.frPath !== null
          ? `<a class="page-lang" lang="${p.locale === "fr" ? "en" : "fr"}" hreflang="${HREFLANG[p.locale === "fr" ? "en" : "fr"]}" href="${localizedPath(p.frPath, p.locale === "fr" ? "en" : "fr")}" aria-label="${u.otherLabel}">${u.other}</a>`
          : "") +
        "</header>";

  const scripts =
    (p.withApp ? '<script type="module" src="/app.js"></script>' : "") +
    '<script type="module" src="/boot.js"></script>';
  return (
    `<!doctype html><html lang="${p.locale}"><head>${head.join("")}</head><body>` +
    `<a class="skip-link" href="#main">${u.skip}</a>${header}` +
    `<main id="main" role="main" class="${p.mainClass || "page"}">${p.main}</main>` +
    `<footer role="contentinfo" class="${p.withApp ? "google-footer" : "page-footer"}">${p.footer || `<p class="note">${u.disclaimer}</p>`}</footer>` +
    `${scripts}</body></html>`
  );
}

function topicsNav(locale: Locale, current?: string): string {
  const items = VERTICALS.filter((v) => v.slug !== current)
    .map(
      (v) =>
        `<li><a href="${localizedPath(verticalPath(v.slug), locale)}">${esc(v[locale].h1)}</a></li>`,
    )
    .join("");
  return `<nav class="seo-hub" aria-label="${UI[locale].topics}"><ul>${items}</ul></nav>`;
}

function faqHtml(
  locale: Locale,
  faqs: Array<{ question: string; answer: string }>,
): string {
  return (
    `<section class="seo-faq" aria-label="${UI[locale].faq}">` +
    faqs
      .map(
        (f) =>
          `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`,
      )
      .join("") +
    "</section>"
  );
}

/** Brand homepage: static, no client app. See src/seo/home.ts, PRD.md, DESIGN.md. */
export function renderHome(locale: Locale, _cfg: GoogleConfig): string {
  return renderBrandHome(locale);
}

function breadcrumbs(
  locale: Locale,
  trail: Array<{ name: string; path: string }>,
): { html: string; items: Array<{ name: string; url: string }> } {
  const items: Array<{ name: string; url: string }> = [
    { name: UI[locale].home, url: SITE_URL + localizedPath("/", locale) },
  ];
  for (const t of trail)
    items.push({ name: t.name, url: SITE_URL + localizedPath(t.path, locale) });
  const html =
    `<nav class="crumbs" aria-label="Breadcrumb"><ol>` +
    items
      .map((it, i) =>
        i < items.length - 1
          ? `<li><a href="${it.url.replace(SITE_URL, "")}">${esc(it.name)}</a></li>`
          : `<li aria-current="page">${esc(it.name)}</li>`,
      )
      .join("") +
    "</ol></nav>";
  return { html, items };
}

export function renderVertical(
  v: Vertical,
  locale: Locale,
  cfg: GoogleConfig,
): string {
  const h = v[locale];
  const u = UI[locale];
  const path = verticalPath(v.slug);
  const url = SITE_URL + localizedPath(path, locale);
  const crumbs = breadcrumbs(locale, [{ name: h.h1, path }]);
  const faqs = [{ question: h.h1 + " ?", answer: h.intro }];
  const links = v.links
    .map(
      (l) =>
        `<li><a class="m3-btn m3-btn-tonal" href="${l.href.startsWith("/search/") ? localizedPath(l.href, locale) : l.href}">${esc(l.label[locale])}</a></li>`,
    )
    .join("");
  const hubLinks =
    v.slug === "packages"
      ? `<ul class="link-list">${PACKAGE_ECOSYSTEMS.map((e) => `<li><a href="${localizedPath(packageHubPath(e), locale)}">${ECOSYSTEM_LABELS[e]}</a></li>`).join("")}</ul>`
      : "";
  const graph = buildPageGraph({
    locale,
    canonicalUrl: url,
    title: h.title,
    description: h.description,
    breadcrumbs: crumbs.items,
    faqs,
    items: h.points.map((p) => ({ name: p })),
    itemListName: h.h1,
    dataset: v.slug === "benchmarks",
  });
  const main =
    `${crumbs.html}<article><h1>${esc(h.h1)}</h1><p class="lead">${esc(h.intro)}</p>` +
    `<ul class="points">${h.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>${hubLinks}` +
    `<ul class="actions">${links}</ul>${adSlot(cfg, locale, `vertical-${v.slug}`)}` +
    `${faqHtml(locale, faqs)}</article>${searchForm(locale, "q")}${topicsNav(locale, v.slug)}`;
  return renderDocument({
    locale,
    frPath: path,
    title: h.title,
    description: h.description,
    main,
    cfg,
    graph,
  });
}

export interface HubPackage {
  name: string;
  description: string;
  installCmd: string;
}

export function renderPackageHub(
  eco: PackageEcosystem,
  pkgs: HubPackage[],
  locale: Locale,
  cfg: GoogleConfig,
): string {
  const u = UI[locale];
  const label = ECOSYSTEM_LABELS[eco];
  const path = packageHubPath(eco);
  const url = SITE_URL + localizedPath(path, locale);
  const title = `${u.packages} ${label} - Aphrody`.slice(0, 60);
  const description =
    locale === "fr"
      ? `Entrées du catalogue Aphrody pour ${label}, avec la commande d'installation de chacune. Métadonnées de catalogue, à vérifier en amont.`
      : `Aphrody catalog entries for ${label}, with the install command for each. Catalog metadata, check upstream before installing.`;
  const crumbs = breadcrumbs(locale, [
    { name: u.packages, path: verticalPath("packages") },
    { name: label, path },
  ]);
  const graph = buildPageGraph({
    locale,
    canonicalUrl: url,
    title,
    description,
    breadcrumbs: crumbs.items,
    items: pkgs.map((p) => ({ name: p.name })),
    itemListName: `${u.packages} ${label}`,
  });
  const list = pkgs
    .map(
      (p) =>
        `<li class="card"><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><code>${esc(p.installCmd)}</code></li>`,
    )
    .join("");
  const main =
    `${crumbs.html}<article><h1>${u.packages} ${esc(label)}</h1><p class="lead">${esc(description)}</p>` +
    `<ul class="cards">${list}</ul>${adSlot(cfg, locale, `hub-${eco}`)}</article>${topicsNav(locale)}`;
  return renderDocument({
    locale,
    frPath: path,
    title,
    description,
    main,
    cfg,
    graph,
  });
}

export function renderNews(
  a: NewsArticle,
  locale: Locale,
  cfg: GoogleConfig,
): string {
  const u = UI[locale];
  const c = a[locale];
  const path = newsPath(a.slug);
  const url = SITE_URL + localizedPath(path, locale);
  const description = c.body.slice(0, 160);
  const crumbs = breadcrumbs(locale, [{ name: c.title, path }]);
  const graph = buildPageGraph({
    locale,
    canonicalUrl: url,
    title: c.title,
    description,
    breadcrumbs: crumbs.items,
  });
  (graph["@graph"] as Array<Record<string, unknown>>).push({
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    headline: c.title,
    datePublished: a.date,
    inLanguage: HREFLANG[locale],
    image: [`${SITE_URL}/og-image.png`],
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: url,
  });
  const main =
    `${crumbs.html}<article><h1>${esc(c.title)}</h1><p class="note">${u.published} <time datetime="${a.date}">${a.date}</time></p>` +
    `<p class="lead">${esc(c.body)}</p>${adSlot(cfg, locale, "news")}</article>${topicsNav(locale)}`;
  return renderDocument({
    locale,
    frPath: path,
    title: c.title.slice(0, 60),
    description,
    main,
    cfg,
    graph,
    ogType: "article",
  });
}

export function render404(locale: Locale, cfg: GoogleConfig): string {
  const u = UI[locale];
  const main = `<article><h1>${u.notFound}</h1><p class="lead">${u.notFoundText}</p><p><a class="m3-btn" href="${localizedPath("/", locale)}">${u.home}</a></p></article>`;
  return renderDocument({
    locale,
    frPath: null,
    title: `${u.notFound} - Aphrody`,
    description: u.notFoundText + " Aphrody.",
    main,
    cfg,
    noindex: true,
  });
}

export function renderSearchResults(
  q: string,
  locale: Locale,
  suggestions: string[],
  pkgs: HubPackage[],
  cfg: GoogleConfig,
): string {
  const u = UI[locale];
  const clusterApi = `/api/search?q=${encodeURIComponent(q)}`;
  const sug = suggestions.length
    ? `<h2>${u.suggestions}</h2><ul class="link-list">${suggestions.map((s) => `<li><a href="/search?q=${encodeURIComponent(s)}&amp;hl=${locale}">${esc(s)}</a></li>`).join("")}</ul>`
    : `<p>${u.noResults}</p>`;
  const pk = pkgs.length
    ? `<h2>${u.catalog}</h2><ul class="cards">${pkgs.map((p) => `<li class="card"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><code>${esc(p.installCmd)}</code></li>`).join("")}</ul>`
    : "";
  const main =
    `${searchForm(locale, "q", q)}<article><h1>${u.results} ${esc(q)}</h1>` +
    `<p><a class="m3-btn" href="${clusterApi}">JSON RRF 3-VPS</a></p>${sug}${pk}</article>`;
  return renderDocument({
    locale,
    frPath: null,
    title: `${q.slice(0, 40)} - Aphrody`,
    description: `${u.results} ${q}`.slice(0, 160) + " - Aphrody",
    main,
    cfg,
    noindex: true,
  });
}

export { APP_URL };
