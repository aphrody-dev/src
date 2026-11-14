#!/usr/bin/env bun
// js-deps-check: supply-chain gate for the root bun workspace (docs/deps/POLICY.md §3, §5, §7).
//
// Fails (exit 1) when:
//   - a workspace package.json declares an external dependency that is not "catalog:" (internal ones use "workspace:*");
//   - bun.lock resolves one package name to more than one version (duplicate);
//   - an external runtime dependency ships no types (no "types"/"typings"/exports types/index.d.ts) and no @types/<name>;
//   - a dependency duplicates a bun built-in or a tool bun replaces (list below);
//   - a version is floating ("latest", "*", "x", tag) in the root catalog.
// Scope: the root workspace (package.json "workspaces"); apps/* products keep their own locks.
// Usage: bun packages/machine/src/js-deps-check.ts [--root DIR] [--json]
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const args = Bun.argv.slice(2);
const root = resolve(
  args.includes("--root")
    ? args[args.indexOf("--root") + 1]!
    : join(import.meta.dir, "..", "..", ".."),
);
const asJson = args.includes("--json");

// Packages whose job is done by bun itself (runtime API or bundled tool). Value: the bun replacement.
const BUILTIN: Record<string, string> = {
  "node-fetch": "fetch",
  "cross-fetch": "fetch",
  axios: "fetch",
  got: "fetch",
  undici: "fetch",
  dotenv: "Bun.env (auto-loads .env)",
  "dotenv-expand": "Bun.env",
  "cross-env": "bun shell",
  ws: "Bun.serve websocket / WebSocket",
  express: "Bun.serve routes",
  "body-parser": "Request.json()",
  glob: "Bun.Glob",
  "fast-glob": "Bun.Glob",
  globby: "Bun.Glob",
  rimraf: "node:fs rm",
  mkdirp: "node:fs mkdir",
  uuid: "crypto.randomUUID / Bun.randomUUIDv7",
  nanoid: "crypto.randomUUID",
  chalk: "Bun.color / util.styleText",
  picocolors: "util.styleText",
  kleur: "util.styleText",
  semver: "Bun.semver",
  "js-yaml": "Bun.YAML",
  yaml: "Bun.YAML",
  "@iarna/toml": "Bun.TOML",
  toml: "Bun.TOML",
  "smol-toml": "Bun.TOML",
  "better-sqlite3": "bun:sqlite",
  sqlite3: "bun:sqlite",
  pg: "Bun.SQL",
  postgres: "Bun.SQL",
  ioredis: "Bun.redis",
  redis: "Bun.redis",
  "node-gyp": "bun:ffi",
  ffi: "bun:ffi",
  execa: "Bun.$",
  shelljs: "Bun.$",
  zx: "Bun.$",
  "string-width": "Bun.stringWidth",
  "strip-ansi": "Bun.stripANSI",
  "deep-equal": "Bun.deepEquals",
  "fast-deep-equal": "Bun.deepEquals",
  "escape-html": "Bun.escapeHTML",
  bcrypt: "Bun.password",
  argon2: "Bun.password",
  "xxhash-wasm": "Bun.hash",
  "mime-types": "Bun.file().type",
  "lru-cache": "Map",
  typescript: "bun check / tsgo",
  "ts-node": "bun",
  tsx: "bun",
  nodemon: "bun --watch",
  esbuild: "bun build",
  vite: "bun build / Bun.serve",
  webpack: "bun build",
  rollup: "bun build",
  jest: "bun test",
  vitest: "bun test",
  mocha: "bun test",
  prettier: "bun fmt",
  eslint: "bun check",
  "@biomejs/biome": "bun fmt / bun check",
  oxlint: "bun check",
  npm: "bun",
  pnpm: "bun",
  yarn: "bun",
};
const EXACT = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;

// Build delegates imposed by a vendor CLI: `cf build`/`cf deploy` only build through the Cloudflare Vite plugin
// (or Wrangler), https://developers.cloudflare.com/cf/projects/ ("cf does not run a dev server or bundler itself").
// Declared as devDependencies of infra/cloudflare/workers/*, never shipped (the Worker bundle runs on workerd).
// Their transitive closure is exempt from the builtin and duplicate rules only when nothing else reaches it.
const DELEGATES: Record<string, string[]> = {
  "infra/cloudflare/workers/": ["@cloudflare/vite-plugin", "vite"],
  // Asset optimizers run at build time by `ay assets` (no bun built-in replaces them; wawoff2 is google/woff2 as wasm,
  // svgo has no maintained alternative); never shipped in an app bundle.
  "packages/assets/": ["svgo", "wawoff2", "gltf-validator"],
};
const delegateOf = (where: string, field: string, name: string) =>
  field === "devDependencies" &&
  Object.entries(DELEGATES).some(
    ([dir, names]) => where.startsWith(dir) && names.includes(name),
  );

type Problem = { kind: string; where: string; detail: string };
const problems: Problem[] = [];
const add = (kind: string, where: string, detail: string) =>
  problems.push({ kind, where, detail });

const rootPkg = await Bun.file(join(root, "package.json")).json();
const ws = rootPkg.workspaces ?? {};
const patterns: string[] = Array.isArray(ws) ? ws : (ws.packages ?? []);
const catalog: Record<string, string> = {
  ...(ws.catalog ?? {}),
  ...(rootPkg.catalog ?? {}),
};

for (const [name, ver] of Object.entries(catalog)) {
  if (!EXACT.test(ver))
    add(
      "floating",
      "package.json catalog",
      `${name}@${ver} (pin an exact version)`,
    );
}

