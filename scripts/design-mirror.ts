#!/usr/bin/env bun
// Index and mirror of the reference design sources (docs/design/sources.toml).
//   bun scripts/design-mirror.ts index  [--site s]...  sitemap -> docs/design/index/<site>.json (robots.txt applied)
//   bun scripts/design-mirror.ts mirror [--site s]...  mode=mirror sites only (free licence): markdown text into
//                                                       third_party/design-mirror/<site>/, front matter url/date/sha256/licence
//   bun scripts/design-mirror.ts check                  recompute every mirrored body sha256 against MANIFEST.json
// Proprietary sites (mode=index) never get page bodies written. Images are dropped from mirrored text.
// One request at a time per site, delay_ms between requests; sites run in parallel. Meant to run on fr1.
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";

type Site = {
  name: string;
  base: string;
  sitemaps: string[];
  mode: "mirror" | "index";
  license: string;
  license_evidence: string;
  attribution?: string;
  include: string[];
  exclude: string[];
  delay_ms: number;
};
type Url = { url: string; section: string; lastmod?: string };
type Entry = { url: string; path: string; fetched: string; lastmod?: string; sha256: string; bytes: number };

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    site: { type: "string", multiple: true },
    root: { type: "string" },
    limit: { type: "string" },
  },
  allowPositionals: true,
});
const repo = join(import.meta.dir, "..");
const root = values.root ?? repo;
const limit = values.limit ? Number(values.limit) : Infinity;
const UA = "aphrody-design-mirror/1 (+https://github.com/aphrody-labs/src)";
const today = new Date().toISOString().slice(0, 10);
const cfg = Bun.TOML.parse(await Bun.file(join(repo, "docs/design/sources.toml")).text()) as { site: Site[] };
const sites = cfg.site.filter((s) => !values.site || values.site.includes(s.name));
const sha256 = (s: string) => new Bun.CryptoHasher("sha256").update(s).digest("hex");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, accept = "*/*"): Promise<Response | undefined> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": UA, accept }, signal: AbortSignal.timeout(60_000) });
      if (r.status === 429 || r.status >= 500) {
        await sleep(5_000 * (attempt + 1));
        continue;
      }
      return r;
    } catch {
      await sleep(3_000);
    }
  }
}

// robots.txt, group "*": longest matching rule wins, Allow wins ties; supports * and $.
async function robots(base: string): Promise<(path: string) => boolean> {
  const text = (await (await get(`${base}/robots.txt`))?.text()) ?? "";
  const rules: { allow: boolean; re: RegExp; len: number }[] = [];
  let mine = false;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m as unknown as [string, string, string];
    const key = k.toLowerCase();
    if (key === "user-agent") {
      if (!lastWasAgent) mine = false;
      if (v === "*" || UA.toLowerCase().startsWith(v.toLowerCase())) mine = true;
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!mine || (key !== "allow" && key !== "disallow") || !v) continue;
    const re = new RegExp(
      `^${v.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$|\$$/, "$")}`,
    );
    rules.push({ allow: key === "allow", re, len: v.length });
  }
  return (path) => {
    let best: (typeof rules)[number] | undefined;
    for (const r of rules)
      if (r.re.test(path) && (!best || r.len > best.len || (r.len === best.len && r.allow))) best = r;
    return !best || best.allow;
  };
}

async function sitemap(url: string, seen = new Set<string>()): Promise<{ loc: string; lastmod?: string }[]> {
  if (seen.has(url)) return [];
  seen.add(url);
  const r = await get(url, "application/xml,text/xml,*/*");
  if (!r?.ok) return [];
  let bytes = new Uint8Array(await r.arrayBuffer());
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = Bun.gunzipSync(bytes);
  const xml = new TextDecoder().decode(bytes);
  const blocks = [...xml.matchAll(/<(url|sitemap)>([\s\S]*?)<\/\1>/g)];
  const out: { loc: string; lastmod?: string }[] = [];
  for (const [, kind, body] of blocks) {
    const loc = body!.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1]?.replace(/&amp;/g, "&");
    const lastmod = body!.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1];
    if (!loc) continue;
    if (kind === "sitemap") out.push(...(await sitemap(loc, seen)));
    else out.push({ loc, lastmod });
  }
  return out;
}

