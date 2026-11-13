#!/usr/bin/env bun
/**
 * One unified NIE workflow: game VFS (nie) + inagle/zukan + wikis + aphrody assets (ay) -> one
 * optimised archive, an AI-training dataset and the cross-platform assets of aphrody.com.
 *
 *   bun run nie:archive                    lean pass (default), resumable
 *   bun run nie:archive all --full         every stage, whole VFS preset
 *   bun run nie:archive models,dataset     named stages only
 *
 * Stages: probe vfs zukan wiki icons models textures audio video data assets theme dataset site pack
 * Output: var/nie-archive (override with --out=DIR). Nothing is deleted from the game install.
 *
 * Formats produced: webp webm svg ico md mdx txt html json ts rs db sqlite glb wav + tar.gz
 */
import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";

// ---------------------------------------------------------------- arguments

const argv: string[] = Bun.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string, d?: string) => {
  const hit = argv.find((a: string) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const positional: string[] = argv.filter((a: string) => !a.startsWith("--"));

const GAME = opt(
  "game-dir",
  process.env.NIE_GAME_DIR ??
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\INAZUMA ELEVEN Victory Road",
)!;
const OUT = opt("out", join(import.meta.dir, "var", "nie-archive"))!;
const FULL = flag("full");
const FORCE = flag("force");
const JOBS = Number(opt("jobs", "6"));
const QUICK = flag("quick");
const STAGE_TIMEOUT = Number(opt("timeout", "1800")) * 1000;
const WIKI = !flag("no-web");
// The single archive holds the raw VFS dumps too (game tables, text, fonts, VN assets) unless
// `--no-pack-raw` is passed.
const PACK_RAW = !flag("no-pack-raw");

const HOME = process.env.USERPROFILE ?? process.env.HOME ?? ".";
export const ROOT = join(import.meta.dir, "..", ".."); // C:\src

// ---------------------------------------------------------------- tooling

const which = (b: string) => Bun.which(b) ?? null;
const NIE = which("nie") ?? "nie.exe";
const ASSETS_CLI = join(ROOT, "packages", "assets", "src", "cli.ts");
const AY = which("ay");
const AY_HAS_ASSETS = (() => {
  if (!AY) return false;
  try {
    // Probe the subcommand itself: an old `ay` mentions "brand" in its help but has no `assets`.
    const r = Bun.spawnSync([AY, "assets", "gen", "--help"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    return r.exitCode === 0;
  } catch {
    return false;
  }
})();
const FFMPEG = which("ffmpeg");
const CWEBP = which("cwebp");

// The compiled nie wasm exposes model_to_glb(g4md, g4mg) -> GLB (glTF 2.0).
const WASM_DIRS = [
  opt("wasm-dir"),
  join(
    ROOT,
    "apps",
    "rosegriffon",
    "packages",
    "nie-web",
    "src",
    "nie-wasm-web",
  ),
].filter(Boolean) as string[];
const ZUKAN_CATALOG = join(
  ROOT,
  "apps",
  "rosegriffon",
  "packages",
  "inagle",
  "src",
  "zukan",
  "catalog.json",
);
const ZUKAN_HASHES = join(
  ROOT,
  "apps",
  "rosegriffon",
  "packages",
  "inagle",
  "src",
  "zukan",
  "zukan-hashes.json",
);
const INAGLE_DATA = join(
  ROOT,
  "apps",
  "rosegriffon",
  "packages",
  "inagle",
  "data",
);

// ---------------------------------------------------------------- web sources

const ZUKAN_PARAM = [
  "https://zukan.inazuma.jp/en/chara_param/?q=hN2ZlpOLmo2gnJeejZ6glpugjIuN3cWk3ZzPzs_PzsbPz92igg%3D%3D",
  "https://zukan.inazuma.jp/en/chara_param/?q=hN2ZlpOLmo2gnJeejZ6glpugjIuN3cWk3ZzPys_NycrGz92igg%3D%3D",
  "https://zukan.inazuma.jp/en/chara_param/?q=hN2ZlpOLmo2gnJeejZ6glpugjIuN3cWk3ZzPyM_Hz8_Oz92igg%3D%3D",
];
const ZUKAN_MODEL = [
  "https://zukan.inazuma.jp/en/chara_model_view/?q=hN2cl56NnpyLmo2glpvdxaTdnM_Kz83JysbP3aKC",
];
const WIKI_URLS = [
  "https://inazuma-eleven.fandom.com/wiki/Afuro_Terumi",
  "https://inazuma-eleven.fandom.com/fr/wiki/Byron_Love",
  "https://manga-encyclopedie.fandom.com/fr/wiki/Afuro_Terumi_(Inazuma_Eleven)",
];
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 aphrody-nie-archive/2.0";

// ---------------------------------------------------------------- layout

const D = {
  raw: join(OUT, "raw"),
  gamedata: join(OUT, "raw", "gamedata"),
  chr: join(OUT, "raw", "chr"),
  sound: join(OUT, "raw", "sound"),
  movie: join(OUT, "raw", "movie"),
  web: join(OUT, "web"),
  zukan: join(OUT, "zukan"),
  wiki: join(OUT, "wiki"),
  icons: join(OUT, "icons"),
  images: join(OUT, "images"),
  models: join(OUT, "models"),
  audio: join(OUT, "audio"),
  video: join(OUT, "video"),
  data: join(OUT, "data"),
  logs: join(OUT, "data", "logs"),
  theme: join(OUT, "theme"),
  dataset: join(OUT, "dataset"),
  site: join(OUT, "site"),
  pack: join(OUT, "pack"),
};
const ALL_DIRS = Object.values(D);
for (const d of ALL_DIRS) mkdirSync(d, { recursive: true });
const DB_PATH = join(D.data, "nie.sqlite");

/** The archive schema, applied in order against `pragma user_version`. Adding a table means
 * appending a migration, never editing one that already shipped. */
const MIGRATIONS: { version: number; name: string; statements: string[] }[] = [
  {
    version: 1,
    name: "init",
    statements: [
      "create table if not exists meta(key text primary key, value text)",
      `create table if not exists characters(
        id text primary key, model_id text, name text, nickname text, slug text, game text,
        position text, element text, level int, description text, stats text, obtain text,
        portraits text, glb text, sources text)`,
      "create index if not exists characters_model on characters(model_id)",
      "create index if not exists characters_slug on characters(slug)",
      "create table if not exists asset(id text primary key, path text, kind text, bytes int, sha256 text)",
      "create index if not exists asset_kind on asset(kind)",
      "create table if not exists doc(path text primary key, title text, source text, body text, sha256 text)",
      "create table if not exists dataset(name text primary key, rows int, bytes int, sha256 text)",
      "create table if not exists stage(name text primary key, ok int, ms int, steps int, failed int, note text)",
    ],
  },
  {
    version: 2,
    name: "search",
    statements: [
      // Full-text search over the wiki corpus and the joined cards, so the archive answers
      // questions without a server.
      `create virtual table if not exists doc_fts using fts5(
        path unindexed, title, body, tokenize = 'unicode61 remove_diacritics 2')`,
      `create virtual table if not exists character_fts using fts5(
        id unindexed, name, nickname, description, tokenize = 'unicode61 remove_diacritics 2')`,
    ],
  },
  {
    version: 3,
    name: "search_content",
    statements: [
      // v2 built the indexes, but an external-content FTS5 table only fills from a rebuild
      // once its shadow tables are consistent; recreating them makes the first rebuild index
      // the rows that already exist.
      "drop table if exists doc_fts",
      "drop table if exists character_fts",
      `create virtual table doc_fts using fts5(
        path, title, body, content='doc', content_rowid='rowid',
        tokenize = 'unicode61 remove_diacritics 2')`,
      `create virtual table character_fts using fts5(
        id, name, nickname, description, content='characters', content_rowid='rowid',
        tokenize = 'unicode61 remove_diacritics 2')`,
    ],
  },
];

// ---------------------------------------------------------------- logging

type StageResult = {
  stage: string;
  ok: boolean;
  ms: number;
  steps: number;
  failed: number;
  note?: string;
};
const results: StageResult[] = [];
const failures: string[] = [];

const ms = (t: number) => Math.round(performance.now() - t);
const say = (s: string) => console.log(s);
const warn = (s: string) => console.error(s);

function record(r: StageResult) {
  results.push(r);
  writeFileSync(join(D.data, "status.json"), JSON.stringify(results, null, 2));
}

// ---------------------------------------------------------------- process

type Run = { ok: boolean; out: string; err: string; code: number; ms: number };

async function exec(
  cmd: string[],
  o: { cwd?: string; timeout?: number; env?: Record<string, string> } = {},
): Promise<Run> {
  const t = performance.now();
  const bin = which(cmd[0]) ?? cmd[0];
  let p: ReturnType<typeof Bun.spawn>;
  try {
    p = Bun.spawn([bin, ...cmd.slice(1)], {
      cwd: o.cwd ?? GAME,
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, ...o.env },
    });
  } catch (e) {
    return { ok: false, out: "", err: String(e), code: -1, ms: ms(t) };
  }
  // `timeout: 0` means no limit (long archive builds), so only a positive value arms the timer.
  const limit = o.timeout ?? STAGE_TIMEOUT;
  const timer =
    limit > 0
      ? setTimeout(() => {
          try {
            p.kill("SIGKILL");
          } catch {
            /* already gone */
          }
        }, limit)
      : null;
  const [out, err] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
  ]);
  const code = await p.exited;
  if (timer) clearTimeout(timer);
  return { ok: code === 0, out, err, code, ms: ms(t) };
}

/** Run one nie/ffmpeg command as a logged step; never throws. */
async function step(
  stage: string,
  label: string,
  cmd: string[],
  o: { cwd?: string; timeout?: number; quiet?: boolean } = {},
): Promise<Run> {
  const r = await exec(cmd, o);
  writeFileSync(
    join(D.logs, `${stage}.${label.replace(/[^\w.-]+/g, "_")}.log`),
    `$ ${cmd.join(" ")}\n# exit=${r.code} ms=${r.ms}\n--- stdout ---\n${r.out}\n--- stderr ---\n${r.err}\n`,
  );
  if (!r.ok) {
    failures.push(
      `${stage}/${label}: exit ${r.code} ${(r.err || r.out).trim().slice(0, 240)}`,
    );
    if (!o.quiet) warn(`  ! ${stage}/${label} exit=${r.code}`);
  } else if (!o.quiet) {
    say(`  · ${stage}/${label} ${r.ms}ms`);
  }
  return r;
}

async function pool<T>(
  items: T[],
  n: number,
  fn: (x: T, i: number) => Promise<void>,
): Promise<void> {
  let i = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(n, items.length)) },
    async () => {
      while (i < items.length) {
        const k = i++;
        try {
          await fn(items[k]!, k);
        } catch (e) {
          failures.push(String(e).slice(0, 240));
        }
      }
    },
  );
  await Promise.all(workers);
}

// ---------------------------------------------------------------- files

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}
const rel = (p: string) => relative(OUT, p).replaceAll("\\", "/");
const put = async (p: string, body: string | Uint8Array | Blob) => {
  mkdirSync(dirname(p), { recursive: true });
  await Bun.write(p, body);
  return p;
};
const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const slug = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const norm = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// ---------------------------------------------------------------- zukan parsing

type Stats = Record<string, number>;
type Card = {
  id: string;
  modelId?: string;
  name: string;
  nickname?: string;
  slug: string;
  game?: string;
  position?: string;
  element?: string;
  stats?: Stats;
  level?: number;
  description?: string;
  obtain?: { group: string; entries: string[] }[];
  basic?: Record<string, string>;
  portrait?: string;
  portraitHash?: string;
  viewerUrl?: string;
  zukanUrl?: string;
  lang: string;
  sources: string[];
};

