// aphrody.com home: public holding page in the manner of abc.xyz. Audience: visitors, search engines and
// AI crawlers. Public copy only: no code, repositories, packages, commands or internal metrics. Internal
// organisation stays in docs/ALPHABET.md and is never rendered here.
import {
  FONT_LINK,
  NATIVE_CSS,
  m3List,
  readBrand,
  tokensCss,
  type,
} from "../../../../packages/deploy/src/m3.ts";

export type HoldingLocale = "fr" | "en";
type L = Record<HoldingLocale, string>;

interface Product {
  name: string;
  url?: string;
  status: L;
  text: L;
}

/** Public products. One sentence each, written for people, not for developers. */
export const PRODUCTS: Product[] = [
  {
    name: "Rose Griffon",
    url: "https://rosegriffon.fr/",
    status: { fr: "En ligne", en: "Live" },
    text: {
      fr: "Association et communauté de joueurs en France : wiki, classement, tournois et actualités.",
      en: "Player association and community in France: wiki, ladder, tournaments and news.",
    },
  },
  {
    name: "aphrody.app",
    url: "https://aphrody.app/",
    status: { fr: "En ligne", en: "Live" },
    text: {
      fr: "Mettre un site en ligne, le prévisualiser avant publication et revenir en arrière en un clic.",
      en: "Put a site online, preview it before publishing and roll back in one click.",
    },
  },
  {
    name: "nt",
    status: { fr: "En préparation", en: "In the works" },
    text: {
      fr: "Un bureau Windows repensé, fluide jusqu'en 4K à 120 images par seconde.",
      en: "A rethought Windows desktop, smooth up to 4K at 120 frames per second.",
    },
  },
];

const T = {
  fr: {
    title: "Aphrody : des produits simples, rapides et accessibles",
    desc: "Aphrody conçoit des produits numériques simples, rapides et accessibles : Rose Griffon, aphrody.app et nt. Hébergés en Europe.",
    lead: "Aphrody conçoit des produits numériques simples, rapides et accessibles. Chaque produit a sa propre équipe et ses propres objectifs, avec une exigence commune : la qualité.",
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
  },
  en: {
    title: "Aphrody: simple, fast and accessible products",
    desc: "Aphrody builds simple, fast and accessible digital products: Rose Griffon, aphrody.app and nt. Hosted in Europe.",
    lead: "Aphrody builds simple, fast and accessible digital products. Each product has its own team and its own goals, with one shared standard: quality.",
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

const CSS = `*{box-sizing:border-box}body{margin:0;background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);${type("body-large")}}
a{color:var(--md-sys-color-primary)}
.skip{position:absolute;left:-999px}.skip:focus{left:16px;top:16px;background:var(--md-sys-color-surface-container-highest);padding:8px 16px;border-radius:var(--md-sys-shape-corner-small)}
header{max-width:1040px;margin:0 auto;padding:24px;display:flex;align-items:center;gap:12px}header svg{width:40px;height:40px}header span{${type("title-large")}}
header nav{margin-left:auto}
main{max-width:1040px;margin:0 auto;padding:0 24px 64px}
h1{${type("display-large")};margin:48px 0 16px}
h2{${type("headline-medium")};margin:56px 0 16px}
.lead{${type("headline-small")};max-width:42ch;color:var(--md-sys-color-on-surface-variant)}
p,li{max-width:68ch}
.status{display:block;margin-top:4px;${type("label-medium")};color:var(--md-sys-color-on-surface-variant)}
.actions{display:flex;flex-wrap:wrap;gap:8px}
footer{max-width:1040px;margin:0 auto;padding:24px;color:var(--md-sys-color-on-surface-variant);${type("body-medium")}}
@media (min-width:840px){h1{font-size:4.5rem;line-height:1.05}}`;

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
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://aphrody.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        name: t.products,
        itemListElement: PRODUCTS.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Brand",
            name: p.name,
            description: p.text[l],
            ...(p.url ? { url: p.url } : {}),
          },
        })),
      },
    ],
  };
}

export function renderHolding(root: string, l: HoldingLocale): string {
  const brand = readBrand(root);
  const t = T[l];
  const self = `https://aphrody.com${pagePath(l)}`;
  const products = m3List(
    PRODUCTS.map((p) => ({
      headline: esc(p.name),
      supporting: `${esc(p.text[l])}<span class="status">${esc(p.status[l])}</span>`,
      href: p.url,
    })),
  );
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(t.title)}</title><meta name="description" content="${esc(t.desc)}"><meta name="color-scheme" content="light dark"><link rel="canonical" href="${self}"><link rel="alternate" hreflang="fr" href="https://aphrody.com/"><link rel="alternate" hreflang="en" href="https://aphrody.com/en"><link rel="alternate" hreflang="x-default" href="https://aphrody.com/"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/site.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta property="og:type" content="website"><meta property="og:site_name" content="Aphrody"><meta property="og:title" content="${esc(t.title)}"><meta property="og:description" content="${esc(t.desc)}"><meta property="og:url" content="${self}"><meta property="og:image" content="https://aphrody.com/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Aphrody"><meta property="og:locale" content="${l === "fr" ? "fr_FR" : "en_US"}"><meta name="twitter:card" content="summary_large_image"><meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">${FONT_LINK}<link rel="stylesheet" href="/holding.css"><script type="module" src="/md.js"></script><script src="/_aphrody/insights.js" defer></script><script type="application/ld+json">${JSON.stringify(holdingJsonLd(l))}</script>`;
  return `<!doctype html><html lang="${l}"><head>${head}</head><body><a class="skip" href="#main">${t.skip}</a><header>${brand.mark}<span>Aphrody</span><nav aria-label="${t.lang}"><md-text-button href="${l === "fr" ? "/en" : "/"}" hreflang="${l === "fr" ? "en" : "fr"}">${l === "fr" ? "English" : "Français"}</md-text-button></nav></header><main id="main"><h1>Aphrody</h1><p class="lead">${esc(t.lead)}</p><section aria-labelledby="products"><h2 id="products">${t.products}</h2>${products}</section><section aria-labelledby="approach"><h2 id="approach">${t.approach}</h2><ul>${t.approachItems.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section><section aria-labelledby="contact"><h2 id="contact">${t.contact}</h2><p>${t.contactText}</p><div class="actions"><md-filled-button href="mailto:contact@aphrody.com">contact@aphrody.com</md-filled-button></div></section></main><footer>Aphrody</footer></body></html>`;
}

/** Stylesheet of the holding page (dist/holding.css): design tokens, then the page layout. */
export function holdingCss(root: string): string {
  return tokensCss(root) + NATIVE_CSS + CSS;
}
