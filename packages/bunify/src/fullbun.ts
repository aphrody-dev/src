// "fullbun" pass: replace Node-era dependencies by Bun built-ins, driven by a table of rules.
// Source rewrites use the tree-sitter core (@aphrody/core query) when present, else a balanced-paren scanner.
// A rule rewrites a file only when every use of the dependency has a shape it fully understands; otherwise
// the sites are reported in `manual` and the file is left untouched.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { KNOWN_PATCHES } from "./patches.ts";

export interface Manual {
  rule: string;
  file: string;
  line: number;
  reason: string;
}
export interface RuleStats {
  files: number;
  rewritten: number;
  manual: number;
  kept: number;
}
export type Engine = "tree-sitter" | "regex";

interface Call {
  callee: string;
  args: string[];
  start: number;
  end: number;
}
interface Binding {
  local: string;
  imported: string; // "default" | "*" | named export | "" (side effect)
  spec: string;
}
interface Stmt {
  s: number;
  e: number;
  kind: "import" | "require";
  spec: string;
  bindings: Binding[];
  bad?: string;
}
interface Need {
  mod: string;
  name: string;
  as: string;
}
type Handled = { s?: number; e?: number; r: string; need?: Need } | string;

export interface Rule {
  id: string;
  packages: string[];
  bun: string;
  /** rewrite: codemod + drop dependency; report: list only; keep: counted, left alone; patch: known bun patch. */
  mode?: "rewrite" | "report" | "keep" | "patch";
  note?: string;
  /** Packages whose dependency entry may be dropped once no reference is left. */
  drop?: string[];
  apply?: (f: FileCtx) => void;
}