const strip = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function parseZukanCard(html: string, url: string, lang = "en"): Card | null {
  const name = strip(
    html.match(/<span class="name">([\s\S]*?)<\/span>/)?.[1] ?? "",
  );
  if (!name) return null;
  const nickname = strip(
    html.match(/<span class="nickname">([\s\S]*?)<\/span>/)?.[1] ?? "",
  );
  const game = strip(
    html.match(/<dl class="appearedWorks">[\s\S]*?<dd>([\s\S]*?)<\/dd>/)?.[1] ??
      "",
  );
  const description = strip(
    html.match(/<p class="description">([\s\S]*?)<\/p>/)?.[1] ?? "",
  );
  const pic =
    html.match(/<source type="image\/webp"\s+srcset="([^"]+)"/) ??
    html.match(/<img src="(https?:[^"]+\.png)"/);
  const viewer = html.match(/href="(\/[a-z]{2}\/chara_model_view\/\?q=[^"]+)"/);

  const obtain: { group: string; entries: string[] }[] = [];
  const getBlock =
    html.match(
      /<dl class="getTxt">([\s\S]*?)<\/dl>\s*<ul class="param">/,
    )?.[1] ?? "";
  for (const m of getBlock.matchAll(/<dl>([\s\S]*?)<\/dl>/g)) {
    const inner = m[1]!;
    const dt = strip(inner.match(/<dt>([\s\S]*?)<\/dt>/)?.[1] ?? "");
    const entries = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) =>
      strip(x[1]!),
    );
    const paras = [...inner.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((x) =>
      strip(x[1]!),
    );
    if (dt)
      obtain.push({
        group: dt,
        entries: [...paras, ...entries].filter(Boolean),
      });
  }

  const stats: Stats = {};
  let level = 50;
  for (const m of html.matchAll(
    /<dt>(Kick|Control|Technique|Pressure|Physical|Agility|Intelligence)<\/dt>\s*<dd>\s*<table>[\s\S]*?<th>Lv(\d+)<\/th>[\s\S]*?<td>(\d+)<\/td>/g,
  )) {
    stats[m[1]!.toLowerCase()] = Number(m[3]);
    level = Number(m[2]);
  }
  const one = (label: string) =>
    strip(
      html.match(
        new RegExp(`<dt>${label}</dt>\\s*<dd>([\\s\\S]*?)</dd>`),
      )?.[1] ?? "",
    ) || undefined;
  const basic: Record<string, string> = {};
  for (const [k, v] of [
    ["ageGroup", one("Age Group")],
    ["schoolYear", one("School Year")],
    ["gender", one("Gender")],
    ["role", one("Character Role")],
  ] as const)
    if (v) basic[k] = v;

  return {
    id: "",
    name,
    nickname: nickname || undefined,
    slug: slug(`${name}${nickname ? `-${nickname}` : ""}`),
    game: game || undefined,
    position: one("Position"),
    element: one("Element"),
    stats: Object.keys(stats).length ? stats : undefined,
    level,
    description: description || undefined,
    obtain: obtain.length ? obtain : undefined,
    basic: Object.keys(basic).length ? basic : undefined,
    portrait: pic?.[1],
    viewerUrl: viewer ? new URL(viewer[1]!, url).href : undefined,
    zukanUrl: url,
    lang,
    sources: [url],
  };
}

/** `<select>` of the model viewer: the complete zukan-name -> game model id map. */
function parseModelMap(html: string): { modelId: string; name: string }[] {
  return [
    ...html.matchAll(/<option value="(c\d{8})"[^>]*>([^<]*)<\/option>/g),
  ].map((m) => ({
    modelId: m[1]!,
    name: strip(m[2]!),
  }));
}

/** Model viewer pages also carry the internal model id of the character they show. */
function modelIdOf(html: string): string | undefined {
  return (
    html.match(/<option value="(c\d{8})"\s+selected/)?.[1] ??
    html.match(/\b(c\d{8})\b/)?.[1]
  );
}

// ---------------------------------------------------------------- wiki parsing

