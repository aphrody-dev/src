// Server-rendered HTML of aphrody.app (landing, labs, dashboard). Design system: packages/design (tokens.css in the
// registry, Material Web components loaded from /_/md.js, Google Sans Flex). Only M3 tokens are referenced in CSS.
// Pages read without JavaScript: Material Web elements upgrade links, lists and chips that already carry their text.
import { FONT_LINK, type } from "./m3.ts";
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
md-chip-set{margin-top:auto;padding-top:8px}
md-list{border-radius:var(--md-sys-shape-corner-medium);background:var(--md-sys-color-surface-container-low)}
.actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ok{color:var(--md-sys-color-primary)}.err{color:var(--md-sys-color-error)}
code{font-family:var(--md-ref-typeface-code)}
form{display:inline}
pre{white-space:pre-wrap;word-break:break-word;background:var(--md-sys-color-surface-container);padding:16px;border-radius:var(--md-sys-shape-corner-medium);font-family:var(--md-ref-typeface-code);${type("body-small").replace(/font:[^;]*;/, "")}}
footer{max-width:1200px;margin:0 auto;padding:24px 16px;color:var(--md-sys-color-on-surface-variant);${type("body-medium")}}
`;

type Tab = "home" | "labs" | "dashboard";

export function layout(
  reg: Pick<Registry, "css" | "mark">,
  title: string,
  tab: Tab,
  body: string,
  desc = "",
): string {
  const nav = (t: Tab, href: string, label: string) =>
    t === tab
      ? `<md-filled-tonal-button href="${href}" aria-current="page">${label}</md-filled-tonal-button>`
      : `<md-text-button href="${href}">${label}</md-text-button>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>${desc ? `<meta name="description" content="${esc(desc)}">` : ""}<meta name="color-scheme" content="light dark"><link rel="canonical" href="https://aphrody.app${tab === "home" ? "/" : `/${tab}`}">${FONT_LINK}<style>${reg.css}${BASE_CSS}</style><script type="module" src="/_/md.js"></script></head><body><header class="top-app-bar"><a class="brand" href="/">${reg.mark}<span>aphrody.app</span></a><nav aria-label="Navigation">${nav("home", "/", "Projets")}${nav("labs", "/labs", "Labs")}${nav("dashboard", "/dashboard", "Tableau de bord")}</nav></header><main>${body}</main><footer>Aphrody. Code source : <a href="https://github.com/aphrody-labs/src">github.com/aphrody-labs/src</a>. Contact : <a href="mailto:contact@aphrody.com">contact@aphrody.com</a>. Holding : <a href="https://aphrody.com/">aphrody.com</a>.</footer></body></html>`;
}

const when = (iso?: string) =>
  iso
    ? `<time datetime="${esc(iso)}">${esc(iso.slice(0, 16).replace("T", " "))} UTC</time>`
    : "jamais";
const state = (d: Deployment) =>
  `<span class="${d.state === "ready" ? "ok" : d.state === "error" ? "err" : ""}">${esc(d.state)}</span>`;
const chip = (label: string, href?: string) =>
  `<md-assist-chip label="${esc(label)}"${href ? ` href="${esc(href)}"` : ""}></md-assist-chip>`;

export interface ProjectView {
  project: Project;
  state: ProjectState | null;
  latest: Deployment | null;
}

export function landing(reg: Registry, views: ProjectView[]): string {
  const cards = views
    .map(({ project: p, state: s, latest: d }) => {
      const domain = p.domains[0];
      return `<article class="card"><h3 class="title">${esc(p.name)}</h3><p class="support"><code>${esc(p.path)}</code></p>${domain ? `<p class="support">Production : <a href="https://${esc(domain)}">${esc(domain)}</a>${s?.production ? ` (<code>${esc(s.production.slice(0, 7))}</code>)` : ""}</p>` : ""}${d ? `<p class="support">Dernier déploiement : <a href="${esc(previewUrl(p.name, d.sha))}"><code>${esc(d.sha.slice(0, 7))}</code></a>, ${state(d)}, ${when(d.readyAt ?? d.createdAt)}</p>` : `<p class="support">Aucun déploiement.</p>`}<md-chip-set>${p.worker ? chip(`Worker ${p.worker}`) : chip("aphrody-deploy")}${chip(p.production === "auto" ? "production automatique" : "production manuelle")}</md-chip-set></article>`;
    })
    .join("");
  const inv = reg.inventory.filter((i) => !i.deployed);
  const body = `<h1>Déployer le monorepo</h1><p class="lead">Chaque commit sur <code>main</code> qui touche un projet est construit en CI, publié sur une URL de preview <code>&lt;projet&gt;-&lt;sha&gt;.aphrody.app</code>, puis promu en production. Les déploiements sont immuables : un rollback déplace le pointeur de production, sans reconstruire. Construit sur Cloudflare Workers et R2.</p><div class="actions"><md-filled-button href="/dashboard">Ouvrir le tableau de bord</md-filled-button><md-text-button href="/labs">Voir les labs</md-text-button></div><h2>Projets déployés par aphrody.app</h2><div class="grid">${cards || '<p class="support">Aucun projet enregistré.</p>'}</div><h2>Autres unités du monorepo</h2><md-list>${inv
    .map(
      (i) =>
        `<md-list-item type="link" href="https://github.com/aphrody-labs/src/tree/main/${esc(i.path)}"><div slot="headline">${esc(i.name)}</div><div slot="supporting-text">${esc(i.description || i.path)}</div><div slot="trailing-supporting-text">${esc(i.kind)}</div></md-list-item>`,
    )
    .join(
      "",
    )}</md-list><p class="support">Inventaire généré au commit <code>${esc(reg.commit.slice(0, 7))}</code> le ${when(reg.generatedAt)}.</p>`;
  return layout(
    reg,
    "aphrody.app, plateforme de déploiement d'Aphrody",
    "home",
    body,
    "Previews par commit, production, rollback et journaux des projets du monorepo Aphrody.",
  );
}

export function labs(reg: Registry): string {
  const card = (c: LabCard) =>
    `<article class="card"><a class="title" href="${esc(c.url)}">${esc(c.name)}</a><p class="support">${esc(c.description)}</p>${c.metric ? `<p class="support">Métrique : ${esc(c.metric)}</p>` : ""}<md-chip-set>${c.language ? chip(c.language) : ""}${c.pushedAt ? chip(`mis à jour ${c.pushedAt.slice(0, 10)}`) : ""}${c.homepage ? chip(c.homepage.replace(/^https?:\/\//, ""), c.homepage) : ""}</md-chip-set></article>`;
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

export function dashboard(
  reg: Registry,
  views: ProjectView[],
  who: string,
): string {
  const rows = views
    .map(
      ({ project: p, state: s, latest: d }) =>
        `<md-list-item type="link" href="/dashboard/${esc(p.name)}"><div slot="headline">${esc(p.name)}</div><div slot="supporting-text">${p.domains.map(esc).join(", ") || "aucun domaine"} ; production ${esc(s?.production?.slice(0, 7) ?? "-")} ; dernier ${esc(d?.sha.slice(0, 7) ?? "-")}</div><div slot="trailing-supporting-text">${d ? esc(d.state) : ""}</div></md-list-item>`,
    )
    .join("");
  return layout(
    reg,
    "Tableau de bord, aphrody.app",
    "dashboard",
    `<h1>Tableau de bord</h1><p class="lead">Connecté via Cloudflare Access : ${esc(who)}.</p><md-list>${rows}</md-list>`,
  );
}

export function projectPage(
  reg: Registry,
  p: Project,
  s: ProjectState | null,
  deps: Deployment[],
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
  const hist = (s?.history ?? [])
    .slice(-10)
    .reverse()
    .map(
      (h) =>
        `<md-list-item><div slot="headline"><code>${esc(h.sha.slice(0, 7))}</code> ${esc(h.action)}</div><div slot="supporting-text">par ${esc(h.by)}, ${when(h.at)}</div></md-list-item>`,
    )
    .join("");
  const body = `<h1>${esc(p.name)}</h1><p class="lead"><code>${esc(p.path)}</code>, construit par <code>${esc(p.build)}</code>, sortie <code>${esc(p.out)}</code>${p.worker ? `, servi en production par le Worker <code>${esc(p.worker)}</code>` : ""}.</p><div class="grid"><section class="card"><h2 class="title">Domaines</h2><p class="support">${p.domains.map((x) => `<a href="https://${esc(x)}">${esc(x)}</a>`).join("<br>") || "aucun"}</p></section><section class="card"><h2 class="title">Variables (coffre env-kit)</h2><p class="support">${p.env.length ? p.env.map((x) => `<code>${esc(x)}</code>`).join(" ") : "aucune"}</p></section><section class="card"><h2 class="title">Production</h2><p class="support">${prod ? `<a href="${esc(previewUrl(p.name, prod))}"><code>${esc(prod.slice(0, 7))}</code></a>` : "aucune"}</p></section></div><h2>Déploiements</h2><div class="grid">${items || '<p class="support">Aucun déploiement.</p>'}</div><h2>Historique de production</h2><md-list>${hist || '<md-list-item><div slot="headline">Vide.</div></md-list-item>'}</md-list>`;
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
