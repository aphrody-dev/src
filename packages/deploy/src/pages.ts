// Server-rendered HTML of aphrody.app (landing, labs, dashboard). Design system: packages/design (tokens.css in the
// registry, Material Web components loaded from /_/md.js, Google Sans Flex). Only M3 tokens are referenced in CSS.
// Pages read without JavaScript: Material Web elements upgrade links, lists and chips that already carry their text.
import { FONT_LINK, NATIVE_CSS, m3List, paintMark, type } from "./m3.ts";
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

type Tab = "home" | "labs" | "dashboard";

const ORG = {
  "@type": "Organization",
  "@id": "https://aphrody.com/#org",
  name: "Aphrody",
  url: "https://aphrody.com/",
  logo: "https://aphrody.com/icon-512.png",
  email: "contact@aphrody.com",
};

// Public pages: no code, repository, package or command is named (owner order, 2026-11-13). The dashboard,
// behind Cloudflare Access, keeps its technical detail.
export function layout(
  reg: Pick<Registry, "css" | "mark">,
  title: string,
  tab: Tab,
  body: string,
  desc = "",
  ld: object[] = [],
): string {
  const path = tab === "home" ? "/" : `/${tab}`;
  const url = `https://aphrody.app${path}`;
  const nav = (t: Tab, href: string, label: string) =>
    t === tab
      ? `<md-filled-tonal-button href="${href}" aria-current="page">${label}</md-filled-tonal-button>`
      : `<md-text-button href="${href}">${label}</md-text-button>`;
  const graph = ld.length
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": [ORG, ...ld] }).replace(/</g, "\\u003c")}</script>`
    : "";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>${desc ? `<meta name="description" content="${esc(desc)}">` : ""}<meta name="color-scheme" content="light dark"><link rel="canonical" href="${url}"><link rel="alternate" hreflang="fr" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}"><link rel="icon" href="https://aphrody.com/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="https://aphrody.com/apple-touch-icon.png"><meta property="og:type" content="website"><meta property="og:site_name" content="aphrody.app"><meta property="og:locale" content="fr_FR"><meta property="og:title" content="${esc(title)}">${desc ? `<meta property="og:description" content="${esc(desc)}">` : ""}<meta property="og:url" content="${url}"><meta property="og:image" content="https://aphrody.com/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">${tab === "dashboard" ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}${FONT_LINK}<style>${reg.css}${NATIVE_CSS}${BASE_CSS}</style><script type="module" src="/_/md.js"></script><script src="/_aphrody/insights.js" defer></script>${graph}</head><body><a class="skip" href="#main">Aller au contenu</a><header class="top-app-bar"><a class="brand" href="/">${paintMark(reg.mark)}<span>aphrody.app</span></a><nav aria-label="Navigation principale">${nav("home", "/", "Accueil")}${nav("dashboard", "/dashboard", "Tableau de bord")}</nav></header><main id="main">${body}</main><footer><p>Aphrody. Contact : <a href="mailto:contact@aphrody.com">contact@aphrody.com</a>. Le groupe : <a href="https://aphrody.com/">aphrody.com</a>.</p></footer></body></html>`;
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

const FEATURES: [string, string][] = [
  [
    "Une adresse par version",
    "Chaque version d'un site reçoit sa propre adresse de prévisualisation, à relire et à partager avant la mise en ligne.",
  ],
  [
    "Mise en ligne et retour arrière",
    "Une version publiée ne change plus jamais. Passer à une autre, plus récente ou plus ancienne, prend quelques secondes.",
  ],
  [
    "Statistiques de visite",
    "Pages vues, provenance, pays et type d'appareil, sans cookie ni identifiant de visiteur.",
  ],
  [
    "Vitesse mesurée chez les visiteurs",
    "Temps d'affichage, réactivité et stabilité de la page, relevés sur de vraies visites et suivis dans le temps.",
  ],
  [
    "Images allégées",
    "Chaque image part à la taille affichée et dans le format le plus léger que le navigateur sait lire.",
  ],
  [
    "Réglages sans republier",
    "Bandeaux, options et interrupteurs se modifient en direct, sans refaire de version.",
  ],
  ["Noms de domaine", "Chaque site garde son adresse, chiffrée en HTTPS."],
  [
    "Journal de chaque publication",
    "Le déroulé de chaque mise en ligne reste consultable, étape par étape.",
  ],
];

