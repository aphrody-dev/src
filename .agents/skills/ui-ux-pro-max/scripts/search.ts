#!/usr/bin/env bun
// Recherche BM25 dans les données UI/UX absorbées de nextlevelbuilder/ui-ux-pro-max-skill (MIT),
// portage bun de scripts/core.py + search.py (k1 = 1.5, b = 0.75), sans dépendance.
//   bun search.ts "<requête>" [--domain <d>] [--stack threejs|winui] [-n 3] [--json] [--ofl]
//   bun search.ts "<produit> <secteur> <mots>" --brief     produit + style + landing + ux + chart
import { join } from "node:path";

const DATA = join(import.meta.dir, "..", "data");

type Cfg = { file: string; search: string[]; out: string[] };
const DOMAINS: Record<string, Cfg> = {
  style: {
    file: "styles.csv",
    search: ["Style ID", "Style Category", "Aliases", "Keywords", "Best For", "Type", "AI Prompt Keywords"],
    out: ["Style Category", "Status", "Type", "Keywords", "Effects & Animation", "Best For", "Performance", "Accessibility", "Complexity", "Implementation Checklist", "rtl_level"],
  },
  product: {
    file: "products.csv",
    search: ["Product Type", "Keywords", "Primary Style Recommendation", "Key Considerations"],
    out: ["Product Type", "Primary Style Recommendation", "Secondary Styles", "Landing Page Pattern", "Dashboard Style (if applicable)", "Key Considerations", "rtl_level"],
  },
  landing: {
    file: "landing.csv",
    search: ["Pattern ID", "Pattern Name", "Aliases", "Keywords", "Conversion Optimization", "Section Order"],
    out: ["Pattern Name", "Section Order", "Primary CTA Placement", "Conversion Optimization"],
  },
  ux: {
    file: "ux-guidelines.csv",
    search: ["Category", "Issue", "Description", "Platform"],
    out: ["Category", "Issue", "Platform", "Description", "Do", "Don't", "Code Example Good", "Code Example Bad", "Severity"],
  },
  chart: {
    file: "charts.csv",
    search: ["Data Type", "Keywords", "Best Chart Type", "When to Use", "When NOT to Use", "Accessibility Notes"],
    out: ["Data Type", "Best Chart Type", "Secondary Options", "When to Use", "When NOT to Use", "Data Volume Threshold", "Accessibility Notes", "A11y Fallback"],
  },
  web: {
    file: "app-interface.csv",
    search: ["Category", "Issue", "Keywords", "Description"],
    out: ["Category", "Issue", "Platform", "Description", "Do", "Don't", "Code Example Good", "Code Example Bad", "Severity"],
  },
  "google-fonts": {
    file: "google-fonts.csv",
    search: ["Family", "Category", "Stroke", "Classifications", "Keywords", "Subsets", "Designers"],
    out: ["Family", "Category", "Styles", "Variable Axes", "Subsets", "Designers", "Popularity Rank", "Google Fonts URL"],
  },
};
const STACK_COLS = {
  search: ["Category", "Guideline", "Description", "Do", "Don't", "Code Good", "Code Bad"],
  out: ["Category", "Guideline", "Description", "Do", "Don't", "Code Good", "Code Bad", "Severity", "Docs URL", "Verified At"],
};
const STACKS = ["threejs", "winui"];

