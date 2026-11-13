// aphrody.com home: public holding page in the manner of abc.xyz. Audience: visitors, search engines and
// AI crawlers. Public copy only: no code, repositories, packages, commands or internal metrics. Internal
// organisation stays in docs/ALPHABET.md and is never rendered here.
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  FONT_LINK,
  NATIVE_CSS,
  readBrand,
  tokensCss,
  type,
} from "../../../../packages/deploy/src/m3.ts";

export type HoldingLocale = "fr" | "en";
type L = Record<HoldingLocale, string>;

interface Product {
  id: string; // icon from `ay brand build`: assets/brand/gen/icons/<id>/
  name: string;
  url?: string;
  status: L;
  text: L;
}

/** Public products. One sentence each, written for people, not for developers. */
export const PRODUCTS: Product[] = [
  {
    id: "rosegriffon",
    name: "Rose Griffon",
    url: "https://rosegriffon.fr/",
    status: { fr: "En ligne", en: "Live" },
    text: {
      fr: "Association et communauté de joueurs en France : wiki, classement, tournois et actualités.",
      en: "Player association and community in France: wiki, ladder, tournaments and news.",
    },
  },
  {
    id: "aphrody-app",
    name: "aphrody.app",
    url: "https://aphrody.app/",
    status: { fr: "En ligne", en: "Live" },
    text: {
      fr: "Mettre un site en ligne, le prévisualiser avant publication et revenir en arrière en un clic.",
      en: "Put a site online, preview it before publishing and roll back in one click.",
    },
  },
  {
    id: "nt",
    name: "nt",
    status: { fr: "En préparation", en: "In the works" },
    text: {
      fr: "Le bureau de Windows redessiné par la carte graphique, prévu pour la 4K à 120 images par seconde.",
      en: "The Windows desktop redrawn by the graphics card, built for 4K at 120 frames per second.",
    },
  },
];

const T = {
  fr: {
    title: "Aphrody : des produits simples, rapides et accessibles",
    desc: "Aphrody conçoit des produits numériques simples, rapides et accessibles : Rose Griffon, aphrody.app et nt.",
    lead: "Aphrody conçoit des produits numériques simples, rapides et accessibles. Chaque produit avance à son rythme, avec ses propres objectifs.",
    products: "Nos produits",
    approach: "Notre approche",
    approachItems: [
      "Des produits indépendants, chacun jugé sur des résultats mesurés.",
      "La performance et l'accessibilité comme exigences de départ, pas comme options.",
      "Aucun suivi publicitaire sans votre accord explicite.",
    ],
    contact: "Contact",
    contactText: "Partenaires, presse et investisseurs :",
    visit: "Visiter",
    skip: "Aller au contenu",
    lang: "Langue",
    nav: "Navigation principale",
    see: "Voir les produits",
    write: "Nous écrire",
    shot: "Capture de la page d'accueil d'aphrody.app",
    home: "Accueil",
  },
  en: {
    title: "Aphrody: simple, fast and accessible products",
    desc: "Aphrody builds simple, fast and accessible digital products: Rose Griffon, aphrody.app and nt.",
    lead: "Aphrody builds simple, fast and accessible digital products. Each one moves at its own pace, with its own goals.",
    products: "Our products",
    approach: "Our approach",
    approachItems: [
      "Independent products, each judged on measured results.",
      "Performance and accessibility as starting requirements, not options.",
      "No advertising tracking without your explicit consent.",
    ],
    contact: "Contact",
    contactText: "Partners, press and investors:",
    visit: "Visit",
    skip: "Skip to content",
    lang: "Language",
    nav: "Main navigation",
    see: "See the products",
    write: "Write to us",
    shot: "Screenshot of the aphrody.app home page",
    home: "Home",
  },
} as const;

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

