// Server-rendered HTML of aphrody.app (landing, labs, dashboard). Design system: packages/design (tokens.css in the
// registry, Material Web components loaded from /_/md.js, Google Sans Flex). Only M3 tokens are referenced in CSS.
// Pages read without JavaScript: Material Web elements upgrade links, lists and chips that already carry their text.
import { catalogs } from "../../i18n/src/index.ts";
import { FONT_LINK, NATIVE_CSS, m3List, paintMark, type } from "./m3.ts";
import { UI_CSS, themeButton } from "./ui.ts";
import { METRICS, rating, type Summary } from "./runtime.ts";
import {
  previewUrl,
  type Deployment,
  type LabCard,
  type Project,
  type ProjectState,
  type Registry,
} from "./state.ts";

export const esc = (s: unknown): string =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export const LOCALES = ["fr", "en", "zh-CN", "ja", "es"] as const;
export type Locale = (typeof LOCALES)[number];
const NATIVE_NAME: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  "zh-CN": "中文",
  ja: "日本語",
  es: "Español",
};
const OG_LOCALE: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_US",
  "zh-CN": "zh_CN",
  ja: "ja_JP",
  es: "es_ES",
};
/** Public path of the landing page in a locale (French is the root, as on aphrody.com). */
export const localePath = (l: Locale) => (l === "fr" ? "/" : `/${l}`);
/** Text of a packages/i18n key in a locale (French gets narrow no-break spaces before ; : ! ?). */
export const tr = (l: Locale, key: string): string => {
  const v = (catalogs[l] as Record<string, string>)[key];
  if (v === undefined) throw new Error(`i18n key ${key} missing in ${l}`);
  return l === "fr" ? v.replace(/ ([;:!?])/g, "\u202f$1") : v;
};

const HERO_CSS = `
.hero-art{position:relative;overflow:hidden;min-height:min(78svh,720px);display:flex;align-items:center;background:linear-gradient(180deg,var(--md-sys-color-primary-container),var(--md-sys-color-tertiary-container) 85%)}
.hero-art [data-hero-stage]{position:absolute;inset:0;--h1:color-mix(in srgb,var(--md-sys-color-tertiary) 35%,var(--md-sys-color-primary-container));--h2:color-mix(in srgb,var(--md-sys-color-tertiary) 55%,var(--md-sys-color-surface));--h3:color-mix(in srgb,var(--md-sys-color-tertiary) 75%,var(--md-sys-color-surface-container-lowest));--h4:var(--md-sys-color-tertiary)}
.hero-art .sun-css{position:absolute;right:14%;top:14%;width:min(26vw,260px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFD36A,#FFB300 55%,#C98200);box-shadow:0 0 120px 40px color-mix(in srgb,#FFB300 35%,transparent)}
.hero-art .hills-css{position:absolute;inset:auto 0 0 0;height:46%;background:var(--h2);clip-path:polygon(0 55%,18% 30%,36% 48%,58% 18%,78% 42%,100% 24%,100% 100%,0 100%)}
.hero-art .hills-css.near{height:30%;background:var(--h4);clip-path:polygon(0 40%,24% 62%,46% 28%,70% 58%,100% 34%,100% 100%,0 100%)}
.hero-copy{position:relative;z-index:1;width:100%;max-width:1200px;margin:0 auto;padding:clamp(48px,10vh,120px) 16px clamp(64px,12vh,140px)}
.hero-copy h1{${type("display-large")};margin:0 0 16px;max-width:16ch;font-weight:800;letter-spacing:-.03em;color:var(--md-sys-color-on-primary-container)}
.hero-copy .lead{${type("headline-small")};max-width:34ch;margin:0 0 28px;color:var(--md-sys-color-on-primary-container)}
@media (max-width:599px){.hero-copy h1{${type("display-small")}}.hero-copy .lead{${type("title-medium")}}}
.langs{display:flex;gap:4px;flex-wrap:wrap}
.langs a{display:inline-flex;align-items:center;min-height:44px;padding:0 12px;border-radius:var(--md-sys-shape-corner-full);color:var(--md-sys-color-on-surface);text-decoration:none;${type("label-large")}}
.langs a:hover{background:color-mix(in srgb,var(--md-sys-color-on-surface) 8%,transparent)}
.langs a[aria-current]{background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container)}
.top-app-bar .langs{margin-left:auto}
@media (max-width:719px){.top-app-bar{flex-wrap:wrap;gap:4px 8px}.top-app-bar .theme-btn{order:1;margin-left:auto}.top-app-bar nav,.top-app-bar .langs{order:2;flex:1 1 100%;margin-left:0}.langs a{padding:0 8px;min-height:40px}}
.card{border-radius:var(--md-sys-shape-corner-extra-large)}.card .head{display:flex;align-items:center;gap:16px}.card .head>div{display:flex;flex-direction:column;gap:4px}.pico{flex:none;object-fit:contain;padding:8px;border-radius:var(--md-sys-shape-corner-large);background:var(--md-sys-color-surface-container-high)}
`;

