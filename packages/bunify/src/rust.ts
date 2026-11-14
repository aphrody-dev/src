// Stage `rust`: analyse a Bun-ready JS/TS repo and plan (and where mechanical, do) the move of hot or native parts to Rust.
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { allCalls, engine, type Engine } from "./fullbun.ts";

export type Status = "rewritten" | "manual" | "plan";
export interface Item {
  kind: "addon" | "hot" | "tool";
  id: string;
  file: string;
  line: number;
  status: Status;
  /** Replacement command (tool) or Rust crate (hot/addon). */
  to: string;
  /** Pinned source of the replacement (github:owner/repo). */
  pin?: string;
  note: string;
}
export interface RustPlan {
  engine: Engine;
  items: Item[];
  summary: { addon: number; hot: number; tool: number; rewritten: number; manual: number };
}

/** Rust projects checked on GitHub (gh api, 2026-11-14). `fork`: an aphrody-labs fork exists, prefer it. */
export const CRATES: Record<string, { repo: string; fork?: boolean }> = {
  oxc: { repo: "oxc-project/oxc", fork: true },
  swc: { repo: "swc-project/swc", fork: true },
  lightningcss: { repo: "parcel-bundler/lightningcss" },
  rspack: { repo: "web-infra-dev/rspack" },
  dprint: { repo: "dprint/dprint" },
  ignore: { repo: "BurntSushi/ripgrep" },
  walkdir: { repo: "BurntSushi/walkdir" },
  notify: { repo: "notify-rs/notify" },
  blake3: { repo: "BLAKE3-team/BLAKE3" },
  sha2: { repo: "RustCrypto/hashes" },
  argon2: { repo: "RustCrypto/password-hashes" },
  ring: { repo: "briansmith/ring" },
  image: { repo: "image-rs/image" },
  zstd: { repo: "gyscos/zstd-rs" },
  flate2: { repo: "rust-lang/flate2-rs" },
  comrak: { repo: "kivikakk/comrak" },
  oxc_resolver: { repo: "oxc-project/oxc_resolver" },
  "napi-rs": { repo: "napi-rs/napi-rs" },
};
export const pinOf = (crate: string) => {
  const c = CRATES[crate.split(/[ ,]/)[0]!];
  return c ? `github:${c.fork ? "aphrody-labs/" + c.repo.split("/")[1] : c.repo}` : undefined;
};

/** npm packages that are native addons or addon toolchains (a subset overlaps depot-migrate OBSOLETE_NODE_PACKAGES). */
export const ADDON_DEPS = ["node-gyp", "nan", "node-addon-api", "bindings", "node-gyp-build", "prebuild-install", "prebuildify", "node-pre-gyp", "@mapbox/node-pre-gyp", "cmake-js"];

/** CPU-hot pure packages -> Rust crate. */
export const HOT: Record<string, { crate: string; area: string }> = {
  md5: { crate: "blake3, sha2", area: "hashing" },
  "js-sha256": { crate: "sha2", area: "hashing" },
  "js-sha512": { crate: "sha2", area: "hashing" },
  "sha.js": { crate: "sha2", area: "hashing" },
  "hash.js": { crate: "sha2", area: "hashing" },
  "crypto-js": { crate: "sha2, ring", area: "crypto" },
  "node-forge": { crate: "ring", area: "crypto" },
  argon2: { crate: "argon2", area: "crypto" },
  marked: { crate: "comrak", area: "parsing" },
  "markdown-it": { crate: "comrak", area: "parsing" },
  acorn: { crate: "oxc", area: "parsing" },
  esprima: { crate: "oxc", area: "parsing" },
  "@babel/parser": { crate: "oxc", area: "parsing" },
  "@babel/core": { crate: "swc", area: "parsing" },
  pako: { crate: "flate2", area: "compression" },
  fflate: { crate: "flate2", area: "compression" },
  snappy: { crate: "zstd", area: "compression" },
  "node-zstd": { crate: "zstd", area: "compression" },
  sharp: { crate: "image", area: "image" },
  jimp: { crate: "image", area: "image" },
  pngjs: { crate: "image", area: "image" },
  glob: { crate: "ignore", area: "glob/walk" },
  globby: { crate: "ignore", area: "glob/walk" },
  "fast-glob": { crate: "ignore", area: "glob/walk" },
  readdirp: { crate: "walkdir", area: "glob/walk" },
  chokidar: { crate: "notify", area: "glob/walk" },
  "enhanced-resolve": { crate: "oxc_resolver", area: "parsing" },
  postcss: { crate: "lightningcss", area: "parsing" },
  autoprefixer: { crate: "lightningcss", area: "parsing" },
};