// Real capture of aphrody.app (1280x800), taken by our Chromium (chrome-devtools MCP) on 2026-11-13; served
// resized and as AVIF/WebP by the image optimizer of aphrody.app (/_aphrody/image, packages/deploy/src/runtime.ts).
export const SHOT = "/shots/aphrody-app.webp";
const WIDTHS = [640, 1080, 1280];
const img = (w: number) =>
  `/_aphrody/image?url=${encodeURIComponent(SHOT)}&amp;w=${w}&amp;q=80`;
const SRCSET = WIDTHS.map((w) => `${img(w)} ${w}w`).join(", ");
const SIZES = "(min-width: 840px) 55vw, 100vw";

// M3 window size classes: compact < 600 dp, medium 600-839, expanded >= 840; the product grid follows its
// container (container queries). Motion: View Transitions between fr and en, scroll-driven entrance of the
// cards (transform only), both off under prefers-reduced-motion.
const CSS = `*{box-sizing:border-box}html{scroll-behavior:smooth}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);${type("body-large")}}
a{color:var(--md-sys-color-primary)}
.skip{position:absolute;left:-999px}.skip:focus{left:16px;top:16px;z-index:2;background:var(--md-sys-color-surface-container-highest);padding:8px 16px;border-radius:var(--md-sys-shape-corner-small)}
.bar{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:12px;padding:8px 16px;min-height:64px;background:var(--md-sys-color-surface-container)}
.bar .brand{display:flex;align-items:center;gap:12px;color:var(--md-sys-color-on-surface);text-decoration:none;${type("title-large")}}.bar svg{width:40px;height:40px}
.bar nav{margin-left:auto;display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
@media (max-width:599px){.bar .sec{display:none}}
.wrap{max-width:1200px;margin:0 auto;padding:0 16px}@media (min-width:600px){.wrap{padding:0 24px}}
.hero{background:radial-gradient(120% 90% at 85% 0%,var(--md-sys-color-primary-container),transparent 60%),radial-gradient(80% 60% at 0% 100%,var(--md-sys-color-tertiary-container),transparent 60%),var(--md-sys-color-surface)}
.hero .wrap{display:grid;gap:32px;padding-block:clamp(32px,7vw,96px);align-items:center}
@media (min-width:840px){.hero .wrap{grid-template-columns:5fr 6fr}}
h1{${type("display-large")};margin:0 0 16px}@media (max-width:599px){h1{${type("display-small")}}}
h2{${type("headline-large")};margin:0 0 24px}
h3{${type("title-large")};margin:0}
.lead{${type("headline-small")};color:var(--md-sys-color-on-surface-variant);max-width:32ch;margin:0 0 24px}
.actions{display:flex;flex-wrap:wrap;gap:8px}
figure{margin:0}.shot img{display:block;width:100%;height:auto;aspect-ratio:1280/800;border-radius:var(--md-sys-shape-corner-extra-large);box-shadow:0 8px 24px color-mix(in srgb,var(--md-sys-color-shadow) 30%,transparent);background:var(--md-sys-color-surface-container)}
.shot figcaption{${type("body-small")};color:var(--md-sys-color-on-surface-variant);margin-top:8px}
section.block{padding-block:clamp(40px,6vw,80px)}
.products{container-type:inline-size}
.products ul{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:1fr}
@container (min-width:560px){.products ul{grid-template-columns:1fr 1fr}}
@container (min-width:960px){.products ul{grid-template-columns:repeat(3,1fr)}}
.card{display:flex;flex-direction:column;gap:12px;padding:24px;border-radius:var(--md-sys-shape-corner-large);background:var(--md-sys-color-surface-container-low);border:1px solid var(--md-sys-color-outline-variant)}
.card img{width:48px;height:48px}
.card p{margin:0;color:var(--md-sys-color-on-surface-variant)}
.card .status{${type("label-large")};color:var(--md-sys-color-secondary)}
.card .open{margin-top:auto;align-self:flex-start}
.principles{list-style:none;margin:0;padding:0;display:grid;gap:16px}@media (min-width:840px){.principles{grid-template-columns:repeat(3,1fr)}}
.principles li{padding:24px;border-radius:var(--md-sys-shape-corner-large);background:var(--md-sys-color-surface-container)}
.contact{background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);border-radius:var(--md-sys-shape-corner-extra-large);padding:clamp(24px,5vw,48px)}
.contact a{color:inherit}
footer{padding-block:32px;color:var(--md-sys-color-on-surface-variant);${type("body-medium")}}
footer .wrap{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between}
@view-transition{navigation:auto}
@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){.card,.principles li{animation:rise linear both;animation-timeline:view();animation-range:entry 0% entry 45%}}}
@keyframes rise{from{transform:translateY(24px)}to{transform:none}}`;