const SIMPLE = /^[\w@%+=:,./-]+$/;
const lit = (a: string | undefined) => (a?.match(/^(['"])((?:(?!\1)[^\\])*)\1$/) ? a.slice(1, -1) : undefined);

// ---------- scanning helpers ----------
export function matchParen(t: string, open: number): number {
  const close = { "(": ")", "[": "]", "{": "}" }[t[open] as "("]!;
  const stack = [close];
  for (let i = open + 1; i < t.length; i++) {
    const c = t[i]!;
    if (c === "'" || c === '"') {
      for (i++; i < t.length && t[i] !== c; i++) if (t[i] === "\\") i++;
    } else if (c === "`") {
      for (i++; i < t.length && t[i] !== "`"; i++) {
        if (t[i] === "\\") i++;
        else if (t[i] === "$" && t[i + 1] === "{") {
          const j = matchParen(t, i + 1);
          if (j < 0) return -1;
          i = j;
        }
      }
    } else if (c === "/" && t[i + 1] === "/") i = t.indexOf("\n", i) < 0 ? t.length : t.indexOf("\n", i);
    else if (c === "/" && t[i + 1] === "*") i = t.indexOf("*/", i + 2) < 0 ? t.length : t.indexOf("*/", i + 2) + 1;
    else if (c === "(" || c === "[" || c === "{") stack.push({ "(": ")", "[": "]", "{": "}" }[c]);
    else if (c === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) return i;
    }
  }
  return -1;
}
export function splitTop(inner: string): string[] {
  const out: string[] = [];
  let from = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]!;
    if (c === "'" || c === '"' || c === "`") {
      for (i++; i < inner.length && inner[i] !== c; i++) if (inner[i] === "\\") i++;
    } else if (c === "(" || c === "[" || c === "{") {
      const j = matchParen(inner, i);
      if (j < 0) return [inner.trim()];
      i = j;
    } else if (c === ",") {
      out.push(inner.slice(from, i).trim());
      from = i + 1;
    }
  }
  const last = inner.slice(from).trim();
  if (last) out.push(last);
  return out;
}

let core: { query(path: string, content: string, sexpr: string): unknown[] } | null | undefined;
async function loadQuery() {
  if (forceRegex) return null;
  if (core !== undefined) return core;
  core = null;
  try {
    if (!process.env.APHRODY_CORE_LIB) {
      const lib = join(import.meta.dir, "..", "..", "..", "target", "release", `${process.platform === "win32" ? "" : "lib"}aphrody_core_capi.${process.platform === "win32" ? "dll" : process.platform === "darwin" ? "dylib" : "so"}`);
      if (existsSync(lib)) process.env.APHRODY_CORE_LIB = lib;
    }
    const mod = await import("../../core/src/ffi.ts");
    if (mod.loadCore?.()) core = { query: mod.query };
  } catch {
    core = null;
  }
  return core;
}
export const engine = async (): Promise<Engine> => ((await loadQuery()) ? "tree-sitter" : "regex");
/** Force the regex engine (tests). */
let forceRegex = false;
export function useCore(on: boolean) {
  forceRegex = !on;
}

const grammarPath = (p: string) => (/\.(tsx|jsx)$/.test(p) ? "x.tsx" : /\.(ts|mts|cts)$/.test(p) ? "x.ts" : "x.js");

function astCalls(path: string, text: string, locals: Set<string> | null): Call[] | null {
  if (forceRegex || !core) return null;
  try {
    const rows = core.query(grammarPath(path), text, "(call_expression function: (_) @f arguments: (arguments) @a) @c") as {
      capture_name: string;
      text: string;
      span: { start_byte: number; end_byte: number };
    }[];
    const ascii = text.length === Buffer.byteLength(text);
    const buf = ascii ? null : Buffer.from(text);
    const idx = (b: number) => (buf ? buf.subarray(0, b).toString().length : b);
    const calls: Call[] = [];
    let cur: Partial<Call> | null = null;
    for (const r of rows) {
      if (r.capture_name === "c") {
        cur = { start: idx(r.span.start_byte), end: idx(r.span.end_byte) };
      } else if (r.capture_name === "f" && cur) cur.callee = r.text;
      else if (r.capture_name === "a" && cur?.callee) {
        const head = cur.callee.split(".")[0]!;
        if ((!locals || locals.has(head)) && /^[\w$]+(\.[\w$]+)?$/.test(cur.callee))
          calls.push({ callee: cur.callee, args: splitTop(r.text.slice(1, -1)), start: cur.start!, end: cur.end! });
      }
    }
    return calls;
  } catch {
    return null;
  }
}
/** Every `name(...)` or `a.b(...)` call of a file (tree-sitter when the core is loaded, else a regex); call `await engine()` first. */
export function allCalls(path: string, text: string): { callee: string; args: string[]; start: number; end: number }[] {
  return astCalls(path, text, null) ?? regexCalls(text, null);
}
function regexCalls(text: string, locals: Set<string> | null): Call[] {
  if (!locals) {
    const calls: Call[] = [];
    for (let m, re = /(?<![.\w$])([\w$]+(?:\.[\w$]+)?)\s*\(/g; (m = re.exec(text)); ) {
      const open = m.index + m[0].length - 1;
      const close = matchParen(text, open);
      if (close >= 0) calls.push({ callee: m[1]!, args: splitTop(text.slice(open + 1, close)), start: m.index, end: close + 1 });
    }
    return calls;
  }
  const calls: Call[] = [];
  for (const local of locals) {
    const re = new RegExp(`(?<![.\\w$])${local.replace(/\$/g, "\\$")}(\\.[\\w$]+)?\\s*\\(`, "g");
    for (let m; (m = re.exec(text)); ) {
      const open = m.index + m[0].length - 1;
      const close = matchParen(text, open);
      if (close < 0) continue;
      calls.push({
        callee: local + (m[1] ?? ""),
        args: splitTop(text.slice(open + 1, close)),
        start: m.index,
        end: close + 1,
      });
    }
  }
  return calls;
}

// ---------- import / require statements ----------
function parseClause(clause: string): { bindings: Omit<Binding, "spec">[]; bad?: string } {
  const bindings: Omit<Binding, "spec">[] = [];
  let rest = clause.trim();
  const ns = rest.match(/^(?:([\w$]+)\s*,\s*)?\*\s*as\s+([\w$]+)$/);
  if (ns) return { bindings: [{ local: ns[2]!, imported: "*" }], bad: "namespace import" };
  const def = rest.match(/^([\w$]+)\s*(?:,\s*)?/);
  if (def && !rest.startsWith("{")) {
    bindings.push({ local: def[1]!, imported: "default" });
    rest = rest.slice(def[0].length);
  }
  const named = rest.match(/^\{([^}]*)\}$/s);
  if (named)
    for (const part of named[1]!.split(",").map((p) => p.trim()).filter(Boolean)) {
      const m = part.match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/);
      if (!m) return { bindings, bad: `specifier "${part}"` };
      bindings.push({ local: m[2] ?? m[1]!, imported: m[1]! });
    }
  else if (rest) return { bindings, bad: "import clause" };
  return { bindings };
}
function parseDestructure(lhs: string): { bindings: Omit<Binding, "spec">[]; bad?: string } {
  if (!lhs.startsWith("{")) return { bindings: [{ local: lhs, imported: "default" }] };
  const bindings: Omit<Binding, "spec">[] = [];
  for (const part of lhs.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean)) {
    const m = part.match(/^([\w$]+)(?:\s*:\s*([\w$]+))?$/);
    if (!m) return { bindings, bad: `pattern "${part}"` };
    bindings.push({ local: m[2] ?? m[1]!, imported: m[1]! });
  }
  return { bindings };
}
export const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