// ---------- tool invocations ----------
interface ToolRule {
  to: string;
  crate: string;
  /** Accepted flags: replacement ("" drops the flag). Anything else makes the site manual. */
  flags?: Record<string, string>;
  /** Flags that take a value (kept verbatim with it). */
  valued?: string[];
  /** Positional arguments allowed (paths). */
  paths?: boolean;
  /** Mechanical only when no flag but these is present and (when set) one of `require` is. */
  require?: string[];
  note: string;
}
export const TOOLS: Record<string, ToolRule> = {
  prettier: { to: "bun fmt", crate: "oxc", flags: { "--write": "", "-w": "", "--check": "--check", "-c": "--check", "--list-different": "--check", "-l": "--check" }, paths: true, note: "bun fmt" },
  eslint: { to: "oxlint", crate: "oxc", flags: { "--fix": "--fix", "--quiet": "--quiet" }, valued: ["--max-warnings"], paths: true, note: "oxlint (config: oxlint --init, rule coverage differs)" },
  tsc: { to: "bun check", crate: "oxc", flags: { "--noEmit": "" }, require: ["--noEmit"], note: "bun check (type-check only)" },
  babel: { to: "swc", crate: "swc", flags: { "-d": "-d", "--out-dir": "-d", "-w": "-w", "--watch": "-w" }, valued: ["-d", "--out-dir"], paths: true, note: "swc (.swcrc replaces babel config)" },
  postcss: { to: "lightningcss", crate: "lightningcss", note: "lightningcss CLI (plugins have no equivalent)" },
  autoprefixer: { to: "lightningcss", crate: "lightningcss", note: "lightningcss does vendor prefixing from browserslist targets" },
  webpack: { to: "rspack build", crate: "rspack", note: "rspack (loader/plugin compatibility to verify); Next: turbopack" },
  "webpack-cli": { to: "rspack build", crate: "rspack", note: "rspack (loader/plugin compatibility to verify)" },
};
const PREFIX = /^(?:(?:npx|bunx|pnpm\s+(?:exec|dlx)|yarn(?:\s+dlx)?|bun\s+x)\s+)+/;
const SHELL = /[|$`<>(){}*?&;]/;

export type Rewrite = { out: string; crate: string } | { manual: string; to: string; crate: string };
/** Map one tool command line (no shell operators) to its Rust-backed equivalent; null when the tool is unknown. */
export function rewriteTool(cmd: string): Rewrite | null {
  const line = cmd.trim().replace(PREFIX, "");
  const tokens = line.split(/\s+/);
  const rule = TOOLS[tokens[0] ?? ""];
  if (!rule) return null;
  const to = rule.to;
  const crate = rule.crate;
  if (SHELL.test(line)) return { manual: "shell syntax in the command", to, crate };
  if (!rule.flags) return { manual: rule.note, to, crate };
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t.startsWith("-")) {
      const [name] = t.split("=");
      if (!(name! in rule.flags)) return { manual: `flag ${name} has no equivalent`, to, crate };
      seen.add(name!);
      if (rule.valued?.includes(name!)) {
        const val = t.includes("=") ? "" : tokens[++i];
        out.push(t.includes("=") ? t.replace(name!, rule.flags[name!]!) : rule.flags[name!]!, ...(val ? [val] : []));
      } else if (rule.flags[name!]) out.push(rule.flags[name!]!);
    } else if (rule.paths) out.push(t);
    else return { manual: "positional arguments", to, crate };
  }
  if (rule.require && !rule.require.some((f) => seen.has(f))) return { manual: `only ${rule.require.join("/")} runs map to ${to}`, to, crate };
  return { out: [to, ...out].join(" "), crate };
}

/** Rewrite every tool segment of a package.json script. */
export function rewriteToolScript(script: string): { out: string; hits: Rewrite[] } {
  const hits: Rewrite[] = [];
  const parts = script.split(/(\s*(?:&&|\|\||;)\s*)/);
  const out = parts.map((p, i) => {
    if (i % 2) return p;
    const r = rewriteTool(p);
    if (!r) return p;
    hits.push(r);
    return "out" in r ? r.out : p;
  });
  return { out: out.join(""), hits };
}

const SPAWN = new Set(["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "execa", "execaSync", "execaCommand", "execaCommandSync"]);
const LINE_FORM = new Set(["exec", "execSync", "execaCommand", "execaCommandSync"]);
const str = (a: string | undefined): string | undefined => {
  const m = a?.match(/^(['"`])((?:(?!\1)[^\\])*)\1$/);
  return m && !(m[1] === "`" && m[2]!.includes("${")) ? m[2] : undefined;
};
const strArray = (a: string | undefined): string[] | undefined => {
  if (!a?.startsWith("[") || !a.endsWith("]")) return undefined;
  const parts = a.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
  const vals = parts.map(str);
  return vals.every((v) => v !== undefined) ? (vals as string[]) : undefined;
};