const pagePath = (l: HoldingLocale) => (l === "fr" ? "/" : "/en");

/** JSON-LD graph: Organization, WebSite and the product list, for search engines and AI crawlers. */
export function holdingJsonLd(l: HoldingLocale): Record<string, unknown> {
  const t = T[l];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://aphrody.com/#org",
        name: "Aphrody",
        url: "https://aphrody.com/",
        logo: "https://aphrody.com/apple-touch-icon.png",
        email: "contact@aphrody.com",
        description: t.desc,
      },
      {
        "@type": "WebSite",
        "@id": "https://aphrody.com/#site",
        url: "https://aphrody.com/",
        name: "Aphrody",
        inLanguage: l,
        publisher: { "@id": "https://aphrody.com/#org" },
      },
      {
        "@type": "ItemList",
        name: t.products,
        itemListElement: PRODUCTS.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: p.name,
            description: p.text[l],
            image: `https://aphrody.com/icons/${p.id}.png`,
            brand: { "@id": "https://aphrody.com/#org" },
            ...(p.url ? { url: p.url } : {}),
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t.home,
            item: `https://aphrody.com${pagePath(l)}`,
          },
        ],
      },
    ],
  };
}

export function renderHolding(root: string, l: HoldingLocale): string {
  const brand = readBrand(root);
  const t = T[l];
  const self = `https://aphrody.com${pagePath(l)}`;
  const other = l === "fr" ? "/en" : "/";
  const products = PRODUCTS.map(
    (p) =>
      `<li class="card"><img src="/icons/${p.id}.svg" width="48" height="48" alt=""><h3>${esc(p.name)}</h3><span class="status">${esc(p.status[l])}</span><p>${esc(fr(p.text[l], l))}</p>${p.url ? `<md-outlined-button class="open" href="${p.url}" aria-label="${t.visit} ${esc(p.name)}">${t.visit}</md-outlined-button>` : ""}</li>`,
  ).join("");
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(t.title)}</title><meta name="description" content="${esc(t.desc)}"><meta name="color-scheme" content="light dark"><link rel="canonical" href="${self}"><link rel="alternate" hreflang="fr" href="https://aphrody.com/"><link rel="alternate" hreflang="en" href="https://aphrody.com/en"><link rel="alternate" hreflang="x-default" href="https://aphrody.com/"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/site.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta property="og:type" content="website"><meta property="og:site_name" content="Aphrody"><meta property="og:title" content="${esc(t.title)}"><meta property="og:description" content="${esc(t.desc)}"><meta property="og:url" content="${self}"><meta property="og:image" content="https://aphrody.com/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Aphrody"><meta property="og:locale" content="${l === "fr" ? "fr_FR" : "en_US"}"><meta name="twitter:card" content="summary_large_image"><meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">${FONT_LINK}<link rel="stylesheet" href="/holding.css"><script type="module" src="/md.js"></script><script src="/_aphrody/insights.js" defer></script><link rel="preload" as="image" href="${img(1080)}" imagesrcset="${SRCSET}" imagesizes="${SIZES}" fetchpriority="high"><script type="application/ld+json">${JSON.stringify(holdingJsonLd(l)).replace(/</g, "\\u003c")}</script>`;
  return `<!doctype html><html lang="${l}"><head>${head}</head><body><a class="skip" href="#main">${t.skip}</a><header class="bar"><a class="brand" href="${pagePath(l)}">${brand.mark}<span>Aphrody</span></a><nav aria-label="${t.nav}"><md-text-button class="sec" href="#products">${t.products}</md-text-button><md-text-button class="sec" href="#approach">${t.approach}</md-text-button><md-text-button class="sec" href="#contact">${t.contact}</md-text-button><md-text-button href="${other}" hreflang="${l === "fr" ? "en" : "fr"}" lang="${l === "fr" ? "en" : "fr"}">${l === "fr" ? "English" : "Français"}</md-text-button></nav></header><main id="main"><section class="hero"><div class="wrap"><div><h1>Aphrody</h1><p class="lead">${esc(fr(t.lead, l))}</p><div class="actions"><md-filled-button href="#products">${t.see}</md-filled-button><md-outlined-button href="mailto:contact@aphrody.com">${t.write}</md-outlined-button></div></div><figure class="shot"><img src="${img(1080)}" srcset="${SRCSET}" sizes="${SIZES}" width="1280" height="800" alt="${t.shot}" fetchpriority="high"><figcaption>aphrody.app</figcaption></figure></div></section><section class="block products" aria-labelledby="products"><div class="wrap"><h2 id="products">${t.products}</h2><ul role="list">${products}</ul></div></section><section class="block" aria-labelledby="approach"><div class="wrap"><h2 id="approach">${t.approach}</h2><ul class="principles" role="list">${t.approachItems.map((x) => `<li>${esc(fr(x, l))}</li>`).join("")}</ul></div></section><section class="block" aria-labelledby="contact"><div class="wrap"><div class="contact"><h2 id="contact">${t.contact}</h2><p>${fr(t.contactText, l)}</p><div class="actions"><md-filled-button href="mailto:contact@aphrody.com">contact@aphrody.com</md-filled-button></div></div></div></section></main><footer><div class="wrap"><span>Aphrody, 2026</span><a href="mailto:contact@aphrody.com">contact@aphrody.com</a><a href="https://aphrody.app/">aphrody.app</a></div></footer></body></html>`;
}

