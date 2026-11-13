// aphrody.com home: the holding page, in the manner of abc.xyz. Single source: docs/ALPHABET.md (core, bets,
// letter, investors) plus metrics measured on the checkout at build time. Nothing here is written by hand:
// owner texts that do not exist yet stay TODO(owner) in ALPHABET.md and are not shown.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  firstPath,
  inline,
  isTodo,
  parseAlphabet,
  plain,
  section,
  type Alphabet,
} from "../../../../packages/deploy/src/alphabet.ts";
import { readBrand, tokensCss } from "../../../../packages/deploy/src/m3.ts";

export type HoldingLocale = "fr" | "en";
const TREE = "https://github.com/aphrody-labs/src/tree/main/";

export interface Metric {
  label: Record<HoldingLocale, string>;
  value: string;
  source: string;
}

const T = {
  fr: {
    title: "Aphrody",
    desc: "Aphrody, holding d'un monorepo : un noyau commun et des paris indépendants, chacun avec sa métrique.",
    letter: "Lettre du fondateur",
    core: "Noyau",
    bets: "Paris",
    metrics: "Métriques publiques",
    contact: "Investisseurs et contact",
    unit: "Unité",
    metric: "Métrique",
    measured: "Mesurées sur le commit",
    source: "source",
    platform: "Plateforme de déploiement",
    platformText:
      "Les projets du monorepo sont déployés par aphrody.app : preview par commit, production, rollback.",
    skip: "Aller au contenu",
  },
  en: {
    title: "Aphrody",
    desc: "Aphrody, holding of one monorepo: a shared core and independent bets, each with its metric.",
    letter: "Founder's letter",
    core: "Core",
    bets: "Bets",
    metrics: "Public metrics",
    contact: "Investors and contact",
    unit: "Unit",
    metric: "Metric",
    measured: "Measured on commit",
    source: "source",
    platform: "Deployment platform",
    platformText:
      "The projects of the monorepo are deployed by aphrody.app: preview per commit, production, rollback.",
    skip: "Skip to content",
  },
} as const;

const git = (root: string, ...a: string[]) =>
  Bun.spawnSync(["git", ...a], { cwd: root })
    .stdout.toString()
    .trim();