function wikiToMarkdown(
  html: string,
  url: string,
): { title: string; md: string; text: string } {
  const title =
    strip(
      html.match(
        /<h1[^>]*class="page-header__title"[^>]*>([\s\S]*?)<\/h1>/,
      )?.[1] ?? "",
    ) || strip(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? url);
  const body =
    html.match(
      /<div class="[^"]*mw-parser-output[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div class="page-footer">/,
    )?.[1] ??
    html.match(/<div class="[^"]*mw-parser-output[^"]*"[^>]*>([\s\S]*)/)?.[1] ??
    html;
  const html2 = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<sup[^>]*class="reference"[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<table[\s\S]*?<\/table>/gi, (t) => {
      const rows = [...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
        [...r[1]!.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)]
          .map((c) => strip(c[1]!))
          .join(" | "),
      );
      return `\n\n${rows.join("\n")}\n\n`;
    });
  const md = html2
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, h) => `\n\n## ${strip(h)}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, h) => `\n\n### ${strip(h)}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, l) => `\n- ${strip(l)}`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, p) => `\n\n${strip(p)}\n\n`)
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const text = md
    .replace(/^#+ /gm, "")
    .replace(/[*_`>]/g, "")
    .trim();
  return { title, md: `# ${title}\n\n> Source: ${url}\n\n${md}\n`, text };
}

// ---------------------------------------------------------------- GLB (wasm)

let wasm: {
  model_to_glb: (a: Uint8Array, b: Uint8Array) => Uint8Array;
} | null = null;
async function glbOf(g4md: Uint8Array, g4mg: Uint8Array): Promise<Uint8Array> {
  if (!wasm) {
    for (const dir of WASM_DIRS) {
      const js = join(dir, "nie_wasm.js");
      const bg = join(dir, "nie_wasm_bg.wasm");
      if (!existsSync(js) || !existsSync(bg)) continue;
      const mod = (await import(js)) as unknown as {
        initSync: (o: { module: WebAssembly.Module }) => void;
        model_to_glb: (a: Uint8Array, b: Uint8Array) => Uint8Array;
      };
      mod.initSync({ module: new WebAssembly.Module(readFileSync(bg)) });
      wasm = { model_to_glb: mod.model_to_glb };
      break;
    }
  }
  if (!wasm)
    throw new Error("nie wasm (model_to_glb) introuvable: --wasm-dir=<path>");
  return wasm.model_to_glb(g4md, g4mg);
}

// ---------------------------------------------------------------- game palette
// Element -> hue, the only colours the game data itself states about a character.
const ELEMENT_HUE: Record<string, number> = {
  fire: 8,
  forest: 142,
  wind: 178,
  mountain: 32,
  void: 268,
  light: 48,
  shadow: 285,
  none: 220,
};

/** The element token of a card, restricted to the values the game itself uses. */
const elToken = (element: string | undefined): string => {
  const e = (element ?? "").toLowerCase().trim();
  return e in ELEMENT_HUE ? e : "none";
};

/** The GLB of a character, if the models stage wrote one. */
const glbFor = (c: Card): string | null => {
  const id = c.modelId;
  if (id && existsSync(join(D.models, `${id}.glb`))) return `models/${id}.glb`;
  return (c as Card & { glb?: string }).glb ?? null;
};

// ---------------------------------------------------------------- stages

type Ctx = {
  cards: Card[];
  modelMap: Map<string, string>; // modelId -> name
  byModel: Map<string, Card>; // modelId -> rich card
  vfs: { g4md: string[]; g4mg: string[]; g4tx: string[] };
};

const ctx: Ctx = {
  cards: [],
  modelMap: new Map(),
  byModel: new Map(),
  vfs: { g4md: [], g4mg: [], g4tx: [] },
};

/** The survey state (cards, model map, VFS index) survives between runs, so a stage can be
 * replayed alone (`bun run nie:archive dataset`) without redoing probe/vfs/zukan. */
const STATE_PATH = join(D.data, "state.json");
function saveState() {
  writeFileSync(
    STATE_PATH,
    JSON.stringify({
      savedAt: new Date().toISOString(),
      cards: ctx.cards,
      modelMap: [...ctx.modelMap],
      byModel: [...ctx.byModel],
      vfs: ctx.vfs,
    }),
  );
}
function loadState(): boolean {
  if (!existsSync(STATE_PATH)) return false;
  try {
    const s = JSON.parse(readFileSync(STATE_PATH, "utf8")) as {
      cards?: Card[];
      modelMap?: [string, string][];
      byModel?: [string, Card][];
      vfs?: Ctx["vfs"];
    };
    ctx.cards = s.cards ?? [];
    ctx.modelMap = new Map(s.modelMap ?? []);
    ctx.byModel = new Map(s.byModel ?? []);
    if (s.vfs) ctx.vfs = { ...ctx.vfs, ...s.vfs };
    return ctx.byModel.size > 0;
  } catch {
    return false;
  }
}

/** 1. What this install is: binary hash, VFS volume, locales, format coverage. */
async function stageProbe() {
  const t = performance.now();
  const before = failures.length;
  const json: [string, string[]][] = [
    ["info", [NIE, "info", "--game-dir", GAME, "--json"]],
    [
      "locales",
      [NIE, "locales", "--game-dir", GAME, "--json", "--samples", "2"],
    ],
    [
      "formats",
      [NIE, "vfs", "formats", "--game-dir", GAME, "--limit", "2000", "-j"],
    ],
  ];
  let steps = 0;
  for (const [name, cmd] of json) {
    const r = await step("probe", name, cmd);
    steps++;
    const body = (r.out || "").trim();
    if (body.startsWith("{") || body.startsWith("["))
      await put(join(D.data, `probe-${name}.json`), body + "\n");
    else failures.push(`probe/${name}: pas de json`);
  }
  const stats = await step("probe", "vfs-stats", [
    NIE,
    "vfs",
    "stats",
    "--game-dir",
    GAME,
    "--top",
    "80",
  ]);
  steps++;
  if (stats.ok) await put(join(D.data, "probe-vfs-stats.txt"), stats.out);
  await step("probe", "atlas-status", [NIE, "atlas", "status"]);
  steps++;
  record({
    stage: "probe",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
  });
}

/** 2. VFS: the game tables, the character assets, sound and film, bounded by default. */
async function stageVfs() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;

  // 2a. game tables (the whole gamedata subtree: ~206 MB of cfg.bin)
  const gamedata = await step(
    "vfs",
    "gamedata",
    [
      NIE,
      "viola",
      "dump",
      "--out",
      D.gamedata,
      "--filtre",
      "data/common/gamedata/**",
      "--index",
      "--game-dir",
      GAME,
    ],
    { timeout: STAGE_TIMEOUT * 3 },
  );
  steps++;

  // 2b. index the VFS extensions we actually consume (json, bounded, no extraction)
  for (const ext of ["g4md", "g4mg", "g4tx"]) {
    const r = await exec([
      NIE,
      "vfs",
      "find",
      "",
      "--ext",
      ext,
      "--limit",
      FULL ? "1000000" : "20000",
      "--json",
      "--game-dir",
      GAME,
    ]);
    steps++;
    if (r.ok) {
      try {
        const arr = JSON.parse(r.out.trim()) as {
          path?: string;
          chemin?: string;
        }[];
        ctx.vfs[ext as "g4md"] = arr
          .map((x) => x.path ?? x.chemin ?? "")
          .filter(Boolean);
      } catch {
        failures.push(`vfs/find-${ext}: json illisible`);
      }
    }
  }
  await put(
    join(D.data, "vfs-index.json"),
    JSON.stringify(
      {
        g4md: ctx.vfs.g4md.length,
        g4mg: ctx.vfs.g4mg.length,
        g4tx: ctx.vfs.g4tx.length,
      },
      null,
      2,
    ),
  );

  // 2c. localised text and fonts (small), always useful
  steps++;
  await step("vfs", "text", [
    NIE,
    "viola",
    "dump",
    "--out",
    join(D.raw, "text"),
    "--filtre",
    "data/dx11/text/**",
    "--game-dir",
    GAME,
  ]);
  steps++;
  await step("vfs", "font", [
    NIE,
    "viola",
    "dump",
    "--out",
    join(D.raw, "font"),
    "--filtre",
    "data/dx11/font/**",
    "--game-dir",
    GAME,
  ]);

  // 2d. the whole menu tree and the admin presets, opt-in only: the menu alone is several GiB
  if (FULL) {
    steps++;
    await step(
      "vfs",
      "menu",
      [
        NIE,
        "viola",
        "dump",
        "--out",
        join(D.raw, "menu"),
        "--filtre",
        "data/dx11/menu/**",
        "--index",
        "--game-dir",
        GAME,
      ],
      { timeout: 0 },
    );
    steps++;
    await step(
      "vfs",
      "dump-assets",
      [
        NIE,
        "viola",
        "dump",
        "--out",
        join(D.raw, "vfs"),
        "--preset",
        "assets",
        "--index",
        "--game-dir",
        GAME,
      ],
      { timeout: 0 },
    );
  }
  record({
    stage: "vfs",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `g4md=${ctx.vfs.g4md.length} g4mg=${ctx.vfs.g4mg.length} g4tx=${ctx.vfs.g4tx.length}`,
  });
}

/** 3. Zukan: the official codex pages, the complete model map, the inagle catalog. */
async function stageZukan() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;
  const wait = (n: number) => new Promise((r) => setTimeout(r, n));

  // 3a. the character pages given as sources
  for (const [i, url] of ZUKAN_PARAM.entries()) {
    steps++;
    const name = `param-${String(i).padStart(2, "0")}`;
    try {
      const r = await fetch(url, { headers: { "user-agent": UA } });
      if (!r.ok) throw new Error(`http ${r.status}`);
      const html = await r.text();
      await put(join(D.web, `${name}.html`), html);
      const card = parseZukanCard(html, url);
      if (!card) throw new Error("card illisible");
      ctx.cards.push(card);
      await put(
        join(D.zukan, `${card.slug}.json`),
        JSON.stringify(card, null, 2),
      );
      say(
        `  · zukan ${card.name}${card.nickname ? ` (${card.nickname})` : ""} model=${card.modelId ?? "?"}`,
      );
    } catch (e) {
      failures.push(`zukan/${name}: ${e}`);
    }
  }

  // 3b. model viewer pages: the complete name -> modelId map, and the viewer's own id
  for (const [i, url] of ZUKAN_MODEL.entries()) {
    steps++;
    try {
      const r = await fetch(url, { headers: { "user-agent": UA } });
      if (!r.ok) throw new Error(`http ${r.status}`);
      const html = await r.text();
      await put(join(D.web, `model-${i}.html`), html);
      const map = parseModelMap(html);
      for (const m of map) ctx.modelMap.set(m.modelId, m.name);
      const shown = modelIdOf(html);
      const title = strip(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "")
        .split("|")[0]!
        .trim();
      for (const c of ctx.cards)
        if (shown && norm(c.name) === norm(title)) c.modelId = shown;
      say(`  · zukan model map ${map.length} character(s) -> modelId`);
    } catch (e) {
      failures.push(`zukan/model-${i}: ${e}`);
    }
  }

  // 3c. inagle: the offline catalog (5400+ characters with stats) and the hash index
  if (!existsSync(ZUKAN_CATALOG)) {
    failures.push(`zukan: catalog inagle absent (${ZUKAN_CATALOG})`);
    record({ stage: "zukan", ok: false, ms: ms(t), steps, failed: 1 });
    return;
  }
  steps++;
  const catalog = (await Bun.file(ZUKAN_CATALOG).json()) as {
    name: string;
    nickname?: string;
    zukanHash?: string;
    position?: string;
    element?: string;
    stats?: Stats;
    game?: string;
    gender?: string;
  }[];
  await put(join(D.zukan, "catalog.json"), JSON.stringify(catalog));
  const byName = new Map(catalog.map((c) => [norm(c.name), c]));

  // every model id in the map becomes a character; the catalog enriches it
  for (const [modelId, name] of ctx.modelMap) {
    const hit = byName.get(norm(name));
    ctx.byModel.set(modelId, {
      id: modelId,
      modelId,
      name: hit?.name ?? name,
      nickname: hit?.nickname,
      slug: slug(name),
      game: hit?.game,
      position: hit?.position,
      element: hit?.element,
      stats: hit?.stats,
      lang: "en",
      basic: hit?.gender ? { gender: hit.gender } : undefined,
      sources: ["https://zukan.inazuma.jp/en/chara_model_view/"],
    } as Card);
  }

  // the rich cards win over the light ones
  for (const c of ctx.cards) {
    const hit = byName.get(norm(c.name));
    if (hit?.stats && !c.stats) c.stats = hit.stats;
    if (hit?.zukanHash)
      (c as Card & { zukanHash?: string }).zukanHash = hit.zukanHash;
    c.id = c.modelId ?? slug(c.name);
    if (c.modelId)
      ctx.byModel.set(c.modelId, { ...ctx.byModel.get(c.modelId), ...c });
  }

  // 3d. official portraits from the CDN the pages themselves use, stored locally
  steps++;
  // A resumed state already carries local portrait paths; only remote URLs are fetched.
  const portraits = ctx.cards.filter((c) => c.portrait?.startsWith("http"));
  let got = ctx.cards.filter((c) => c.portrait?.startsWith("images/")).length;
  const missed: string[] = [];
  for (const c of portraits) {
    // A portrait is decoration: the card, stats and model are the archive. CDN hiccups are
    // retried, then recorded as a note rather than a stage failure.
    let ok = false;
    let last = "";
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      try {
        if (attempt) await wait(800 * attempt);
        const r = await fetch(c.portrait!, { headers: { "user-agent": UA } });
        if (!r.ok) throw new Error(`http ${r.status}`);
        const ext = extname(new URL(c.portrait!).pathname) || ".webp";
        const target = `images/zukan/${c.slug}${ext}`;
        await put(join(OUT, target), new Uint8Array(await r.arrayBuffer()));
        c.portrait = target;
        got++;
        ok = true;
        await wait(120); // be a good guest on the codex CDN
      } catch (e) {
        last = String(e);
      }
    }
    if (!ok) missed.push(`${c.slug}: ${last}`);
  }
  if (missed.length) warn(`  ! portraits absents: ${missed.join(", ")}`);
  // propagate the local portrait to the merged card
  for (const c of ctx.cards)
    if (c.modelId)
      ctx.byModel.set(c.modelId, {
        ...ctx.byModel.get(c.modelId),
        portrait: c.portrait,
        description: c.description,
        obtain: c.obtain,
        basic: c.basic,
        position: c.position,
        element: c.element,
        stats: c.stats,
        game: c.game,
        nickname: c.nickname,
        sources: c.sources,
      } as Card);
  say(
    `  · portraits ${got}/${portraits.length}, ${ctx.byModel.size} character(s)`,
  );

  // 3e. the inagle hash index and its compiled data, as sidecars
  if (existsSync(ZUKAN_HASHES)) {
    steps++;
    await put(
      join(D.zukan, "zukan-hashes.json"),
      await Bun.file(ZUKAN_HASHES).text(),
    );
  }
  if (existsSync(INAGLE_DATA)) {
    steps++;
    for (const f of readdirSync(INAGLE_DATA)) {
      const src = join(INAGLE_DATA, f);
      if (statSync(src).isFile())
        await put(join(D.zukan, "inagle", f), await Bun.file(src).text());
    }
  }
  const all = [...ctx.byModel.values()];
  await put(
    join(D.dataset, "characters.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: all.length,
        characters: all,
      },
      null,
      2,
    ),
  );
  record({
    stage: "zukan",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${all.length} characters, ${ctx.modelMap.size} models, ${got} portrait(s)`,
  });
  saveState();
}

/** 4. Wikis: the pages as raw html, text, markdown, mdx and wikitext. */
async function stageWiki() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;
  const skipped: string[] = [];
  const docs: {
    url: string;
    title: string;
    md: string;
    text: string;
    sha256: string;
  }[] = [];

  /** Fandom serves a language API at /<lang>/api.php for /<lang>/wiki/ pages. */
  const apiBase = (u: URL) => {
    const lang = u.pathname.match(/^\/([a-z]{2})\/wiki\//)?.[1];
    return `https://${u.hostname}${lang ? `/${lang}` : ""}/api.php`;
  };
  const apiParse = async (u: URL, page: string, prop: "text" | "wikitext") => {
    const url = `${apiBase(u)}?action=parse&page=${encodeURIComponent(page)}&format=json&formatversion=2&redirects=1&prop=${prop}`;
    const r = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/json" },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      parse?: { title?: string; text?: string; wikitext?: string };
    };
    return j.parse ?? null;
  };

  for (const [i, url] of WIKI_URLS.entries()) {
    steps++;
    const u = new URL(url);
    const page = decodeURIComponent(
      u.pathname.split("/wiki/")[1] ?? u.pathname.split("/").pop() ?? "page",
    );
    const name = `${String(i).padStart(2, "0")}-${u.hostname}-${slug(page)}`;
    try {
      let html = "";
      let wikitext: string | undefined;
      let title = page.replaceAll("_", " ");

      // 1) the rendered page, as a browser would get it
      const raw = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept: "text/html,application/xhtml+xml",
        },
      }).catch(() => null);
      if (raw?.ok) {
        html = await raw.text();
        if (html.includes("mw-parser-output") === false) {
          const why = html.match(
            /We couldn(?:&#0?39;|')t find an English wiki at this URL/,
          )?.[0];
          if (why) {
            skipped.push(
              `wiki/${name}: source morte — ${why.replace(/&#0?39;/g, "'")}`,
            );
            await put(join(D.web, `${name}.html`), html);
            say(
              `  · wiki ${u.hostname}${u.pathname}: source morte (aucun wiki anglais) — html conservé`,
            );
            continue;
          }
        }
      }
      if (!html) {
        const api = await apiParse(u, page, "text");
        if (!api?.text)
          throw new Error(
            `http ${raw ? raw.status : "réseau"} et API indisponible`,
          );
        html = api.text;
        title = api.title ?? title;
      }
      // 2) the wikitext, the cleanest training form
      const api = await apiParse(u, page, "wikitext").catch(() => null);
      if (api?.wikitext) wikitext = api.wikitext;
      title =
        api?.title ||
        strip(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "")
          .split("|")[0]!
          .trim() ||
        title;

      await put(join(D.web, `${name}.html`), html);
      if (wikitext) await put(join(D.web, `${name}.wiki.txt`), wikitext);
      const parsed = wikiToMarkdown(html, url);
      const text = parsed.text;
      if (text.length < 200) {
        const api2 = await apiParse(u, page, "text");
        if (!api2?.text) throw new Error(`texte vide (${text.length})`);
        html = api2.text;
        await put(join(D.web, `${name}.html`), html);
      }
      const md = wikiToMarkdown(html, url).md.replace(/^# .*$/m, `# ${title}`);
      const body = wikiToMarkdown(html, url).text;
      await put(join(D.wiki, `${name}.md`), md);
      await put(
        join(D.wiki, `${name}.mdx`),
        `export const meta = ${JSON.stringify({ title, source: url, wikitext: Boolean(wikitext) }, null, 2)};\n\n${md.replace(/^# /m, "## ")}`,
      );
      await put(join(D.wiki, `${name}.txt`), body);
      docs.push({
        url,
        title,
        md,
        text: body,
        sha256: sha(new TextEncoder().encode(html)),
      });
      say(
        `  · wiki ${title} (${body.length} chars${wikitext ? `, wikitext ${wikitext.length}` : ""})`,
      );
    } catch (e) {
      failures.push(`wiki/${name}: ${e}`);
    }
  }
  await put(
    join(D.dataset, "corpus.jsonl"),
    docs.map((d) => JSON.stringify({ kind: "wiki", ...d })).join("\n") + "\n",
  );
  if (skipped.length)
    await put(
      join(D.data, "wiki-skipped.json"),
      JSON.stringify(skipped, null, 2),
    );
  record({
    stage: "wiki",
    ok: failures.length === before && docs.length > 0,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${docs.length} document(s), ${skipped.length} dead source(s)`,
  });
}

/** 5. Icons: the game icon index, decoded PNG, webp, an ico and an svg sprite. */
async function stageIcons() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;
  const limit = FULL ? "20000" : "600";
  const idx = join(D.icons, "index.json");
  steps++;
  await step("icons", "index", [
    NIE,
    "icons",
    "--game-dir",
    GAME,
    "index",
    "--out",
    idx,
    "--skip",
    "01_icon_emblem",
  ]);
  steps++;
  await step("icons", "dict", [
    NIE,
    "icons",
    "--game-dir",
    GAME,
    "dict",
    "--prefix",
    "menu/200_icon/",
    "--out-dir",
    join(D.icons, "dict"),
  ]);
  steps++;
  await step(
    "icons",
    "extract",
    [
      NIE,
      "icons",
      "--game-dir",
      GAME,
      "extract",
      "--prefix",
      "menu/200_icon/",
      "--limit",
      limit,
    ],
    { timeout: STAGE_TIMEOUT * 2 },
  );

  // nie writes the decoded PNGs into the installed game tree; copy them out, do not move.
  const src = join(GAME, "data", "dx11", "menu");
  let n = 0;
  for (const p of walk(src)) {
    if (extname(p).toLowerCase() !== ".png") continue;
    const dst = join(D.icons, "png", relative(src, p));
    await put(dst, await Bun.file(p).arrayBuffer());
    n++;
    if (!FULL && n >= Number(limit)) break;
  }
  say(`  · icons ${n} png copied from the game dump`);

  // webp + ico from the PNG set, and one svg sprite of the whole set
  const pngs = [...walk(join(D.icons, "png"))].filter((p) =>
    p.endsWith(".png"),
  );
  if (pngs.length) {
    steps++;
    if (CWEBP)
      await pool(pngs.slice(0, 400), Math.min(JOBS, 8), async (p) => {
        await exec([
          CWEBP,
          "-quiet",
          "-q",
          "92",
          "-metadata",
          "none",
          p,
          "-o",
          p.replace(/\.png$/, ".webp"),
        ]);
      });
    await put(join(D.icons, "icon.ico"), icoFromPng(readFileSync(pngs[0]!)));
    await put(join(D.icons, "sprite.svg"), await iconSprite(pngs.slice(0, 64)));
  }
  const index = existsSync(idx)
    ? (JSON.parse(readFileSync(idx, "utf8")) as unknown[])
    : [];
  record({
    stage: "icons",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${Array.isArray(index) ? index.length : 0} indexed, ${n} decoded`,
  });
}