const BASE_CSS = `
*{box-sizing:border-box}
body{margin:0;background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);${type("body-large")}}
a{color:var(--md-sys-color-primary)}
.top-app-bar{display:flex;align-items:center;gap:16px;min-height:64px;padding:8px 16px;background:var(--md-sys-color-surface-container);position:sticky;top:0;z-index:1}
.top-app-bar .brand{display:flex;align-items:center;gap:12px;color:var(--md-sys-color-on-surface);text-decoration:none;${type("title-large")}}
.top-app-bar .brand svg{width:32px;height:32px}
.top-app-bar nav{margin-left:auto;display:flex;gap:4px;flex-wrap:wrap}
main{max-width:1200px;margin:0 auto;padding:24px 16px 64px}
h1{${type("display-small")};margin:32px 0 8px}
h2{${type("headline-small")};margin:40px 0 16px}
.title{${type("title-medium")};margin:0}
.support{${type("body-medium")};color:var(--md-sys-color-on-surface-variant);margin:4px 0 0}
.lead{${type("body-large")};max-width:60ch;color:var(--md-sys-color-on-surface-variant)}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.card{border:1px solid var(--md-sys-color-outline-variant);border-radius:var(--md-sys-shape-corner-medium);background:var(--md-sys-color-surface-container-low);padding:16px;display:flex;flex-direction:column;gap:8px}
.card a.title{color:var(--md-sys-color-on-surface);text-decoration:none}
.card a.title:hover{text-decoration:underline}
.actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ok{color:var(--md-sys-color-primary)}.err{color:var(--md-sys-color-error)}
.good{color:var(--md-sys-color-primary)}.ni{color:var(--md-sys-color-tertiary)}.poor{color:var(--md-sys-color-error)}
.kpi{${type("display-small")};margin:0}
table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:8px;border-bottom:1px solid var(--md-sys-color-outline-variant);${type("body-medium")}}th{${type("label-large")};color:var(--md-sys-color-on-surface-variant)}
code{font-family:var(--md-ref-typeface-code)}
form{display:inline}
pre{white-space:pre-wrap;word-break:break-word;background:var(--md-sys-color-surface-container);padding:16px;border-radius:var(--md-sys-shape-corner-medium);font-family:var(--md-ref-typeface-code);${type("body-small").replace(/font:[^;]*;/, "")}}
.skip{position:absolute;left:-999px}.skip:focus{left:16px;top:16px;z-index:2;background:var(--md-sys-color-surface-container-highest);padding:8px 16px;border-radius:var(--md-sys-shape-corner-small)}
ul.grid{list-style:none;padding:0;margin:0}
.hero{padding:clamp(24px,6vw,72px) 0 8px}
.hero h1{${type("display-medium")};max-width:18ch;margin:0 0 16px}
@media (max-width:599px){.hero h1{${type("headline-large")}}}
.card h3.title a{color:var(--md-sys-color-on-surface)}
@view-transition{navigation:auto}
@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){.card{animation:rise linear both;animation-timeline:view();animation-range:entry 0% entry 40%}}}
@keyframes rise{from{transform:translateY(24px)}to{transform:none}}
footer{max-width:1200px;margin:0 auto;padding:24px 16px;color:var(--md-sys-color-on-surface-variant);${type("body-medium")}}
`;

