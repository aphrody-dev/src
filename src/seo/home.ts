/**
 * aphrody.com brand homepage (fr at "/", en at "/en").
 * Static HTML + inline CSS, readable without JavaScript. Spec: PRD.md, DESIGN.md.
 * Only Aphrody's own products appear here; every status was checked against production.
 */

import {
  HOME,
  HREFLANG,
  LOCALES,
  SITE_URL,
  localizedPath,
  type Locale,
} from "./site";
import { buildPageGraph, graphToScript } from "./schema-graph";
import { consentScriptTag } from "../google/config";
import { HOME_CSS } from "./home-css";

type Status = "live" | "dev";

interface Tile {
  id: string;
  name: string;
  text: string;
  status: Status;
  /** Same-site path or absolute URL. Omitted while the product is not public. */
  href?: string;
  /** Facts backed by code in the product's repository (apps/aphrody-app). */
  facts?: string[];
}

/** Page copy beyond the title/description/h1/intro, which live in HOME (site.ts) for llms.txt and agent.json too. */
interface HomeCopy {
  nav: { products: string; search: string; contact: string; label: string };
  otherLocale: { name: string; label: string };
  skip: string;
  productsTitle: string;
  status: Record<Status, string>;
  tiles: Tile[];
  workTitle: string;
  work: Array<{ title: string; text: string }>;
  contactTitle: string;
  contactText: string;
  footer: string;
}

const EMAIL = "contact@aphrody.com";

