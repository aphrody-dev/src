// Snapshot of vercel/next.js canary into docs/nextjs: PRs, commits, releases, blog, packages, crates.
// Usage: bun scripts/nextjs-scan.ts [--days 30]
import { $ } from "bun";
import { readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const REPO = join(ROOT, "third_party/next.js");
const OUT = join(ROOT, "docs/nextjs");
const days = Number(process.argv[process.argv.indexOf("--days") + 1]) || 30;
const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
mkdirSync(OUT, { recursive: true });

const GH = Bun.which("gh.exe") ?? Bun.which("gh") ?? "gh";
const gh = async (args: string[]) => JSON.parse(await $`${GH} ${args}`.quiet().text());
const md = (s: string) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const write = (name: string, body: string) => Bun.write(join(OUT, name), body.trimEnd() + "\n");

async function prs() {
  const fields = "number,title,author,state,mergedAt,createdAt,labels,url";
  const [open, merged] = await Promise.all([
    gh(["pr", "list", "-R", "vercel/next.js", "--state", "open", "-L", "300", "--json", fields]),
    gh(["pr", "list", "-R", "vercel/next.js", "--state", "merged", "-L", "1000",
      "--search", `base:canary merged:>=${since}`, "--json", fields]),
  ]);
  const row = (p: any) =>
    `| [#${p.number}](${p.url}) | ${md(p.title)} | ${p.author?.login ?? ""} | ${(p.mergedAt ?? p.createdAt).slice(0, 10)} | ${p.labels.map((l: any) => l.name).join(", ")} |`;
  const head = "| PR | Titre | Auteur | Date | Labels |\n|---|---|---|---|---|";
  await write("PRS.md", `# Pull requests vercel/next.js\n\nInstantané du ${new Date().toISOString().slice(0, 10)}.\n\n## Fusionnées sur canary depuis ${since} (${merged.length})\n\n${head}\n${merged.map(row).join("\n")}\n\n## Ouvertes (${open.length})\n\n${head}\n${open.map(row).join("\n")}`);
  await Bun.write(join(OUT, "data/prs.json"), JSON.stringify({ open, merged }, null, 1));
}

async function commits() {
  const log = await $`git -C ${REPO} log --since=${since} --format=%h%x09%ad%x09%an%x09%s --date=short`.quiet().text();
  const rows = log.trim().split("\n").filter(Boolean).map((l) => {
    const [h, d, a, s] = l.split("\t");
    return `| \`${h}\` | ${d} | ${md(a!)} | ${md(s!)} |`;
  });
  await write("COMMITS.md", `# Commits canary depuis ${since} (${rows.length})\n\n| SHA | Date | Auteur | Sujet |\n|---|---|---|---|\n${rows.join("\n")}`);
}

async function releases() {
  const rel = await gh(["api", "repos/vercel/next.js/releases?per_page=60"]);
  const body = rel.map((r: any) => `## ${r.tag_name} (${r.published_at?.slice(0, 10)})${r.prerelease ? " canary" : ""}\n\n${(r.body ?? "").trim()}`).join("\n\n");
  await write("RELEASES.md", `# Releases vercel/next.js (60 dernières)\n\n${body}`);
}

async function blog() {
  const xml = await (await fetch("https://nextjs.org/feed.xml")).text().catch(() => "");
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const g = (t: string) => m[1]!.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`))?.[1]?.trim() ?? "";
    return { title: g("title"), link: g("link"), date: g("pubDate"), desc: g("description") };
  });
  const rows = items.map((i) => `- [${md(i.title)}](${i.link}) — ${new Date(i.date).toISOString().slice(0, 10)}: ${md(i.desc).slice(0, 240)}`);
  await write("BLOG.md", `# Blog nextjs.org (${rows.length} articles, flux feed.xml)\n\n${rows.join("\n") || "Flux indisponible."}`);
}

function workspace() {
  const pkgs = readdirSync(join(REPO, "packages")).filter((d) => existsSync(join(REPO, "packages", d, "package.json")));
  const pkgRows = pkgs.map((d) => {
    const p = require(join(REPO, "packages", d, "package.json"));
    return `| \`${p.name}\` | ${p.version ?? ""} | ${p.private ? "privé" : "publié"} | ${md(p.description ?? "")} |`;
  });
  const plugins = pkgs.filter((d) => /plugin|eslint|codemod|mdx|font|swc|env|third-parties|bundle-analyzer|polyfill/.test(d));
  const crates: string[] = [];
  for (const top of ["crates", "turbopack/crates"]) {
    const dir = join(REPO, top);
    if (!existsSync(dir)) continue;
    for (const c of readdirSync(dir)) {
      const toml = join(dir, c, "Cargo.toml");
      if (!existsSync(toml)) continue;
      const text = require("node:fs").readFileSync(toml, "utf8");
      const desc = text.match(/^description\s*=\s*"([^"]*)"/m)?.[1] ?? "";
      crates.push(`| \`${c}\` | ${top} | ${md(desc)} |`);
    }
  }
  return write("WORKSPACE.md", `# Espace de travail next.js canary\n\n## Paquets npm (${pkgRows.length})\n\n| Paquet | Version | Statut | Description |\n|---|---|---|---|\n${pkgRows.join("\n")}\n\n## Plugins et outils (${plugins.length})\n\n${plugins.map((p) => `- \`packages/${p}\``).join("\n")}\n\n## Crates Rust (${crates.length})\n\n| Crate | Dossier | Description |\n|---|---|---|\n${crates.join("\n")}`);
}

mkdirSync(join(OUT, "data"), { recursive: true });
const results = await Promise.allSettled([prs(), commits(), releases(), blog(), workspace()]);
for (const r of results) if (r.status === "rejected") console.error(r.reason);
console.log(`docs/nextjs written (since ${since})`);