type Tab = "home" | "platform" | "labs" | "dashboard";

/** Public path of a page: the launcher entry (home) and the publishing platform, per locale. */
export const pagePath = (tab: Tab, l: Locale): string =>
  tab === "home"
    ? localePath(l)
    : tab === "platform"
      ? l === "fr"
        ? "/platform"
        : `/${l}/platform`
      : `/${tab}`;

const ORG = {
  "@type": "Organization",
  "@id": "https://aphrody.com/#org",
  name: "Aphrody",
  url: "https://aphrody.com/",
  logo: "https://aphrody.com/icon-512.png",
  email: "contact@aphrody.com",
};

export interface LayoutOpts {
  l?: Locale;
  ld?: object[];
  /** Full-bleed hero markup placed between the app bar and <main>. */
  hero?: string;
  desc?: string;
}

// Public pages: no code, repository, package or command is named (owner order, 2026-11-13). The dashboard,
// behind Cloudflare Access, keeps its technical detail and stays in French.
export function layout(
  reg: Pick<Registry, "css" | "mark">,
  title: string,
  tab: Tab,
  body: string,
  o: LayoutOpts = {},
): string {
  const l = o.l ?? "fr";
  const desc = o.desc ?? "";
  const ld = o.ld ?? [];
  const t = (k: string) => tr(l, k);
  const path = pagePath(tab, l);
  const url = `https://aphrody.app${path}`;
  const nav = (x: Tab, href: string, label: string) =>
    x === tab
      ? `<md-filled-tonal-button href="${href}" aria-current="page">${label}</md-filled-tonal-button>`
      : `<md-text-button href="${href}">${label}</md-text-button>`;
  const graph = ld.length
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": [ORG, ...ld] }).replace(/</g, "\\u003c")}</script>`
    : "";
  const alt =
    tab === "home" || tab === "platform"
      ? LOCALES.map((x) => `<link rel="alternate" hreflang="${x}" href="https://aphrody.app${pagePath(tab, x)}">`).join("") +
        `<link rel="alternate" hreflang="x-default" href="https://aphrody.app/">`
      : `<link rel="alternate" hreflang="fr" href="${url}">`;
  const langs =
    tab === "home" || tab === "platform"
      ? `<nav class="langs" aria-label="${esc(t("home.lang"))}">${LOCALES.map((x) => `<a href="${pagePath(tab, x)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="page"' : ""}>${NATIVE_NAME[x]}</a>`).join("")}</nav>`
      : "";
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>${desc ? `<meta name="description" content="${esc(desc)}">` : ""}<meta name="color-scheme" content="light dark"><link rel="canonical" href="${url}">${alt}<link rel="icon" href="https://aphrody.com/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="https://aphrody.com/apple-touch-icon.png"><meta property="og:type" content="website"><meta property="og:site_name" content="aphrody.app"><meta property="og:locale" content="${OG_LOCALE[l]}"><meta property="og:title" content="${esc(title)}">${desc ? `<meta property="og:description" content="${esc(desc)}">` : ""}<meta property="og:url" content="${url}"><meta property="og:image" content="https://aphrody.com/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">${tab === "dashboard" ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}${FONT_LINK}<style>${reg.css}${NATIVE_CSS}${BASE_CSS}${UI_CSS}${HERO_CSS}</style><script src="/_/theme.js"></script><script type="module" src="/_/md.js"></script><script src="/_/hero.js" defer></script><script src="/_aphrody/insights.js" defer></script>${graph}</head><body><a class="skip" href="#main">${esc(t("plat.skip"))}</a><header class="top-app-bar"><a class="brand" href="${localePath(l)}">${paintMark(reg.mark)}<span>aphrody.app</span></a><nav aria-label="${esc(t("plat.nav.label"))}">${nav("home", localePath(l), esc(t("plat.nav.home")))}${nav("platform", pagePath("platform", l), esc(t("plat.nav.platform")))}${nav("dashboard", "/dashboard", esc(t("plat.nav.dash")))}</nav>${langs}${themeButton(t("home.theme"))}</header>${o.hero ?? ""}<main id="main">${body}</main><footer><p>Aphrody. <a href="mailto:contact@aphrody.com">contact@aphrody.com</a>. ${esc(t("plat.footer"))} <a href="https://aphrody.com/">aphrody.com</a>.</p></footer></body></html>`;
}