/** Analyse one JS/TS source file. Returns plan items and the rewritten text (when a mechanical rewrite applied). */
export function analyzeSource(file: string, text: string): { items: Item[]; text: string } {
  const items: Item[] = [];
  const lineOf = (i: number) => text.slice(0, i).split("\n").length;
  const edits: { s: number; e: number; r: string }[] = [];
  for (const c of allCalls(file, text)) {
    const name = c.callee.split(".").pop()!;
    const line = lineOf(c.start);
    if (name === "dlopen" && c.callee.startsWith("process"))
      items.push({ kind: "addon", id: "process.dlopen", file, line, status: "plan", to: "Rust cdylib + bun:ffi", pin: undefined, note: "load a native .node addon directly" });
    else if (c.callee === "require" || c.callee === "createRequire") {
      const spec = str(c.args[0]);
      if (spec && /\.node$/.test(spec)) items.push({ kind: "addon", id: "*.node", file, line, status: "plan", to: "Rust cdylib + bun:ffi", note: `.node binary (${spec})` });
    } else if (SPAWN.has(name)) {
      const first = str(c.args[0]);
      if (!first) continue;
      const arr = LINE_FORM.has(name) ? undefined : strArray(c.args[1]);
      const full = LINE_FORM.has(name) ? first : arr ? `${first} ${arr.join(" ")}` : first;
      if (!LINE_FORM.has(name) && c.args[1] && !arr && !/^\{/.test(c.args[1])) continue;
      const r = rewriteTool(full);
      if (!r) continue;
      const id = full.replace(PREFIX, "").split(/\s+/)[0]!;
      if ("out" in r) {
        const [bin, ...rest] = r.out.split(" ");
        const q = c.args[0]!.slice(0, 1) === "`" ? '"' : c.args[0]![0]!;
        const args = [...c.args];
        if (LINE_FORM.has(name)) args[0] = `${q}${r.out}${q}`;
        else if (arr) {
          args[0] = `${q}${bin}${q}`;
          args[1] = `[${rest.map((a) => JSON.stringify(a)).join(", ")}]`;
        } else args[0] = `${q}${r.out}${q}`;
        if (!LINE_FORM.has(name) && !arr && rest.length) {
          items.push({ kind: "tool", id, file, line, status: "manual", to: r.out, pin: pinOf(r.crate), note: "args not a literal array" });
          continue;
        }
        edits.push({ s: c.start, e: c.end, r: `${c.callee}(${args.join(", ")})` });
        items.push({ kind: "tool", id, file, line, status: "rewritten", to: r.out, pin: pinOf(r.crate), note: TOOLS[id]?.note ?? "" });
      } else items.push({ kind: "tool", id, file, line, status: "manual", to: r.to, pin: pinOf(r.crate), note: r.manual });
    }
  }
  // package imports of hot / addon packages (static, dynamic, require)
  const seen = new Set<string>();
  for (const m of text.matchAll(/(?:\bfrom\s+|\brequire\s*\(\s*|\bimport\s*\(\s*|^\s*import\s+)(['"])([^'"]+)\1/gm)) {
    const spec = m[2]!;
    const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]!;
    if (seen.has(pkg)) continue;
    seen.add(pkg);
    const hot = HOT[pkg];
    const line = lineOf(m.index!);
    if (hot) items.push({ kind: "hot", id: pkg, file, line, status: "plan", to: hot.crate, pin: pinOf(hot.crate), note: hot.area });
    else if (ADDON_DEPS.includes(pkg)) items.push({ kind: "addon", id: pkg, file, line, status: "plan", to: "Rust cdylib + bun:ffi", note: "native addon loader" });
  }
  let out = text;
  for (const e of edits.sort((a, b) => b.s - a.s)) out = out.slice(0, e.s) + e.r + out.slice(e.e);
  return { items, text: out };
}

/** Analyse a package.json (scripts, addon fields). Returns items and the rewritten manifest text. */
export function analyzeManifest(file: string, raw: string): { items: Item[]; text: string } {
  const items: Item[] = [];
  let pkg: any;
  try {
    pkg = JSON.parse(raw);
  } catch {
    return { items, text: raw };
  }
  let dirty = false;
  const lineOf = (needle: string) => Math.max(1, raw.split("\n").findIndex((l) => l.includes(needle)) + 1);
  for (const [k, v] of Object.entries<string>(pkg.scripts ?? {})) {
    const { out, hits } = rewriteToolScript(v);
    for (const h of hits) {
      const id = "out" in h ? h.out.split(" ")[0]! : h.to.split(" ")[0]!;
      items.push({ kind: "tool", id: `scripts.${k}`, file, line: lineOf(`"${k}"`), status: "out" in h ? "rewritten" : "manual", to: "out" in h ? h.out : h.to, pin: pinOf(h.crate), note: "out" in h ? `script: ${id}` : h.manual });
    }
    if (out !== v) {
      pkg.scripts[k] = out;
      dirty = true;
    }
    if (/\bnode-gyp\b|\bcmake-js\b/.test(v)) items.push({ kind: "addon", id: `scripts.${k}`, file, line: lineOf(`"${k}"`), status: "plan", to: "Rust cdylib + bun:ffi", note: "native build step" });
  }
  if (pkg.gypfile) items.push({ kind: "addon", id: "gypfile", file, line: lineOf("gypfile"), status: "plan", to: "Rust cdylib + bun:ffi", note: "binding.gyp addon" });
  for (const f of ["dependencies", "devDependencies", "optionalDependencies"])
    for (const dep of Object.keys(pkg[f] ?? {})) {
      const line = lineOf(`"${dep}"`);
      if (ADDON_DEPS.includes(dep)) items.push({ kind: "addon", id: dep, file, line, status: "plan", to: "Rust cdylib + bun:ffi", note: `${f}` });
      else if (HOT[dep]) items.push({ kind: "hot", id: dep, file, line, status: "plan", to: HOT[dep]!.crate, pin: pinOf(HOT[dep]!.crate), note: `${HOT[dep]!.area} (${f})` });
      else if (TOOLS[dep]) items.push({ kind: "tool", id: dep, file, line, status: "plan", to: TOOLS[dep]!.to, pin: pinOf(TOOLS[dep]!.crate), note: `${f}: ${TOOLS[dep]!.note}` });
    }
  const indent = raw.match(/^\{\n([ \t]+)"/)?.[1] ?? "  ";
  return { items, text: dirty ? JSON.stringify(pkg, null, indent) + "\n" : raw };
}

export interface RustOptions {
  root: string;
  files: string[];
  /** Persist a rewritten file (honours --check in the caller). */
  save: (rel: string, before: string, after: string) => Promise<void>;
}

/** Fixtures, examples and test trees are not migration targets. */
const SKIP = /(?:^|[\\/])(?:node_modules|dist|compiled|fixtures|examples|tests?|e2e|target|\.next)[\\/]/;

export async function runRust({ root, files, save }: RustOptions): Promise<RustPlan> {
  const eng = await engine();
  const items: Item[] = [];
  const manifests: string[] = [];
  for await (const rel of new Glob("**/package.json").scan({ cwd: root }))
    if (!SKIP.test(rel)) manifests.push(rel.replace(/\\/g, "/"));
  for (const rel of manifests.sort()) {
    const before = readFileSync(join(root, rel), "utf8");
    const r = analyzeManifest(rel, before);
    items.push(...r.items);
    await save(rel, before, r.text);
  }
  for (const rel of files.filter((r) => !SKIP.test(r))) {
    const before = readFileSync(join(root, rel), "utf8");
    const r = analyzeSource(rel, before);
    items.push(...r.items);
    await save(rel, before, r.text);
  }
  for await (const rel of new Glob("**/binding.gyp").scan({ cwd: root }))
    if (!SKIP.test(rel)) items.push({ kind: "addon", id: "binding.gyp", file: rel.replace(/\\/g, "/"), line: 1, status: "plan", to: "Rust cdylib + bun:ffi", note: "node-gyp build description" });
  const count = (k: Item["kind"]) => items.filter((i) => i.kind === k).length;
  return {
    engine: eng,
    items,
    summary: { addon: count("addon"), hot: count("hot"), tool: count("tool"), rewritten: items.filter((i) => i.status === "rewritten").length, manual: items.filter((i) => i.status === "manual").length },
  };
}

export function planMarkdown(plan: RustPlan, title = "Rust migration plan"): string {
  const s = plan.summary;
  const L = [`# ${title}`, "", `Generated by @aphrody/bunify (stage rust, engine ${plan.engine}).`, "", `Addons ${s.addon}, hot modules ${s.hot}, tool invocations ${s.tool} (${s.rewritten} rewritten, ${s.manual} manual).`, ""];
  const group = (kind: Item["kind"], head: string, cols: string) => {
    const rows = plan.items.filter((i) => i.kind === kind);
    if (!rows.length) return;
    // collapse by (id,to,status): one row per distinct target with its first locations
    const by = new Map<string, Item[]>();
    for (const r of rows) by.set(`${r.id}\0${r.to}\0${r.status}`, [...(by.get(`${r.id}\0${r.to}\0${r.status}`) ?? []), r]);
    L.push(`## ${head}`, "", cols, cols.replace(/[^|]/g, "-"));
    for (const g of by.values()) {
      const r = g[0]!;
      const where = g.slice(0, 3).map((x) => `${x.file}:${x.line}`).join(", ") + (g.length > 3 ? ` (+${g.length - 3})` : "");
      L.push(`| ${r.id} | ${r.status} | ${r.to} | ${r.pin ?? ""} | ${where} | ${r.note} |`);
    }
    L.push("");
  };
  const cols = "| id | status | to | pin | where | note |";
  group("addon", "Native addons (N-API / node-gyp -> Rust cdylib via bun:ffi, C ABI)", cols);
  group("hot", "CPU-hot modules -> Rust crates", cols);
  group("tool", "JS CLIs with Rust equivalents", cols);
  return L.join("\n");
}