/** A PNG-in-ICO container (any Windows build accepts 256x256 PNG entries). */
function icoFromPng(png: Uint8Array): Uint8Array {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(1, 4);
  head.writeUInt8(0, 6); // 256px
  head.writeUInt8(0, 7);
  head.writeUInt8(0, 8);
  head.writeUInt8(0, 9);
  head.writeUInt16LE(1, 10);
  head.writeUInt16LE(32, 12);
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18);
  return new Uint8Array(Buffer.concat([head, Buffer.from(png)]));
}

/** A single-file SVG sprite: each icon as a <symbol> so one request paints all of them. */
async function iconSprite(pngs: string[]): Promise<string> {
  const parts: string[] = [];
  for (const [i, p] of pngs.entries()) {
    const b64 = Buffer.from(readFileSync(p)).toString("base64");
    parts.push(
      `<symbol id="${slug(basename(p, ".png"))}" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,${b64}"/></symbol>`,
    );
    if (i > 64) break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" style="display:none">${parts.join("")}</svg>\n`;
}

/** 6. Models: g4md+g4mg -> GLB (wasm), PNG still and GIF turntable (nie render). */
async function stageModels() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;
  const wanted = [...ctx.byModel.keys()];
  if (!wanted.length) {
    failures.push("models: no character (run zukan first)");
    record({ stage: "models", ok: false, ms: ms(t), steps: 0, failed: 1 });
    return;
  }
  const limit = QUICK
    ? 2
    : FULL
      ? wanted.length
      : Number(opt("model-limit", "8"));
  const work = wanted.slice(0, limit);

  // one `nie vfs find <modelId>` gives the model, the face texture, the voice bank and the icon
  const found = new Map<string, { path: string; size: number }[]>();
  await pool(work, Math.min(JOBS, 4), async (modelId) => {
    const r = await exec([
      NIE,
      "vfs",
      "find",
      modelId,
      "--json",
      "--limit",
      "32",
      "--game-dir",
      GAME,
    ]);
    if (!r.ok) return;
    try {
      const arr = JSON.parse(r.out.trim()) as {
        path?: string;
        chemin?: string;
        size?: number;
        taille?: number;
      }[];
      found.set(
        modelId,
        arr
          .map((x) => ({
            path: x.path ?? x.chemin ?? "",
            size: x.size ?? x.taille ?? 0,
          }))
          .filter((x) => x.path),
      );
    } catch {
      failures.push(`models/${modelId}: vfs find json illisible`);
    }
  });

  await pool(work, Math.min(JOBS, 4), async (modelId) => {
    const list = found.get(modelId) ?? [];
    const mdPath = list.find((x) => x.path.endsWith(`${modelId}.g4md`))?.path;
    const mgPath = list.find((x) => x.path.endsWith(`${modelId}.g4mg`))?.path;
    if (!mdPath || !mgPath) {
      failures.push(`models/${modelId}: paire g4md/g4mg absente`);
      return;
    }
    const dir = join(D.chr, modelId);
    mkdirSync(dir, { recursive: true });
    const md = join(dir, `${modelId}.g4md`);
    const mg = join(dir, `${modelId}.g4mg`);
    if (
      !(
        await exec([
          NIE,
          "vfs",
          "extract",
          mdPath,
          "--out",
          md,
          "--game-dir",
          GAME,
        ])
      ).ok
    )
      return;
    if (
      !(
        await exec([
          NIE,
          "vfs",
          "extract",
          mgPath,
          "--out",
          mg,
          "--game-dir",
          GAME,
        ])
      ).ok
    )
      return;
    try {
      const glb = await glbOf(readFileSync(md), readFileSync(mg));
      await put(join(D.models, `${modelId}.glb`), glb);
      steps++;
      await exec([
        NIE,
        "render",
        "glb-png",
        join(D.models, `${modelId}.glb`),
        "-o",
        join(D.models, `${modelId}.png`),
        "--width",
        "768",
        "--height",
        "768",
      ]);
      if (FULL) {
        await exec([
          NIE,
          "render",
          "glb-gif",
          join(D.models, `${modelId}.glb`),
          "-o",
          join(D.models, `${modelId}.gif`),
          "--frames",
          "24",
          "--width",
          "480",
          "--height",
          "480",
        ]);
        const gif = join(D.models, `${modelId}.gif`);
        if (FFMPEG && existsSync(gif))
          await exec([
            FFMPEG,
            "-y",
            "-loglevel",
            "error",
            "-i",
            gif,
            "-c:v",
            "libvpx-vp9",
            "-b:v",
            "0",
            "-crf",
            "34",
            "-an",
            join(D.video, `${modelId}.webm`),
          ]);
      }
      const card = ctx.byModel.get(modelId);
      if (card) (card as Card & { glb?: string }).glb = `models/${modelId}.glb`;
      say(`  · model ${modelId} -> glb ${(glb.length / 1024).toFixed(0)} KiB`);
    } catch (e) {
      failures.push(`models/${modelId}: ${e}`);
    }
    // every g4tx of the same character: body/face atlases, all sub-textures to webp
    const texDir = join(D.images, "chr", modelId);
    mkdirSync(texDir, { recursive: true });
    const tex = list.filter((x) => x.path.endsWith(".g4tx"));
    for (const x of tex) {
      const r = await exec([
        NIE,
        "convert",
        x.path,
        "--to",
        "webp",
        "--toutes",
        "-o",
        texDir,
        "--game-dir",
        GAME,
      ]);
      if (r.ok) steps++;
    }
    const icon = list.find(
      (x) => x.path.includes("200_icon/") && x.path.endsWith(".g4tx"),
    );
    if (icon) {
      await exec([
        NIE,
        "convert",
        icon.path,
        "--to",
        "webp",
        "-o",
        join(D.images, "icon", `${modelId}.webp`),
        "--game-dir",
        GAME,
      ]);
      await exec([
        NIE,
        "convert",
        icon.path,
        "--to",
        "png",
        "-o",
        join(D.images, "icon", `${modelId}.png`),
        "--game-dir",
        GAME,
      ]);
    }
  });

  record({
    stage: "models",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${work.length}/${wanted.length} model(s)`,
  });
  saveState();
}

/** 7. Audio: voices and sound effects, decoded by nie, then opus/webm. */
async function stageAudio() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;
  const casting = [...ctx.byModel.keys()].slice(
    0,
    QUICK ? 1 : Number(opt("voice-limit", "3")),
  );
  if (!casting.length) {
    failures.push("audio: no casting (run zukan first)");
    record({ stage: "audio", ok: false, ms: ms(t), steps, failed: 1 });
    return;
  }
  const outDir = join(D.raw, "vn");
  const r = await step(
    "audio",
    "vn-export",
    [
      NIE,
      "vn",
      "--game-dir",
      GAME,
      "export",
      "--out",
      outDir,
      "--casting",
      casting.join(","),
      "--voix-max",
      String(FULL ? 12 : 4),
      "--bgm-max",
      FULL ? "4" : "1",
      "--textures-max",
      "2",
      "--dialogues-max",
      "0",
    ],
    { timeout: STAGE_TIMEOUT * 2 },
  );
  steps++;
  let wavs = 0;
  if (r.ok) {
    for (const p of walk(outDir)) {
      const e = extname(p).toLowerCase();
      if (e === ".wav") {
        wavs++;
        const dst = join(D.audio, "voice", basename(dirname(p)), basename(p));
        await put(dst, await Bun.file(p).arrayBuffer());
        if (FFMPEG) {
          steps++;
          await exec([
            FFMPEG,
            "-y",
            "-loglevel",
            "error",
            "-i",
            dst,
            "-c:a",
            "libopus",
            "-b:a",
            "48k",
            "-ar",
            "48000",
            dst.replace(/\.wav$/, ".webm"),
          ]);
        }
      } else if (e === ".png") {
        const dst = join(
          D.images,
          "portrait",
          basename(dirname(p)),
          basename(p),
        );
        await put(dst, await Bun.file(p).arrayBuffer());
        if (CWEBP)
          await exec([
            CWEBP,
            "-quiet",
            "-q",
            "92",
            dst,
            "-o",
            dst.replace(/\.png$/, ".webp"),
          ]);
      } else if (e === ".json") {
        await put(
          join(D.dataset, "vn-catalogue.json"),
          await Bun.file(p).text(),
        );
      }
    }
  }
  // the sound-effect and music banks: decoded to WAV by `nie vfs cat --wav-out` (CRI ACB/AWB),
  // then compressed to webm for the site. The voice banks came from `nie vn export` above.
  const seBanks: { bank: string; kind: "se" | "bgm" }[] = [
    { bank: "data/common/sound_asset/effect.acb", kind: "se" },
    { bank: "data/common/sound_asset/ch.acb", kind: "se" },
    { bank: "data/common/sound_asset/common.acb", kind: "se" },
    { bank: "data/common/sound_asset/ja/c_common.acb", kind: "se" },
    { bank: "data/common/sound_asset/bgm.acb", kind: "bgm" },
    { bank: "data/common/sound_asset/bgm_title.acb", kind: "bgm" },
    { bank: "data/common/sound_asset/bgm_chronicle.acb", kind: "bgm" },
  ];
  const banks = FULL ? seBanks : seBanks.slice(0, 5);
  let sounds = 0;
  for (const { bank, kind } of banks) {
    const name = basename(bank, ".acb");
    const wav = join(D.audio, kind, `${name}.wav`);
    mkdirSync(dirname(wav), { recursive: true });
    const d = await step(
      "audio",
      `${kind}-${name}`,
      [NIE, "vfs", "cat", bank, "--wav-out", wav, "--game-dir", GAME],
      { timeout: STAGE_TIMEOUT * 2, quiet: true },
    );
    steps++;
    if (!d.ok || !existsSync(wav)) continue;
    sounds++;
    if (FFMPEG)
      await exec([
        FFMPEG,
        "-y",
        "-loglevel",
        "error",
        "-i",
        wav,
        "-c:a",
        "libopus",
        "-b:a",
        "96k",
        "-ar",
        "48000",
        wav.replace(/\.wav$/, ".webm"),
      ]);
  }

  // the lipsync index and the full bank inventory, as data
  steps++;
  for (const ext of ["acb", "awb", "p3lip"]) {
    const q = await exec([
      NIE,
      "vfs",
      "find",
      "",
      "--ext",
      ext,
      "--limit",
      FULL ? "200000" : "40",
      "--json",
      "--game-dir",
      GAME,
    ]);
    if (q.ok) await put(join(D.data, `vfs-${ext}.json`), q.out.trim() + "\n");
  }
  record({
    stage: "audio",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${wavs} voice wav, ${sounds} sound bank(s)`,
  });
}