const when = (iso?: string) =>
  iso
    ? `<time datetime="${esc(iso)}">${esc(iso.slice(0, 16).replace("T", " "))} UTC</time>`
    : "jamais";
const state = (d: Deployment) =>
  `<span class="${d.state === "ready" ? "ok" : d.state === "error" ? "err" : ""}">${esc(d.state)}</span>`;
const chip = (label: string, href?: string) =>
  href
    ? `<a class="chip" href="${esc(href)}">${esc(label)}</a>`
    : `<span class="chip">${esc(label)}</span>`;

export interface ProjectView {
  project: Project;
  state: ProjectState | null;
  latest: Deployment | null;
}

const FEATURE_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

export function platform(
  reg: Registry,
  views: ProjectView[],
  l: Locale = "fr",
): string {
  const t = (k: string) => tr(l, k);
  const sites = views
    .filter(({ project: p }) => p.domains.length)
    .map(({ project: p, state: s }) => {
      const d = p.domains[0]!;
      return `<li class="card"><h3 class="title"><a href="https://${esc(d)}">${esc(d)}</a></h3><p class="support">${esc(s?.production ? t("plat.live") : t("plat.prep"))}</p></li>`;
    })
    .join("");
  const features = FEATURE_IDS.map(
    (i) =>
      `<li class="card"><h3 class="title">${esc(t(`plat.f${i}.t`))}</h3><p class="support">${esc(t(`plat.f${i}.d`))}</p></li>`,
  ).join("");
  const hero = `<section class="hero-art" aria-labelledby="h"><div data-hero-stage><div class="bg sun-css"></div><div class="bg hills-css"></div><div class="bg hills-css near"></div></div><div class="hero-copy"><h1 id="h">${esc(t("plat.h1"))}</h1><p class="lead">${esc(t("plat.lead"))}</p><div class="actions"><md-filled-button href="#f">${esc(t("plat.features"))}</md-filled-button><md-outlined-button href="https://aphrody.com${l === "fr" ? "/" : "/" + l}">aphrody.com</md-outlined-button></div></div></section>`;
  const body = `<section aria-labelledby="f"><h2 id="f">${esc(t("plat.features"))}</h2><ul class="grid" role="list">${features}</ul></section><section aria-labelledby="s"><h2 id="s">${esc(t("plat.sites"))}</h2><ul class="grid" role="list">${sites || `<li class="support">${esc(t("plat.none"))}</li>`}</ul></section><section aria-labelledby="c"><h2 id="c">${esc(t("plat.contact"))}</h2><p>${esc(t("plat.contact.p"))} <a href="mailto:contact@aphrody.com">contact@aphrody.com</a>.</p></section>`;
  const desc = t("plat.desc");
  return layout(reg, t("plat.title"), "platform", body, {
    l,
    desc,
    hero,
    ld: [
      {
        "@type": "WebSite",
        "@id": "https://aphrody.app/#site",
        url: "https://aphrody.app/",
        name: "aphrody.app",
        inLanguage: l,
        publisher: { "@id": "https://aphrody.com/#org" },
      },
      {
        "@type": "Product",
        name: "aphrody.app",
        url: "https://aphrody.app/",
        description: desc,
        image: "https://aphrody.com/og-image.png",
        brand: { "@id": "https://aphrody.com/#org" },
        category: t("plat.category"),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Aphrody", item: "https://aphrody.com/" },
          { "@type": "ListItem", position: 2, name: "aphrody.app", item: `https://aphrody.app${pagePath("platform", l)}` },
        ],
      },
    ],
  });
}