export const HOME_COPY: Record<Locale, HomeCopy> = {
  fr: {
    nav: {
      products: "Produits",
      search: "Recherche",
      contact: "Contact",
      label: "Navigation principale",
    },
    otherLocale: { name: "English", label: "Read this page in English" },
    skip: "Aller au contenu",
    productsTitle: "Produits",
    status: {
      live: "En ligne",
      dev: "En développement, pas encore ouvert au public",
    },
    tiles: [
      {
        id: "app",
        name: "aphrody.app",
        text: "Un bureau dans le navigateur où les fenêtres se rangent seules en tuiles. Le rendu passe par WebGPU, et vos fichiers restent stockés sur votre appareil.",
        facts: [
          "Trois dispositions de fenêtres : spirale, grille et défilement horizontal.",
          "Fichiers enregistrés dans le stockage du navigateur, sans doublon grâce à une empreinte Blake3.",
          "Fenêtres et espace de travail pilotables par des outils WebMCP.",
        ],
        status: "dev",
      },
      {
        id: "search",
        name: "Recherche",
        text: "Des suggestions pendant la saisie et des résultats rendus par le serveur, qui s'affichent même sans JavaScript.",
        status: "live",
        href: "/search",
      },
      {
        id: "packages",
        name: "Catalogue de paquets",
        text: "Les commandes d'installation d'un même outil pour Bun, winget, AUR, Nix, Flatpak et d'autres gestionnaires, sur une seule page.",
        status: "live",
        href: "/search/packages",
      },
      {
        id: "bench",
        name: "Benchmarks",
        text: "Des micro-benchmarks lancés sur le serveur à chaque appel : copie mémoire, SQLite et calcul, avec les mesures en JSON.",
        status: "live",
        href: "/search/benchmarks",
      },
    ],
    workTitle: "Ce que fait Aphrody",
    work: [
      {
        title: "Des sites",
        text: "Nous développons et maintenons des sites pour des communautés et des associations : pages rendues par le serveur, lisibles sans JavaScript, hébergées sur nos serveurs en France.",
      },
      {
        title: "Des logiciels",
        text: "Nos applications sont écrites en Rust et en TypeScript, et compilées en WebAssembly quand le travail doit se faire dans le navigateur.",
      },
      {
        title: "Des systèmes",
        text: "Nous maintenons nos propres environnements Linux, basés sur Arch et CachyOS, ainsi que les outils qui compilent, testent et déploient tout ce qui précède.",
      },
    ],
    contactTitle: "Contact",
    contactText:
      "Un projet de site, une question sur un produit ou un problème à signaler : écrivez-nous.",
    footer: "Aphrody est indépendant.",
  },
  en: {
    nav: {
      products: "Products",
      search: "Search",
      contact: "Contact",
      label: "Main navigation",
    },
    otherLocale: { name: "Français", label: "Lire cette page en français" },
    skip: "Skip to content",
    productsTitle: "Products",
    status: {
      live: "Online",
      dev: "In development, not yet open to the public",
    },
    tiles: [
      {
        id: "app",
        name: "aphrody.app",
        text: "A desktop in the browser where windows arrange themselves into tiles. Rendering goes through WebGPU, and your files stay stored on your device.",
        facts: [
          "Three window layouts: spiral, grid and horizontal scrolling.",
          "Files saved in the browser's storage, deduplicated with a Blake3 fingerprint.",
          "Windows and workspace controllable through WebMCP tools.",
        ],
        status: "dev",
      },
      {
        id: "search",
        name: "Search",
        text: "Suggestions as you type and results rendered by the server, which display even without JavaScript.",
        status: "live",
        href: "/search?hl=en",
      },
      {
        id: "packages",
        name: "Package catalog",
        text: "The install commands for one tool across Bun, winget, AUR, Nix, Flatpak and other package managers, on a single page.",
        status: "live",
        href: "/en/search/packages",
      },
      {
        id: "bench",
        name: "Benchmarks",
        text: "Micro-benchmarks run on the server on every call: memory copy, SQLite and compute, with the measurements in JSON.",
        status: "live",
        href: "/en/search/benchmarks",
      },
    ],
    workTitle: "What Aphrody does",
    work: [
      {
        title: "Websites",
        text: "We build and maintain websites for communities and associations: server-rendered pages, readable without JavaScript, hosted on our servers in France.",
      },
      {
        title: "Software",
        text: "Our applications are written in Rust and TypeScript, and compiled to WebAssembly when the work has to happen in the browser.",
      },
      {
        title: "Systems",
        text: "We maintain our own Linux environments, based on Arch and CachyOS, and the tools that build, test and deploy everything above.",
      },
    ],
    contactTitle: "Contact",
    contactText:
      "A website project, a question about a product, or a problem to report: write to us.",
    footer: "Aphrody is independent.",
  },
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tileHtml(t: Tile, c: Pick<HomeCopy, "status">): string {
  const body =
    `<h3 class="tile-name" id="tile-${t.id}">${esc(t.name)}</h3>` +
    `<p class="tile-text">${esc(t.text)}</p>` +
    (t.facts
      ? `<ul class="tile-facts">${t.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
      : "") +
    `<p class="tile-status" data-status="${t.status}">${esc(c.status[t.status])}</p>`;
  return t.href
    ? `<li class="tile tile-${t.id}"><a class="tile-link" href="${esc(t.href)}" aria-labelledby="tile-${t.id}">${body}</a></li>`
    : `<li class="tile tile-${t.id}"><div class="tile-link">${body}</div></li>`;
}

export function renderBrandHome(locale: Locale): string {
  const c = { ...HOME[locale], ...HOME_COPY[locale] };
  const other: Locale = locale === "fr" ? "en" : "fr";
  const url = SITE_URL + localizedPath("/", locale);
  const home = localizedPath("/", locale);

  const graph = buildPageGraph({
    locale,
    canonicalUrl: url,
    title: c.title,
    description: c.description,
    breadcrumbs: [{ name: "Aphrody", url }],
    items: c.tiles
      .filter((t) => t.href)
      .map((t) => ({
        name: t.name,
        url: SITE_URL + t.href!.replace(/\?.*$/, ""),
      })),
    itemListName: c.productsTitle,
    webApp: false,
  });

  const head = [
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">',
    '<meta name="color-scheme" content="light dark">',
    '<meta name="referrer" content="strict-origin-when-cross-origin">',
    `<title>${esc(c.title)}</title>`,
    `<meta name="description" content="${esc(c.description)}">`,
    '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">',
    `<link rel="canonical" href="${url}">`,
    ...LOCALES.map(
      (l) =>
        `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${SITE_URL}${localizedPath("/", l)}">`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/">`,
    `<meta property="og:title" content="${esc(c.title)}">`,
    `<meta property="og:description" content="${esc(c.description)}">`,
    `<meta property="og:url" content="${url}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Aphrody">',
    `<meta property="og:locale" content="${HREFLANG[locale].replace("-", "_")}">`,
    `<meta property="og:image" content="${SITE_URL}/og-image.jpg">`,
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="preload" href="/atkinson-next.woff2" as="font" type="font/woff2" crossorigin>',
    `<style>${HOME_CSS}</style>`,
    consentScriptTag(),
    graphToScript(graph),
  ].join("");

  const header =
    `<header class="site-header"><div class="wrap bar">` +
    `<a class="brand" href="${home}">Aphrody</a>` +
    `<nav aria-label="${esc(c.nav.label)}"><ul class="nav">` +
    `<li><a href="#produits">${esc(c.nav.products)}</a></li>` +
    `<li><a href="${locale === "fr" ? "/search" : "/search?hl=en"}">${esc(c.nav.search)}</a></li>` +
    `<li><a href="#contact">${esc(c.nav.contact)}</a></li>` +
    `<li><a lang="${other}" hreflang="${HREFLANG[other]}" href="${localizedPath("/", other)}" aria-label="${esc(c.otherLocale.label)}">${esc(c.otherLocale.name)}</a></li>` +
    `</ul></nav></div></header>`;

  const main =
    `<main id="main" class="wrap">` +
    `<section class="hero" aria-labelledby="h1"><h1 id="h1">${esc(c.h1)}</h1><p class="intro">${esc(c.intro)}</p></section>` +
    `<section id="produits" class="products" aria-labelledby="produits-title"><h2 id="produits-title" class="visually-hidden">${esc(c.productsTitle)}</h2>` +
    `<ul class="mosaic">${c.tiles.map((t) => tileHtml(t, c)).join("")}</ul></section>` +
    `<section class="work" aria-labelledby="work-title"><h2 id="work-title">${esc(c.workTitle)}</h2><div class="work-list">` +
    c.work
      .map(
        (w) =>
          `<div class="work-item"><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></div>`,
      )
      .join("") +
    `</div></section>` +
    `<section id="contact" class="contact" aria-labelledby="contact-title"><h2 id="contact-title">${esc(c.contactTitle)}</h2>` +
    `<p>${esc(c.contactText)}</p><p class="email"><a href="mailto:${EMAIL}">${EMAIL}</a></p></section>` +
    `</main>`;

  const footer =
    `<footer class="site-footer"><div class="wrap bar"><p>${esc(c.footer)}</p>` +
    `<p><a lang="${other}" hreflang="${HREFLANG[other]}" href="${localizedPath("/", other)}">${esc(c.otherLocale.name)}</a></p></div></footer>`;

  return (
    `<!doctype html><html lang="${locale}"><head>${head}</head><body>` +
    `<a class="skip-link" href="#main">${esc(c.skip)}</a>${header}${main}${footer}` +
    `<script type="module" src="/boot.js"></script></body></html>`
  );
}