/** 8. Video: USM films -> mp4 (nie, no re-encode) -> webm (ffmpeg). */
async function stageVideo() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;
  const q = await exec([
    NIE,
    "vfs",
    "find",
    "",
    "--ext",
    "usm",
    "--limit",
    FULL ? "200" : "10",
    "--json",
    "--game-dir",
    GAME,
  ]);
  steps++;
  let films: string[] = [];
  if (q.ok) {
    try {
      const arr = JSON.parse(q.out.trim()) as {
        path?: string;
        chemin?: string;
      }[];
      films = arr.map((x) => x.path ?? x.chemin ?? "").filter(Boolean);
      await put(join(D.data, "vfs-usm.json"), JSON.stringify(arr));
    } catch {
      failures.push("video: usm index illisible");
    }
  }
  const limit = QUICK
    ? 1
    : FULL
      ? films.length
      : Number(opt("video-limit", "2"));
  await pool(films.slice(0, limit), 2, async (f) => {
    const mp4 = join(D.raw, "movie", `${basename(f, ".usm")}.mp4`);
    mkdirSync(dirname(mp4), { recursive: true });
    const r = await exec(
      [NIE, "video", "--game-dir", GAME, "export", f, "--out", mp4, "--audio"],
      { timeout: STAGE_TIMEOUT * 2 },
    );
    if (!r.ok) return;
    steps++;
    if (FFMPEG && existsSync(mp4))
      await exec(
        [
          FFMPEG,
          "-y",
          "-loglevel",
          "error",
          "-i",
          mp4,
          "-c:v",
          "libvpx-vp9",
          "-b:v",
          "0",
          "-crf",
          "36",
          "-c:a",
          "libopus",
          "-b:a",
          "64k",
          join(D.video, `${basename(f, ".usm")}.webm`),
        ],
        { timeout: STAGE_TIMEOUT * 2 },
      );
  });
  record({
    stage: "video",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${Math.min(films.length, limit)} film(s) of ${films.length}`,
  });
}

/** 9. Game tables: cfg.bin -> typed json, and the knowledge mirror when one exists. */
async function stageData() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;
  const root =
    existsSync(D.gamedata) && [...walk(D.gamedata)].length ? D.gamedata : null;
  if (!root) {
    failures.push("data: gamedata dump absent (run the vfs stage)");
    record({ stage: "data", ok: false, ms: ms(t), steps: 0, failed: 1 });
    return;
  }
  // Decode the tables, bounded: the iecode-typed form is what every parser reads.
  const cfg = [...walk(root)].filter((p) => p.endsWith(".cfg.bin"));
  const limit = QUICK
    ? 40
    : FULL
      ? cfg.length
      : Number(opt("cfg-limit", "400"));
  await pool(cfg.slice(0, limit), Math.min(JOBS, 8), async (p) => {
    const r = await exec([NIE, "decode", p, "-o", `${p}.json`, "-q"]);
    if (r.ok) steps++;
  });
  await step("data", "typed-json", [NIE, "refresh-typed-json", root], {
    timeout: STAGE_TIMEOUT * 2,
    quiet: true,
  });
  const decoded = [...walk(root)].filter((p) => p.endsWith(".json"));
  await put(
    join(D.dataset, "gamedata.json"),
    JSON.stringify(
      { root: rel(root), cfgBin: cfg.length, decoded: decoded.length },
      null,
      2,
    ),
  );
  say(`  · data ${decoded.length}/${cfg.length} table(s) decoded`);
  record({
    stage: "data",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${decoded.length} json`,
  });
}