const LAUNCH_CARDS: { id: string; icon: string; state: "built" | "partial" | "planned"; url: string }[] = [
  { id: "app", icon: "app.png", state: "partial", url: "" },
  { id: "play", icon: "play.png", state: "partial", url: "https://aphrody.com/play" },
  { id: "os", icon: "os.svg", state: "built", url: "https://aphrody.com/os" },
  { id: "craft", icon: "craft.png", state: "planned", url: "https://aphrody.com/craft" },
];

/** aphrody.app home: entry of the Aphrody launcher (fullscreen, controller-first shell). Only what exists is linked. */
export function landing(reg: Registry, l: Locale = "fr"): string {
  const t = (k: string) => tr(l, k);
  const cards = LAUNCH_CARDS.map(
    (c) =>
      `<li class="card"><div class="head"><img class="pico" src="https://aphrody.com/icons/${c.icon}" alt="" width="56" height="56"><div><h3 class="title">${esc(t(`home.p.${c.id}.name`))}</h3><span class="support">${esc(t(`home.state.${c.state}`))}</span></div></div><p class="support">${esc(t(`home.p.${c.id}.text`))}</p>${c.url ? `<div class="actions"><md-outlined-button href="${c.url}">${esc(t("home.open"))}</md-outlined-button></div>` : ""}</li>`,
  ).join("");
  const platformCard = `<li class="card"><h3 class="title">${esc(t("launch.platform.name"))}</h3><p class="support">${esc(t("launch.platform.text"))}</p><div class="actions"><md-outlined-button href="${pagePath("platform", l)}">${esc(t("home.open"))}</md-outlined-button></div></li>`;
  const hero = `<section class="hero-art" aria-labelledby="h"><div data-hero-stage><div class="bg sun-css"></div><div class="bg hills-css"></div><div class="bg hills-css near"></div></div><div class="hero-copy"><h1 id="h">${esc(t("launch.h1"))}</h1><p class="lead">${esc(t("launch.lead"))}</p><div class="actions"><md-filled-button href="https://aphrody.com/play">${esc(t("launch.cta.play"))}</md-filled-button><md-outlined-button href="https://aphrody.com/os">${esc(t("launch.cta.os"))}</md-outlined-button></div></div></section>`;
  const body = `<section aria-labelledby="w"><h2 id="w">${esc(t("launch.sec"))}</h2><ul class="grid" role="list">${cards}${platformCard}</ul><p class="support">${esc(t("launch.status"))}</p></section><section aria-labelledby="c"><h2 id="c">${esc(t("plat.contact"))}</h2><p>${esc(t("plat.contact.p"))} <a href="mailto:contact@aphrody.com">contact@aphrody.com</a>.</p></section>`;
  const desc = t("launch.desc");
  return layout(reg, t("launch.title"), "home", body, {
    l,
    desc,
    hero,
    ld: [
      { "@type": "WebSite", "@id": "https://aphrody.app/#site", url: "https://aphrody.app/", name: "aphrody.app", inLanguage: l, publisher: { "@id": "https://aphrody.com/#org" } },
      { "@type": "SoftwareApplication", name: "Aphrody Launcher", url: "https://aphrody.app/", description: desc, applicationCategory: "GameApplication", operatingSystem: "Web, Windows, Linux", brand: { "@id": "https://aphrody.com/#org" } },
    ],
  });
}