// French typography: narrow no-break space before ; : ! ? (humanizer rule for public pages).
const fr = (s: string, l: HoldingLocale) =>
  l === "fr" ? s.replace(/ ([;:!?])/g, "\u202f$1") : s;

/** Product icons generated by `ay brand build` (assets/brand/gen/icons/<id>/icon.svg and icon-512.png). */
export function productIcons(
  root: string,
): { id: string; svg: string; png: string }[] {
  return PRODUCTS.map((p) => {
    const dir = join(root, "assets", "brand", "gen", "icons", p.id);
    return {
      id: p.id,
      svg: join(dir, "icon.svg"),
      png: join(dir, "icon-512.png"),
    };
  }).filter((x) => existsSync(x.svg) && existsSync(x.png));
}

/** 404 page: same shell and stylesheet, short message, links back home. */
export function holding404(root: string): string {
  const brand = readBrand(root);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page introuvable, Aphrody</title><meta name="robots" content="noindex"><meta name="color-scheme" content="light dark"><link rel="icon" href="/favicon.svg" type="image/svg+xml">${FONT_LINK}<link rel="stylesheet" href="/holding.css"></head><body><header class="bar"><a class="brand" href="/">${brand.mark}<span>Aphrody</span></a></header><main id="main"><section class="block"><div class="wrap"><h1>Page introuvable</h1><p class="lead">Cette adresse n'existe pas ou plus.</p><p><a href="/">Revenir à l'accueil</a> · <a href="/en" lang="en" hreflang="en">Back to the home page</a></p></div></section></main></body></html>`;
}

/** Stylesheet of the holding page (dist/holding.css): design tokens, then the page layout. */
export function holdingCss(root: string): string {
  return tokensCss(root) + NATIVE_CSS + CSS;
}