const manifests = [join(root, "package.json")];
for (const p of patterns) {
  for (const rel of new Bun.Glob(`${p}/package.json`).scanSync({
    cwd: root,
    onlyFiles: true,
  }))
    manifests.push(join(root, rel));
}

const internal = new Set<string>();
const pkgs: { file: string; json: any }[] = [];
for (const file of manifests) {
  const json = await Bun.file(file).json();
  pkgs.push({ file, json });
  if (json.name) internal.add(json.name);
}

const runtimeExternal = new Set<string>();
const delegateRoots = new Set<string>(),
  otherRoots = new Set<string>();
for (const { file, json } of pkgs) {
  const where = file.slice(root.length + 1).replaceAll("\\", "/");
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    for (const [name, spec] of Object.entries<string>(json[field] ?? {})) {
      if (BUILTIN[name] && !delegateOf(where, field, name))
        add("builtin", where, `${name}: use ${BUILTIN[name]}`);
      if (!internal.has(name))
        (delegateOf(where, field, name) ? delegateRoots : otherRoots).add(name);
      if (internal.has(name)) {
        if (!spec.startsWith("workspace:"))
          add("internal-spec", where, `${name}@${spec} (use "workspace:*")`);
        continue;
      }
      if (field === "peerDependencies") continue;
      if (spec !== "catalog:" && !spec.startsWith("catalog:"))
        add("not-catalog", where, `${field}.${name}@${spec} (use "catalog:")`);
      if (field !== "devDependencies" && !name.startsWith("@types/"))
        runtimeExternal.add(name);
    }
  }
  for (const [hook] of Object.entries(json.scripts ?? {})) {
    if (/^(pre|post)install$|^prepare$/.test(hook))
      add("lifecycle", where, `scripts.${hook} (no install hooks)`);
  }
}

// bun.lock: JSONC, packages: { key: [ "name@version", registry, meta, integrity ] }
const lockPath = join(root, "bun.lock");
const lock = Bun.JSONC.parse(await Bun.file(lockPath).text()) as any;
const versions = new Map<string, Set<string>>();
const meta = new Map<string, any>();
const edges = new Map<string, Set<string>>(); // package name -> names it depends on (any version)
for (const entry of Object.values<any[]>(lock.packages ?? {})) {
  const id = String(entry[0]);
  const at = id.lastIndexOf("@");
  const name = id.slice(0, at);
  const ver = id.slice(at + 1);
  if (ver.startsWith("workspace:")) continue;
  (versions.get(name) ?? versions.set(name, new Set()).get(name)!).add(ver);
  meta.set(name, entry[2] ?? {});
  const m = entry[2] ?? {};
  const e = edges.get(name) ?? edges.set(name, new Set()).get(name)!;
  for (const k of ["dependencies", "optionalDependencies", "peerDependencies"])
    for (const d of Object.keys(m[k] ?? {})) e.add(d);
}
const closure = (roots: Set<string>) => {
  const seen = new Set<string>(),
    todo = [...roots];
  while (todo.length) {
    const n = todo.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    for (const d of edges.get(n) ?? []) todo.push(d);
  }
  return seen;
};
const others = closure(otherRoots);
const delegateOnly = new Set(
  [...closure(delegateRoots)].filter((n) => !others.has(n)),
);
for (const name of versions.keys())
  if (BUILTIN[name] && !delegateOnly.has(name))
    add(
      "builtin",
      "bun.lock",
      `${name} (transitive): replaced by ${BUILTIN[name]}`,
    );
for (const [name, set] of versions)
  if (set.size > 1 && !delegateOnly.has(name))
    add("duplicate", "bun.lock", `${name}: ${[...set].join(", ")}`);

for (const name of runtimeExternal) {
  if (versions.has(`@types/${name.replace(/^@([^/]+)\//, "$1__")}`)) continue;
  const dir = join(root, "node_modules", name);
  const pj = existsSync(join(dir, "package.json"))
    ? await Bun.file(join(dir, "package.json")).json()
    : null;
  if (!pj) {
    add(
      "untyped",
      name,
      "not installed: run `bun install --frozen-lockfile` then re-check",
    );
    continue;
  }
  // Asset-only package (no main/module/exports, no root .js): files read at build time, nothing to import or type.
  const code =
    pj.main ||
    pj.module ||
    pj.exports ||
    readdirSync(dir).some((f) => /\.(c|m)?js$/.test(f));
  if (!code) continue;
  const exportsTyped = JSON.stringify(pj.exports ?? {}).includes('"types"');
  const typed =
    pj.types ||
    pj.typings ||
    exportsTyped ||
    existsSync(join(dir, "index.d.ts")) ||
    readdirSync(dir).some((f) => f.endsWith(".d.ts") || f.endsWith(".d.mts"));
  if (!typed)
    add(
      "untyped",
      name,
      "ships no .d.ts and no @types package: pick a typed alternative",
    );
}

const summary = {
  root,
  workspaces: pkgs.length,
  external: versions.size,
  catalog: Object.keys(catalog).length,
  problems,
  exempt: { delegateOnly: delegateOnly.size },
};
if (asJson) console.log(JSON.stringify(summary, null, 2));
else {
  for (const p of problems)
    console.error(`js-deps-check: ${p.kind}: ${p.where}: ${p.detail}`);
  console.log(
    `js-deps-check: ${pkgs.length} manifests, ${versions.size} external packages (${delegateOnly.size} only behind a vendor build delegate), ${problems.length} problem(s)`,
  );
}
process.exit(problems.length ? 1 : 0);