export function labs(reg: Registry): string {
  const card = (c: LabCard) =>
    `<article class="card"><a class="title" href="${esc(c.url)}">${esc(c.name)}</a><p class="support">${esc(c.description)}</p>${c.metric ? `<p class="support">Métrique : ${esc(c.metric)}</p>` : ""}<div class="chips">${c.language ? chip(c.language) : ""}${c.pushedAt ? chip(`mis à jour ${c.pushedAt.slice(0, 10)}`) : ""}${c.homepage ? chip(c.homepage.replace(/^https?:\/\//, ""), c.homepage) : ""}</div></article>`;
  const bets = reg.labs.filter((c) => c.source === "alphabet");
  const repos = reg.labs.filter((c) => c.source === "github");
  const body = `<h1>aphrody-labs</h1><p class="lead">Les projets expérimentaux d'Aphrody. Les paris viennent de <a href="https://github.com/aphrody-labs/src/blob/main/docs/ALPHABET.md">docs/ALPHABET.md</a> ; les dépôts sont ceux de l'organisation <a href="https://github.com/aphrody-labs">github.com/aphrody-labs</a> qui ne sont ni des forks ni archivés, avec leur description GitHub.</p><h2>Paris du monorepo</h2><div class="grid">${bets.map(card).join("")}</div><h2>Dépôts</h2><div class="grid">${repos.map(card).join("")}</div><p class="support">Liste générée au commit <code>${esc(reg.commit.slice(0, 7))}</code> le ${when(reg.generatedAt)}.</p>`;
  return layout(
    reg,
    "Labs, aphrody.app",
    "labs",
    body,
    { desc: "Projets expérimentaux de l'organisation aphrody-labs." },
  );
}

const fmt = (m: string, v: number) =>
  m === "CLS" ? v.toFixed(3) : `${Math.round(v)} ms`;