/** 10. aphrody.com assets: the shared generator (theme, styles, svg, brand, icons). */
async function stageAssets() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;
  const gen = async (what: string) => {
    steps++;
    const cmd = AY_HAS_ASSETS
      ? [AY!, "assets", "gen", what]
      : [process.execPath, ASSETS_CLI, "gen", what];
    return step("assets", `gen-${what}`, cmd, {
      cwd: ROOT,
      timeout: STAGE_TIMEOUT,
    });
  };
  for (const what of ["svg", "brand", "index"]) await gen(what);
  // copy what the archive needs; leave the rest in the shared library
  const genDir = join(ROOT, "assets", "generated");
  for (const p of walk(genDir)) {
    const e = extname(p).toLowerCase();
    if (![".svg", ".webp", ".ico", ".json", ".css"].includes(e)) continue;
    const r = relative(ROOT, p).replaceAll("\\", "/");
    if (
      r.includes("wallpapers/") ||
      r.includes("textures/") ||
      r.includes("gif/")
    )
      continue;
    await put(
      join(D.theme, "aphrody", r.replace(/^assets\/generated\//, "")),
      await Bun.file(p).arrayBuffer(),
    );
    if (steps++ > 400) break;
  }
  const verify = await step(
    "assets",
    "verify",
    [process.execPath, ASSETS_CLI, "verify"],
    { cwd: ROOT, quiet: true, timeout: STAGE_TIMEOUT },
  );
  record({
    stage: "assets",
    ok: failures.length === before && verify.ok,
    ms: ms(t),
    steps,
    failed: failures.length - before,
  });
}

/** 11. Theme: tokens, stylesheet, per-element icon, from the game's own data. */
async function stageTheme() {
  const t = performance.now();
  const before = failures.length;
  // Only the game's real element tokens become CSS classes and file names; anything else
  // (missing, "?", a scrape artefact) collapses to `none`.
  const elements = [
    ...new Set([...ctx.byModel.values()].map((c) => elToken(c.element))),
  ]
    .filter(Boolean)
    .sort();
  const tokens = {
    name: "nie-victory-road",
    version: "1.0.0",
    source: {
      game: GAME,
      codex: "https://zukan.inazuma.jp/en/",
      models: ctx.byModel.size,
    },
    color: {
      element: Object.fromEntries(
        elements.map((e) => [
          e,
          `hsl(${ELEMENT_HUE[e] ?? ELEMENT_HUE.none} 72% 52%)`,
        ]),
      ),
      surface: {
        base: "#0b0e16",
        raised: "#141926",
        sunken: "#080a11",
        line: "#26304a",
      },
      text: { base: "#eef1fa", muted: "#a8b2cc", inverse: "#0b0e16" },
      position: { GK: "#f2b844", DF: "#4f9df7", MF: "#46c98b", FW: "#f2584f" },
    },
    radius: { sm: "6px", md: "12px", lg: "20px", full: "999px" },
    space: [0, 4, 8, 12, 16, 24, 32, 48, 64],
    type: {
      family: "system-ui, 'Segoe UI', sans-serif",
      scale: [12, 14, 16, 20, 26, 34, 46],
    },
    motion: {
      fast: "120ms",
      base: "220ms",
      slow: "420ms",
      ease: "cubic-bezier(.2,.8,.2,1)",
    },
  };
  await put(join(D.theme, "tokens.json"), JSON.stringify(tokens, null, 2));
  await put(
    join(D.theme, "tokens.ts"),
    `// generated by nie-archive; do not edit\nexport const tokens = ${JSON.stringify(tokens, null, 2)} as const;\nexport type Tokens = typeof tokens;\n`,
  );
  const css = `:root{${Object.entries(tokens.color.surface)
    .map(([k, v]) => `--surface-${k}:${v}`)
    .join(";")};${Object.entries(tokens.color.text)
    .map(([k, v]) => `--text-${k}:${v}`)
    .join(";")};${Object.entries(tokens.color.element)
    .map(([k, v]) => `--el-${k}:${v}`)
    .join(";")};${Object.entries(tokens.color.position)
    .map(([k, v]) => `--pos-${k}:${v}`)
    .join(";")};${Object.entries(tokens.radius)
    .map(([k, v]) => `--r-${k}:${v}`)
    .join(
      ";",
    )};--dur-fast:${tokens.motion.fast};--dur:${tokens.motion.base};--dur-slow:${tokens.motion.slow};--ease:${tokens.motion.ease}}\n`;
  const styles = `${css}
*{box-sizing:border-box}
html{color-scheme:dark}
body{margin:0;background:var(--surface-base);color:var(--text-base);font:16px/1.55 ${tokens.type.family}}
a{color:var(--el-wind);text-underline-offset:3px}
.card{background:var(--surface-raised);border:1px solid var(--surface-line);border-radius:var(--r-md);padding:16px}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.el{display:inline-block;padding:2px 8px;border-radius:var(--r-full);font-size:12px;font-weight:600;color:var(--surface-base);background:var(--el-none)}
${Object.keys(tokens.color.element)
  .map((e) => `.el-${e}{background:var(--el-${e})}`)
  .join("\n")}
${Object.keys(tokens.color.position)
  .map((p) => `.pos-${p}{color:var(--pos-${p})}`)
  .join("\n")}
.muted{color:var(--text-muted)}
img{max-width:100%;height:auto;display:block}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;
  await put(join(D.theme, "theme.css"), styles);
  await put(join(D.theme, "styles.css"), styles);

  // one icon per element, drawn as a real SVG (no bitmap), plus the site icon
  for (const e of elements) {
    const hue = ELEMENT_HUE[e] ?? ELEMENT_HUE.none;
    await put(join(D.icons, "element", `${e}.svg`), elementSvg(e, hue));
  }
  await put(
    join(D.icons, "element", "victory-road.svg"),
    markSvg(ctx.byModel.size),
  );
  const first = [...walk(join(D.icons, "png"))].find((p) => p.endsWith(".png"));
  if (first)
    await put(join(D.icons, "favicon.ico"), icoFromPng(readFileSync(first)));
  record({
    stage: "theme",
    ok: failures.length === before,
    ms: ms(t),
    steps: 6,
    failed: failures.length - before,
    note: `${elements.length} element(s)`,
  });
}

function elementSvg(element: string, hue: number): string {
  const paths: Record<string, string> = {
    fire: "M32 4c6 10 2 14 8 20s10 12 4 20-14 8-20 2-8-14-2-20 6-12 10-22Z",
    forest:
      "M32 4 46 26h-8l10 16h-8l6 10H18l6-10h-8l10-16h-8L32 4Zm-3 46h6v6h-6z",
    wind: "M6 22h34a8 8 0 1 0-8-8M6 34h26a6 6 0 1 1-6 6M6 46h30",
    mountain: "M4 56 24 18l12 22 6-10 18 26H4Z",
    void: "M32 6a26 26 0 1 0 0 52 26 26 0 0 0 0-52Zm0 10a16 16 0 0 1 0 32 16 16 0 0 1 0-32Z",
    light:
      "M32 8v10M32 46v10M8 32h10M46 32h10M15 15l7 7M42 42l7 7M49 15l-7 7M22 42l-7 7M32 22a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z",
    shadow: "M40 6a26 26 0 1 0 0 52A20 20 0 0 1 40 6Z",
    none: "M32 6 58 32 32 58 6 32Z",
  };
  const d = paths[element] ?? paths.none;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${element}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 82% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 72% 42%)"/></linearGradient></defs><path d="${d}" fill="url(#g)" fill-rule="evenodd"/></svg>\n`;
}

function markSvg(n: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Inazuma Eleven Victory Road archive"><rect width="64" height="64" rx="14" fill="#0b0e16"/><circle cx="32" cy="32" r="18" fill="none" stroke="#46c98b" stroke-width="3"/><path d="M32 10v8M32 46v8M10 32h8M46 32h8" stroke="#f2b844" stroke-width="3" stroke-linecap="round"/><path d="m22 40 8-18 6 12 3-5 5 11Z" fill="#4f9df7"/><title>${n} character(s) archived</title></svg>\n`;
}

/** 12. Dataset: the training and app-asset export (jsonl, ts, rs, sqlite, md/mdx/html/txt). */
async function stageDataset() {
  const t = performance.now();
  const before = failures.length;
  let steps = 0;
  const all = [...ctx.byModel.values()].sort((a, b) =>
    (a.modelId ?? "").localeCompare(b.modelId ?? ""),
  );
  const rich = all.filter((c) => c.stats || c.description);

  // cards.jsonl: one record per character, the canonical training card
  const cards = all.map((c) => ({
    id: c.id,
    modelId: c.modelId ?? null,
    name: c.name,
    nickname: c.nickname ?? null,
    slug: c.slug,
    game: c.game ?? null,
    position: c.position ?? null,
    element: c.element ?? null,
    stats: c.stats ?? null,
    level: c.level ?? null,
    description: c.description ?? null,
    basic: c.basic ?? null,
    obtain: c.obtain ?? null,
    assets: {
      // The file on disk is the truth; the in-memory card may not carry it in a resumed run.
      glb: glbFor(c),
      portrait: c.portrait ?? null,
      face: `images/chr/${c.modelId ?? c.slug}`,
    },
    sources: c.sources,
  }));
  await put(
    join(D.dataset, "cards.jsonl"),
    cards.map((c) => JSON.stringify(c)).join("\n") + "\n",
  );
  await put(join(D.dataset, "cards.json"), JSON.stringify(cards, null, 2));

  // vision.jsonl: image <-> text pairs (portraits, renders)
  const byId = new Map(cards.map((c) => [c.id, c]));
  const vision: Record<string, unknown>[] = [];
  for (const c of all) {
    const card = byId.get(c.id);
    const pairs: [string, string | null][] = [];
    if (c.portrait && existsSync(join(OUT, c.portrait)))
      pairs.push(["portrait", c.portrait]);
    if ((c as Card & { glb?: string }).glb)
      pairs.push(["render", `models/${c.modelId}.png`]);
    for (const [kind, p] of pairs) {
      if (!p) continue;
      vision.push({
        kind: "image-text",
        image: p,
        caption: `${c.name}${c.nickname ? ` (${c.nickname})` : ""} — ${c.position ?? "?"} ${c.element ?? "?"} — Inazuma Eleven: Victory Road`,
        text: c.description ?? card?.description ?? "",
        tags: [c.game, c.position, c.element, c.basic?.gender].filter(Boolean),
        imageKind: kind,
      });
    }
  }
  await put(
    join(D.dataset, "vision.jsonl"),
    vision.map((v) => JSON.stringify(v)).join("\n") + "\n",
  );

  // sft.jsonl: instruction pairs, generated from the card itself (no invention)
  const sft: Record<string, unknown>[] = [];
  for (const c of rich) {
    const lines = [
      `Name: ${c.name}${c.nickname ? ` (${c.nickname})` : ""}`,
      c.game ? `Game: ${c.game}` : "",
      c.position ? `Position: ${c.position}` : "",
      c.element ? `Element: ${c.element}` : "",
      c.stats
        ? `Stats Lv${c.level ?? 50}: ${Object.entries(c.stats)
            .map(([k, v]) => `${k} ${v}`)
            .join(", ")}`
        : "",
      c.description ? `Description: ${c.description}` : "",
    ].filter(Boolean);
    sft.push({
      messages: [
        {
          role: "user",
          content: `Describe the Inazuma Eleven character ${c.name}${c.nickname ? ` (${c.nickname})` : ""}.`,
        },
        { role: "assistant", content: lines.join("\n") },
      ],
      meta: { id: c.id, modelId: c.modelId, sources: c.sources },
    });
  }
  await put(
    join(D.dataset, "sft.jsonl"),
    sft.map((r) => JSON.stringify(r)).join("\n") + "\n",
  );

  // typed exports for the app assets
  const TsPartial = `// generated by apps/aphrody/nie-archive.ts — do not edit
export type Element = ${[...new Set(all.map((c) => elToken(c.element)))].map((e) => JSON.stringify(e)).join(" | ")};
export type Position = "GK" | "DF" | "MF" | "FW";
export interface Stats { kick: number; control: number; technique: number; pressure: number; physical: number; agility: number; intelligence: number }
export interface Character {
  id: string;
  modelId: string | null;
  name: string;
  nickname: string | null;
  slug: string;
  game: string | null;
  position: Position | null;
  element: Element | null;
  stats: Stats | null;
  level: number | null;
  description: string | null;
  assets: { glb: string | null; portrait: string | null; face: string };
  sources: string[];
}
export const characters: Character[] = ${JSON.stringify(cards, null, 0)} as Character[];
export const byModelId = new Map(characters.map((c) => [c.modelId ?? c.id, c]));
export const bySlug = new Map(characters.map((c) => [c.slug, c]));
`;
  await put(join(D.dataset, "characters.ts"), TsPartial);

  const Rs = `// generated by apps/aphrody/nie-archive.ts — do not edit
//! Typed view of the NIE archive, ready for a Rust asset pipeline or a Bevy app.
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, Default, serde::Deserialize, serde::Serialize)]
pub struct Stats {
    pub kick: u16,
    pub control: u16,
    pub technique: u16,
    pub pressure: u16,
    pub physical: u16,
    pub agility: u16,
    pub intelligence: u16,
}

#[derive(Debug, Clone, Default, serde::Deserialize, serde::Serialize)]
pub struct Character {
    pub id: String,
    pub model_id: Option<String>,
    pub name: String,
    pub nickname: Option<String>,
    pub slug: String,
    pub game: Option<String>,
    pub position: Option<String>,
    pub element: Option<String>,
    pub stats: Option<Stats>,
    pub level: Option<u16>,
    pub description: Option<String>,
    pub glb: Option<String>,
    pub portrait: Option<String>,
    pub sources: Vec<String>,
}

/// The whole archive, keyed by model id (for example c05026590).
pub fn load(json: &str) -> serde_json::Result<BTreeMap<String, Character>> {
    let all: Vec<Character> = serde_json::from_str(json)?;
    Ok(all.into_iter().map(|c| (c.model_id.clone().unwrap_or_else(|| c.id.clone()), c)).collect())
}
`;
  await put(join(D.dataset, "characters.rs"), Rs);

  // markdown + mdx + txt + html descriptions
  let md = `# Inazuma Eleven: Victory Road — character archive\n\n`;
  md += `${all.length} characters, ${rich.length} with a full card. Source: the game install plus the official codex (zukan.inazuma.jp).\n\n`;
  for (const c of rich) {
    md += `## ${c.name}${c.nickname ? ` (${c.nickname})` : ""}\n\n\`${c.modelId ?? c.id}\` · ${c.position ?? "?"} · ${c.element ?? "?"}${c.game ? ` · ${c.game}` : ""}\n\n`;
    if (c.stats)
      md += `| Kick | Control | Technique | Pressure | Physical | Agility | Intelligence |\n|---:|---:|---:|---:|---:|---:|---:|\n| ${[c.stats.kick, c.stats.control, c.stats.technique, c.stats.pressure, c.stats.physical, c.stats.agility, c.stats.intelligence].join(" | ")} |\n\n`;
    if (c.description) md += `${c.description}\n\n`;
    if (c.obtain?.length)
      md +=
        c.obtain
          .map((o) => `- **${o.group}**: ${o.entries.join(", ")}`)
          .join("\n") + "\n\n";
    md += `Sources: ${c.sources.join(" · ")}\n\n`;
  }
  await put(join(D.dataset, "characters.md"), md);
  await put(
    join(D.dataset, "characters.mdx"),
    `---\ntitle: Inazuma Eleven Victory Road character archive\ndescription: ${all.length} characters exported from the game data and the official codex\n---\n\n${md.replace(/^# /, "## ")}\n`,
  );
  await put(
    join(D.dataset, "characters.txt"),
    md.replace(/[#*|]/g, "").replace(/\n{3,}/g, "\n\n"),
  );

  // sqlite: the queryable form of everything above, as a versioned migration so an existing
  // archive is upgraded in place instead of being silently reshaped.
  const db = new Database(DB_PATH);
  db.run("pragma journal_mode = wal");
  db.run("pragma foreign_keys = on");
  const version =
    (db.query("pragma user_version").get() as { user_version: number } | null)
      ?.user_version ?? 0;
  for (const m of MIGRATIONS.filter((m) => m.version > version)) {
    db.transaction(() => {
      for (const sql of m.statements) db.run(sql);
      db.run(`pragma user_version = ${m.version}`);
    })();
    steps++;
  }
  // The migration corpus ships with the archive so another machine can rebuild or upgrade the
  // database with plain `sqlite3 nie.sqlite < 000N.sql`.
  for (const m of MIGRATIONS)
    await put(
      join(D.data, "migrations", `${String(m.version).padStart(4, "0")}_${m.name}.sql`),
      `-- nie-archive schema ${m.version} (${m.name})\n-- applied with: sqlite3 nie.sqlite < this file\n${m.statements.join(";\n")};\n\npragma user_version = ${m.version};\n`,
    );
  await put(
    join(D.data, "migrations", "README.md"),
    `# nie.sqlite migrations\n\nThe archive database is versioned with \`pragma user_version\`.\nnie-archive applies every migration above the stored version on each \`dataset\` run.\n\nTo rebuild elsewhere:\n\n\`\`\`sh\nsqlite3 nie.sqlite < 0001_init.sql\nsqlite3 nie.sqlite < 0002_fts.sql\n\`\`\`\n`,
  );
  const insC = db.prepare(
    "insert or replace into characters values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
  );
  const tx = db.transaction(() => {
    for (const c of cards)
      insC.run(
        c.id,
        c.modelId,
        c.name,
        c.nickname,
        c.slug,
        c.game,
        c.position,
        c.element,
        c.level,
        c.description,
        c.stats ? JSON.stringify(c.stats) : null,
        c.obtain ? JSON.stringify(c.obtain) : null,
        c.assets.portrait,
        c.assets.glb,
        JSON.stringify(c.sources),
      );
  });
  tx();

  // every file of the archive, hashed (first 4 MiB read for speed, full hash under --full)
  const insA = db.prepare("insert or replace into asset values(?,?,?,?,?)");
  const kinds: Record<string, string> = {
    ".png": "image",
    ".webp": "image",
    ".svg": "vector",
    ".ico": "icon",
    ".glb": "model",
    ".wav": "audio",
    ".webm": "video",
    ".mp4": "video",
    ".gif": "image",
    ".json": "data",
    ".jsonl": "dataset",
    ".md": "doc",
    ".mdx": "doc",
    ".txt": "doc",
    ".html": "doc",
    ".ts": "code",
    ".rs": "code",
    ".css": "style",
    ".sqlite": "db",
    ".db": "db",
    ".tar": "archive",
    ".gz": "archive",
  };
  let n = 0;
  for (const p of walk(OUT)) {
    if (p === DB_PATH || p.includes(`${join(OUT, "pack")}`)) continue;
    const ext = extname(p).toLowerCase();
    const buf = readFileSync(p);
    insA.run(
      rel(p),
      rel(p),
      kinds[ext] ?? "other",
      buf.length,
      sha(FULL ? buf : buf.subarray(0, 4 << 20)),
    );
    n++;
  }

  // documents, searchable
  const insD = db.prepare("insert or replace into doc values(?,?,?,?,?)");
  for (const p of walk(D.wiki)) {
    const body = readFileSync(p, "utf8");
    const title = body.match(/^# (.+)$/m)?.[1] ?? basename(p);
    const source = body.match(/^> Source: (.+)$/m)?.[1] ?? "";
    insD.run(rel(p), title, source, body, sha(new TextEncoder().encode(body)));
  }
  for (const p of walk(D.dataset)) {
    if (extname(p) !== ".md") continue;
    const body = readFileSync(p, "utf8");
    insD.run(
      rel(p),
      body.match(/^# (.+)$/m)?.[1] ?? basename(p),
      "dataset",
      body.slice(0, 2_000_000),
      sha(new TextEncoder().encode(body)),
    );
  }
  try {
    db.run(
      "create virtual table if not exists doc_fts using fts5(path, title, body, content='doc', content_rowid='rowid')",
    );
    db.run("insert into doc_fts(doc_fts) values('rebuild')");
  } catch {
    /* fts5 absent: the doc table stays the index */
  }
  try {
    db.run(
      "create virtual table if not exists character_fts using fts5(id, name, nickname, description, content='characters', content_rowid='rowid')",
    );
    db.run("insert into character_fts(character_fts) values('rebuild')");
  } catch {
    /* fts5 absent: the characters table stays the index */
  }
  steps++;

  const insS = db.prepare("insert or replace into dataset values(?,?,?,?)");
  for (const f of [
    "cards.jsonl",
    "vision.jsonl",
    "sft.jsonl",
    "corpus.jsonl",
    "characters.json",
  ]) {
    const p = join(D.dataset, f);
    if (!existsSync(p)) continue;
    const body = readFileSync(p);
    const rows = f.endsWith(".jsonl")
      ? body.toString().split("\n").filter(Boolean).length
      : 1;
    insS.run(f, rows, body.length, sha(body));
  }
  const m = db.prepare("insert or replace into meta values(?,?)");
  for (const [k, v] of Object.entries({
    game: GAME,
    generated_at: new Date().toISOString(),
    characters: String(all.length),
    rich_cards: String(rich.length),
    files: String(n),
    full: String(FULL),
  }))
    m.run(k, v);
  db.run("pragma optimize");
  db.close();

  // the same database under both extensions the task names
  await put(join(D.data, "nie.db"), await Bun.file(DB_PATH).arrayBuffer());
  await put(
    join(D.data, "schema.sql"),
    `-- nie.sqlite schema, generated by nie-archive\n${["meta", "characters", "asset", "doc", "dataset", "stage"].map((t) => `-- table ${t}`).join("\n")}\n`,
  );
  say(
    `  · dataset characters=${all.length} rich=${rich.length} vision=${vision.length} sft=${sft.length} files=${n}`,
  );
  record({
    stage: "dataset",
    ok: failures.length === before,
    ms: ms(t),
    steps: 6,
    failed: failures.length - before,
    note: `${all.length} chars, ${n} files`,
  });
}

/** 13. Site: the static pages served from aphrody.com. */
async function stageSite() {
  const t = performance.now();
  const before = failures.length;
  const all = [...ctx.byModel.values()]
    .filter((c) => c.stats || c.description)
    .sort((a, b) => a.name.localeCompare(b.name));
  const esc = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const css = existsSync(join(D.theme, "theme.css"))
    ? readFileSync(join(D.theme, "theme.css"), "utf8")
    : "";
  // Absolute site base: the pages are served under aphrody.com/nie/, so every asset link is
  // root-relative and works from both /nie/ and /nie/chara/.
  const BASE = opt("site-base", "/nie/");
  const head = (title: string, desc: string) =>
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="icon" href="${BASE}icons/favicon.ico"><link rel="stylesheet" href="${BASE}theme/theme.css"><style>${css}</style></head><body>`;

  const cardsHtml = all
    .map((c) => {
      const el = elToken(c.element);
      return `<a class="card" href="${BASE}chara/${c.slug}.html"><h3>${esc(c.name)}${c.nickname ? ` <span class="muted">${esc(c.nickname)}</span>` : ""}</h3><p><span class="el el-${esc(el)}">${esc(el)}</span> <b class="pos-${esc(c.position ?? "")}">${esc(c.position ?? "")}</b></p>${c.portrait ? `<img src="${BASE}${esc(c.portrait)}" alt="${esc(c.name)}" loading="lazy" width="220" height="220">` : ""}</a>`;
    })
    .join("");
  await put(
    join(D.site, "index.html"),
    `${head("Inazuma Eleven: Victory Road — open archive", "Characters, models, voices and game data exported from a licensed install and the official codex.")}<main><h1>Inazuma Eleven: Victory Road</h1><p class="muted">${all.length} documented characters · ${ctx.byModel.size} model ids · dataset and assets exported for reuse.</p><div class="grid">${cardsHtml}</div></main></body></html>\n`,
  );

  for (const c of all) {
    const el = elToken(c.element);
    const stats = c.stats
      ? `<table><thead><tr>${Object.keys(c.stats)
          .map((k) => `<th>${esc(k)}</th>`)
          .join("")}</tr></thead><tbody><tr>${Object.values(c.stats)
          .map((v) => `<td>${v}</td>`)
          .join("")}</tr></tbody></table>`
      : "";
    const glb = glbFor(c);
    const html = `${head(`${c.name} — NIE archive`, c.description ?? `${c.name} in Inazuma Eleven: Victory Road`)}<main><p><a href="${BASE}index.html">← archive</a></p><h1>${esc(c.name)}${c.nickname ? ` <span class="muted">${esc(c.nickname)}</span>` : ""}</h1><p><code>${esc(c.modelId ?? c.id)}</code> <span class="el el-${esc(el)}">${esc(el)}</span> <b class="pos-${esc(c.position ?? "")}">${esc(c.position ?? "")}</b></p>${c.portrait ? `<img src="${BASE}${esc(c.portrait)}" alt="${esc(c.name)}" width="320">` : ""}${c.description ? `<p>${esc(c.description)}</p>` : ""}${stats}${glb ? `<p><a href="${BASE}${glb}" download>model (.glb)</a></p>` : ""}<p class="muted">Sources: ${c.sources.map((s) => `<a href="${esc(s)}">${esc(new URL(s).hostname)}</a>`).join(" · ")}</p></main></body></html>\n`;
    await put(join(D.site, "chara", `${c.slug}.html`), html);
  }
  const wikiDocs = existsSync(D.wiki)
    ? [...walk(D.wiki)]
        .filter((p) => p.endsWith(".md"))
        .map((p) => relative(D.wiki, p).replaceAll("\\", "/"))
    : [];
  await put(
    join(D.site, "dataset.html"),
    `${head("Dataset", "The training export: cards, vision pairs, instructions and the wiki corpus.")}<main><h1>Dataset</h1><ul><li><a href="${BASE}dataset/cards.jsonl">cards.jsonl</a> — one record per character</li><li><a href="${BASE}dataset/vision.jsonl">vision.jsonl</a> — image/text pairs</li><li><a href="${BASE}dataset/sft.jsonl">sft.jsonl</a> — instruction pairs</li><li><a href="${BASE}dataset/corpus.jsonl">corpus.jsonl</a> — wiki documents</li><li><a href="${BASE}dataset/characters.json">characters.json</a> — the joined archive</li><li><a href="${BASE}data/nie.sqlite">nie.sqlite</a> — the queryable archive</li></ul><h2>Wiki corpus</h2><ul>${wikiDocs.map((w) => `<li><a href="${BASE}wiki/${esc(w)}">${esc(w)}</a></li>`).join("")}</ul><h2>Types</h2><ul><li><a href="${BASE}dataset/characters.ts">characters.ts</a></li><li><a href="${BASE}dataset/characters.rs">characters.rs</a></li><li><a href="${BASE}dataset/characters.md">characters.md</a></li><li><a href="${BASE}dataset/characters.mdx">characters.mdx</a></li></ul></main></body></html>\n`,
  );
  await put(
    join(D.site, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://aphrody.com/nie/</loc></url><url><loc>https://aphrody.com/nie/dataset.html</loc></url>${all.map((c) => `<url><loc>https://aphrody.com/nie/chara/${c.slug}.html</loc></url>`).join("")}</urlset>\n`,
  );
  await put(
    join(D.site, "robots.txt"),
    "User-agent: *\nAllow: /nie/\nSitemap: https://aphrody.com/nie/sitemap.xml\n",
  );
  record({
    stage: "site",
    ok: failures.length === before,
    ms: ms(t),
    steps: all.length + 4,
    failed: failures.length - before,
    note: `${all.length} page(s)`,
  });
}

/** 16. Survey: every remaining nie command family, exercised and captured as data. */
async function stageSurvey() {
  const t = performance.now();
  const before = failures.length;
  const s = join(D.data, "survey");
  mkdirSync(s, { recursive: true });
  let steps = 0;
  const G = GAME;
  // [label, argv, required?] — a required command failing fails the stage; the rest are
  // environment-dependent extras (a Redis-backed index, a host-only tool) and are only noted.
  const cmds: [string, string[], boolean][] = [
    // `--data` is the decoded game-data root, i.e. the parent of `common/gamedata`; the
    // archive's own dump lives under raw/gamedata/data.
    [
      "oc-morphologies",
      [
        "oc",
        "morphologies",
        "--data",
        [join(OUT, "raw", "gamedata", "data"), join(OUT, "raw"), join(GAME, "data")].find(
          (p) => existsSync(join(p, "common", "gamedata")),
        ) ?? join(GAME, "data"),
      ],
      // The morphology files are shipped inside the CPKs; a decoded tree is required and the
      // archive does not dump one, so an unavailable path is recorded, not fatal.
      false,
    ],
    ["avatar-catalog", ["avatar", "catalog"], true],
    ["avatar-parts", ["avatar", "parts", "--limit", "40"], true],
    ["avatar-preset", ["avatar", "preset"], true],
    ["avatar-export", ["avatar", "export", "-o", join(s, "avatar-resolved.json")], true],
    ["mode-coverage", ["mode", "coverage", "-o", join(s, "mode-coverage.json")], false],
    ["mode-export", ["mode", "export", "-o", join(s, "mode-catalog.json")], false],
    ["vfs-ls", ["vfs", "ls", "data/common/sound_asset", "--game-dir", G], true],
    [
      "vfs-stat",
      ["vfs", "stat", "data/common/chr/_face/01_IE1/c01000010/c01000010.g4md", "--game-dir", G],
      true,
    ],
    ["vfs-chara", ["vfs", "chara", "Evans", "-j", "-n", "5", "--game-dir", G], true],
    ["vfs-waza", ["vfs", "waza", "Fire", "-j", "-n", "5", "--game-dir", G], true],
    ["format", ["format", join(D.models, "c01000010.glb")], true],
    [
      "textures",
      ["textures", "--game-dir", G, "--limit", FULL ? "2000" : "120", "--manifest", join(s, "g4tx.ndjson")],
      false,
    ],
    ["uniform-map", ["uniform-map", "--game-dir", G, "--out", join(s, "model-crc.ndjson")], false],
    [
      "seed-ui",
      ["seed-ui", "--game-dir", G, "--db", join(s, "nie-survey.sqlite")],
      false,
    ],
    [
      "vfs-bundle",
      ["vfs", "bundle", "--game-dir", G, "--out", join(s, "browser-vfs"), "--profile", "afubuki_lean"],
      false,
    ],
  ];
  for (const [label, argv, required] of cmds) {
    const r = await step("survey", label, [NIE, ...argv], {
      cwd: GAME,
      timeout: STAGE_TIMEOUT,
      quiet: true,
    });
    steps++;
    if (r.ok) {
      const body = `${r.out}\n`;
      await put(join(s, `${label}.txt`), body);
      const trimmed = r.out.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("["))
        await put(join(s, `${label}.json`), trimmed + "\n");
      say(`  · survey/${label} ${r.ms}ms`);
    } else if (required) {
      // `step` already recorded the failure.
      say(`  ! survey/${label} exit=${r.code}`);
    } else {
      // Optional command: keep the message with the data, never fail the stage on it.
      failures.pop();
      await put(join(s, `${label}.error.txt`), `${r.out}\n${r.err}\n`);
      say(`  · survey/${label} (indisponible: ${(r.err || r.out).trim().split("\n")[0] ?? ""})`);
    }
  }
  record({
    stage: "survey",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${steps} command(s) -> data/survey`,
  });
}

/** 17. Index: the app catalogue over the repository (files, crates, docs, tools, gaps). */
async function stageIndex() {
  const t = performance.now();
  const before = failures.length;
  const s = join(D.data, "atlas");
  mkdirSync(s, { recursive: true });
  const db = join(s, "nie-atlas.sqlite");
  let steps = 0;
  const build = await step(
    "index",
    "atlas-build",
    [
      NIE,
      "atlas",
      "build",
      "--db",
      db,
      "--root",
      ROOT,
      // The archive database is a dataset store, not the atlas knowledge base: digesting it
      // needs the `kb.*` schema the atlas builds itself, so the file scan runs alone here.
      "--no-kb",
      ...(FULL ? [] : ["--no-link"]),
      "--json",
    ],
    { cwd: ROOT, timeout: STAGE_TIMEOUT * 3, quiet: true },
  );
  steps++;
  if (build.ok) {
    say(`  · index/atlas-build ${build.ms}ms`);
    await put(join(s, "build.json"), build.out.trim() + "\n");
  }
  for (const [label, argv] of [
    ["menu", ["atlas", "menu", "--db", db, "--json"]],
    ["gaps", ["atlas", "gaps", "--db", db, "--json", "--limit", "50"]],
    ["docs", ["atlas", "docs", "--db", db]],
    ["dupes", ["atlas", "dupes", "--db", db]],
    ["search", ["atlas", "search", "nie", "--db", db, "--json", "--limit", "50"]],
    ["status", ["atlas", "status", "--db", db]],
  ] as [string, string[]][]) {
    const r = await step("index", label, [NIE, ...argv], {
      cwd: ROOT,
      timeout: STAGE_TIMEOUT,
      quiet: true,
    });
    steps++;
    if (!r.ok) continue;
    await put(join(s, `${label}.txt`), `${r.out}\n`);
    const trimmed = r.out.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("["))
      await put(join(s, `${label}.json`), trimmed + "\n");
    say(`  · index/${label} ${r.ms}ms`);
  }
  record({
    stage: "index",
    ok: failures.length === before,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${steps} atlas command(s)`,
  });
}

/** 14. Pack: one archive, with a hash and a manifest that says what is inside. */
async function stagePack() {
  const t = performance.now();
  const before = failures.length;
  const exclude = new Set([join(OUT, "pack")]);
  // SQLite transient files (-wal, -shm, -journal) disappear when the connection closes: they
  // are never part of the archive and would make tar fail on a vanished path.
  const transientDb = /\.sqlite3?-(wal|shm|journal)$/;
  const files = [...walk(OUT)].filter(
    (p) =>
      ![...exclude].some((e) => p.startsWith(e)) &&
      !transientDb.test(p) &&
      (PACK_RAW || !p.includes(`${join(OUT, "raw")}`)),
  );
  const manifest = {
    generatedAt: new Date().toISOString(),
    target: GAME,
    full: FULL,
    characters: ctx.byModel.size,
    files: files.length,
    bytes: files.reduce((n, p) => n + statSync(p).size, 0),
    stages: results,
    failures,
    contents: files.map((p) => rel(p)).sort(),
  };
  await put(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));

  let steps = 0;
  const tgz = join(D.pack, "nie-archive.tar.gz");
  // Bun.Archive in this Bun build writes zero-byte entries for Bun.file sources, so the archive
  // is always built by bsdtar/gtar from a file list, then checked for size.
  const list = join(D.pack, "files.txt");
  await put(list, files.map((p) => rel(p)).join("\n") + "\n");
  const tarBin = which("bsdtar") ?? which("tar") ?? "tar";
  const r = await exec([tarBin, "-czf", tgz, "-C", OUT, "-T", list], {
    cwd: OUT,
    timeout: 0,
  });
  steps++;
  let packed = r.ok && existsSync(tgz);
  if (!r.ok) failures.push(`pack/tar: ${(r.err || r.out).slice(0, 200)}`);
  if (packed) {
    const buf = readFileSync(tgz);
    if (buf.length < files.length) {
      failures.push(
        `pack: archive suspecte (${buf.length} octets pour ${files.length} entrées)`,
      );
      packed = false;
    } else {
      await put(
        join(D.pack, "nie-archive.tar.gz.sha256"),
        `${sha(buf)}  nie-archive.tar.gz\n`,
      );
      say(
        `  · pack ${files.length} files, ${(buf.length / 1048576).toFixed(1)} MiB -> ${rel(tgz)}`,
      );
    }
  }
  record({
    stage: "pack",
    ok: failures.length === before && packed,
    ms: ms(t),
    steps,
    failed: failures.length - before,
    note: `${files.length} files`,
  });
}

// ---------------------------------------------------------------- runner

/** 15. Publish: assemble the aphrody.com/nie tree (pages + every asset the pages link). */
async function stagePublish() {
  const t = performance.now();
  const before = failures.length;
  const PUB = opt(
    "publish-dir",
    join(ROOT, "apps", "aphrody", "public", "nie"),
  )!;
  const trees = [
    { src: D.site, dst: "", skip: [] as string[] },
    { src: D.theme, dst: "theme", skip: [] },
    { src: D.icons, dst: "icons", skip: ["dict/"] },
    { src: D.images, dst: "images", skip: [] },
    { src: D.models, dst: "models", skip: [] },
    { src: D.dataset, dst: "dataset", skip: [] },
    { src: D.wiki, dst: "wiki", skip: [] },
    { src: D.audio, dst: "audio", skip: [] },
    { src: D.video, dst: "video", skip: [] },
    { src: D.data, dst: "data", skip: ["logs/", "state.json"] },
  ];
  let n = 0;
  let bytes = 0;
  for (const { src, dst, skip } of trees) {
    for (const p of walk(src)) {
      const r = relative(src, p).replaceAll("\\", "/");
      if (skip.some((s) => r === s || r.startsWith(s))) continue;
      const body = await Bun.file(p).arrayBuffer();
      await put(join(PUB, dst, r), body);
      n++;
      bytes += body.byteLength;
    }
  }
  // the archive manifest and a plain index of what a consumer can download
  if (existsSync(join(OUT, "manifest.json")))
    await put(
      join(PUB, "manifest.json"),
      await Bun.file(join(OUT, "manifest.json")).text(),
    );
  await put(
    join(PUB, "assets.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        base: opt("site-base", "/nie/"),
        characters: ctx.byModel.size,
        files: n,
        bytes,
        trees: trees.map((t) => t.dst || "pages"),
      },
      null,
      2,
    ),
  );
  say(
    `  · publish ${n} file(s), ${(bytes / 1048576).toFixed(1)} MiB -> ${relative(ROOT, PUB)}`,
  );
  record({
    stage: "publish",
    ok: failures.length === before,
    ms: ms(t),
    steps: trees.length,
    failed: failures.length - before,
    note: `${n} files under public/nie`,
  });
}

const STAGES: Record<string, () => Promise<void>> = {
  probe: stageProbe,
  vfs: stageVfs,
  zukan: stageZukan,
  wiki: stageWiki,
  icons: stageIcons,
  models: stageModels,
  audio: stageAudio,
  video: stageVideo,
  data: stageData,
  assets: stageAssets,
  theme: stageTheme,
  dataset: stageDataset,
  site: stageSite,
  survey: stageSurvey,
  index: stageIndex,
  pack: stagePack,
  publish: stagePublish,
};
const ORDER = [
  "probe",
  "vfs",
  "zukan",
  "wiki",
  "icons",
  "models",
  "audio",
  "video",
  "data",
  "assets",
  "theme",
  "dataset",
  "site",
  "survey",
  "index",
  "pack",
  "publish",
];

if (flag("list")) {
  for (const s of ORDER) say(`${s}\t${STAGES[s] ? "ready" : "missing"}`);
  process.exit(0);
}

const wanted: string[] = positional.length
  ? positional
      .flatMap((p: string) =>
        p === "all" ? ORDER : p.split(",").map((x: string) => x.trim()),
      )
      .filter((x: string) => Boolean(x))
  : ORDER.filter(
      (s: string) => !QUICK || !["video", "data", "assets"].includes(s),
    );
const unknown = wanted.filter((s: string) => !STAGES[s]);
if (unknown.length) {
  warn(`unknown stage(s): ${unknown.join(", ")} — known: ${ORDER.join(", ")}`);
  process.exit(2);
}

if (!existsSync(GAME)) {
  warn(`game install not found: ${GAME}\npass --game-dir=<path>`);
  process.exit(2);
}
if (!WIKI)
  for (const s of ["zukan", "wiki"])
    if (wanted.includes(s)) warn(`no-web: ${s} will only use the local data`);

say(`nie-archive  target=${GAME}`);
say(
  `            out=${OUT}  stages=${wanted.join(",")}  full=${FULL}  jobs=${JOBS}`,
);
const t0 = performance.now();
if (loadState())
  say(
    `            resumed state: ${ctx.byModel.size} character(s), ${ctx.vfs.g4md.length} g4md`,
  );
for (const name of wanted) {
  const t = performance.now();
  say(`\n== ${name}`);
  try {
    await STAGES[name]!();
  } catch (e) {
    failures.push(`${name}: ${e}`);
    record({
      stage: name,
      ok: false,
      ms: ms(t),
      steps: 0,
      failed: 1,
      note: String(e).slice(0, 200),
    });
    warn(`  !! ${name}: ${e}`);
  }
}
const total = ms(t0);
for (const r of results)
  say(
    `${r.ok ? "ok  " : "FAIL"} ${r.stage.padEnd(8)} ${String(r.ms).padStart(7)}ms  steps=${r.steps} failed=${r.failed} ${r.note ?? ""}`,
  );
say(
  `\n${results.filter((r) => r.ok).length}/${results.length} stage(s) ok in ${(total / 1000).toFixed(1)}s`,
);
if (failures.length) {
  say(`\n${failures.length} failure(s):`);
  for (const f of failures.slice(0, 40)) say(`  - ${f}`);
}
say(`\narchive  ${OUT}`);
say(`manifest ${join(OUT, "manifest.json")}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