async function index(site: Site): Promise<Url[]> {
  const allowed = await robots(site.base);
  const inc = site.include.map((p) => new RegExp(p));
  const exc = site.exclude.map((p) => new RegExp(p));
  const byUrl = new Map<string, Url>();
  for (const sm of site.sitemaps)
    for (const { loc, lastmod } of await sitemap(sm)) {
      let u: URL;
      try {
        u = new URL(loc);
      } catch {
        continue;
      }
      if (u.origin !== new URL(site.base).origin) continue;
      const p = u.pathname.replace(/\/$/, "") || "/";
      const pq = p + u.search;
      if (!allowed(u.pathname + u.search) || !inc.some((r) => r.test(pq)) || exc.some((r) => r.test(pq))) continue;
      const url = `${u.origin}${p}${u.search}`;
      byUrl.set(url, { url, section: p.split("/")[1] || "/", lastmod });
    }
  const urls = [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
  const sections: Record<string, number> = {};
  for (const u of urls) sections[u.section] = (sections[u.section] ?? 0) + 1;
  const file = join(root, "docs/design/index", `${site.name}.json`);
  mkdirSync(dirname(file), { recursive: true });
  await Bun.write(
    file,
    `${JSON.stringify(
      {
        site: site.name,
        generated: today,
        mode: site.mode,
        license: site.license,
        license_evidence: site.license_evidence,
        robots: `${site.base}/robots.txt`,
        count: urls.length,
        sections,
        urls,
      },
      null,
      1,
    )}\n`,
  );
  console.log(`${site.name}: ${urls.length} URLs indexed -> ${file}`);
  return urls;
}

// Mirrored text: markdown served by the site (Accept: text/markdown), images and avatar rows removed.
function clean(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/^\s*(<br\s*\/?>\s*)+$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function mirror(site: Site, urls: Url[]) {
  if (site.mode !== "mirror") return;
  const dir = join(root, "third_party/design-mirror", site.name);
  const manFile = join(dir, "MANIFEST.json");
  const prev = new Map<string, Entry>(
    existsSync(manFile) ? ((await Bun.file(manFile).json()).pages as Entry[]).map((e) => [e.url, e]) : [],
  );
  const pages: Entry[] = [];
  let fetched = 0;
  let skipped = 0;
  for (const u of urls.slice(0, limit)) {
    const rel = `${new URL(u.url).pathname.replace(/^\/|\/$/g, "") || "index"}.md`;
    const old = prev.get(u.url);
    if (old && old.lastmod === u.lastmod && existsSync(join(dir, old.path))) {
      pages.push(old);
      continue;
    }
    await sleep(site.delay_ms);
    const r = await get(u.url, "text/markdown");
    if (!r?.ok || !(r.headers.get("content-type") ?? "").includes("markdown")) {
      skipped++;
      continue;
    }
    const body = clean(await r.text());
    if (body.length < 200) {
      skipped++;
      continue;
    }
    const hash = sha256(body);
    const head = [
      "---",
      `source_url: ${u.url}`,
      `fetched: ${today}`,
      ...(u.lastmod ? [`lastmod: ${u.lastmod}`] : []),
      `sha256: ${hash}`,
      `license: ${site.license}`,
      `attribution: ${site.attribution ?? site.name}`,
      "modified: images et avatars retirés ; texte inchangé sinon",
      "---",
      "",
    ].join("\n");
    await Bun.write(join(dir, rel), `${head}${body}\n`);
    pages.push({ url: u.url, path: rel, fetched: today, lastmod: u.lastmod, sha256: hash, bytes: body.length });
    if (++fetched % 25 === 0) console.log(`${site.name}: ${fetched} fetched`);
  }
  pages.sort((a, b) => a.url.localeCompare(b.url));
  await Bun.write(
    manFile,
    `${JSON.stringify({ site: site.name, license: site.license, attribution: site.attribution, generated: today, count: pages.length, pages }, null, 1)}\n`,
  );
  await Bun.write(
    join(dir, "README.md"),
    [
      `# ${site.name} (miroir texte)`,
      "",
      `Source : ${site.base}. Licence : ${site.license}.`,
      `Preuve : ${site.license_evidence}.`,
      `Attribution : ${site.attribution ?? site.name}. Contenu modifié : images retirées, texte servi en markdown par le site.`,
      "Licences : https://creativecommons.org/licenses/by/4.0/ et https://www.apache.org/licenses/LICENSE-2.0 .",
      `Pages : ${pages.length} (MANIFEST.json : URL, date, sha256). Régénéré par \`bun scripts/design-mirror.ts mirror --site ${site.name}\`.`,
      "",
    ].join("\n"),
  );
  console.log(`${site.name}: ${pages.length} pages mirrored (${fetched} fetched now, ${skipped} skipped)`);
}

async function check(): Promise<number> {
  let bad = 0;
  for (const site of cfg.site.filter((s) => s.mode === "mirror")) {
    const dir = join(root, "third_party/design-mirror", site.name);
    const manFile = join(dir, "MANIFEST.json");
    if (!existsSync(manFile)) continue;
    for (const e of (await Bun.file(manFile).json()).pages as Entry[]) {
      const f = Bun.file(join(dir, e.path));
      const text = (await f.exists()) ? await f.text() : "";
      const body = text.replace(/^---\n[\s\S]*?\n---\n\n/, "").replace(/\n$/, "");
      if (sha256(body) !== e.sha256) {
        bad++;
        console.error(`sha256 mismatch: ${site.name}/${e.path}`);
      }
    }
  }
  console.log(bad ? `${bad} mismatches` : "design-mirror: all sha256 ok");
  return bad ? 1 : 0;
}

const cmd = positionals[0] ?? "index";
if (cmd === "check") process.exit(await check());
if (cmd !== "index" && cmd !== "mirror") {
  console.error("usage: bun scripts/design-mirror.ts index|mirror|check [--site name]... [--root dir] [--limit n]");
  process.exit(2);
}
await Promise.all(
  sites.map(async (s) => {
    const urls = await index(s);
    if (cmd === "mirror") await mirror(s, urls);
  }),
);