export function landing(reg: Registry, views: ProjectView[]): string {
  const sites = views
    .filter(({ project: p }) => p.domains.length)
    .map(({ project: p, state: s }) => {
      const d = p.domains[0]!;
      return `<li class="card"><h3 class="title"><a href="https://${esc(d)}">${esc(d)}</a></h3><p class="support">${s?.production ? "En ligne" : "En préparation"}</p></li>`;
    })
    .join("");
  const features = FEATURES.map(
    ([t, d]) =>
      `<li class="card"><h3 class="title">${t}</h3><p class="support">${d}</p></li>`,
  ).join("");
  const body = `<section class="hero"><h1>Mettre en ligne les sites d'Aphrody</h1><p class="lead">Chaque version d'un site reçoit sa propre adresse pour être relue. Quand elle convient, elle passe en ligne. Si un problème apparaît, la version précédente revient en quelques secondes.</p></section><section aria-labelledby="f"><h2 id="f">Ce que fait la plateforme</h2><ul class="grid" role="list">${features}</ul></section><section aria-labelledby="s"><h2 id="s">Sites publiés</h2><ul class="grid" role="list">${sites || '<li class="support">Aucun site pour le moment.</li>'}</ul></section><section aria-labelledby="c"><h2 id="c">Nous contacter</h2><p>Une question sur la plateforme ou sur un site publié : <a href="mailto:contact@aphrody.com">contact@aphrody.com</a>.</p></section>`;
  const desc =
    "La plateforme de mise en ligne d'Aphrody : une adresse de prévisualisation par version, mise en ligne et retour arrière en quelques secondes, statistiques sans cookie et vitesse mesurée chez les visiteurs.";
  return layout(
    reg,
    "aphrody.app, la plateforme de mise en ligne d'Aphrody",
    "home",
    body,
    desc,
    [
      {
        "@type": "WebSite",
        "@id": "https://aphrody.app/#site",
        url: "https://aphrody.app/",
        name: "aphrody.app",
        inLanguage: "fr",
        publisher: { "@id": "https://aphrody.com/#org" },
      },
      {
        "@type": "Product",
        name: "aphrody.app",
        url: "https://aphrody.app/",
        description: desc,
        image: "https://aphrody.com/og-image.png",
        brand: { "@id": "https://aphrody.com/#org" },
        category: "Plateforme de mise en ligne de sites",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Aphrody",
            item: "https://aphrody.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "aphrody.app",
            item: "https://aphrody.app/",
          },
        ],
      },
    ],
  );
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
    "Projets expérimentaux de l'organisation aphrody-labs.",
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
    return `<section class="card"><h3 class="title">${m} (p75)</h3>${x ? `<p class="kpi ${rating(m, x.p75)}">${fmt(m, x.p75)}</p><p class="support">${x.n} visites</p>` : '<p class="support">Aucune mesure.</p>'}</section>`;
  }).join("");
  return `<h2>Analytics (${s.days} jours)</h2><div class="grid"><section class="card"><h3 class="title">Pages vues</h3><p class="kpi">${s.views}</p><p class="support">Sans cookie ni identifiant ; robots exclus.</p></section>${top("Pages", s.paths)}${top("Référents", s.referrers)}${top("Pays", s.countries)}${top("Appareils", s.devices)}</div><h2>Speed Insights</h2><p class="support">Core Web Vitals mesurées chez les visiteurs (RUM), 75e centile, seuils web.dev.</p><div class="grid">${vit}</div>`;
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