const countDirs = (dir: string, marker: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter(
        (d) => d.isDirectory() && existsSync(join(dir, d.name, marker)),
      ).length
    : 0;

/** Metrics measured on the checkout. Each one names the command or file it comes from. */
export function measure(root: string): {
  commit: string;
  date: string;
  metrics: Metric[];
} {
  const commit = git(root, "rev-parse", "HEAD");
  const date = git(root, "log", "-1", "--format=%cs");
  const metrics: Metric[] = [];
  const commits = git(root, "rev-list", "--count", "HEAD");
  const shallow = git(root, "rev-parse", "--is-shallow-repository") === "true";
  if (commits && !shallow)
    metrics.push({
      label: { fr: "Commits sur main", en: "Commits on main" },
      value: commits,
      source: "git rev-list --count HEAD",
    });
  const forks = join(root, "third_party", "forks.txt");
  if (existsSync(forks)) {
    const n = readFileSync(forks, "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("#")).length;
    metrics.push({
      label: { fr: "Forks amont suivis", en: "Upstream forks tracked" },
      value: String(n),
      source: "third_party/forks.txt",
    });
  }
  metrics.push({
    label: { fr: "Crates Rust", en: "Rust crates" },
    value: String(countDirs(join(root, "crates"), "Cargo.toml")),
    source: "crates/*/Cargo.toml",
  });
  metrics.push({
    label: { fr: "Paquets Bun", en: "Bun packages" },
    value: String(countDirs(join(root, "packages"), "package.json")),
    source: "packages/*/package.json",
  });
  const reviews = join(root, "docs", "reviews");
  if (existsSync(reviews)) {
    const n = readdirSync(reviews).filter(
      (f) => f.endsWith(".md") && f !== "INDEX.md",
    ).length;
    metrics.push({
      label: { fr: "Revues archivées", en: "Archived reviews" },
      value: String(n),
      source: "docs/reviews/*.md",
    });
  }
  return { commit, date, metrics };
}

const esc = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

const CSS = `*{box-sizing:border-box}body{margin:0;background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);font:400 1rem/1.5rem "Google Sans Flex","Roboto Flex",system-ui,sans-serif;letter-spacing:.03125rem}
a{color:var(--md-sys-color-primary)}a:focus-visible{outline:3px solid var(--md-sys-color-secondary);outline-offset:2px}
.skip{position:absolute;left:-999px}.skip:focus{left:16px;top:16px;background:var(--md-sys-color-surface-container-highest);padding:8px 16px;border-radius:8px}
header{max-width:960px;margin:0 auto;padding:32px 24px 0;display:flex;align-items:center;gap:12px}header svg{width:40px;height:40px}header span{font:500 1.375rem/1.75rem "Google Sans Flex","Roboto Flex",system-ui,sans-serif}
header nav{margin-left:auto}header nav a{display:inline-flex;align-items:center;min-height:48px;padding:0 12px;font:500 .875rem/1.25rem "Roboto Flex",system-ui,sans-serif}
main{max-width:960px;margin:0 auto;padding:0 24px 64px}
h1{font:400 3.5625rem/4rem "Google Sans Flex","Roboto Flex",system-ui,sans-serif;letter-spacing:-.015625rem;margin:56px 0 16px}
h2{font:400 1.75rem/2.25rem "Google Sans Flex","Roboto Flex",system-ui,sans-serif;margin:56px 0 16px}
.lead{font:400 1.375rem/1.75rem "Google Sans Flex","Roboto Flex",system-ui,sans-serif;max-width:40ch;color:var(--md-sys-color-on-surface-variant)}
p{max-width:68ch}
ul.units{list-style:none;margin:0;padding:0;border-top:1px solid var(--md-sys-color-outline-variant)}
ul.units li{display:grid;grid-template-columns:minmax(10rem,14rem) 1fr;gap:4px 24px;padding:16px 0;border-bottom:1px solid var(--md-sys-color-outline-variant)}
ul.units .name{font:500 1rem/1.5rem "Roboto Flex",system-ui,sans-serif}ul.units .role{color:var(--md-sys-color-on-surface)}ul.units .metric{grid-column:2;color:var(--md-sys-color-on-surface-variant);font-size:.875rem;line-height:1.25rem}
@media (max-width:640px){ul.units li{grid-template-columns:1fr}ul.units .metric{grid-column:1}h1{font-size:2.8125rem;line-height:3.25rem}}
dl.metrics{display:grid;grid-template-columns:repeat(auto-fill,minmax(12rem,1fr));gap:16px;margin:0}
dl.metrics div{background:var(--md-sys-color-surface-container-low);border-radius:12px;padding:16px}
dl.metrics dt{font:500 .875rem/1.25rem "Roboto Flex",system-ui,sans-serif;color:var(--md-sys-color-on-surface-variant)}
dl.metrics dd{margin:4px 0 0;font:400 2rem/2.5rem "Google Sans Flex","Roboto Flex",system-ui,sans-serif}
dl.metrics small{display:block;margin-top:4px;font:400 .75rem/1rem ui-monospace,"Roboto Mono",monospace;color:var(--md-sys-color-on-surface-variant)}
code{font:400 .875em ui-monospace,"Roboto Mono",monospace}
footer{max-width:960px;margin:0 auto;padding:24px;border-top:1px solid var(--md-sys-color-outline-variant);color:var(--md-sys-color-on-surface-variant);font-size:.875rem}`;

function units(a: Alphabet, name: string, l: HoldingLocale): string {
  const rows = section(a, name)?.table?.rows ?? [];
  return `<ul class="units">${rows
    .map((r) => {
      const path = firstPath(r[1] ?? "");
      const title = esc(plain(r[0] ?? ""));
      return `<li><span class="name">${path ? `<a href="${TREE}${esc(path)}">${title}</a>` : title}</span><span class="role">${inline(r[2] ?? "")}</span><span class="metric">${T[l].metric} : ${inline(r[3] ?? "")}</span></li>`;
    })
    .join("")}</ul>`;
}

function prose(s: ReturnType<typeof section>): string {
  if (!s) return "";
  return [
    ...s.paragraphs.map((p) => `<p>${inline(p)}</p>`),
    s.bullets.length
      ? `<ul>${s.bullets.map((b) => `<li>${inline(b)}</li>`).join("")}</ul>`
      : "",
  ].join("");
}

export function renderHolding(
  root: string,
  l: HoldingLocale,
  m = measure(root),
): string {
  const a = parseAlphabet(
    readFileSync(join(root, "docs", "ALPHABET.md"), "utf8"),
  );
  const brand = readBrand(root);
  const t = T[l];
  const letter = section(a, "Lettre");
  const investors = section(a, "Investisseurs");
  const intro = a.intro[0] ?? "";
  const metrics = `<dl class="metrics">${m.metrics.map((x) => `<div><dt>${esc(x.label[l])}</dt><dd>${esc(x.value)}</dd><small>${esc(x.source)}</small></div>`).join("")}</dl><p>${t.measured} <a href="https://github.com/aphrody-labs/src/commit/${esc(m.commit)}"><code>${esc(m.commit.slice(0, 7))}</code></a> (${esc(m.date)}).</p>`;
  const self = l === "fr" ? "/" : "/en";
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${t.title}</title><meta name="description" content="${esc(t.desc)}"><meta name="color-scheme" content="light dark"><link rel="canonical" href="https://aphrody.com${self === "/" ? "/" : self}"><link rel="alternate" hreflang="fr" href="https://aphrody.com/"><link rel="alternate" hreflang="en" href="https://aphrody.com/en"><link rel="alternate" hreflang="x-default" href="https://aphrody.com/"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta property="og:title" content="Aphrody"><meta property="og:description" content="${esc(t.desc)}"><meta property="og:url" content="https://aphrody.com${self === "/" ? "/" : self}"><meta property="og:image" content="https://aphrody.com/og-image.jpg"><meta name="aphrody-commit" content="${esc(m.commit)}"><style>${tokensCss(root)}${CSS}</style><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Aphrody", url: "https://aphrody.com/", email: "contact@aphrody.com", sameAs: ["https://github.com/aphrody-dev", "https://github.com/aphrody-labs"] })}</script></head><body><a class="skip" href="#main">${t.skip}</a><header>${brand.mark}<span>Aphrody</span><nav aria-label="Langue"><a href="${l === "fr" ? "/en" : "/"}" hreflang="${l === "fr" ? "en" : "fr"}">${l === "fr" ? "English" : "Français"}</a></nav></header><main id="main"><h1>Aphrody</h1><p class="lead">${inline(intro.replace(/^Décision du propriétaire, [0-9-]+ : /, "").split(/\s+(?=Ce document)/)[0]!)}</p>${
    isTodo(letter)
      ? "<!-- TODO(owner): lettre du fondateur (docs/ALPHABET.md, section « Lettre du fondateur »). -->"
      : `<section><h2>${t.letter}</h2>${prose(letter)}</section>`
  }<section><h2>${t.core}</h2>${units(a, "Noyau", l)}</section><section><h2>${t.bets}</h2>${units(a, "Paris", l)}</section><section><h2>${t.metrics}</h2>${metrics}</section><section><h2>${t.platform}</h2><p>${t.platformText} <a href="https://aphrody.app/">aphrody.app</a></p></section><section><h2>${t.contact}</h2>${
    isTodo(investors)
      ? "<!-- TODO(owner): relations investisseurs (docs/ALPHABET.md, section « Investisseurs et contact »). -->"
      : prose(investors)
  }<p><a href="mailto:contact@aphrody.com">contact@aphrody.com</a></p><p><a href="https://github.com/aphrody-dev">github.com/aphrody-dev</a></p><p><a href="https://github.com/aphrody-labs">github.com/aphrody-labs</a></p><!-- TODO(owner): URL publiques Discord et X d'Aphrody. --></section></main><footer>Aphrody. <a href="https://github.com/aphrody-labs/src/blob/main/docs/ALPHABET.md">docs/ALPHABET.md</a>. <a href="/search">${l === "fr" ? "Recherche" : "Search"}</a></footer></body></html>`;
}