function findStatements(text: string, packages: string[]): Stmt[] {
  const alt = packages.map(esc).join("|");
  const spec = (n: number) => `(['"])((?:${alt})(?:/[\\w./-]*)?)\\${n}`;
  const out: Stmt[] = [];
  for (const m of text.matchAll(new RegExp(`^[ \\t]*import\\s+(type\\s+)?([^'";]*?)\\s*from\\s*${spec(3)};?[ \\t]*\\r?\\n?`, "gm"))) {
    const p = parseClause(m[2]!);
    out.push({
      s: m.index!, e: m.index! + m[0].length, kind: "import", spec: m[4]!,
      bindings: p.bindings.map((b) => ({ ...b, spec: m[4]! })),
      bad: m[1] ? "type-only import" : p.bad,
    });
  }
  for (const m of text.matchAll(new RegExp(`^[ \\t]*import\\s*${spec(1)};?[ \\t]*\\r?\\n?`, "gm")))
    out.push({ s: m.index!, e: m.index! + m[0].length, kind: "import", spec: m[2]!, bindings: [{ local: "", imported: "", spec: m[2]! }] });
  for (const m of text.matchAll(new RegExp(`^[ \\t]*(?:const|let|var)\\s+([\\w$]+|\\{[^}]*\\})\\s*=\\s*require\\(\\s*${spec(2)}\\s*\\)(\\.[\\w$]+)?;?[ \\t]*\\r?\\n?`, "gm"))) {
    const p = parseDestructure(m[1]!.trim());
    let bindings = p.bindings.map((b) => ({ ...b, spec: m[3]! }));
    let bad = p.bad;
    if (m[4]) {
      if (bindings.length === 1 && bindings[0]!.imported === "default") bindings = [{ ...bindings[0]!, imported: m[4].slice(1) }];
      else bad = "require member";
    }
    out.push({ s: m.index!, e: m.index! + m[0].length, kind: "require", spec: m[3]!, bindings, bad });
  }
  return out.sort((a, b) => a.s - b.s);
}