/** CSV RFC 4180 : guillemets doublés, champs multilignes. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let f = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') (f += '"'), i++;
      else if (c === '"') q = false;
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") row.push(f), (f = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(f), rows.push(row), (row = []), (f = "");
    } else f += c;
  }
  if (f || row.length) row.push(f), rows.push(row);
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.replace(/^﻿/, ""), r[i] ?? ""])));
}

const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1); // garde ui, ux, 3d, ar

function bm25(docs: string[], query: string, k1 = 1.5, b = 0.75): [number, number][] {
  const corpus = docs.map(tokenize);
  const avg = corpus.reduce((a, d) => a + d.length, 0) / Math.max(1, corpus.length);
  const df = new Map<string, number>();
  for (const d of corpus) for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);
  const N = corpus.length;
  const q = tokenize(query);
  return corpus
    .map((d, i): [number, number] => {
      const tf = new Map<string, number>();
      for (const w of d) tf.set(w, (tf.get(w) ?? 0) + 1);
      let s = 0;
      for (const w of q) {
        const n = df.get(w);
        if (!n) continue;
        const idf = Math.log((N - n + 0.5) / (n + 0.5) + 1);
        const t = tf.get(w) ?? 0;
        s += (idf * t * (k1 + 1)) / (t + k1 * (1 - b + (b * d.length) / avg));
      }
      return [i, s];
    })
    .filter(([, s]) => s > 0)
    .sort((a, b2) => b2[1] - a[1]);
}

let oflFamilies: Set<string> | null = null;
async function ofl(): Promise<Set<string>> {
  if (oflFamilies) return oflFamilies;
  const j = (await Bun.file(join(DATA, "google-font-licenses.json")).json()) as { families: { name: string; license: string }[] };
  oflFamilies = new Set(j.families.filter((f) => f.license === "OFL").map((f) => f.name));
  return oflFamilies;
}

async function search(file: string, cfg: { search: string[]; out: string[] }, query: string, n: number, onlyOfl = false) {
  let rows = parseCsv(await Bun.file(join(DATA, file)).text());
  if (onlyOfl) {
    const ok = await ofl();
    rows = rows.filter((r) => ok.has(r.Family));
  }
  const hits = bm25(rows.map((r) => cfg.search.map((c) => r[c] ?? "").join(" ")), query).slice(0, n);
  return hits.map(([i, score]) => ({ score: +score.toFixed(3), ...Object.fromEntries(cfg.out.filter((c) => rows[i][c]).map((c) => [c, rows[i][c]])) }));
}

function detect(query: string): string {
  const q = query.toLowerCase();
  const rules: [string, RegExp][] = [
    ["chart", /\b(chart|graph|plot|visuali[sz]|axis|legend|dashboard metric)/],
    ["google-fonts", /\b(font|typeface|serif|sans|mono|variable axes)/],
    ["landing", /\b(landing|hero|cta|pricing|testimonial|social proof)/],
    ["product", /\b(saas|e-?commerce|fintech|healthcare|portfolio|marketplace|app for)\b/],
    ["style", /\b(style|minimal|brutal|glass|neumorph|bento|flat|skeuo|aesthetic)/],
    ["web", /\b(safe.?area|touch target|haptic|accessibilitylabel|native)/],
  ];
  return rules.find(([, r]) => r.test(q))?.[0] ?? "ux";
}

const argv = Bun.argv.slice(2);
const flag = (k: string) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : undefined;
};
const query = argv.find((a, i) => !a.startsWith("-") && !["--domain", "--stack", "-n"].includes(argv[i - 1] ?? ""));
if (!query) {
  console.error('usage : bun search.ts "<requête>" [--domain style|product|landing|ux|chart|web|google-fonts] [--stack threejs|winui] [-n 3] [--json] [--ofl] [--brief]');
  process.exit(2);
}
const n = Number(flag("-n") ?? 3);
const asJson = argv.includes("--json");
let result: Record<string, unknown>;

if (argv.includes("--brief")) {
  result = {};
  for (const d of ["product", "style", "landing", "ux", "chart"]) result[d] = await search(DOMAINS[d].file, DOMAINS[d], query, 1);
} else if (flag("--stack")) {
  const st = flag("--stack")!;
  if (!STACKS.includes(st)) {
    console.error(`pile inconnue : ${st} (disponibles : ${STACKS.join(", ")} ; web = Material Web, voir ui-system)`);
    process.exit(2);
  }
  result = { [`stack:${st}`]: await search(`stacks/${st}.csv`, STACK_COLS, query, n) };
} else {
  const d = flag("--domain") ?? detect(query);
  if (!DOMAINS[d]) {
    console.error(`domaine inconnu : ${d} (${Object.keys(DOMAINS).join(", ")})`);
    process.exit(2);
  }
  result = { [d]: await search(DOMAINS[d].file, DOMAINS[d], query, n, d === "google-fonts" && argv.includes("--ofl")) };
}

if (asJson) console.log(JSON.stringify(result, null, 2));
else
  for (const [d, hits] of Object.entries(result)) {
    const list = hits as Record<string, unknown>[];
    console.log(`## ${d} (${list.length} résultat${list.length > 1 ? "s" : ""})`);
    if (!list.length) console.log("aucun résultat : resserrer la requête ou forcer --domain ; ne rien inventer.");
    for (const h of list) {
      console.log("");
      for (const [k, v] of Object.entries(h)) console.log(`- ${k} : ${String(v).replace(/\s*\n\s*/g, " ")}`);
    }
    console.log("");
  }