/** Web Analytics and Speed Insights of one project (Durable Object Insights, last `s.days` days). */
export function insightsHtml(s: Summary | null): string {
  if (!s)
    return '<p class="support">Analytics non branchées (binding INSIGHTS absent).</p>';
  const top = (title: string, rows: { key: string; n: number }[]) =>
    `<section class="card"><h3 class="title">${title}</h3>${rows.length ? `<table><thead><tr><th scope="col">Valeur</th><th scope="col">Vues</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.key || "(direct)")}</td><td>${r.n}</td></tr>`).join("")}</tbody></table>` : '<p class="support">Aucune donnée.</p>'}</section>`;
  const vit = METRICS.map((m) => {
    const x = s.vitals[m];
    return `<section class="card"><h3 class="title">${m === "INP" ? "INP approché" : m} (p75)</h3>${x ? `<p class="kpi ${rating(m, x.p75)}">${fmt(m, x.p75)}</p><p class="support">${x.n} visites</p>` : '<p class="support">Aucune mesure.</p>'}</section>`;
  }).join("");
  return `<h2>Analytics (${s.days} jours)</h2><div class="grid"><section class="card"><h3 class="title">Pages vues</h3><p class="kpi">${s.views}</p><p class="support">Sans cookie ni identifiant ; robots exclus.</p></section>${top("Pages", s.paths)}${top("Référents", s.referrers)}${top("Pays", s.countries)}${top("Appareils", s.devices)}</div><h2>Speed Insights</h2><p class="support">Core Web Vitals mesurées chez les visiteurs (RUM), 75e centile, seuils web.dev. INP approché : plus longue interaction de la visite (web-vitals prend le 98e centile au-delà de 50 interactions).</p><div class="grid">${vit}</div>`;
}

export function dashboard(
  reg: Registry,
  views: ProjectView[],
  who: string,
  platform: Summary | null = null,
): string {
  const rows = m3List(
    views.map(({ project: p, state: s, latest: d }) => ({
      headline: esc(p.name),
      supporting: `${p.domains.map(esc).join(", ") || "aucun domaine"} ; production ${esc(s?.production?.slice(0, 7) ?? "-")} ; dernier ${esc(d?.sha.slice(0, 7) ?? "-")}`,
      trailing: d ? esc(d.state) : "",
      href: `/dashboard/${esc(p.name)}`,
    })),
  );
  return layout(
    reg,
    "Tableau de bord, aphrody.app",
    "dashboard",
    `<h1>Tableau de bord</h1><p class="lead">Connecté via Cloudflare Access : ${esc(who)}.</p>${rows}<h2>Plateforme aphrody.app</h2>${insightsHtml(platform)}`,
  );
}

export function projectPage(
  reg: Registry,
  p: Project,
  s: ProjectState | null,
  deps: Deployment[],
  ins: Summary | null = null,
  cfg: Record<string, unknown> = {},
): string {
  const prod = s?.production;
  const prodIdx = prod ? deps.findIndex((x) => x.sha === prod) : -1;
  const items = deps
    .map((d, i) => {
      const live = d.sha === prod;
      const action =
        !live && d.state === "ready"
          ? `<form method="post" action="/dashboard/${esc(p.name)}/promote"><input type="hidden" name="sha" value="${esc(d.sha)}"><md-filled-tonal-button type="submit">${prodIdx >= 0 && i > prodIdx ? "Rollback ici" : "Promouvoir"}</md-filled-tonal-button></form>`
          : "";
      return `<article class="card"><a class="title" href="${esc(previewUrl(p.name, d.sha))}"><code>${esc(d.sha.slice(0, 7))}</code>${live ? " (production)" : ""}</a><p class="support">${esc(d.message)}</p><p class="support">${esc(d.branch)}, ${state(d)}, ${when(d.readyAt ?? d.createdAt)}${d.files ? `, ${d.files} fichiers, ${Math.round((d.bytes ?? 0) / 1024)} Kio` : ""}</p><div class="actions"><md-text-button href="/dashboard/${esc(p.name)}/${esc(d.sha)}/log">Journal</md-text-button>${d.run ? `<md-text-button href="${esc(d.run)}">CI</md-text-button>` : ""}${action}</div></article>`;
    })
    .join("");
  const hist = m3List(
    (s?.history ?? [])
      .slice(-10)
      .reverse()
      .map((h) => ({
        headline: `<code>${esc(h.sha.slice(0, 7))}</code> ${esc(h.action)}`,
        supporting: `par ${esc(h.by)}, ${when(h.at)}`,
      })),
  );
  const body = `<h1>${esc(p.name)}</h1><p class="lead"><code>${esc(p.path)}</code>, construit par <code>${esc(p.build)}</code>, sortie <code>${esc(p.out)}</code>${p.worker ? `, servi en production par le Worker <code>${esc(p.worker)}</code>` : ""}.</p><div class="grid"><section class="card"><h2 class="title">Domaines</h2><p class="support">${p.domains.map((x) => `<a href="https://${esc(x)}">${esc(x)}</a>`).join("<br>") || "aucun"}</p></section><section class="card"><h2 class="title">Variables (coffre env-kit)</h2><p class="support">${p.env.length ? p.env.map((x) => `<code>${esc(x)}</code>`).join(" ") : "aucune"}</p></section><section class="card"><h2 class="title">Production</h2><p class="support">${prod ? `<a href="${esc(previewUrl(p.name, prod))}"><code>${esc(prod.slice(0, 7))}</code></a>` : "aucune"}</p></section></div><h2>Déploiements</h2><div class="grid">${items || '<p class="support">Aucun déploiement.</p>'}</div><h2>Historique de production</h2>${s?.history?.length ? hist : '<p class="support">Vide.</p>'}${insightsHtml(ins)}<h2>Edge Config</h2><p class="support">Lue par les déploiements sur <code>/_aphrody/config</code> (publique, sans secret) ; écriture : <code>PUT /api/projects/${esc(p.name)}/config</code>.</p><pre>${esc(JSON.stringify(cfg, null, 2))}</pre><h2>Optimisation d'images</h2><p class="support"><code>/_aphrody/image?url=/chemin.png&amp;w=640&amp;q=75</code> sur chaque déploiement : redimensionnement, AVIF ou WebP selon Accept, cache immuable par commit.</p>`;
  return layout(reg, `${p.name}, aphrody.app`, "dashboard", body);
}

export function logPage(
  reg: Registry,
  p: string,
  sha: string,
  log: string,
): string {
  return layout(
    reg,
    `Journal ${p}@${sha.slice(0, 7)}`,
    "dashboard",
    `<h1>Journal de ${esc(p)}@<code>${esc(sha.slice(0, 7))}</code></h1><div class="actions"><md-text-button href="/dashboard/${esc(p)}">Retour</md-text-button></div><pre>${esc(log)}</pre>`,
  );
}