// ---------- per-file context ----------
export class FileCtx {
  edits: { s: number; e: number; r: string }[] = [];
  manual: Manual[] = [];
  rewritten = 0;
  kept = 0;
  needs = new Set<string>();
  private lineStarts: number[] = [];
  private callsCache?: Call[];
  constructor(public path: string, public text: string, public ruleId: string, public stmts: Stmt[], public versions: (pkg: string) => number[]) {
    this.lineStarts = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === "\n") this.lineStarts.push(i + 1);
  }
  line(i: number) {
    let lo = 0, hi = this.lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.lineStarts[mid]! <= i) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }
  note(i: number, reason: string) {
    this.manual.push({ rule: this.ruleId, file: this.path, line: this.line(i), reason });
  }
  callsFor(locals: string[]): Call[] {
    const set = new Set(locals);
    return astCalls(this.path, this.text, set) ?? regexCalls(this.text, set);
  }
  /** Occurrences of an identifier outside the given statements and not used as a property. */
  occurrences(local: string): number[] {
    let t = this.text;
    for (const s of this.stmts) t = t.slice(0, s.s) + " ".repeat(s.e - s.s) + t.slice(s.e);
    const re = new RegExp(`(?<![.\\w$'"\`])${local.replace(/\$/g, "\\$")}(?![\\w$])`, "g");
    return [...t.matchAll(re)].map((m) => m.index!);
  }
  /** Span of the whole statement line when the call stands alone on it (before: only whitespace). */
  standalone(c: Call): { s: number; e: number } | null {
    const ls = this.text.lastIndexOf("\n", c.start - 1) + 1;
    if (this.text.slice(ls, c.start).trim() !== "") return null;
    const m = this.text.slice(c.end).match(/^[ \t]*;?[ \t]*(\r?\n|$)/);
    return m ? { s: ls, e: c.end + m[0].length } : null;
  }
  /** Replace one statement with its needed imports (deduped per file). */
  stmtReplacement(st: Stmt, needs: Need[]): string {
    const lines: string[] = [];
    for (const n of needs) {
      const l = st.kind === "import" ? `import { ${n.name}${n.as === n.name ? "" : ` as ${n.as}`} } from "${n.mod}";\n` : `const { ${n.name}${n.as === n.name ? "" : `: ${n.as}`} } = require("${n.mod}");\n`;
      if (!this.needs.has(l)) {
        this.needs.add(l);
        lines.push(l);
      }
    }
    return lines.join("");
  }
}

/** Generic call-shape rule: every use of every binding must be a handled call, else nothing changes. */
function callRule(f: FileCtx, rule: Rule, handle: (c: Call, b: Binding, f: FileCtx) => Handled, opts: { sideEffect?: (spec: string) => boolean } = {}) {
  for (const st of f.stmts) {
    const real = st.bindings.filter((b) => b.local);
    if (st.bad) {
      f.note(st.s, `${st.bad}: ${st.spec}`);
      continue;
    }
    if (!real.length) {
      if (opts.sideEffect?.(st.spec)) {
        f.edits.push({ s: st.s, e: st.e, r: "" });
        f.rewritten++;
      } else f.note(st.s, `side-effect import ${st.spec}`);
      continue;
    }
    const byLocal = new Map(real.map((b) => [b.local, b]));
    const calls = f.callsFor([...byLocal.keys()]);
    const local: { s: number; e: number; r: string }[] = [];
    const needs: Need[] = [];
    let ok = true;
    let handled = 0;
    const seen = new Set<number>();
    for (const c of calls) {
      const head = c.callee.split(".")[0]!;
      const b = byLocal.get(head)!;
      const h = handle(c, b, f);
      if (typeof h === "string") {
        f.note(c.start, h);
        seen.add(c.start);
        ok = false;
      } else {
        local.push({ s: h.s ?? c.start, e: h.e ?? c.end, r: h.r });
        if (h.need) needs.push(h.need);
        handled++;
        seen.add(c.start);
      }
    }
    for (const b of real) {
      const rest = f.occurrences(b.local).filter((i) => !seen.has(i));
      for (const i of rest) f.note(i, `${b.local} used outside a supported call`);
      if (rest.length) ok = false;
    }
    if (!ok) continue;
    // nested handled calls would overlap: leave to manual
    local.sort((a, b) => a.s - b.s);
    if (local.some((e, i) => i && e.s < local[i - 1]!.e)) {
      f.note(st.s, `nested ${rule.id} calls`);
      continue;
    }
    const uniq = [...new Map(needs.map((n) => [n.as, n])).values()];
    f.edits.push(...local, { s: st.s, e: st.e, r: f.stmtReplacement(st, uniq) });
    f.rewritten += handled || 1;
  }
}

const GLOB_CHARS = /[*?[\]{}!]/;
function parseOpts(arg: string | undefined, allowed: Set<string>): Record<string, string> | null {
  if (arg === undefined) return {};
  if (!arg.startsWith("{") || !arg.endsWith("}")) return null;
  const out: Record<string, string> = {};
  for (const part of splitTop(arg.slice(1, -1))) {
    const m = part.match(/^([\w$]+)\s*(?::\s*([\s\S]+))?$/);
    if (!m || !allowed.has(m[1]!)) return null;
    out[m[1]!] = (m[2] ?? m[1]!).trim();
  }
  return out;
}

// ---------- the rule table ----------
const rmNeed = (sync: boolean): Need => (sync ? { mod: "node:fs", name: "rmSync", as: "fsRmSync" } : { mod: "node:fs/promises", name: "rm", as: "fsRm" });

export const RULES: Rule[] = [
  {
    id: "execa", packages: ["execa"], bun: "Bun.$", drop: ["execa"],
    note: "only `await execa('lit', ['lit', ...])` statements, optional {stdio:'inherit'}",
    apply(f) {
      callRule(f, this, (c, b) => {
        if (b.imported !== "execa" && b.imported !== "default") return `execa.${b.imported} is not supported`;
        if (c.callee !== b.local) return `${c.callee}() form`;
        const before = f.text.slice(0, c.start);
        const aw = before.match(/(^|\n)([ \t]*)await\s+$/);
        const after = f.text.slice(c.end).match(/^[ \t]*;?[ \t]*(\r?\n|$)/);
        if (!aw || !after) return "execa result is used or not a statement";
        const cmd = lit(c.args[0]);
        if (!cmd || !SIMPLE.test(cmd)) return "non-literal command";
        let parts = [cmd];
        if (c.args[1] !== undefined) {
          if (!c.args[1].startsWith("[")) return "non-literal args";
          const items = splitTop(c.args[1].slice(1, -1)).map(lit);
          if (items.some((x) => x === undefined || !SIMPLE.test(x))) return "non-literal args";
          parts = parts.concat(items as string[]);
        }
        let quiet = true;
        if (c.args[2] !== undefined) {
          if (c.args.length > 3 || !/^\{\s*stdio\s*:\s*(['"])inherit\1\s*,?\s*\}$/.test(c.args[2])) return "unsupported execa options";
          quiet = false;
        }
        return { s: c.start - aw[0].length + aw[1]!.length + aw[2]!.length, r: `await Bun.$\`${parts.join(" ")}\`${quiet ? ".quiet()" : ""}` };
      });
    },
  },
  {
    id: "glob", packages: ["glob", "fast-glob", "globby"], bun: "Bun.Glob", drop: ["glob", "fast-glob"],
    note: "string pattern + options {cwd,dot,absolute,nodir}; globby, ignore, arrays and callbacks are manual",
    apply(f) {
      callRule(f, this, (c, b) => {
        if (b.spec === "globby") return "globby: use Bun.Glob manually";
        const fast = b.spec === "fast-glob";
        let name = c.callee.slice(b.local.length + 1);
        if (!name) name = b.imported === "globSync" ? "sync" : "async";
        else if (b.imported !== "default") return "unsupported glob member";
        if (b.imported === "globSync") name = "sync";
        if (b.imported !== "default" && b.imported !== "glob" && b.imported !== "globSync") return `${b.imported} is not supported`;
        const isSync = name === "sync";
        if (!isSync && name !== "async" && !(fast && name === "glob")) return `glob.${name}`;
        if (c.args.length < 1 || c.args.length > 2) return "callback or extra arguments";
        const pat = c.args[0]!;
        if (pat.startsWith("[") || pat.startsWith("...")) return "array pattern";
        const o = parseOpts(c.args[1], new Set(["cwd", "dot", "absolute", ...(fast ? [] : ["nodir"])]));
        if (!o) return "unsupported glob options";
        const bun: string[] = [];
        for (const k of ["cwd", "dot", "absolute"]) if (o[k] !== undefined) bun.push(`${k}: ${o[k]}`);
        if (!fast && o.nodir !== "true") bun.push("onlyFiles: false");
        else if (o.nodir !== undefined && o.nodir !== "true") return "dynamic nodir";
        const opt = bun.length ? `{ ${bun.join(", ")} }` : "";
        return { r: isSync ? `Array.from(new Bun.Glob(${pat}).scanSync(${opt}))` : `Array.fromAsync(new Bun.Glob(${pat}).scan(${opt}))` };
      });
    },
  },
  {
    id: "rimraf", packages: ["rimraf"], bun: "node:fs rm", drop: ["rimraf"],
    note: "single path argument, no options or callback; rimraf < 4 only for glob-free literals; CLI uses in scripts are kept",
    apply(f) {
      callRule(f, this, (c, b) => {
        let m = c.callee.slice(b.local.length + 1);
        if (!m) m = b.imported === "rimrafSync" ? "sync" : "async";
        else if (m === "rimrafSync") m = "sync";
        if (b.imported !== "default" && b.imported !== "rimraf" && b.imported !== "rimrafSync") return `${b.imported} is not supported`;
        if (m !== "sync" && m !== "async") return `rimraf.${m}`;
        if (c.args.length !== 1 || /^(\[|\.\.\.)/.test(c.args[0]!)) return "options, callback or array argument";
        const l = lit(c.args[0]);
        if (l !== undefined && GLOB_CHARS.test(l)) return "glob pattern";
        if (l === undefined && f.versions("rimraf").some((v) => v < 4)) return "rimraf < 4 globs non-literal paths";
        const sync = m === "sync";
        const n = rmNeed(sync);
        return { r: `${n.as}(${c.args[0]}, { recursive: true, force: true })`, need: n };
      });
    },
  },
  {
    id: "del", packages: ["del"], bun: "node:fs rm", mode: "report", note: "del takes globs: review by hand",
    apply(f) {
      for (const s of f.stmts) f.note(s.s, `del -> fs.rm / Bun.Glob (globs are not rewritten)`);
    },
  },
  {
    id: "require-like", packages: ["require-like"], bun: "module.createRequire", drop: ["require-like"],
    note: "requireLike(absolute file) -> createRequire(file)",
    apply(f) {
      callRule(f, this, (c, b) => {
        if (c.callee !== b.local || c.args.length !== 1) return "requireLike with extra arguments";
        if (!/^(__filename|import\.meta\.(filename|url)|fileURLToPath\(import\.meta\.url\)|(path\.)?(resolve|join)\(.*\))$/s.test(c.args[0]!)) return "path may be relative";
        const n: Need = { mod: "node:module", name: "createRequire", as: "createRequire" };
        return { r: `createRequire(${c.args[0]})`, need: n };
      });
    },
  },
  {
    id: "dotenv", packages: ["dotenv"], bun: "built-in .env loading", drop: ["dotenv"],
    note: "dotenv/config and zero-argument config() statements; {path} options are manual",
    apply(f) {
      callRule(f, this, (c, b) => {
        if (c.callee !== `${b.local}.config` || c.args.length) return "dotenv with options";
        const sp = f.standalone(c);
        return sp ? { s: sp.s, e: sp.e, r: "" } : "config() result is used";
      }, { sideEffect: (s) => s === "dotenv/config" });
      for (const m of f.text.matchAll(/^[ \t]*require\(\s*(['"])dotenv(?:\/config)?\1\s*\)(\.config\(\s*\))?;?[ \t]*\r?\n?/gm)) {
        f.edits.push({ s: m.index!, e: m.index! + m[0].length, r: "" });
        f.rewritten++;
      }
    },
  },
  {
    id: "node-fetch", packages: ["node-fetch", "undici"], bun: "global fetch", drop: ["node-fetch", "undici"],
    note: "bindings named like the globals (fetch, Headers, Request, Response, FormData); node-fetch-only APIs are manual",
    apply(f) {
      const GLOBALS = new Set(["fetch", "Headers", "Request", "Response", "FormData"]);
      const unsafe = /\.buffer\(\)|\bagent\s*:|\.body\.pipe\(|\bcompress\s*:|\bfollow\s*:|\bsize\s*:|\.textConverted\(|\bAbortError\b|\bFetchError\b|\bdispatcher\s*:/;
      for (const st of f.stmts) {
        if (st.bad || !st.bindings.length) {
          f.note(st.s, st.bad ?? `side-effect import ${st.spec}`);
          continue;
        }
        const bad = st.bindings.find((b) => !b.local || (b.imported === "default" ? b.local !== "fetch" || st.spec === "undici" : !GLOBALS.has(b.imported) || b.local !== b.imported));
        if (bad) {
          f.note(st.s, `${bad.imported || "import"} (as ${bad.local}) has no global equivalent`);
          continue;
        }
        const um = f.text.match(unsafe);
        if (um) {
          f.note(f.text.indexOf(um[0]), `node-fetch/undici-only API ${um[0].trim()}`);
          continue;
        }
        f.edits.push({ s: st.s, e: st.e, r: "" });
        f.rewritten++;
      }
    },
  },
  {
    id: "ws", packages: ["ws"], bun: "global WebSocket", drop: ["ws"],
    note: "client only: no server, no .on/.once/.ping/.terminate, no constructor options",
    apply(f) {
      for (const st of f.stmts) {
        if (st.bad || !st.bindings.length) {
          f.note(st.s, st.bad ?? "side-effect import ws");
          continue;
        }
        const bad = st.bindings.find((b) => b.local !== "WebSocket" || (b.imported !== "default" && b.imported !== "WebSocket"));
        const um = f.text.match(/WebSocketServer|\bServer\b|\.(?:on|once|off|ping|pong|terminate|removeListener|removeAllListeners)\(|new WebSocket\([^()]*,/);
        if (bad || um) {
          f.note(st.s, bad ? "ws binding is not the global name" : `ws-only API ${um![0]}`);
          continue;
        }
        f.edits.push({ s: st.s, e: st.e, r: "" });
        f.rewritten++;
      }
    },
  },
  { id: "jest", packages: ["jest", "ts-jest", "babel-jest", "@swc/jest", "@types/jest"], bun: "bun:test", mode: "report", note: "reported per package; never forced" },
  { id: "taskr", packages: ["taskr", "@taskr/esnext"], bun: "bun patch", mode: "patch", note: "known patch applied when the pinned version matches" },
  { id: "chalk", packages: ["chalk", "picocolors"], bun: "Bun.color", mode: "keep", note: "Bun.color converts colors, it does not style text: kept" },
];

for (const r of RULES) r.mode ??= "rewrite";

export const ruleSummary = () => RULES.map(({ id, packages, bun, mode, note }) => ({ id, packages, bun, mode, note }));

// ---------- driver ----------
const JEST_UNSAFE = /\bjest\.(?:mock|doMock|unmock|useFakeTimers|requireActual|requireMock|isolateModules|resetModules)\b/;

export interface FullbunResult {
  engine: Engine;
  rules: Record<string, RuleStats>;
  manual: Manual[];
  /** relative path -> new content for source files */
  files: Map<string, string>;
  /** package names whose last reference is gone per rule, with the files that still mention them */
  remaining: Map<string, Set<string>>;
  /** package name -> files where its last reference was removed */
  dropped: Map<string, Set<string>>;
  patches: { name: string; file: string; content: string }[];
  jestFiles: Map<string, number>;
}

export async function runFullbun(root: string, files: string[], read: (rel: string) => string, versions: Map<string, number[]>, only?: string[]): Promise<FullbunResult> {
  const eng = await engine();
  const rules = RULES.filter((r) => !only || only.includes(r.id));
  const stats: Record<string, RuleStats> = Object.fromEntries(rules.map((r) => [r.id, { files: 0, rewritten: 0, manual: 0, kept: 0 }]));
  const pre = new RegExp(`['"](?:${rules.flatMap((r) => r.packages).map(esc).join("|")})(?:/[\\w./-]*)?['"]|\\bjest\\.`);
  const manual: Manual[] = [];
  const out = new Map<string, string>();
  const remaining = new Map<string, Set<string>>();
  const jestFiles = new Map<string, number>();
  const dropped = new Map<string, Set<string>>();
  for (const rel of files) {
    const text = read(rel);
    if (!pre.test(text)) continue;
    if (JEST_UNSAFE.test(text)) jestFiles.set(rel, 1);
    let cur = text;
    for (const rule of rules) {
      const pk = rule.packages;
      const quoted = new RegExp(`['"](?:${pk.map(esc).join("|")})(?:/[\\w./-]*)?['"]`);
      if (!quoted.test(cur)) continue;
      if (rule.mode === "keep") {
        stats[rule.id]!.kept++;
        continue;
      }
      if (rule.mode === "patch" || (rule.mode === "report" && !rule.apply)) continue;
      const f = new FileCtx(rel, cur, rule.id, findStatements(cur, pk), (p) => versions.get(p) ?? []);
      rule.apply!(f);
      // stray mentions (dynamic import, require.resolve, jest.mock...) keep the dependency alive
      const covered = f.stmts.reduce((n, s) => n + (cur.slice(s.s, s.e).match(quoted) ? 1 : 0), 0);
      const mentions = [...cur.matchAll(new RegExp(quoted.source, "g"))];
      const dotenvInline = rule.id === "dotenv" ? [...cur.matchAll(/require\(\s*(['"])dotenv(?:\/config)?\1\s*\)/g)].length : 0;
      if (mentions.length > covered + dotenvInline && rule.mode === "rewrite") {
        const extra = mentions.find((m) => !f.stmts.some((s) => m.index! >= s.s && m.index! < s.e));
        if (extra && !(rule.id === "dotenv" && /require\(\s*$/.test(cur.slice(Math.max(0, extra.index! - 20), extra.index!)))) f.note(extra.index!, `${extra[0]} referenced in an unsupported form`);
      }
      const st = stats[rule.id]!;
      st.files++;
      st.manual += f.manual.length;
      manual.push(...f.manual);
      if (rule.mode === "rewrite" && f.edits.length && !f.manual.length) {
        st.rewritten += f.rewritten;
        for (const e of f.edits.sort((a, b) => b.s - a.s)) cur = cur.slice(0, e.s) + e.r + cur.slice(e.e);
      } else if (f.edits.length && f.manual.length) {
        // partial: file untouched, rewritable sites are reported with the blocking reason
      }
    }
    if (cur !== text) out.set(rel, cur);
    for (const rule of rules) {
      if (rule.mode !== "rewrite") continue;
      for (const p of rule.packages) {
        const q = new RegExp(`['"]${esc(p)}(?:/[\\w./-]*)?['"]`);
        if (q.test(text) && !q.test(cur)) {
          if (!dropped.has(p)) dropped.set(p, new Set());
          dropped.get(p)!.add(rel);
        }
        if (q.test(cur)) {
          if (!remaining.has(p)) remaining.set(p, new Set());
          remaining.get(p)!.add(rel);
        }
      }
    }
  }
  return { engine: eng, rules: stats, manual, files: out, remaining, dropped, patches: [], jestFiles };
}

/** Known bun patches for dependencies present at the pinned version and not yet patched. */
export function plannedPatches(root: string, pkg: any, version: (name: string) => string | undefined) {
  const planned: { key: string; name: string; file: string; content: string }[] = [];
  for (const [key, content] of Object.entries(KNOWN_PATCHES)) {
    const at = key.lastIndexOf("@");
    const name = key.slice(0, at);
    const v = version(name);
    if (v !== key.slice(at + 1)) continue;
    if (pkg.patchedDependencies?.[key]) continue;
    const file = `patches/${name.replace("/", "%2F")}@${v}.patch`;
    if (existsSync(join(root, file)) && !pkg.patchedDependencies?.[key]) {
      planned.push({ key, name, file, content: "" });
      continue;
    }
    planned.push({ key, name, file, content });
  }
  return planned;
}

export const dirOf = (rel: string) => (dirname(rel) === "." ? "" : dirname(rel) + "/");
